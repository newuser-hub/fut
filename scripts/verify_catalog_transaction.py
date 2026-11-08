#!/usr/bin/env python3
"""Gate independente, ANTES do commit, para o lote exato autorizado.

Compara o snapshot gerado com origin/main, sem escrever quaisquer ficheiros.
Não dispensa verify_catalogs.py/verify_expansion_plan.py e, no roteiro,
verify_audited_batch.py para o pedido original do evento.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True)


def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def base(path: str):
    return json.loads(git("show", f"origin/main:{path}"))


def scope(mode: str, request: dict | None) -> list[str]:
    if mode in ("next", "roadmap"):
        if not isinstance(request, dict) or not isinstance(
            request.get("collections"), list
        ):
            raise ValueError("Lote sem pedido autorizado")
        cards = request["collections"]
        if len(cards) != 2:
            raise ValueError("O pedido deve selecionar exatamente dois catálogos")
        ids = [x.get("id") for x in cards]
        sources = [x.get("sourceId") for x in cards]
        if not all(isinstance(x, str) and SLUG.fullmatch(x) for x in ids):
            raise ValueError("Identificador do pedido inválido")
        if len(set(ids)) != 2 or any(not isinstance(x, int) for x in sources):
            raise ValueError("Pedido ambíguo, duplicado ou sem origem")
        if mode == "roadmap" and (
            request.get("authorizedSourceIds") != sources
            or request.get("auditPipelineVersion") != 2
        ):
            raise ValueError("IDs autorizados do roteiro não correspondem ao pedido")
        return ids
    if mode == "premier":
        return ["premier-league-flagship-2026-27"]
    if mode == "leagues":
        return ["serie-a-calciatori-2026-27", "ligue-1-foot-2025-26"]
    raise ValueError("Modo de escrita desconhecido")


def verify(mode: str, request: dict | None) -> None:
    selected = scope(mode, request)
    expected = set(selected)
    original = base("public/library.json")
    published = load("public/library.json")
    before = {x["id"]: x for x in original}
    after = {x["id"]: x for x in published}
    if len(after) != len(published) or len(before) != len(original):
        raise ValueError("Manifesto com IDs duplicados")
    if any(x not in after or after[x] != y for x, y in before.items()
           if x not in expected):
        raise ValueError("Coleção anterior modificada ou eliminada")
    if any(x not in expected for x in after.keys() - before.keys()):
        raise ValueError("Coleção extra não autorizada")
    if any(x not in after or after[x].get("status") != "active" for x in selected):
        raise ValueError("Catálogo do pedido ainda não ativo")
    for slug in selected:
        item = after[slug]
        path = f"public/data/{slug}.json"
        data = load(path)
        cards = data.get("cards")
        sections = data.get("sections")
        if not isinstance(cards, list) or not isinstance(sections, list):
            raise ValueError("Catálogo sem cards/sections: " + slug)
        if (data.get("id") != slug or not cards or not sections or
            len(cards) != item.get("count") or
            len(sections) != item.get("sections")):
            raise ValueError("Contagem ou estrutura divergente no catálogo: " + slug)
        ids = [c.get("id") for c in cards]
        if any(not isinstance(x, str) or not x for x in ids) or len(set(ids)) != len(ids):
            raise ValueError("IDs de cromos inválidos ou duplicados: " + slug)
        if slug in before and before[slug].get("status") == "active":
            prior_file = f"public/data/{slug}.json"
            try:
                old = base(prior_file)
            except subprocess.CalledProcessError:
                old = None
            if old is not None:
                old_ids = {x.get("id") for x in old.get("cards", [])}
                if not old_ids.issubset(set(ids)):
                    raise ValueError("IDs anteriores eliminados: " + slug)
        if mode in ("next", "roadmap"):
            entry = next(x for x in request["collections"] if x["id"] == slug)
            if data.get("sourceCollectionId") != entry["sourceId"]:
                raise ValueError("Origem divergente do lote exato: " + slug)

    changed = set(git("diff", "--cached", "--name-only", "origin/main", "--").splitlines())
    allowed = {f"public/data/{x}.json" for x in selected}
    allowed.update({"public/library.json", "public/index.html", "src/index.html"})
    if mode == "roadmap":
        allowed.add("public/expansion-plan.json")
        plan = load("public/expansion-plan.json")
        expected_plan = {x["id"]: x for x in plan["collections"]}
        for entry in request["collections"]:
            candidate = expected_plan.get(entry["id"])
            if (not candidate or candidate.get("sourceId") != entry["sourceId"]
                or candidate.get("imageAudit") != "verified"
                or not candidate.get("auditSummary")):
                raise ValueError("Roteiro não confirmou exatamente o lote: " + entry["id"])
    if changed - allowed:
        raise ValueError("Escritas fora do lote: " + ", ".join(sorted(changed - allowed)))
    if changed and ("public/library.json" not in changed
                    or not any(f"public/data/{x}.json" in changed for x in selected)):
        raise ValueError("Commit parcial sem manifesto e catálogo do lote")
    # A ausência de diferenças significa que o lote já foi publicado.
    # Evitar commits vazios sem afetar o pedido imutável associado ao run.
    html = (ROOT / "src/index.html").read_text(encoding="utf-8")
    public_html = (ROOT / "public/index.html").read_text(encoding="utf-8")
    if html != public_html or '"fut.album."+id+".progress.v1"' not in html:
        raise ValueError("Frontend ou chave de progresso alterada")
    print("PASS: lote exato validado, IDs preservados; "
          f"{len(selected)} coleções; {len(changed)} ficheiros alterados")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=("next", "roadmap", "premier", "leagues"),
                   required=True)
    p.add_argument("--request", help="Snapshot imutável do pedido no SHA do evento")
    a = p.parse_args()
    if a.mode in ("next", "roadmap") and not a.request:
        p.error("--request obrigatório para lotes autorizados")
    req = load(a.request) if a.request else None
    verify(a.mode, req)


if __name__ == "__main__":
    main()
