#!/usr/bin/env python3
"""Sincroniza o roteiro após uma importação auditada, na mesma transação Git.

Executa-se depois de ingest_batch.py e antes de verify_expansion_plan.py.
Não altera registos, fotos ou IDs das coleções; apenas assinala o estado e
contagens comprovadas das coleções que já passaram na auditoria da origem.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    request_path = ROOT / (sys.argv[1] if len(sys.argv)>1 else "requests/roadmap-batch.json")
    request = read(request_path)
    plan_path = ROOT / "public/expansion-plan.json"
    plan = read(plan_path)
    manifest = read(ROOT / "public/library.json")
    indexed = {x["id"]: x for x in manifest if x["status"] == "active"}
    planned = {x["id"]: x for x in plan["collections"]}
    if len(request["collections"])!=2:
        raise ValueError("A synchronização é transacional por duas coleções")
    result = []
    for selected in request["collections"]:
        slug = selected["id"]
        if slug not in indexed or slug not in planned:
            raise ValueError(f"Coleção não integrada ou ausente do roteiro: {slug}")
        item = indexed[slug]
        candidate = planned[slug]
        if candidate["sourceId"]!=selected["sourceId"]:
            raise ValueError(f"Origem não coincide com a candidata do roteiro: {slug}")
        cat=read(ROOT/"public/data"/f"{slug}.json")
        cards=cat["cards"]
        base=[c for c in cards if not c["optional"]]
        all_verified=[c for c in cards if c["available"]]
        if (cat["id"]!=slug or cat["sourceCollectionId"]!=selected["sourceId"]
            or len(cards)!=item["count"] or len(base)!=candidate["declaredMainCount"]
            or len(cat["sections"])!=item["sections"]
            or len({c["id"] for c in cards})!=len(cards)
            or len({c["number"] for c in cards})!=len(cards)):
            raise ValueError(f"Catálogo, estrutura, IDs ou posições incompatíveis: {slug}")
        if len([c for c in base if c["available"]]) < 0.8*len(base):
            raise ValueError(f"Fotografias principais insuficientes: {slug}")
        if (cat["imageAudit"]["available"]!=len(all_verified)
            or cat["imageAudit"]["missing"]!=len(cards)-len(all_verified)):
            raise ValueError(f"Contagem de imagens inconsistentes: {slug}")
        if any(not c.get("sha256") or c.get("bytes",0)<=1000 for c in all_verified):
            raise ValueError(f"Imagem sem auditoria completa: {slug}")
        summary={
            "auditedAt":cat["imageAudit"]["checkedAt"],
            "positions":len(cards),
            "principal":len(base),
            "principalWithImage":sum(c["available"] for c in base),
            "verifiedImages":len(all_verified),
            "missingImages":len(cards)-len(all_verified),
            "sections":len(cat["sections"]),
            "evidence":f"https://github.com/newuser-hub/fut/actions/runs/{os.environ.get('GITHUB_RUN_ID') or '0'}",
        }
        candidate.update(imageAudit="verified",auditSummary=summary)
        result.append({"id":slug,**summary})
    batch=str(request["batch"])
    execution_log=plan.setdefault("executionLog",[])
    if not any(str(entry.get("batch"))==batch for entry in execution_log):
        execution_log.append({
            "batch":batch,
            "authorized":request.get("authorizedSourceIds",[]),
            "integrated":[x["id"] for x in result],
            "auditRun":f"https://github.com/newuser-hub/fut/actions/runs/{os.environ.get('GITHUB_RUN_ID') or '0'}",
            "details":result,
        })
    plan["lastReviewedAt"]=datetime.now(timezone.utc).date().isoformat()
    # Só gravar após validação simultânea de ambas.
    plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    for x in result:
        print("ROTEIRO SINCRONIZADO",x["id"],x["verifiedImages"],"/",x["positions"],
              "fotografias; principais",x["principalWithImage"],"/",x["principal"],flush=True)


if __name__=="__main__":
    main()
