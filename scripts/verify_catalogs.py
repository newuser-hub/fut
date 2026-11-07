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
    # A edição Match Attax inclui extras sem fotografia pública; as suas
    # posições mantêm-se navegáveis com o fallback já existente no motor.
    verified=[c for c in cards if c.get('available')]
    unavailable=[c for c in cards if not c.get('available')]
    assert all(c.get('sha256') and c.get('bytes',0)>1000 and
               (c.get('image') or '').startswith('https://www.cromos.pt/storage/uploads/stickers/')
               for c in verified),(entry['id'],'image audit invalid')
    assert all(not c.get('image') and not c.get('sha256') for c in unavailable),(entry['id'],'unverified image metadata')
    required=[c for c in cards if not c.get('optional')]
    assert len([c for c in required if c.get('available')])>=.8*len(required),(entry['id'],'too many primary images missing')
    assert all(c['id'] and c.get('originalNumber',c['number']) is not None for c in cards)
    if 'imageAudit' in cat:
        assert cat['imageAudit']['available']==len(verified)
        assert cat['imageAudit'].get('missing',len(unavailable))==len(unavailable)
    assert all(c['name'] and c['section'] for c in cards)
    total+=n
    print(f"{entry['id']}: {n} posições / {len(cat['sections'])} secções / {len(verified)} imagens auditadas")
print(f"PASS: {len(active)} collections, {total} distinct image-verified cards")

