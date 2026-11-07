#!/usr/bin/env python3
"""Integridade do FUT: todos os catálogos ativos completos, sem duplicados."""
from pathlib import Path
import json

root=Path(__file__).resolve().parent.parent
manifest=root/'public/library.json'
if manifest.exists():
    library=json.loads(manifest.read_text(encoding='utf-8'))
    active=[x for x in library if x['status']=='active']
else:
    active=[
      {'id':'club-world-cup-2025','count':550,'sections':33},
      {'id':'euro-2004','count':334,'sections':17}
    ]

assert len(set(x['id'] for x in library))==len(library) if manifest.exists() else True
total=0
for entry in active:
    cat=json.loads((root/'public/data'/f"{entry['id']}.json").read_text(encoding='utf-8'))
    cards=cat['cards']
    n=len(cards)
    assert n==entry['count'],(entry['id'],'count',n)
    assert len(cat['sections'])==entry['sections'],(entry['id'],'sections')
    assert cat['id']==entry['id']
    assert len({c['id'] for c in cards})==n,(entry['id'],'duplicate ids')
    assert len({str(c['number']) for c in cards})==n,(entry['id'],'duplicate positions')
    assert all(c.get('available') and c.get('sha256') and c.get('bytes',0)>1000 for c in cards),(entry['id'],'image not verified')
    assert all(c.get('image','').startswith('https://www.cromos.pt/storage/uploads/stickers/') for c in cards)
    assert all(c['name'] and c['section'] for c in cards)
    total+=n
    print(f"{entry['id']}: {n} cromos / {len(cat['sections'])} secções")
print(f"PASS: {len(active)} collections, {total} distinct image-verified cards")

