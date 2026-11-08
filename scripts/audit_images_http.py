#!/usr/bin/env python3
"""Auditoria HTTP retomável de imagens FUT (somente leitura).

Uma falha HTTP/timeout NÃO demonstra que a imagem é do jogador errado.
Os hashes do catálogo são referências históricas, não evidência de novo GET.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import ssl
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener, HTTPSHandler

ALLOWED_HOSTS = frozenset({
    "www.cromos.pt", "cromos.pt",
    "www.stickersone.com", "stickersone.com",
    "images.topps.com"
})
RETRY_HTTP = frozenset({408, 425, 429, 500, 502, 503, 504})
MIME_PREFIX = "image/"
MAX_BYTES = 12 * 1024 * 1024
USER_AGENT = "FUT-ImageAudit/1.0 (+github.com/newuser-hub/fut; read-only)"
PAIR_NUMBERS = frozenset({
    "CC1-EU","CC1-AM","CC2-EU","CC2-AM","CC4-EU","CC5-AM",
    "CC5-EU","CC6-AM","CC6-EU","CC10-AM","CC8-EU","CC13-AM",
    "CC10-EU","CC14-AM","CC11-EU","CC3-AM"
})


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def build_inventory(root):
    library=json.loads((root/"public/library.json").read_text(encoding="utf8"))
    targets=[]
    missing=[]
    for item in sorted(library,key=lambda x:x["id"]):
        slug=item["id"]
        cover=item.get("cover")
        if cover:
            targets.append({
                "key":f"cover:{slug}","kind":"cover","collection":slug,
                "url":cover,"cardId":None,"number":None,
                "claimedSha256":None,"claimedBytes":None,"imageKind":None
            })
        else:
            missing.append({"collection":slug,"kind":"cover"})
        cat=json.loads((root/"public/data"/(slug+".json")).read_text(encoding="utf8"))
        for card in cat["cards"]:
            url=card.get("image")
            if not url:
                missing.append({"collection":slug,"kind":"card","id":card["id"]})
                continue
            targets.append({
                "key":f"card:{slug}:{card['id']}","kind":"card",
                "collection":slug,"cardId":card["id"],"number":card.get("number"),
                "name":card.get("name"),"url":url,
                "claimedSha256":card.get("sha256"),"claimedBytes":card.get("bytes"),
                "imageKind":card.get("imageKind")
            })
    targets.sort(key=lambda x:x["key"])
    return targets,missing


def inventory_summary(root):
    targets,missing=build_inventory(root)
    counts=Counter(x["kind"] for x in targets)
    previews=sum(x.get("imageKind")=="official-preview-link" for x in targets)
    return {"urls_total":len(targets),
        "card_urls":counts["card"],"cover_urls":counts["cover"],
        "missing_cards_or_covers":len(missing),
        "preview_links_without_hash":previews,
        "unique_urls":len(set(x["url"] for x in targets)),
        "duplicates_by_url":len(targets)-len(set(x["url"] for x in targets))}


def is_valid_host(url,allow_local_test=False):
    parsed=urlparse(url)
    if parsed.username or parsed.password or parsed.fragment:
        return False
    if allow_local_test and parsed.scheme=="http" and parsed.hostname in {"127.0.0.1","localhost"}:
        return True
    return parsed.scheme=="https" and parsed.hostname in ALLOWED_HOSTS and parsed.port in {None,443}


class SafeRedirect(HTTPRedirectHandler):
    def __init__(self, allow_local_test=False):
        super().__init__()
        self.allow_local_test=allow_local_test

    def redirect_request(self,request,fp,code,msg,headers,newurl):
        if not is_valid_host(newurl,self.allow_local_test):
            raise ValueError("redirect_to_unapproved_host")
        return super().redirect_request(request,fp,code,msg,headers,newurl)


def single_request(url,timeout=10,allow_local_test=False):
    if not is_valid_host(url,allow_local_test):
        return {"status":"invalid_url","http":None,"finalUrl":None,
                "mime":None,"bytes":None,"sha256":None,"error":"unapproved_scheme_or_host"}
    opener=build_opener(SafeRedirect(allow_local_test),
                        HTTPSHandler(context=ssl.create_default_context()))
    request=Request(url,headers={"User-Agent":USER_AGENT,
                                 "Accept":"image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.9"})
    try:
        with opener.open(request,timeout=timeout) as response:
            code=response.status
            final=response.geturl()
            mime=response.headers.get_content_type()
            if not is_valid_host(final,allow_local_test):
                return {"status":"redirect_blocked","http":code,"finalUrl":final,
                        "mime":mime,"bytes":None,"sha256":None,
                        "error":"unapproved_final_url"}
            if not mime.startswith(MIME_PREFIX):
                return {"status":"non_image_response","http":code,"finalUrl":final,
                        "mime":mime,"bytes":None,"sha256":None,"error":"content_type_not_image"}
            size=0
            hasher=hashlib.sha256()
            while True:
                blob=response.read(65536)
                if not blob:
                    break
                size+=len(blob)
                if size>MAX_BYTES:
                    return {"status":"oversize","http":code,"finalUrl":final,
                            "mime":mime,"bytes":size,"sha256":None,"error":"max_bytes_exceeded"}
                hasher.update(blob)
            return {"status":"verified" if size>1000 else "undersize",
                    "http":code,"finalUrl":final,"mime":mime,
                    "bytes":size,"sha256":hasher.hexdigest(),
                    "error":None if size>1000 else "size_below_1001"}
    except HTTPError as exc:
        return {"status":"transient_http" if exc.code in RETRY_HTTP else "http_unavailable",
                "http":exc.code,"finalUrl":exc.url,"mime":exc.headers.get_content_type()
                if exc.headers else None,"bytes":None,"sha256":None,
                "error":"http_status_"+str(exc.code)}
    except (TimeoutError,URLError,OSError) as exc:
        return {"status":"transient_network","http":None,"finalUrl":url,
                "mime":None,"bytes":None,"sha256":None,
                "error":type(exc).__name__+":"+str(exc)[:160]}
    except ValueError as exc:
        return {"status":"redirect_blocked","http":None,"finalUrl":None,
                "mime":None,"bytes":None,"sha256":None,"error":str(exc)}


def audit_one(target,timeout=10,retries=2,allow_local_test=False):
    attempts=[]
    for index in range(retries+1):
        start=time.monotonic()
        result=single_request(target["url"],timeout,allow_local_test)
        attempts.append({
            "attempt":index+1,"status":result["status"],"http":result["http"],
            "elapsedMs":round((time.monotonic()-start)*1000)
        })
        if result["status"] not in {"transient_http","transient_network"} or index==retries:
            break
        time.sleep(min(1.2,0.2*(2**index)))
    delta=[]
    if result["status"]=="verified" and target.get("claimedSha256"):
        if result["sha256"]!=target["claimedSha256"]:
            delta.append("sha256_changed")
    if result["status"]=="verified" and target.get("claimedBytes"):
        if result["bytes"]!=target["claimedBytes"]:
            delta.append("size_changed")
    if result["status"]=="verified" and target.get("imageKind")=="official-preview-link":
        delta.append("previously_unverified_preview_verified_now")
    return {**target,**result,"checkedAt":now(),"attempts":attempts,
            "divergences":delta}


def load_resume(path):
    completed={}
    if path is None or not path.exists():
        return completed
    with path.open(encoding="utf8") as f:
        for line in f:
            try:
                row=json.loads(line)
            except json.JSONDecodeError:
                # tolerar uma última linha truncada em interrupção
                continue
            if isinstance(row,dict) and "key" in row and "status" in row:
                completed[row["key"]]=row
    return completed


def run_scan(targets,output,workers=4,timeout=10,retries=2,
             resume=None,retry_transient=False,max_seconds=1000):
    previous=load_resume(resume)
    selected={t["key"]:t for t in targets}
    retained={key:row for key,row in previous.items()
        if key in selected and row.get("url")==selected[key]["url"]
        and not (retry_transient and row.get("status") in {"transient_http","transient_network"})}
    todo=[x for x in targets if x["key"] not in retained]
    output.parent.mkdir(parents=True,exist_ok=True)
    # Salvar checkpoint no ficheiro final ANTES de iniciar pedidos.
    with output.open("w",encoding="utf8") as handle:
        for row in retained.values():
            handle.write(json.dumps(row,ensure_ascii=False)+"\n")
        handle.flush()
        completed=dict(retained)
        started=time.monotonic()
        iter_t=iter(todo)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            inflight={}
            for _ in range(min(workers,len(todo))):
                target=next(iter_t,None)
                if target:
                    inflight[pool.submit(audit_one,target,timeout,retries)]=target
            while inflight:
                done,_=wait(inflight,return_when=FIRST_COMPLETED)
                for future in done:
                    t=inflight.pop(future)
                    try:
                        result=future.result()
                    except Exception as e:
                        result={**t,"status":"unexpected_error","http":None,
                            "finalUrl":None,"mime":None,"bytes":None,"sha256":None,
                            "error":str(e)[:160],"checkedAt":now(),
                            "attempts":[],"divergences":[]}
                    completed[result["key"]]=result
                    handle.write(json.dumps(result,ensure_ascii=False)+"\n")
                    handle.flush()
                    if time.monotonic()-started < max_seconds:
                        next_t=next(iter_t,None)
                        if next_t:
                            inflight[pool.submit(audit_one,next_t,timeout,retries)]=next_t
    statuses=Counter(row["status"] for row in completed.values())
    diffs=Counter(d for r in completed.values() for d in r.get("divergences",[]))
    summary={
        "selected":len(targets),"completed":len(completed),
        "remaining":len(targets)-len(completed),"resultsByStatus":dict(statuses),
        "divergences":dict(diffs),
        "started":now(),"resumeFrom":str(resume) if resume else None,
        "workers":workers,"timeoutSec":timeout,"retries":retries
    }
    summary_path=output.parent/"summary.json"
    summary_path.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("AUDIT_BATCH_SUMMARY_JSON="+json.dumps(summary,ensure_ascii=False,sort_keys=True),flush=True)
    for r in completed.values():
        if r.get("imageKind")=="official-preview-link":
            print("PREVIEW_RESULT_JSON="+json.dumps(r,ensure_ascii=False),flush=True)
        if r["collection"]=="world-cup-2026" and r.get("number") in PAIR_NUMBERS:
            print("REGIONAL_PAIR_RESULT_JSON="+json.dumps(r,ensure_ascii=False),flush=True)
        if r.get("divergences"):
            print("DIVERGENCE_JSON="+json.dumps({
                k:r.get(k) for k in ("key","http","finalUrl","mime",
                        "bytes","sha256","claimedSha256","claimedBytes",
                        "divergences","checkedAt")},ensure_ascii=False),flush=True)
    return summary


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",type=Path,default=Path(__file__).resolve().parent.parent)
    p.add_argument("--output",type=Path,default=Path("/tmp/fut-image-audit/results.jsonl"))
    p.add_argument("--resume",type=Path)
    p.add_argument("--retry-transient",action="store_true")
    p.add_argument("--offset",type=int,default=0)
    p.add_argument("--limit",type=int,default=2500)
    p.add_argument("--workers",type=int,default=4)
    p.add_argument("--timeout",type=float,default=10)
    p.add_argument("--retries",type=int,default=2)
    p.add_argument("--max-seconds",type=int,default=1050)
    p.add_argument("--priority",action="store_true")
    p.add_argument("--inventory-only",action="store_true")
    a=p.parse_args()
    inv=inventory_summary(a.root)
    print("AUDIT_INVENTORY_JSON="+json.dumps(inv,sort_keys=True),flush=True)
    if a.inventory_only:
        return
    targets,_=build_inventory(a.root)
    if a.priority:
        targets=[t for t in targets if
            (t["collection"]=="world-cup-2026" and t["number"] in PAIR_NUMBERS)
            or t.get("imageKind")=="official-preview-link"
            or t["kind"]=="cover"]
        # Evidência da URL previamente errada. Não reinserir no catálogo.
        targets.append({
            "key":"known_wrong:ligue-1-foot-2025-26-1355840",
            "kind":"known_wrong_reference","collection":"ligue-1-foot-2025-26",
            "cardId":"ligue-1-foot-2025-26-1355840","number":"383",
            "name":"Salis Abdul Samed",
            "url":"https://www.stickersone.com/images/figurine/4380/1355840.jpg",
            "claimedSha256":"333af17f87bbb8d3574bd001840f9faf69965f3dd5218373b1bb6eaa553d851b",
            "claimedBytes":17631,"imageKind":None
        })
        targets.sort(key=lambda t:t["key"])
    else:
        if a.offset<0 or a.limit<0:
            raise SystemExit("offset/limit negativos")
        targets=targets[a.offset:a.offset+a.limit]
    if not 1<=a.workers<=8 or not 2<=a.timeout<=30 or not 0<=a.retries<=3:
        raise SystemExit("Parâmetros de concorrência/timeout/retries fora dos limites")
    summary=run_scan(targets,a.output,a.workers,a.timeout,a.retries,
                     a.resume,a.retry_transient,a.max_seconds)
    if summary["remaining"]:
        sys.exit("AUDIT_INCOMPLETE: checkpoint JSONL escrito; retomar com --resume")


if __name__=="__main__":
    main()
