#!/usr/bin/env python3
"""Import 2026/27 Premier League from the official Topps 21-page checklist.

Official promotional images are the only accepted images, never generic player
photographs or artwork from another card. Every entry has a stable identifier.
"""
from __future__ import annotations
import hashlib
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
import pymupdf

ROOT=Path(__file__).resolve().parent.parent
SLUG="premier-league-flagship-2026-27"
OFFICIAL="https://cdn.shopify.com/s/files/1/0739/2015/1805/files/26_27_Topps_Flagship_Premier_League_Checklist_2.pdf?v=1784890627"
CLUBS=["Brighton & Hove Albion","AFC Bournemouth","Nottingham Forest","Tottenham Hotspur",
       "Newcastle United","Manchester United","Manchester City","Crystal Palace",
       "Liverpool FC","Leeds United","Aston Villa","Coventry City","Ipswich Town",
       "Hull City","Sunderland","Brentford","Chelsea","Everton","Fulham","Arsenal"]
TEAM_END=re.compile(r"\s+("+"|".join(re.escape(t) for t in CLUBS)+r")(?:\s+Rookie)?(?:\s+\d{4}/\d{2})?\s*$")
CARD=re.compile(r"^\s*(\d{1,3}|[A-Za-z0-9]{2,5}-[A-Za-z0-9]{1,6}|[A-Z0-9]{2,5}\s+\d{1,3})\s{2,}(\S.*)$")
DUAL=re.compile(r"\b(DA-[A-Z]{2,3})\b")
PROMO={
 "8B 11":"https://images.topps.com/v3/assets/bltc7206971cb4b2bfc/blt90b22202db3facad/6a60d7e89e4a6b7d3af52d49/26PRML_8BIT_BALLERS_CRF_2508.jpg",
 "FF 24":"https://images.topps.com/v3/assets/bltc7206971cb4b2bfc/blt6d9cb874b191eef3/6a60d8187bf5f64b8143132c/26PRML_FLYING_THE_FLAG_CRF_2223.jpg",
 "FSA-MD":"https://images.topps.com/v3/assets/bltc7206971cb4b2bfc/blt1a6086964ad0bdf8/6a60d7e8a66b92bc018134a1/26PRML_FUTURE_STARS_AUTO_CRF_8110.jpg",
 "MA 3":"https://images.topps.com/v3/assets/bltc7206971cb4b2bfc/blt21ad0e7c89a5989f/6a60d7e88a87c87eaf5e83a1/26PRML_MAYHEM_CRF_3312.jpg",
 "RT 21":"https://images.topps.com/v3/assets/bltc7206971cb4b2bfc/blt3b617fe390575cb6/6a60d7e7b93259893cb2730c/26PRML_RETRO_THREADS_CRF_2653.jpg",
}
SECTION={
 "8B":"8 Bit Ballers","RTN":"Remember the Name","SPL":"Stars of the Premier League",
 "FSA":"Future Stars Autographs","SPLA":"Stars of the Premier League Autographs",
 "BA":"Base Autograph Cards","BR":"Base Card Relics","PC":"Premier Class Autograph Relics",
 "AR":"Topps Autograph Relics","EX":"Marks of Excellence",
 "CA":"25 Years Champions Anniversary Autographs","DA":"Dual Autographs",
 "DR":"Diamond Rookies","UBM":"Ultra Beast Mode","GL":"Gold Lion",
 "SGL":"True Gold Lion","PT":"Perfect 10","VI":"Vibes","MA":"Mayhem",
 "OF":"On Fire","GB":"Golden Boot","BE":"Black Edge","QU":"Quasar",
 "BB":"Billboard Material","CD":"Carpe Diem","HP":"Home Pitch",
 "PS":"Perfect Storm","TR":"The Rise","AK":"All Kings","CC":"Chrome Classics",
 "BM":"Beast Mode","NB":"Nitro Boost","FF":"Flying the Flag",
}
AUTOS={
 "CC":"Chrome Classics Autograph Cards","PT":"Perfect 10 Autograph Cards",
 "VI":"Vibes Autograph Cards","MA":"Mayhem Autograph Cards",
 "OF":"On Fire Autograph Cards","GB":"Golden Boot On-Card Autographs",
 "BE":"Black Edge Autograph Cards",
}

