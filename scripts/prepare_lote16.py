#!/usr/bin/env python3
"""Lote 16: apenas preparação de PR numa branch; nunca publica main/produção."""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
BASE = "8320e996470332388f4ed956e0a11984d3ff6e60"
MAIN = "7b51023f6767a807786ecf2d03fcf7086a39712c"
REQUEST = "requests/lote16-2026-11-12.json"
SLUGS = ("futebol-2013-14", "futebol-2012-13")
COUNTS = (418, 426)
EXTRAS = (54, 0)


def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def from_git(ref, path):
    return subprocess.check_output(["git", "show", f"{ref}:{path}"], cwd=ROOT)


def check_previous():
    old = json.loads(from_git(BASE, "public/library.json"))
    main = json.loads(from_git(MAIN, "public/library.json"))
    current = load("public/library.json")
    assert len(old) == 51 and sum(c["count"] for c in old) == 28594
    assert len(main) == 47 and sum(c["count"] for c in main) == 26774
    assert [x["id"] for x in old[:47]] == [x["id"] for x in main], "IDs das coleções históricas divergentes"
    assert current[:51] == old, "Manifesto preexistente foi alterado"
    assert len(current) == 53 and sum(c["count"] for c in current) == 29492
    key = lambda cat: [(c["id"], c["number"], c.get("originalNumber"))
                       for c in cat["cards"]]
    for item in old:
        path = f"public/data/{item['id']}.json"
        current_data = (ROOT / path).read_bytes()
        assert current_data == from_git(BASE, path), f"Catálogo anterior modificado: {path}"
        if item["id"] in {x["id"] for x in main}:
            before = json.loads(from_git(MAIN, path))
            after = json.loads(current_data)
            assert key(before) == key(after), f"Progresso/IDs/números anteriores mudaram: {path}"
    print("PASS: 51 catálogos e 28.594 posições anteriores preservados byte a byte", flush=True)


def groups(cards, field):
    buckets = defaultdict(list)
    for c in cards:
        key = str(c.get(field) or "").strip()
        if key:
            buckets[key].append(c["id"])
    return {k: ids for k, ids in sorted(buckets.items()) if len(ids) > 1}


def detail(cat, expected, expected_extra, source):
    cards = cat["cards"]
    required = [c for c in cards if not c["optional"]]
    extra = [c for c in cards if c["optional"]]
    assert len(required) == expected and len(extra) == expected_extra and len(cards) == expected + expected_extra, (
        source["id"], "Contagem de principais/extras mudou desde a amostra; rever guardas")
    assert all(isinstance(c.get("name"), str) and c["name"].strip() and
               isinstance(c.get("section"), str) and c["section"].strip()
               for c in cards), "Nome ou secção em branco"
    assert all(str(c.get("originalNumber") or "").strip() for c in required), "Número original principal em branco"
    assert len({c["id"] for c in cards}) == len(cards)
    assert len({c["number"] for c in cards}) == len(cards)
    assert all(c["section"] in cat["sections"] for c in cards)
    assert all(c["id"].startswith(source["id"] + "-") for c in cards)
    images = [c for c in cards if c["available"]]
    gaps = [c for c in cards if not c["available"]]
    for c in images:
        assert c.get("httpStatus") == 200 and str(c.get("mime") or "").startswith("image/")
        assert isinstance(c.get("bytes"), int) and c["bytes"] >= 1500
        assert len(c.get("sha256") or "") == 64
    sha_groups = groups(images, "sha256")
    assert not sha_groups, f"Bytes de imagem repetidos em {source['id']}: {list(sha_groups)[:8]}"
    assert sum(c["available"] for c in required) >= 0.8 * len(required), "Cobertura principal abaixo de 80%"
    return {
        "id": source["id"], "sourceId": source["sourceId"], "sourceUrl":
            f"https://www.cromos.pt/collection/{source['sourceId']}/{source['sourceSlug']}",
        "positions": len(cards), "principal": len(required), "extras": len(extra),
        "principalWithImage": sum(c["available"] for c in required),
        "extrasWithImage": sum(c["available"] for c in extra),
        "verifiedImages": len(images), "missingImages": len(gaps),
        "sections": len(cat["sections"]),
        "emptyNamesOrSections": 0, "duplicatedCardIds": 0,
        "duplicatedNavigationNumbers": 0,
        "missingOriginalNumbersExtras": [
            {"id": c["id"], "name": c["name"], "section": c["section"]}
            for c in extra if not str(c.get("originalNumber") or "").strip()
        ],
        "duplicateOriginalNumbers": groups(cards, "originalNumber"),
        "duplicateNames": groups(cards, "name"),
        "duplicateImageHashes": sha_groups,
        "missing": [
            {"id": c["id"], "name": c["name"], "originalNumber": c["originalNumber"],
             "section": c["section"], "optional": c["optional"],
             "sourceImage": c.get("sourceImage"), "httpStatus": c.get("httpStatus"),
             "mime": c.get("mime"), "error": c.get("imageAuditError")}
            for c in gaps
        ],
    }


