#!/usr/bin/env python3
"""FUT: auditoria read-only de integridade e potenciais duplicados.

Uma repetição do mesmo jogador entre edições, equipas ou inserts não é,
por si, um erro. Este programa não altera nenhum catálogo.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from difflib import SequenceMatcher
import json
from pathlib import Path
import re
import subprocess
import unicodedata


def normalized(value):
    if not isinstance(value, str):
        return ""
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return " ".join(re.findall(r"[a-z0-9]+", value.casefold()))


def semantic_name(value):
    if not isinstance(value, str):
        return ""
    # Elimina somente qualificadores entre parênteses; não muda dados-fonte.
    simplified = re.sub(r"\([^)]*\)", " ", value)
    return normalized(simplified)


def finding(kind, severity, path, card=None, detail="", other=None):
    out = {"kind": kind, "severity": severity, "catalogue": path, "detail": detail}
    if card is not None:
        out["id"] = card.get("id")
        out["number"] = card.get("number")
        out["name"] = card.get("name")
        out["section"] = card.get("section")
    if other is not None:
        out["other"] = other
    return out


def audit_data(library, catalogues):
    issues = []
    findings = []
    by_kind = Counter()
    samples = defaultdict(list)
    catalogs_metrics = []
    global_ids = {}
    global_sources = {}
    global_hashes = defaultdict(list)
    cross_names = defaultdict(set)
    total = 0
    absent_original = 0
    changed_original = 0
    original_equal = 0
    repeated_name_groups = 0
    semantic_groups = 0
    potential_near_pairs = 0

    def record(row):
        findings.append(row)
        by_kind[row["kind"]] += 1
        if len(samples[row["kind"]]) < 12:
            samples[row["kind"]].append(row)
        if row["severity"] == "critical":
            issues.append(row)

    ids = [x.get("id") for x in library]
    if len(ids) != len(set(ids)):
        record(finding("duplicate_manifest_id", "critical", "public/library.json"))
    active = [x for x in library if x.get("status") == "active"]
    catalogues_ids = set(catalogues)
    active_ids = {x["id"] for x in active}
    for orphan in sorted(catalogues_ids - active_ids):
        record(finding("orphan_catalogue", "critical", orphan))
    for missing in sorted(active_ids - catalogues_ids):
        record(finding("missing_catalogue", "critical", missing))
    for entry in active:
        slug = entry["id"]
        cat = catalogues.get(slug)
        if not cat:
            continue
        cards = cat.get("cards", [])
        sections = cat.get("sections", [])
        if cat.get("id") != slug or len(cards) != entry.get("count") or len(sections) != entry.get("sections"):
            record(finding("manifest_catalogue_mismatch", "critical", slug,
                detail=f"manifest count={entry.get('count')} / sections={entry.get('sections')}; actual={len(cards)} / {len(sections)}"))
        if len(sections) != len(set(sections)) or len(sections) != len(set(map(normalized, sections))):
            record(finding("duplicate_section", "review", slug,
                detail="Secções repetidas literalmente ou após normalização"))
        section_set = set(sections)
        local_ids = set()
        local_numbers = set()
        local_source_ids = set()
        local_originals = set()
        section_exact = defaultdict(list)
        section_semantic = defaultdict(list)
        section_near = defaultdict(list)
        local_changed = 0
        local_without = 0
        local_exact_groups = 0
        local_semantic_groups = 0
        for index, card in enumerate(cards, 1):
            total += 1
            cid = card.get("id")
            number = card.get("number")
            name = card.get("name")
            section = card.get("section")
            if not isinstance(cid, str) or not cid or cid in local_ids:
                record(finding("duplicate_or_invalid_card_id", "critical", slug, card))
            local_ids.add(cid)
            if cid in global_ids and global_ids[cid] != slug:
                record(finding("cross_catalogue_card_id", "critical", slug, card,
                    other={"catalogue":global_ids[cid]}))
            global_ids[cid] = slug
            if not isinstance(number, str) or not number.strip() or number in local_numbers:
                record(finding("duplicate_or_invalid_card_number", "critical", slug, card))
            local_numbers.add(number)
            if not isinstance(name, str) or not name.strip():
                record(finding("invalid_card_title", "critical", slug, card))
            if not isinstance(section, str) or section not in section_set:
                record(finding("missing_section_reference", "critical", slug, card))
            if not isinstance(card.get("order"), int) or card["order"] != index:
                record(finding("nonsequential_order", "review", slug, card, detail=f"index={index}, order={card.get('order')}"))
            if card.get("category") != section:
                record(finding("category_section_mismatch", "review", slug, card,
                    detail=f"category={card.get('category')!r}"))
            original = card.get("originalNumber")
            if original is None:
                absent_original += 1
                local_without += 1
            else:
                if str(original) != str(number):
                    changed_original += 1
                    local_changed += 1
                    record(finding("original_number_differs", "review", slug, card,
                        detail=f"originalNumber={original!r}"))
                else:
                    original_equal += 1
                if str(original) in local_originals:
                    record(finding("duplicate_original_number", "review", slug, card,
                        detail=f"originalNumber={original!r}"))
                local_originals.add(str(original))
            source = card.get("sourceId")
            if source is not None:
                if source in local_source_ids:
                    record(finding("duplicate_source_id", "critical", slug, card,
                        detail=f"sourceId={source!r}"))
                local_source_ids.add(source)
                if source in global_sources and global_sources[source] != slug:
                    record(finding("reused_source_id_across_catalogues", "review", slug, card,
                        detail=f"sourceId={source!r}",other={"catalogue":global_sources[source]}))
                global_sources[source] = slug
            key = normalized(name)
            sec = normalized(section)
            if key:
                section_exact[(sec, key)].append(card)
                semantic = semantic_name(name)
                if len(semantic) >= 7:
                    section_semantic[(sec, semantic)].append(card)
                if len(key) >= 10:
                    first = key.split()[0]
                    section_near[(sec, first)].append((card, key))
                cross_names[key].add(slug)
            digest=card.get("sha256")
            if digest and isinstance(digest,str):
                global_hashes[digest].append((slug,cid,number))
            if re.search(r"\)\s*\d{2,4}\s*$", str(name)):
                record(finding("suspicious_title_suffix", "review", slug, card,
                    detail="Algarismos imediatamente após parênteses; verificar fonte antes de alterar"))
        for (section_key,name_key),members in section_exact.items():
            if len(members) > 1:
                repeated_name_groups += 1
                local_exact_groups += 1
                record(finding("same_section_exact_name", "review", slug, members[0],
                    detail=f"{len(members)} posições, secção={section_key}; possíveis variantes legítimas",
                    other=[{"id":c["id"],"number":c["number"]} for c in members[1:7]]))
        for (section_key,sem),members in section_semantic.items():
            distinct={normalized(c["name"]) for c in members}
            if len(distinct)>1:
                semantic_groups+=1
                local_semantic_groups+=1
                record(finding("same_section_semantic_name", "review", slug, members[0],
                    detail=f"{len(members)} posições, nome base={sem}; verificar variante",
                    other=[{"id":c["id"],"number":c["number"],"name":c["name"]} for c in members[1:7]]))
        # Comparação limitada à mesma secção e primeiro token.
        # Não cruzar nomes entre temporadas: jogadores recorrentes são esperados.
        for group in section_near.values():
            if len(group)>110:  # grupo muito amplo, evita falsos positivos e custo quadrático
                continue
            for i,(card_a,name_a) in enumerate(group):
                for card_b,name_b in group[i+1:]:
                    if name_a==name_b or abs(len(name_a)-len(name_b))>4:
                        continue
                    if SequenceMatcher(None,name_a,name_b).ratio()>=0.94:
                        potential_near_pairs+=1
                        record(finding("same_section_near_name", "review", slug, card_a,
                            detail="Similaridade >=0.94; hipótese editorial, não eliminação",
                            other={"id":card_b["id"],"number":card_b["number"],"name":card_b["name"]}))
        catalogs_metrics.append({
            "id":slug, "positions":len(cards),"sections":len(sections),
            "originalNumber_missing":local_without,"originalNumber_different":local_changed,
            "same_section_exact_name_groups":local_exact_groups,
            "same_section_semantic_name_groups":local_semantic_groups
        })
    cross_hash_groups=0
    within_hash_groups=0
    for digest,uses in global_hashes.items():
        if len(uses)<2:
            continue
        grouped={x[0] for x in uses}
        if len(grouped)==1:
            within_hash_groups+=1
            record(finding("same_image_within_catalogue","review",uses[0][0],
                detail=f"SHA-256={digest[:18]}… usado em {len(uses)} posições",
                other=[{"catalogue":x[0],"id":x[1],"number":x[2]} for x in uses[:8]]))
        else:
            cross_hash_groups+=1
            record(finding("same_image_across_catalogues","review",uses[0][0],
                detail=f"SHA-256={digest[:18]}… repetido em {len(grouped)} edições; comparar imagens",
                other=[{"catalogue":x[0],"id":x[1],"number":x[2]} for x in uses[:8]]))
    repeated_cross_names=sum(len(slugs)>1 for slugs in cross_names.values())
    summary={
        "active_collections":len(active),"positions":total,
        "catalogue_files":len(catalogues),"critical_findings":len(issues),
        "review_findings":sum(count for kind,count in by_kind.items()
            if kind not in {"duplicate_manifest_id","orphan_catalogue","missing_catalogue",
              "manifest_catalogue_mismatch","duplicate_or_invalid_card_id",
              "cross_catalogue_card_id","duplicate_or_invalid_card_number",
              "invalid_card_title","missing_section_reference","duplicate_source_id"}),
        "originalNumber_equal":original_equal,
        "originalNumber_missing":absent_original,
        "originalNumber_different":changed_original,
        "exact_name_groups_same_section":repeated_name_groups,
        "semantic_name_groups_same_section":semantic_groups,
        "near_name_pairs_same_section":potential_near_pairs,
        "names_repeated_across_editions_informational":repeated_cross_names,
        "same_image_within_catalogue_groups":within_hash_groups,
        "same_image_across_catalogues_groups":cross_hash_groups
    }
    return {"findings":findings,"summary":summary,"counts_by_kind":dict(sorted(by_kind.items())),
            "examples":{kind:values for kind,values in sorted(samples.items())},
            "catalogues":catalogs_metrics,"critical_findings":issues}


def load_repository(root):
    library=json.loads((root/"public/library.json").read_text(encoding="utf8"))
    catalogues={}
    for path in sorted((root/"public/data").glob("*.json")):
        catalogues[path.stem]=json.loads(path.read_text(encoding="utf8"))
    return library,catalogues


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",type=Path,default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--output",type=Path)
    parser.add_argument("--baseline-ref", default="", help="SHA de base para comparar alertas, sem alterar dados")
    parser.add_argument("--strict",action="store_true",help="Falhar em invariantes críticos")
    args=parser.parse_args()
    report=audit_data(*load_repository(args.root))
    if args.baseline_ref and args.baseline_ref != '0'*40:
        if not re.fullmatch(r'[a-f0-9]{40}',args.baseline_ref):
            raise SystemExit('SHA de base inválido')
        def old_json(path):
            return json.loads(subprocess.check_output(['git','show',args.baseline_ref+':'+path],cwd=args.root))
        old_library=old_json('public/library.json')
        old_cats={x['id']:old_json('public/data/'+x['id']+'.json') for x in old_library if x['status']=='active'}
        baseline=audit_data(old_library,old_cats)
        report['baseline_sha']=args.baseline_ref
        report['counts_delta']={k:report['counts_by_kind'].get(k,0)-baseline['counts_by_kind'].get(k,0) for k in sorted(set(report['counts_by_kind'])|set(baseline['counts_by_kind']))}
        report['new_findings']=[x for x in report['findings'] if x not in baseline['findings']]
        print('AUDIT_DELTA_JSON='+json.dumps(report['counts_delta'],sort_keys=True))
        print('AUDIT_NEW_FINDINGS='+str(len(report['new_findings'])))
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("AUDIT_SUMMARY_JSON="+json.dumps(report["summary"],ensure_ascii=False,sort_keys=True))
    print("AUDIT_COUNTS_JSON="+json.dumps(report["counts_by_kind"],ensure_ascii=False,sort_keys=True))
    for kind,rows in report["examples"].items():
        print("AUDIT_EXAMPLES_"+kind+"="+json.dumps(rows[:3],ensure_ascii=False))
    for c in report["catalogues"]:
        print("AUDIT_CATALOGUE="+json.dumps(c,ensure_ascii=False,sort_keys=True))
    if args.strict and report["summary"]["critical_findings"]:
        raise SystemExit("FAIL: invariantes críticos violados (ver relatório)")
    print("PASS: auditoria completa; advertências editoriais não implicam alterações automáticas")


if __name__=="__main__":
    main()