def read_url(url,max_bytes):
    request=Request(url,headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36","Referer":"https://uk.topps.com/","Accept":"image/avif,image/webp,image/apng,image/*,*/*"})
    with urlopen(request,timeout=30) as response:
        data=response.read(max_bytes+1)
        mime=response.headers.get("Content-Type","").lower().split(";")[0]
        if response.status!=200 or len(data)>max_bytes:raise RuntimeError("HTTP or size invalid")
    return data,mime

def named_team(text):
    text=re.sub(r"\s+"," ",text).strip()
    match=TEAM_END.search(" "+text)
    if not match:return None,None
    return text[:max(0,match.start()-1)].strip(),match.group(1)

def main():
    pdf,mime=read_url(OFFICIAL,7_000_000)
    if mime!="application/pdf":raise RuntimeError("Official checklist MIME incorrect")
    doc=pymupdf.open(stream=pdf,filetype="pdf")
    if len(doc)!=21:raise RuntimeError("Unexpected official PDF page count")
    items=[]; section=""; dual_active=None; dual_items={}; unmatched=[]
    for p,page in enumerate(doc):
        for raw in page.get_text(sort=True).splitlines():
            line=raw.strip()
            if not line or line.startswith("Checklists provided by Topps") or line.startswith("product at the time"):continue
            if (line==line.upper() and any(c.isalpha() for c in line) and len(line)<85
                and not CARD.match(raw) and not DUAL.fullmatch(line)):
                section=line.title()
                if section!="Dual Autographs":dual_active=None
                continue
            if line.startswith("GOLDEN BOOT Year Won"):
                section="Golden Boot"
                continue
            if section=="Dual Autographs":
                token=DUAL.search(raw)
                if token:
                    number=token.group(1)
                    if number not in dual_items:
                        c={"number":number,"names":[],"clubs":[],"section":section,"category":section}
                        dual_items[number]=c;items.append(c)
                    dual_active=number
                candidate=DUAL.sub("",raw).strip()
                if candidate and dual_active:
                    name,club=named_team(candidate)
                    if name and name not in dual_items[dual_active]["names"]:
                        dual_items[dual_active]["names"].append(name)
                        dual_items[dual_active]["clubs"].append(club)
                continue
            m=CARD.match(raw)
            if not m:
                if any(c.isdigit() for c in line) and len(line)>5:unmatched.append((p,line))
                continue
            number=re.sub(r"\s+"," ",m.group(1).strip())
            name,club=named_team(m.group(2))
            if not name:
                unmatched.append((p,line))
                continue
            if number.isdigit():kind="Future Stars" if int(number)<=20 else club
            else:
                code=number.split("-")[0] if "-" in number else number.split(" ")[0]
                kind=AUTOS.get(code) if "-" in number and code in AUTOS else SECTION.get(code,section or "Extras")
            items.append({"number":number,"name":name,"team":club,"section":kind,"category":kind})
    for c in items:
        if "names" in c:
            c["name"]=" / ".join(c.pop("names"))
            c["team"]=" / ".join(dict.fromkeys(c.pop("clubs")))
    numbers=[c["number"] for c in items]
    counts=Counter(numbers)
    duplicates={n:k for n,k in counts.items() if k>1}
    print("Parser:",len(items),"cards, duplicates:",duplicates,flush=True)
    print("Sections:",dict(Counter(x["section"] for x in items)),flush=True)
    print("Unparsed samples:",unmatched[:35],flush=True)
    if (len(items)!=1138 or duplicates or
        any(not c.get("name") or not c.get("team") for c in items)):
        raise RuntimeError("Full official checklist could not be reconciled exactly (expected 1138)")
    sections=[]
    for i,c in enumerate(items,1):
        if c["section"] not in sections:sections.append(c["section"])
        c.update(id=SLUG+"-"+hashlib.sha1(c["number"].encode()).hexdigest()[:12],
                 originalNumber=c["number"],order=i,optional=c["number"].isdigit()==False,
                 type=c["section"],image=None,available=False,sha256=None,bytes=0)
    for number,url in PROMO.items():
        candidates=[c for c in items if c["number"]==number]
        if len(candidates)!=1:raise RuntimeError("Official preview cannot be mapped: "+number)
        try:
            img,mime=read_url(url,3_000_000)
            if mime.startswith("image/") and len(img)>1500:
                candidates[0].update(image=url,available=True,sha256=hashlib.sha256(img).hexdigest(),
                                     bytes=len(img),imageKind="official-preview")
        except Exception as exc:
            print("Official image unavailable:",number,type(exc).__name__,str(exc)[:150],flush=True)
            # The images.topps.com CDN blocks GitHub runner IPs (HTTP 403).
            # Keep an honest direct-source *link* for browser rendering, but
            # never manufacture bytes or a SHA256 checksum for that image.
            if "403" in str(exc) and url.startswith("https://images.topps.com/"):
                candidates[0].update(image=url,available=True,imageKind="official-preview-link",bytes=0,sha256=None)
    image_count=sum(c["available"] for c in items)
    verified_count=sum(bool(c["sha256"]) for c in items)
    audit={"available":image_count,"verified":verified_count,"linked":image_count-verified_count,"missing":len(items)-image_count,
           "checkedAt":datetime.now(timezone.utc).date().isoformat(),
           "source":"Official Topps links (HTTP 403 on runner); only downloaded bytes receive SHA256"}
    cat={"id":SLUG,"title":"Premier League · Topps Flagship 2026/27",
         "subtitle":"Official Topps Flagship Premier League 2026/27",
         "year":"26/27","source":OFFICIAL,"publisher":"Topps","cover":None,
         "sections":sections,"cards":items,"declaredCount":1138,"sourceTotal":len(items),
         "catalogueMode":"official-checklist","imageAudit":audit}
    libfile=ROOT/"public/library.json"
    library=json.loads(libfile.read_text(encoding="utf8"))
    existing=next((x for x in library if x["id"]==SLUG),None)
    if existing and existing["status"]=="active":
        oldfile=ROOT/"public/data"/(SLUG+".json")
        if oldfile.exists():
            previous=json.loads(oldfile.read_text(encoding="utf8"))
            if (previous.get("imageAudit",{}).get("available",0)>=image_count and previous.get("sections")==sections):
                print("No-op; no additional images to integrate",flush=True)
                return
    entry={"id":SLUG,"title":cat["title"],"year":"26/27","count":len(items),
           "sections":len(sections),"category":"Clubes · Premier League","status":"active",
           "cover":None,"description":"Checklist oficial completa. Cinco ligações diretas a imagens promocionais Topps (não auditadas por hash, disponibilidade variável); restantes cartas sem imagem."}
    if existing:existing.update(entry)
    else:library.append(entry)
    target=ROOT/"public/data";target.mkdir(exist_ok=True,parents=True)
    (target/(SLUG+".json")).write_text(json.dumps(cat,ensure_ascii=False,separators=(",",":")),encoding="utf8")
    libfile.write_text(json.dumps(library,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("INTEGRATED:",SLUG,len(items),"entries",len(sections),"sections",image_count,"verified previews",flush=True)

if __name__=="__main__":main()
