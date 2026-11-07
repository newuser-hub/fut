#!/usr/bin/env python3
"""Audit and add the two accessible Panini league catalogues to FUT.

Only real sticker images from their matching source records are admitted.
Both catalogues are validated in memory before any file is written.
"""
from __future__ import annotations
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import hashlib
import json
import re
import time

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
HOST = "https://stickersone.com"
UA = "Mozilla/5.0 (compatible; FUT-Panini-Catalogue-Auditor/1.0)"
CONFIGS = [
    {
        "id": "serie-a-calciatori-2026-27",
        "source": "https://stickersone.com/it/albumgrid-calciatori-2026-2027-panini-4689",
        "title": "Serie A · Calciatori 2026/27",
        "subtitle": "Calciatori 2026–2027 · Panini",
        "year": "26/27",
        "category": "Clubes · Serie A",
        "description": "Caderneta italiana de 2026/27: equipas, jogadores, lendas e séries adicionais.",
        "expected": 827,
        "main": 589,
        "min_main_coverage": 0.90,
    },
    {
        "id": "ligue-1-foot-2025-26",
        "source": "https://www.stickersone.com/it/albumgrid-foot-ligue-1-2025-2026-panini-4380",
        "title": "Ligue 1 · Foot 2025/26",
        "subtitle": "Foot Ligue 1 2025–2026 · Panini",
        "year": "25/26",
        "category": "Clubes · Ligue 1",
        "description": "Caderneta francesa de 2025/26, com 556 cromos e imagens individuais de quase todas as posições.",
        "expected": 556,
        "main": 556,
        "min_main_coverage": 0.95,
    },
]


