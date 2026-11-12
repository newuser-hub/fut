#!/usr/bin/env python3
"""Calcula métricas documentais do manifesto e TODOS os JSON, nunca de texto antigo.

--write: atualiza apenas docs/02-colecoes/README.md, docs/04-imagens/README.md,
         docs/index.json e docs/metrics-current.json.
--check: verifica correspondência byte a byte entre JSON e documentação,
         sem escrita em nenhum ficheiro.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHA256 = re.compile(r"^[0-9a-f]{64}$", re.IGNORECASE)
BASE_MAIN = "7b51023f6767a807786ecf2d03fcf7086a39712c"
SNAPSHOT = "2026-11-12"
CATEGORIES = [
    ("portugal", "Portugal"),
    ("selecoes", "Seleções"),
    ("champions", "Champions League"),
    ("outros", "Outros"),
]
DOCS = Path("docs")


def read_json(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def classify(item: dict) -> str:
    from unicodedata import normalize
    category = "".join(ch for ch in normalize("NFD", item.get("category", ""))
                       if not 0x0300 <= ord(ch) <= 0x036F).lower()
    if "selecoes" in category:
        return "selecoes"
    if "portugal" in category:
        return "portugal"
    if "champions league" in category:
        return "champions"
    return "outros"


def metrics() -> dict:
    manifest = read_json("public/library.json")
    plan = read_json("public/expansion-plan.json")
    assert isinstance(manifest, list) and manifest, "Manifesto vazio"
    assert isinstance(plan.get("collections"), list), "Roteiro inválido"
    seen_collections = set()
    totals = dict(positions=0, cardsWithSHA=0, previewLinksUnverified=0,
                  missingImagePositions=0, cardsWithImageURL=0, sections=0,
                  totalCoversWithURL=0)
    records = []
    for item in manifest:
        slug = item["id"]
        assert slug not in seen_collections, f"Coleção duplicada: {slug}"
        seen_collections.add(slug)
        cat = read_json(f"public/data/{slug}.json")
        cards = cat["cards"]
        assert cat["id"] == slug and len(cards) == item["count"], f"Catálogo incompatível: {slug}"
        assert len(cat["sections"]) == item["sections"], f"Secções incompatíveis: {slug}"
        seen_cards = set()
        with_sha = links = missing = 0
        for card in cards:
            cid = card["id"]
            assert isinstance(cid, str) and cid and cid not in seen_cards, f"ID inválido/repetido: {cid}"
            seen_cards.add(cid)
            url = card.get("image")
            sha = card.get("sha256")
            if isinstance(url, str) and url.strip():
                if isinstance(sha, str) and SHA256.fullmatch(sha):
                    assert card.get("available") is not False, f"Imagem hash marcada indisponível: {cid}"
                    assert isinstance(card.get("bytes"), int) and card["bytes"] > 0, f"Sem bytes: {cid}"
                    with_sha += 1
                else:
                    assert not sha, f"SHA malformado em {cid}"
                    links += 1
            else:
                assert not sha, f"SHA sem URL em {cid}"
                missing += 1
        totals["positions"] += len(cards)
        totals["sections"] += len(cat["sections"])
        totals["cardsWithSHA"] += with_sha
        totals["previewLinksUnverified"] += links
        totals["missingImagePositions"] += missing
        totals["cardsWithImageURL"] += with_sha + links
        totals["totalCoversWithURL"] += bool(item.get("cover"))
        records.append(dict(id=slug, title=item["title"], year=item["year"],
            category=classify(item), labelCategory=item["category"],
            publisher=cat.get("publisher") or "Não indicado", status=item["status"],
            count=len(cards), sections=len(cat["sections"]),
            cardsWithSHA=with_sha, previewLinksUnverified=links,
            missingImagePositions=missing))
    ids = {x["id"] for x in manifest if x["status"] == "active"}
    roadmap = dict(goal=plan["goal"], candidates=len(plan["collections"]),
        integrated=sum(c["id"] in ids for c in plan["collections"]),
        blocked=sum(c["id"] not in ids and c.get("imageAudit") == "blocked"
                    for c in plan["collections"]),
        pending=sum(c["id"] not in ids and c.get("imageAudit") != "blocked"
                    for c in plan["collections"]))
    assert roadmap["integrated"] + roadmap["blocked"] + roadmap["pending"] == roadmap["candidates"]
    assert totals["positions"] == totals["cardsWithSHA"] + totals["previewLinksUnverified"] + totals["missingImagePositions"]
    assert totals["cardsWithImageURL"] == totals["cardsWithSHA"] + totals["previewLinksUnverified"]
    assert totals["totalCoversWithURL"] == len(manifest), "Uma das capas não tem URL"
    assert len(manifest) == 53 and totals["positions"] == 29492, "Inventário do lote 16 incompatível"
    assert totals["cardsWithSHA"] >= 26529 and totals["previewLinksUnverified"] == 0 and totals["missingImagePositions"] <= 2065 + 898, "Metadados de imagens do lote 16 inválidos"
    distribution = {key: sum(row["category"] == key for row in records) for key, _ in CATEGORIES}
    assert distribution == dict(portugal=14, selecoes=25, champions=7, outros=7)
    assert len(plan["collections"]) == plan["goal"] == 36
    return {
        "version": 2, "snapshotAt": SNAPSHOT, "referenceMainCommit": BASE_MAIN,
        "origin": ["public/library.json", "public/data/*.json", "public/expansion-plan.json"],
        "note": "SHA persistido nos JSON não implica disponibilidade HTTP atual; rede verificada separadamente na etapa 4.",
        "activeCollections": len(ids), **totals,
        "portalCategories": distribution, "roadmap": roadmap,
        "collectionsWithMissingImages": sum(r["missingImagePositions"] > 0 for r in records),
        "collections": records,
    }


def as_markdown_title(s: str) -> str:
    return s.replace("|", r"\|").replace("\n", " ")


def year_start(value:str) -> int:
    text=str(value or "").strip()
    if re.fullmatch(r"(?:19|20)\d{2}",text):
        return int(text)
    match=re.fullmatch(r"(\d{2})\s*/\s*\d{2}",text)
    if match:
        yy=int(match.group(1))
        return 1900+yy if yy>=90 else 2000+yy
    match=re.search(r"(?:19|20)\d{2}",text)
    return int(match.group(0)) if match else 0


def collections_md(m: dict) -> str:
    t = [
        "# 02 — Inventário atual de coleções",
        "",
        f"**Snapshot documental:** {SNAPSHOT}, calculado de [`public/library.json`](../../public/library.json) e dos **{m['activeCollections']} JSON** em [`public/data/`](../../public/data/). "
        "Este documento é gerado automaticamente com `python3 scripts/refresh_documentation.py --write` e não altera os catálogos.",
        "",
        f"**{m['activeCollections']} coleções ativas; {m['positions']:,} posições; {m['cardsWithSHA']:,} imagens de cromos com hash; "
        f"{m['previewLinksUnverified']} ligações não verificadas; {m['missingImagePositions']:,} posições sem URL de fotografia.**".replace(",", "."),
        "",
        "A divisão em **Portugal, Seleções, Champions League e Outros** corresponde à classificação real do portal. "
        "Cada categoria e época são vistas de navegação, não diretórios físicos ou novos IDs.",
        ""
    ]
    for key, name in CATEGORIES:
        rows = sorted((r for r in m["collections"] if r["category"] == key),
                      key=lambda r:(-year_start(r["year"]),r["title"].casefold()))
        t.extend([f"## {name} — {len(rows)} coleções", "",
            "| Coleção | Ano | Editora | Posições | Secções | Com SHA | Link sem SHA | Sem URL | Catálogo |",
            "|---|---|---|---:|---:|---:|---:|---:|---|"])
        for r in rows:
            t.append(f"| {as_markdown_title(r['title'])} | {r['year']} | {as_markdown_title(r['publisher'])} "
                f"| {r['count']} | {r['sections']} | {r['cardsWithSHA']} | {r['previewLinksUnverified']} "
                f"| {r['missingImagePositions']} | [JSON](../../public/data/{r['id']}.json) |")
        t.append("")
    t.extend([
        "## Como interpretar",
        "",
        "- **Com SHA:** há URL de imagem, SHA-256 válido e bytes guardados no catálogo. Estes são metadados auditados por GET na etapa 4, mas não garantem acesso futuro.",
        "- **Link sem SHA:** há URL oficial, sem bytes verificados; cinco previews Topps devolveram HTTP 403 no runner. Não contar como imagem auditada nem como posição sem URL.",
        "- **Sem URL:** a posição continua válida e navegável, mas não tem fotografia associada; não inventar imagem substituta.",
        "- **Capa:** cada coleção tem URL de capa; a auditoria HTTP das 47 capas está [documentada separadamente](../../ops/audit-2026-11-08-step4-images.md).",
        "- **Histórico:** a tabela do [PR #1](../01-gestao/README-original-2026-11-08.md) corresponde a 29 coleções e foi preservada como arquivo, não como estado presente.",
        "",
        f"**Roteiro separado:** {m['roadmap']['integrated']}/{m['roadmap']['candidates']} candidatos integrados, "
        f"{m['roadmap']['blocked']} bloqueados, {m['roadmap']['pending']} pendentes. Fonte: [expansion-plan.json](../../public/expansion-plan.json).",
        "",
    ])
    return "\n".join(t)


def images_md(m: dict) -> str:
    x=m
    return "\n".join([
        "# 04 — Imagens, proveniência e cobertura",
        "",
        f"**Snapshot calculado dos {m['activeCollections']} catálogos em {SNAPSHOT}.** [Inventário detalhado](../02-colecoes/README.md) · [Auditoria HTTP/SHA da etapa 4](../../ops/audit-2026-11-08-step4-images.md).",
        "",
        "| Estado, mutuamente exclusivo | Cromos | Fonte da classificação |",
        "|---|---:|---|",
        f"| URL e SHA-256 persistido com bytes positivos | **{x['cardsWithSHA']:,}** | Campos `image`, `sha256`, `bytes` |".replace(",","."),
        f"| URL oficial sem SHA-256 auditado | **{x['previewLinksUnverified']}** | Previews com URL e sem bytes confirmados |",
        f"| Sem URL de imagem | **{x['missingImagePositions']:,}** | `image` ausente ou nulo; posições mantidas |".replace(",","."),
        f"| **Total de posições** | **{x['positions']:,}** | `public/library.json` e `public/data/*.json` |".replace(",","."),
        "",
        f"**URLs de cromos:** {x['cardsWithImageURL']:,} = {x['cardsWithSHA']:,} com hash + {x['previewLinksUnverified']} ligações não verificadas. "
        f"**Capas:** {x['totalCoversWithURL']} URLs adicionais (não fazem parte das posições). "
        f"**Inventário URL total:** {x['cardsWithImageURL']+x['totalCoversWithURL']:,}.".replace(",","."),
        "",
        "## GET real — evidência histórica de 08/11/2026",
        "",
        "- O varrimento da [etapa 4](../../ops/audit-2026-11-08-step4-images.md) cobriu 24.747 URLs e comprovou **24.742 GET 200** com tipo MIME de imagem, tamanho e SHA (24.695 cromos + 47 capas), sem divergência de hash confirmada. Os outros **5 URLs** devolveram HTTP 403.",
        "- O hash persistido no JSON é evidência histórica de bytes, **não** uma nova descarga e **não** garante que o URL responda hoje.",
        "- A capa Premier League num URL específico de `blogger.googleusercontent.com` foi verificada por GET; o pipeline Drive permite apenas essa URL exata como exceção de host.",
        "- O cromo **Salis Abdul Samed**, Ligue 1 #383, tinha os mesmos bytes de uma fotografia de outro jogador. A associação errada foi retirada; preservaram-se identidade, número e progresso, e a nova fotografia foi verificada em 12/11.",
        "- Oito pares de cromos regionais Coca-Cola partilham imagens legitimamente. Não foram apagados nem alterados.",
        "",
        "## Regras de qualidade",
        "",
        "Usar URL legítimo, HTTP GET, MIME, limite de bytes e SHA-256; investigar diferenças por imagem e identidade antes de substituir. Se os bytes não forem verificáveis, assinalar ligação não verificada; se não houver URL, preservar a posição sem fotografia. **Nunca inventar imagens, hashes ou disponibilidade.**",
        "",
        "As imagens e marcas pertencem aos titulares. A acessibilidade pública não constitui autorização de reprodução nem de migração para outro alojamento. A [migração Drive](../GOOGLE_DRIVE_STORAGE.md) continua não executada.",
        "",
    ])


def index_json(m: dict) -> dict:
    labels=[
        ("01","Gestão do projeto","01-gestao/README.md"),
        ("02","Coleções de cromos","02-colecoes/README.md"),
        ("03","Catálogos e bases de dados","03-catalogos/README.md"),
        ("04","Imagens e recursos","04-imagens/README.md"),
        ("05","Funcionalidades","05-funcionalidades/README.md"),
        ("06","Desenvolvimento e arquitetura","06-arquitetura/README.md"),
        ("07","Segurança e integridade","07-seguranca/README.md"),
        ("08","GitHub e Vercel","08-github-vercel/README.md"),
        ("09","Auditorias e controlo","09-auditorias/README.md"),
        ("10","Backlog e expansões","10-backlog/README.md"),
    ]
    return dict(version=2,at=SNAPSHOT,baseCommit=BASE_MAIN,
        sourceOfTruth=dict(manifest="public/library.json",catalogs="public/data/",
                           roadmap="public/expansion-plan.json"),
        summary=dict(activeCollections=m["activeCollections"],positions=m["positions"],
            imagesWithSHA=m["cardsWithSHA"],previewLinksUnverified=m["previewLinksUnverified"],
            missingImages=m["missingImagePositions"],
            roadmapIntegrated=m["roadmap"]["integrated"],roadmapBlocked=m["roadmap"]["blocked"],
            roadmapPending=m["roadmap"]["pending"]),
        historicalSnapshot="docs/source-map.json (snapshot congelado do PR #1: 29 coleções/76 ficheiros)",
        categories=[dict(id=i,name=name,path="docs/"+path) for i,name,path in labels],
        navigation=dict(history="docs/HISTORICO.md",maintenance="docs/MANUTENCAO.md",
                        classification="docs/CLASSIFICACAO.md",
                        decisions="docs/01-gestao/DECISOES.md",
                        checkpoint="docs/01-gestao/CHECKPOINT.md"),
        relatedDocuments=["docs/GOOGLE_DRIVE_STORAGE.md","docs/metrics-current.json",
                          "ops/audit-2026-11-08.md"])


def outputs(m:dict) -> dict[str,str]:
    return {
        "docs/02-colecoes/README.md": collections_md(m),
        "docs/04-imagens/README.md": images_md(m),
        "docs/metrics-current.json": json.dumps(m,ensure_ascii=False,indent=2)+"\n",
        "docs/index.json": json.dumps(index_json(m),ensure_ascii=False,indent=2)+"\n",
    }


def main():
    p=argparse.ArgumentParser()
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument("--write",action="store_true")
    group.add_argument("--check",action="store_true")
    args=p.parse_args()
    m=metrics()
    result=outputs(m)
    for path,content in result.items():
        target=ROOT/path
        if args.write:
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_text(content,encoding="utf-8")
        else:
            if not target.exists() or target.read_text(encoding="utf-8")!=content:
                raise SystemExit("FAIL: documentação desatualizada: "+path)
    print("FUT_STAGE9_METRICS_JSON="+json.dumps({key:value for key,value in m.items()
        if key!="collections"},ensure_ascii=False,separators=(",",":")))
    print("PASS: métricas calculadas dos ficheiros JSON sem alterar catálogos")


if __name__=="__main__":
    main()
