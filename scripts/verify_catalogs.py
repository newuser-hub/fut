#!/usr/bin/env python3
"""Validação reprodutível dos catálogos estáticos do portal."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
EXPECTED={'club-world-cup-2025':(550,33),'euro-2004':(334,17)}
for slug,(count,sections) in EXPECTED.items():
 path=ROOT/'public/data'/f'{slug}.json'
 d=json.loads(path.read_text(encoding='utf8'))
 cards=d['cards']
 assert len(cards)==count,(slug,len(cards),count)
 assert len(d['sections'])==sections,(slug,len(d['sections']),sections)
 ids=[x['id'] for x in cards]
 positions=[x['number'] for x in cards]
 assert len(set(ids))==count and len(set(positions))==count
 assert positions==[str(i) for i in range(1,count+1)],slug
 assert all(c['name'] and c['section'] and c['available'] and c['image'] and c['sha256'] and c['bytes']>1000 for c in cards)
 assert all(c['image'].startswith('https://www.cromos.pt/storage/uploads/stickers/') for c in cards)
 print(f'{slug}: {count} cromos, {sections} secções, {sum(c["bytes"] for c in cards):,} bytes de imagens auditados')
print('PASS: 884 cromos auditados, sem duplicados ou imagens em falta.')