def load_http(url: str, retries: int = 2, max_bytes: int = 3_000_000):
    if urlparse(url).hostname not in ("stickersone.com", "www.stickersone.com"):
        raise ValueError("Unexpected image/source host")
    last = None
    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,image/*"})
            with urlopen(req, timeout=21) as response:
                data = response.read(max_bytes + 1)
                content_type = response.headers.get("Content-Type", "").split(";")[0].lower()
                if response.status != 200 or len(data) > max_bytes:
                    raise RuntimeError("Invalid HTTP response or size")
                return data, content_type
        except Exception as exc:
            last = exc
            if attempt + 1 < retries:
                time.sleep(.3 * (attempt + 1))
    raise RuntimeError(str(last))


def section_for(number: str, team: str, italian: bool):
    if team and team.casefold() != "no team":
        return team
    if number.isdigit() and int(number) <= (4 if italian else 7):
        return "Introdução" if italian else "Troféu e Le Classique"
    prefix = re.match(r"^([A-Za-z]+)", number)
    if prefix:
        code = prefix.group(1).upper()
        labels = {
            "FUT": "Futbolini", "UPG": "Calciatori Upgrade",
            "KIT": "Equipamentos", "HC": "Lendas · Time Capsule",
            "FC": "Fantacalcio", "C": "Séries adicionais C",
            "R": "Edições especiais", "K": "Edições especiais K",
        }
        return labels.get(code, "Especiais · " + code)
    return "Especiais e atualizações"


def parse(config):
    content, mime = load_http(config["source"])
    if "html" not in mime:
        raise RuntimeError("Catalogue source is not HTML")
    soup = BeautifulSoup(content, "html.parser")
    tiles = soup.select(".card.figurina.card-body")
    if len(tiles) != config["expected"]:
        raise RuntimeError(f"{config['id']}: catalogue count {len(tiles)} != {config['expected']}")
    cover = None
    meta = soup.select_one('meta[property="og:image"]')
    if meta and meta.get("content"):
        candidate = urljoin(config["source"], meta["content"])
        if urlparse(candidate).hostname in ("stickersone.com", "www.stickersone.com"):
            cover = candidate

    cards = []
    for index, tile in enumerate(tiles, 1):
        label_el = tile.select_one(".area-text strong")
        label = label_el.get_text(" ", strip=True) if label_el else ""
        number_match = re.search(r"(?:Figurina|Card)\s+n[°.]*\s*(.+)$", label, re.I)
        if not number_match:
            raise ValueError(f"Invalid printed number on position {index}: {label!r}")
        number = number_match.group(1).strip()
        name_el = tile.select_one(".area-text.mt-2 strong")
        name = name_el.get_text(" ", strip=True) if name_el else ""
        if not name or not number:
            raise ValueError(f"Missing card name/number {index}")

        detail = tile.select_one(".area-img a[href]")
        if detail is None:
            raise ValueError(f"Missing card detail link {index}")
        detail_url = urljoin(config["source"], detail["href"])
        source_match = re.search(r"-(\d+)(?:/)?$", detail_url)
        if source_match is None:
            raise ValueError(f"Missing stable source ID: {detail_url}")
        source_id = int(source_match.group(1))

        icon = tile.select_one(".area-img img.scudetto")
        club = icon.get("title", "").strip() if icon else ""
        if club.casefold() == "no team":
            club = ""
        card_img = tile.select_one(".area-img picture img")
        img_path = (card_img.get("src") or "").strip() if card_img else ""
        valid_image = bool(img_path and "/images/figurine/" in img_path and
                           "/vuote/" not in img_path and
                           img_path.lower().endswith((".jpg", ".jpeg", ".webp", ".png")))
        url = urljoin(config["source"], img_path) if valid_image else None
        if url and urlparse(url).hostname not in ("stickersone.com", "www.stickersone.com"):
            raise ValueError(f"External unexpected image URL: {url}")
        section = section_for(number, club, config["id"].startswith("serie-a"))
        optional = not (number.isdigit() and 1 <= int(number) <= config["main"])

        cards.append({
            "id": f"{config['id']}-{source_id}",
            "number": number,
            "originalNumber": number,
            "name": name,
            "section": section,
            "category": section,
            "team": club or None,
            "image": url,
            "sourceId": source_id,
            "sourceDetail": detail_url,
            "type": "extra" if optional else "base",
            "optional": optional,
            "order": index,
            "available": False,
        })

    counts = Counter(c["number"] for c in cards)
    duplicate_numbers = {n: num for n, num in counts.items() if num > 1}
    if duplicate_numbers:
        raise ValueError(f"Duplicate print positions {duplicate_numbers}")
    if len({c["id"] for c in cards}) != len(cards):
        raise ValueError("Duplicate source IDs")
    principal = [c for c in cards if not c["optional"]]
    if len(principal) != config["main"]:
        raise ValueError(f"Main card sequence incomplete: {len(principal)} vs {config['main']}")
    if {int(c["number"]) for c in principal} != set(range(1, config["main"] + 1)):
        raise ValueError("Gaps in base sticker numbers")

    candidates = [c for c in cards if c["image"]]
    print(f"{config['id']}: {len(cards)} unique records, "
          f"{len(candidates)} individual photo URLs; auditing...", flush=True)

    def verify(c):
        if not c["image"]:
            return None
        try:
            image, image_mime = load_http(c["image"], retries=2, max_bytes=2_000_000)
            if image_mime not in ("image/jpeg", "image/webp", "image/png") or len(image) < 1500:
                return None
            return len(image), hashlib.sha256(image).hexdigest()
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=8) as pool:
        for c, result in zip(cards, pool.map(verify, cards)):
            if result:
                size, sha = result
                c.update(available=True, bytes=size, sha256=sha)
            else:
                c.update(available=False, image=None, bytes=0, sha256=None)
    verified = [c for c in cards if c["available"]]
    missing = len(cards) - len(verified)
    principal_available = sum(c["available"] for c in principal)
    coverage = principal_available / len(principal)
    if coverage < config["min_main_coverage"]:
        raise ValueError(f"Insufficient main collection photos: "
                         f"{principal_available}/{len(principal)}")
    if len(verified) < .85 * len(candidates):
        raise ValueError("Image host too unreliable for safe integration")
    if len({c["sha256"] for c in verified}) < len(verified) * .90:
        raise ValueError("Excessive repeated image bytes: possible placeholders")
    sections = list(dict.fromkeys(c["section"] for c in cards))
    print(f"PASS {config['id']}: {len(cards)} positions, {len(sections)} sections, "
          f"{len(verified)} verified images, {missing} missing "
          f"({principal_available}/{len(principal)} main positions)", flush=True)

    return {
        "id": config["id"],
        "title": config["title"],
        "subtitle": config["subtitle"],
        "year": config["year"],
        "source": config["source"],
        "publisher": "Panini",
        "cover": cover,
        "sections": sections,
        "cards": cards,
        "declaredCount": config["main"],
        "sourceTotal": len(cards),
        "catalogueMode": "stickerone-image-audit",
        "imageAudit": {
            "available": len(verified),
            "missing": missing,
            "checkedAt": datetime.now(timezone.utc).date().isoformat(),
            "source": "StickersOne GET, MIME, bytes, SHA256; placeholder images excluded",
        },
    }


def main():
    root = ROOT / "public"
    path = root / "library.json"
    library = json.loads(path.read_text(encoding="utf8"))
    current = {item["id"]: item for item in library}
    ids = [conf["id"] for conf in CONFIGS]
    if all(x in current and current[x]["status"] == "active" for x in ids):
        print("Both collections already integrated; no changes", flush=True)
        return
    if any(x in current and current[x]["status"] == "active" for x in ids):
        raise ValueError("Partially integrated batch; not replacing old data")
    # Transactional: no files are altered if either audit fails.
    catalogs = [parse(c) for c in CONFIGS]
    entries = []
    for config, cat in zip(CONFIGS, catalogs):
        entries.append({
            "id": cat["id"], "title": cat["title"], "year": cat["year"],
            "count": len(cat["cards"]), "sections": len(cat["sections"]),
            "category": config["category"], "status": "active",
            "cover": cat["cover"],
            "description": config["description"],
        })
    for entry in entries:
        if entry["id"] in current:
            current[entry["id"]].update(entry)
        else:
            library.append(entry)
    data_dir = root / "data"
    for cat in catalogs:
        (data_dir / (cat["id"] + ".json")).write_text(
            json.dumps(cat, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    path.write_text(json.dumps(library, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("INTEGRATED", ", ".join(ids), "active", sum(x["status"] == "active" for x in library), flush=True)


if __name__ == "__main__":
    main()
