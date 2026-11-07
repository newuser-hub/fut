#!/usr/bin/env python3
"""Incorpora exatamente duas coleções Cromos.pt no FUT.

Fase transacional: só escreve a manifest/source depois de validar os dois
catálogos, respetivas imagens, IDs e ordem. Imagens ficam na fonte original.
Ação GitHub não instala segredos nem publica ficheiros de imagem.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import hashlib
import json
import re
import time

ROOT = Path(__file__).resolve().parent.parent
MAIN_HOST = "https://www.cromos.pt"
USER_AGENT = "Mozilla/5.0 (compatible; FUT-Archive-Validator/1.0)"
MAX_CONTENT = 4_000_000

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.payload = None
    def handle_starttag(self, tag, attrs):
        pairs = dict(attrs)
        if "data-page" in pairs:
            self.payload = json.loads(pairs["data-page"])

def request_bytes(url: str, retries: int = 3) -> tuple[bytes,str]:
    if not url.startswith(MAIN_HOST+"/"):
        raise ValueError("Fora do domínio permitido")
    error = None
    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT, "Referer": MAIN_HOST+"/"})
            with urlopen(req, timeout=24) as response:
                mime=response.headers.get("Content-Type","").lower().split(";")[0]
                content=response.read(MAX_CONTENT+1)
                if response.status != 200 or len(content)>MAX_CONTENT:
                    raise RuntimeError("Estado HTTP ou dimensão inválida")
                return content,mime
        except Exception as exc:
            error=exc
            time.sleep(0.45+attempt*.8)
    raise RuntimeError(f"Falha de acesso à origem: {error}")

def validate_entry(c:dict) -> None:
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", c["id"]), c
    assert isinstance(c["sourceId"],int) and 1 <= c["sourceId"] <= 1000000
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", c["sourceSlug"]), c
    assert isinstance(c["year"],str) and len(c["year"]) <= 10
    assert len(c["title"]) <= 100 and len(c["description"]) <= 220
    assert c["publisher"] in ("Panini","Topps","Merlin","Upper Deck","Other")

def fetch_catalog(item:dict, fixture_dir:Path|None=None, prefetched:Path|None=None) -> dict:
    slug=item["id"]
    if prefetched and (prefetched/f"{slug}.json").exists():
        loaded=json.loads((prefetched/f"{slug}.json").read_text())
        assert loaded["id"]==slug and loaded["sourceCollectionId"]==item["sourceId"]
        print(f"Prefetched audit for {slug}: {len(loaded['cards'])} cards",flush=True)
        return loaded
    url=MAIN_HOST+f"/collection/{item['sourceId']}/{item['sourceSlug']}"
    if fixture_dir and (fixture_dir/f"fut-source-{item['sourceId']}.html").exists():
        html=(fixture_dir/f"fut-source-{item['sourceId']}.html").read_text(encoding="utf-8")
    else:
        content,mime=request_bytes(url)
        assert "text/html" in mime
        html=content.decode("utf-8")
    p=Page();p.feed(html)
    if not p.payload or "collection" not in p.payload.get("props",{}):
        raise ValueError(f"Catálogo Inertia não identificado: {slug}")
    col=p.payload["props"]["collection"]
    if col["id"]!=item["sourceId"]:
        raise ValueError("Identificador da coleção incorreto")
    cards=[]
    sections=[]
    for raw in col["stickers"]:
        section=raw.get("section") or "Outros"
        if section=="-":section="Atualizações internacionais"
        if section not in sections:sections.append(section)
        pathname=str(raw.get("img_path") or "").lstrip("/")
        if pathname and (".." in pathname or pathname.startswith("http")):
            raise ValueError("Caminho de imagem inválido: "+str(raw.get("id")))
        is_optional=bool(raw.get("is_optional"))
        raw_number=str(raw.get("collection_pos") or "").strip()
        if not raw_number and not is_optional:
            raise ValueError("Posição obrigatória em falta: "+str(raw.get("id")))
        cards.append(dict(
            id=f"{slug}-{raw['id']}",
            number=raw_number or "OPT",
            originalNumber=raw_number,
            name=raw["name"],
            section=section,category=section,
            image=f"{MAIN_HOST}/storage/uploads/stickers/{item['sourceId']}/{pathname}" if pathname else None,
            sourceId=raw["id"],type=raw.get("type") or None,
            optional=is_optional,order=int(raw.get("order_in_collection") or 0),
            available=False
        ))
    cards.sort(key=lambda c:(c["order"],c["sourceId"]))
    if len(cards)<col["stickers_count"] or len(cards)<100:
        raise ValueError("Coleção incompleta")
    if len({c["id"] for c in cards})!=len(cards):
        raise ValueError("IDs repetidos")
    # Algumas séries limitadas partilham o número "OPT" e só são
    # distinguíveis pelo ID interno da fonte. Guardamos a referência original.
    seen_numbers=set()
    for c in cards:
        if c["number"] in seen_numbers:
            if not c["optional"]:
                raise ValueError("Posição de carta principal repetida: "+c["number"])
            c["number"]=f"{c['number']} (ref. {c['sourceId']})"
        if c["number"] in seen_numbers:
            raise ValueError("Posição repetida após desambiguação: "+c["number"])
        seen_numbers.add(c["number"])
    if sum(not c["optional"] for c in cards)<col["stickers_count"]:
        raise ValueError("Coleção principal incompleta")

    def verify(c):
        if not c["image"]:
            return None
        try:
            data,mime=request_bytes(c["image"])
            if not mime.startswith("image/") or len(data)<1500:
                return None
            return len(data),hashlib.sha256(data).hexdigest()
        except Exception:
            # Um catálogo pode incluir cartas extra sem fotografia pública.
            # Preservamos o registo e assinalamos a ausência da imagem.
            return None
    print(f"Validating {len(cards)} images for {slug}...",flush=True)
    with ThreadPoolExecutor(max_workers=5) as pool:
        for c,result in zip(cards,pool.map(verify,cards)):
            if result:
                size,digest=result
                c.update(available=True,bytes=size,sha256=digest)
            else:
                c.update(available=False,bytes=0,sha256=None,image=None)
    principal=[c for c in cards if not c["optional"]]
    principal_with_image=sum(c["available"] for c in principal)
    # O Cromos.pt não publica imagens de todas as cartas de raridade elevada.
    # Exigir cobertura suficiente sem suprimir posições genuínas do catálogo.
    if principal_with_image<len(principal)*0.8:
        raise ValueError(
            f"Auditoria insuficiente: {principal_with_image}/{len(principal)} imagens principais")
    verified=sum(c["available"] for c in cards)
    missing=len(cards)-verified
    cover_path=str(col.get("img_path") or "").lstrip("/")
    cover=f"{MAIN_HOST}/storage/{cover_path}" if cover_path else None
    result=dict(
        id=slug,title=item["title"],subtitle=item["subtitle"],year=item["year"],
        source=url,publisher=item["publisher"],cover=cover,
        sections=sections,cards=cards,declaredCount=col["stickers_count"],
        sourceCollectionId=item["sourceId"],sourceTotal=len(cards),
        imageAudit=dict(available=verified,missing=missing,checkedAt=datetime.now(timezone.utc).date().isoformat(),
        source="Cromos.pt HTTP GET, MIME, size and SHA256")
    )
    print(f"OK: {slug} -> {verified}/{len(cards)} verified images, {missing} without photo; {len(sections)} sections",flush=True)
    return result

def ensure_modern_html() -> str:
    source=ROOT/"src/index.html"
    if source.exists():
        return source.read_text(encoding="utf-8")
    legacy=ROOT/"public/index.html"
    html=legacy.read_text(encoding="utf-8")
    old=re.search(r"    const LIBRARY = (\[.*?\]);\n    let activeCollectionId",html)
    if not old:
        raise RuntimeError("Não foi possível localizar o manifesto antigo do portal")
    html=html.replace(old.group(0),"    let LIBRARY = [];\n    let activeCollectionId",1)
    old_start="    async function start(){if(location.hash.startsWith('#/c/'))await restoreHash();else{view='portal';render()}}"
    new_start="""    async function start(){
      try{
        const response=await fetch('/library.json',{cache:'no-cache'});
        if(!response.ok)throw new Error('Índice de coleções indisponível');
        const items=await response.json();
        if(!Array.isArray(items) || items.length<2)throw new Error('Índice inválido');
        LIBRARY=items;
        if(location.hash.startsWith('#/c/'))await restoreHash();
        else{view='portal';render()}
      }catch(error){
        app.innerHTML='<div class="empty"><h2>Não foi possível abrir a biblioteca</h2><p>'+esc(error.message)+'</p><button class="tool" onclick="location.reload()">Tentar novamente</button></div>';
      }
    }"""
    if html.count(old_start)!=1:raise RuntimeError("Função start inesperada")
    html=html.replace(old_start,new_start,1)
    css="""
    .next-batch{border:1px solid rgba(223,181,107,.4);border-radius:17px;background:linear-gradient(120deg,#132e4a,#0b213a);padding:24px;margin:28px 0 6px;display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}
    .next-batch h3{font-size:20px;margin:7px 0}.next-batch p{font-size:12px;color:#a8bfd1;margin:0;line-height:1.65;max-width:630px}
    .next-batch .pill{flex-shrink:0}
    """
    html=html.replace("  </style>",css+"  </style>",1)
    anchor="      html+='</div><p class=\"portal-note\">O progresso fica apenas neste navegador."
    if html.count(anchor)!=1:raise RuntimeError("Portal footer inesperado")
    html=html.replace(anchor,
        """      const pending=LIBRARY.filter(x=>x.status!=='active').slice(0,2);
      html+='</div><section class="next-batch"><div><span class="section-label">Expansão contínua</span><h3>Mais duas coleções no próximo lote</h3><p>'+(pending.length?pending.map(x=>esc(x.title)).join(' + '):'Serão escolhidas duas coleções novas com imagens verificáveis.')+'. Prepara um pedido para continuar o trabalho nesta conversa do ChatGPT.</p></div><button class="pill gold" data-action="next-batch">✦ Copiar pedido para próximas duas ↗</button></section><p class="portal-note">O progresso fica apenas neste navegador.""",1)
    first="if(action==='portal')navigate('portal');else if(action==='collection')"
    if html.count(first)!=1:raise RuntimeError("Ações do portal inesperadas")
    replacement="""if(action==='next-batch'){
      const waiting=LIBRARY.filter(x=>x.status!=='active').slice(0,2);
      const scope=waiting.length>=2
        ?'as coleções '+waiting.map(x=>x.title).join(' e ')
        :'duas novas coleções de futebol com imagens completas e acessíveis, ainda não existentes no FUT';
      const prompt='Autorizo o próximo lote de duas coleções no repositório newuser-hub/fut, já ligado ao Vercel: integra '+scope+'. Verifica integralmente os catálogos, números, imagens, secções, favoritos, progresso independente e gestos; publica e testa em produção. Mantém todas as coleções anteriores. No final, apresenta novamente o botão de autorização para as próximas duas, repetindo o ciclo.';
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(prompt).then(()=>notify('Pedido copiado. Cola-o na conversa do ChatGPT.')).catch(()=>window.prompt('Copia o pedido para o ChatGPT:',prompt));
      else window.prompt('Copia o pedido para o ChatGPT:',prompt);
    }else if(action==='portal')navigate('portal');else if(action==='collection')"""
    html=html.replace(first,replacement,1)
    old_intro="As duas primeiras estão completas; as restantes serão acrescentadas ao portal."
    html=html.replace(old_intro,"As coleções disponíveis estão completas e auditadas; as restantes serão acrescentadas ao portal.")
    return html

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("request",nargs="?",default="requests/next-batch.json")
    cli.add_argument("--prefetched",type=Path,help="Utilização em testes: usa catálogos já auditados")
    cli.add_argument("--fixture-dir",type=Path,help="Utilização em testes: páginas HTML de origem arquivadas")
    args=cli.parse_args()
    config=json.loads((ROOT/args.request).read_text(encoding="utf-8"))
    items=config["collections"]
    if len(items)!=2 or len(set(c["id"] for c in items))!=2:
        raise ValueError("Cada lote deve ter exatamente duas coleções distintas")
    for c in items:validate_entry(c)
    libpath=ROOT/"public/library.json"
    if libpath.exists(): library=json.loads(libpath.read_text(encoding="utf-8"))
    else:
        html=(ROOT/"public/index.html").read_text(encoding="utf-8")
        match=re.search(r"    const LIBRARY = (\[.*?\]);\n",html)
        if not match:raise RuntimeError("Lista inicial de coleções não encontrada")
        library=json.loads(match.group(1))
    current={c["id"]:c for c in library}
    duplicates=[c["id"] for c in items if c["id"] in current and current[c["id"]]["status"]=="active"]
    if len(duplicates)==len(items):
        print("Lote já integrado; não são necessárias alterações.",flush=True)
        return
    if duplicates:
        raise ValueError("Lote parcialmente integrado; escolha duas coleções novas: "+", ".join(duplicates))
    # Tudo validado em memória antes da alteração dos ficheiros.
    catalogs=[fetch_catalog(c,args.fixture_dir,args.prefetched) for c in items]
    source=ensure_modern_html()
    for item,catalog in zip(items,catalogs):
        dest=current.get(item["id"])
        patch=dict(id=item["id"],title=item["title"],year=item["year"],
         count=len(catalog["cards"]),sections=len(catalog["sections"]),
         category=item["category"],status="active",cover=catalog["cover"],
         description=item["description"])
        if dest:dest.update(patch)
        else:library.append(patch)
    # Exclusivamente após a conclusão das duas auditorias.
    (ROOT/"src").mkdir(exist_ok=True)
    (ROOT/"src/index.html").write_text(source,encoding="utf-8")
    (ROOT/"public/index.html").write_text(source,encoding="utf-8")
    for catalog in catalogs:
        file=ROOT/"public/data"/(catalog["id"]+".json")
        file.write_text(json.dumps(catalog,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    libpath.write_text(json.dumps(library,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Integrated",", ".join(c['id'] for c in items),
          "active collections:",sum(x['status']=="active" for x in library),flush=True)

if __name__=="__main__":main()

