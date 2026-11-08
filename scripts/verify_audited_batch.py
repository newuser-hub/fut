#!/usr/bin/env python3
"""FUT: validação estrutural e de auditoria individual do lote autorizado.

Não volta a descarregar imagens; a importação regista HTTP, MIME, tamanho e SHA-256.
Este verificador independente audita o resultado persistido e preserva a
independência entre catálogos, IDs e progresso em cada edição.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    req = load(ROOT / (sys.argv[1] if len(sys.argv)>1 else "requests/roadmap-batch.json"))
    plan = load(ROOT / "public/expansion-plan.json")
    library = load(ROOT / "public/library.json")
    planned = {x["id"]: x for x in plan["collections"]}
    active = {x["id"]: x for x in library if x["status"]=="active"}
    if not (isinstance(req.get("collections"),list) and len(req["collections"])==2):
        raise ValueError("Pedido não contém exatamente duas coleções")
    all_ids=set()
    seen_hashes={}
    for item in req["collections"]:
        slug=item["id"]
        if slug not in active or slug not in planned:
            raise ValueError(f"Coleção não está ativa ou fora do plano: {slug}")
        cat=load(ROOT/"public/data"/f"{slug}.json")
        cards=cat["cards"]
        main_cards=[c for c in cards if not c["optional"]]
        verified=[c for c in cards if c["available"]]
        audit=planned[slug].get("auditSummary")
        assert planned[slug]["imageAudit"]=="verified" and audit
        assert cat["sourceCollectionId"]==item["sourceId"]==planned[slug]["sourceId"]
        assert cat["id"]==slug and len(cards)==active[slug]["count"]==audit["positions"]
        assert len(cat["sections"])==active[slug]["sections"]==audit["sections"]
        assert len(main_cards)==audit["principal"]==planned[slug]["declaredMainCount"]
        assert len(verified)==audit["verifiedImages"]==cat["imageAudit"]["available"]
        assert len(cards)-len(verified)==audit["missingImages"]==cat["imageAudit"]["missing"]
        assert sum(c["available"] for c in main_cards)==audit["principalWithImage"]
        ids=[c["id"] for c in cards]
        numbers=[c["number"] for c in cards]
        assert len(ids)==len(set(ids)) and len(numbers)==len(set(numbers))
        assert not (all_ids & set(ids)), "IDs coincidentes entre as duas coleções"
        all_ids.update(ids)
        hashes={}
        for c in cards:
            assert isinstance(c["name"],str) and c["name"].strip(), (slug,"nome em branco")
            assert isinstance(c["section"],str) and c["section"].strip(), (slug,"secção em branco")
            assert c["section"] in cat["sections"], (slug,"secção omitida do índice")
            assert c["number"], (slug,"número de navegação em branco")
            if c["available"]:
                assert isinstance(c["bytes"],int) and c["bytes"]>=1500
                assert re.fullmatch(r"[0-9a-f]{64}",c["sha256"]), (slug,"SHA256 inválido")
                assert c["image"].startswith(f"https://www.cromos.pt/storage/uploads/stickers/{item['sourceId']}/")
                hashes.setdefault(c["sha256"],[]).append(c["id"])
                seen_hashes.setdefault(c["sha256"],[]).append(c["id"])
            else:
                assert not c.get("sha256") and not c.get("image"), (slug,"imagem não verificada usada")
        repeats={x:y for x,y in hashes.items() if len(y)>1}
        if repeats:
            raise ValueError(f"{slug}: {len(repeats)} imagens repetidas no catálogo")
        print(f"PASS {slug}: {len(cards)} registos, {len(main_cards)} principais, "
              f"{len(verified)} fotografias SHA256 distintas, {len(cat['sections'])} secções, "
              f"{len(cards)-len(verified)} posições sem imagem")
    repeats={x:y for x,y in seen_hashes.items() if len(y)>1}
    if repeats:
        print(f"AVISO: {len(repeats)} fotografias partilhadas entre edições distintas; verificar relevância editorial")
    else:
        print(f"PASS lote: {len(seen_hashes)} SHA256 únicos no par de coleções")


if __name__=="__main__":
    main()
