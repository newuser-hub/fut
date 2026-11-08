#!/usr/bin/env python3
"""Verifica o roteiro histórico e a nova fase de expansão, sem importar."""
import json,re
from pathlib import Path

root=Path(__file__).resolve().parent.parent
plan=json.loads((root/"public/expansion-plan.json").read_text(encoding="utf8"))
library=json.loads((root/"public/library.json").read_text(encoding="utf8"))
assert plan["version"]==1 and 20<=plan["goal"]<=100 and plan["goal"]%2==0 and plan["batchSize"]==2
items=plan["collections"]
assert isinstance(items,list) and len(items)==plan["goal"]
assert [x["priority"] for x in items]==list(range(1,plan["goal"]+1))
assert len({x["id"] for x in items})==plan["goal"]
assert len({x["sourceId"] for x in items})==plan["goal"]
known={x["id"] for x in library if x["status"]=="active"}
for x in items:
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*",x["id"])
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*",x["sourceSlug"])
    assert x["sourceId"]>0 and x["declaredMainCount"]>0
    assert x["publisher"] in {"Panini","Topps"}
    assert x["imageAudit"] in {"pending","blocked","verified"}
    current=next((c for c in library if c["id"]==x["id"] and c["status"]=="active"),None)
    if current:
        assert x["imageAudit"]=="verified",(x["id"],"expected audit")
        cat=json.loads((root/"public/data"/f"{x['id']}.json").read_text(encoding="utf8"))
        cards=cat["cards"]; audit=x["auditSummary"]
        main=[c for c in cards if not c["optional"]]
        assert audit["positions"]==len(cards)==current["count"]
        assert audit["principal"]==len(main)==x["declaredMainCount"]
        assert audit["principalWithImage"]==sum(bool(c["available"]) for c in main)
        assert audit["verifiedImages"]==sum(bool(c["available"]) for c in cards)
        assert audit["missingImages"]==sum(not c["available"] for c in cards)
        assert audit["sections"]==len(cat["sections"])==current["sections"]
        assert cat["sourceCollectionId"]==x["sourceId"]
    elif x["imageAudit"]=="blocked":
        a=x["auditSummary"]
        assert a["principal"]==x["declaredMainCount"] and a["principalWithImage"]==0
        assert a["verifiedImages"]==0 and a["positions"]>=a["principal"]
        assert a["reason"] and a["evidence"].startswith("https://github.com/")
    else:
        assert x["imageAudit"]=="pending" and "auditSummary" not in x
    assert x["sourceUrl"]==f"https://www.cromos.pt/collection/{x['sourceId']}/{x['sourceSlug']}"
    assert len(x["title"])<=100 and len(x["description"])<=220
assert len(known)==len([x for x in library if x["status"]=="active"])
print(f"PASS: {plan['goal']} candidatas, {plan['goal']//2} lotes, {sum(x['id'] in known for x in items)} integradas, "
      f"{sum(x['imageAudit']=='blocked' for x in items)} sem imagens, "
      f"{sum(x['declaredMainCount'] for x in items)} posições principais previstas (não auditadas)")