def update_readme(state):
    old = (ROOT / "README.md").read_text(encoding="utf-8")
    metrics = state["totals"]
    dot = lambda n: f"{n:,}".replace(",", ".")
    subs = {
        "51 coleções ativas, 28.594 posições": "53 coleções ativas, 29.492 posições",
        "Inventário das 51 coleções": "Inventário das 53 coleções",
        "**51 / 28.594**": "**53 / 29.492**",
        "| Secções | **1.612** |": f"| Secções | **{dot(metrics['sections'])}** |",
        "| Cromos com URL, bytes e SHA-256 persistidos | **26.529** |":
            f"| Cromos com URL, bytes e SHA-256 persistidos | **{dot(metrics['cardsWithSHA'])}** |",
        "| Posições sem URL de imagem | **2.065** |":
            f"| Posições sem URL de imagem | **{dot(metrics['missingImagePositions'])}** |",
        "| Capas (URLs separadas dos cromos) | **51** |":
            "| Capas (URLs separadas dos cromos) | **53** |",
        "**34 candidatas; 30 integradas, 4 bloqueadas, 0 outras pendentes**":
            "**36 candidatas; 32 integradas, 4 bloqueadas, 0 outras pendentes**",
        "(51 catálogos)": "(53 catálogos)",
        "roteiro de 34 candidatas": "roteiro de 36 candidatas",
    }
    for before, after in subs.items():
        if before not in old:
            raise ValueError("README inesperado; ausência de " + before)
        old = old.replace(before, after)
    (ROOT / "README.md").write_text(old, encoding="utf-8")


def main():
    assert os.environ.get("GITHUB_REF") == "refs/heads/expansion/lote16-2026-11-12"
    req = load(REQUEST)
    assert req["batch"] == "lote-16" and req["authorizedSourceIds"] == [38, 57]
    assert tuple(x["id"] for x in req["collections"]) == SLUGS
    assert len(load("public/library.json")) == 51
    assert load("public/expansion-plan.json")["goal"] == 36
    subprocess.run([sys.executable, "-u", "scripts/ingest_batch.py", REQUEST], cwd=ROOT, check=True)
    check_previous()
    summaries = [detail(load(f"public/data/{slug}.json"), size, extra, source)
                 for slug, size, extra, source in zip(SLUGS, COUNTS, EXTRAS, req["collections"])]
    assert all(x["principalWithImage"] >= 0.8 * x["principal"] for x in summaries)
    subprocess.run([sys.executable, "scripts/sync_expansion_plan.py", REQUEST],
                   cwd=ROOT, check=True)
    plan = load("public/expansion-plan.json")
    for result in summaries:
        entry = next(x for x in plan["collections"] if x["id"] == result["id"])
        assert entry["imageAudit"] == "verified"
        assert entry["auditSummary"]["verifiedImages"] == result["verifiedImages"]
    from scripts.refresh_documentation import metrics
    current = metrics()
    assert current["activeCollections"] == 53 and current["positions"] == 29492
    assert current["roadmap"] == dict(goal=36, candidates=36, integrated=32, blocked=4, pending=0)
    update_readme({"totals": current})
    subprocess.run([sys.executable, "scripts/refresh_documentation.py", "--write"],
                   cwd=ROOT, check=True)
    report = {
        "batch": "lote-16", "checkedAt": datetime.now(timezone.utc).isoformat(),
        "baselineLote15": BASE, "baselineMain": MAIN, "runId": os.environ.get("GITHUB_RUN_ID"),
        "legacyCollectionsUnchanged": 51, "legacyPositionsUnchanged": 28594,
        "totals": {"collections": 53, "positions": 29492}, "collections": summaries,
        "individualImageChecks": "HTTP GET, MIME, bytes and SHA-256 persisted on every available card",
        "imageVisualMatching": "Not an exhaustive visual identification of photographed players"
    }
    (ROOT / "ops/lote16-2026-11-12-audit.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# FUT — Auditoria do lote 16 (preparação, não publicação)",
        "", f"Auditoria em {report['checkedAt']}; base lote 15 {BASE}; main {MAIN}.",
        "", "Fonte: Cromos.pt; todas as posições percorridas. Por imagem disponível:",
        "GET 200, MIME image/*, tamanho mínimo 1.500 bytes, SHA-256 persistido no JSON.",
        "A auditoria dos bytes não substitui revisão visual de identidade dos retratos.",
        "", "| Coleção | Principais | Extras | GET/MIME/SHA verificados | Lacunas | Secções |",
        "|---|---:|---:|---:|---:|---:|"
    ]
    for c in summaries:
        lines.append(f"| {c['id']} | {c['principalWithImage']}/{c['principal']} | "
                     f"{c['extrasWithImage']}/{c['extras']} | {c['verifiedImages']} | {c['missingImages']} | {c['sections']} |")
    lines.extend(["", "## Anomalias e duplicados", ""])
    for c in summaries:
        lines.append("### " + c["id"])
        lines.append(f"- Números originais duplicados: {len(c['duplicateOriginalNumbers'])} grupos")
        lines.append(f"- Nomes repetidos: {len(c['duplicateNames'])} grupos (não presumir erro)")
        lines.append(f"- Extras sem número original: {len(c['missingOriginalNumbersExtras'])} posições")
        lines.append("- SHA-256 repetidos na coleção: 0; IDs e números de navegação repetidos: 0")
        lines.append(f"- Posições sem imagem verificada: {c['missingImages']}")
        for gap in c["missing"]:
            lines.append(f"  - {gap['originalNumber']} — {gap['name']} "
                         f"(ID {gap['id']}; {gap['error']})")
    lines.extend(["", "## Preservação e publicação", "",
                  "- 51 catálogos prévios, incluindo os PRs #3, #4 e #5, inalterados byte a byte relativamente ao lote 15.",
                  "- IDs, números originais e de navegação iguais aos do main de base.",
                  "- Os dois novos catálogos, o manifesto, o roteiro e a documentação são escritos na branch.",
                  "- Nenhuma migração Drive, mudança de autenticação, alteração de main ou publicação.",
                  "", "[JSON detalhado](lote16-2026-11-12-audit.json)"])
    (ROOT / "ops/lote16-2026-11-12-audit.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"status":"READY_FOR_CI","reports":summaries},ensure_ascii=False),flush=True)


if __name__ == "__main__":
    main()
