#!/usr/bin/env python3
"""Verifica o roteiro FUT de 20 coleções, sem executar importações."""
import json,re
from pathlib import Path

root=Path(__file__).resolve().parent.parent
plan=json.loads((root/"public/expansion-plan.json").read_text(encoding="utf8"))
library=json.loads((root/"public/library.json").read_text(encoding="utf8"))
assert plan["version"]==1 and plan["goal"]==20 and plan["batchSize"]==2
items=plan["collections"]
assert isinstance(items,list) and len(items)==20
assert [x["priority"] for x in items]==list(range(1,21))
assert len({x["id"] for x in items})==20
assert len({x["sourceId"] for x in items})==20
known={x["id"] for x in library if x["status"]=="active"}
for x in items:
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*",x["id"])
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*",x["sourceSlug"])
    assert x["sourceId"]>0 and x["declaredMainCount"]>0
    assert x["publisher"] in {"Panini","Topps"}
    assert x["imageAudit"]=="pending"
    assert x["sourceUrl"]==f"https://www.cromos.pt/collection/{x['sourceId']}/{x['sourceSlug']}"
    assert len(x["title"])<=100 and len(x["description"])<=220
assert len(known)==len([x for x in library if x["status"]=="active"])
print(f"PASS: 20 candidatas, 10 lotes, {sum(x['id'] in known for x in items)} já presentes, "
      f"{sum(x['declaredMainCount'] for x in items)} posições principais previstas (não auditadas)")
