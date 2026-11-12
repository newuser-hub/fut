#!/usr/bin/env node
/**
 * FUT -> Drive, geração imutável.
 *
 * --plan                    Só lê os JSON locais; sem rede e sem credenciais.
 * --prepare --generation X  Escreve apenas staging e checkpoints isolados.
 * --validate --generation X Relê e valida staging, hashes e TODOS os bytes.
 * --promote --generation X --expected-active none|Y
 *                           Só altera fut-active.json depois de revalidar.
 * --resume --generation X   Continua checkpoints ou valida geração selada.
 *
 * Escritas exigem --confirm-drive-write. Nunca define FUT_STORAGE_BACKEND.
 * Nunca executar na auditoria com credenciais ou dados reais.
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { URL, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import {
  driveConfigured, folderIds, findFile, readJson, readImage, putFile, ensureFolder
} from '../lib/drive-store.js';
import {
  assertGeneration, digest, prepareGeneration, validateGeneration,
  promoteGeneration, recoverGeneration, readActivePointer
} from '../lib/drive-migration.js';

const hostAllowlist = new Set([
  'www.cromos.pt','cromos.pt','www.stickersone.com','stickersone.com',
  'www.topps.com','topps.com','images.topps.com','cdn.shopify.com',
  'www.paniniamerica.net','paniniamerica.net'
]);

// Exceção EXATA, somente para a capa Premier League 2026/27. Não permite
// outras páginas ou imagens de blogger.googleusercontent.com.
export const PREMIER_LEAGUE_COVER =
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhGPRMcAjAJmxKel9GctoPMiKq-TLsHLjgZutUo4IRtPrjHP8GyMbIU90CzYfhtQa8JwnuI2pmQ53uDti8To5yrRz3mVN-IO8xChpVWsbLtDS8bkskMTBt6ff-gNg6pr0IVPd1DwQ7lozwwrGFe3xrmkirnRfhdgT7wCcVXVhuYfTdyCAADi_BqP0zV9Fs/s1600/2026-27%20Topps%20PL%20Flagship%20-%20Binder1aa.jpg';

const MIME_EXT = Object.freeze({
  'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp',
  'image/gif':'.gif','image/avif':'.avif'
});
const transient = new Set([408,425,429,500,502,503,504]);

export function authorizeSource(address,{kind,collection}) {
  let url;
  try{url=new URL(address);}catch{throw Error('URL de origem inválido');}
  if(url.protocol!=='https:'||url.username||url.password||url.port||
     url.hash)throw Error('URL de origem não autorizado');
  const standard=hostAllowlist.has(url.hostname);
  const exactCover=(kind==='cover'&&
    collection==='premier-league-flagship-2026-27'&&
    url.href===PREMIER_LEAGUE_COVER);
  const frenchSticker = kind === 'card' && collection === 'ligue-1-foot-2025-26' &&
    /^https:\/\/www\.laststicker\.com\/i\/cards\/11771\/[0-9]+\.jpg$/.test(url.href);
  if(!standard&&!exactCover&&!frenchSticker)
    throw Error('Host ou caminho de origem não autorizado');
  return url.href;
}

export function assertImageType(rawType) {
  const mime=String(rawType||'').toLowerCase().split(';')[0].trim();
  if(!Object.hasOwn(MIME_EXT,mime))throw Error('MIME de imagem não permitido');
  return mime;
}

export async function boundedImage(response,maxBytes=6_000_000) {
  const header=response.headers?.get('content-length');
  if(header!==null&&header!==undefined) {
    const n=Number(header);
    if(!Number.isSafeInteger(n)||n<0||n>maxBytes)
      throw Error('Imagem: content-length inválido ou excessivo');
  }
  if(!response.body?.getReader)throw Error('Imagem sem corpo streaming');
  const reader=response.body.getReader();
  const parts=[];
  let len=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      len+=value.byteLength;
      if(len>maxBytes)throw Error('Imagem excede limite de leitura');
      parts.push(Buffer.from(value));
    }
  }catch(e){
    await reader.cancel().catch(()=>{});
    throw e;
  }finally{reader.releaseLock();}
  if(len<1200)throw Error('Imagem demasiado pequena ou placeholder');
  return Buffer.concat(parts,len);
}

export async function downloadImage(address,ctx,{
  fetcher=fetch,retries=2,pause=ms=>new Promise(r=>setTimeout(r,ms))
}={}) {
  const original=authorizeSource(address,ctx);
  for(let attempt=0;attempt<=retries;attempt++){
    let status=null;
    try{
      let current=original;
      let hops=0;
      while(true){
        const r=await fetcher(current,{
          method:'GET',redirect:'manual',
          headers:{'Accept':'image/jpeg,image/png,image/webp,image/gif,image/avif'},
          signal:AbortSignal.timeout(16000)
        });
        status=r.status;
        if([301,302,303,307,308].includes(status)){
          if(++hops>4)throw Error('Imagem: demasiados redirecionamentos');
          const location=r.headers.get('location');
          if(!location)throw Error('Imagem: redirecionamento sem destino');
          const next=new URL(location,current).href;
          current=authorizeSource(next,ctx); // validar CADA salto
          await r.body?.cancel?.();
          continue;
        }
        if(!r.ok){
          await r.body?.cancel?.();
          throw Error('Imagem: HTTP '+r.status);
        }
        const mime=assertImageType(r.headers.get('content-type'));
        const bytes=await boundedImage(r);
        return {bytes,mime,sha256:digest(bytes),urlFinal:current};
      }
    }catch(e) {
      const retry=(status!==null?transient.has(status):
        /fetch|abort|timeout|network/i.test(String(e?.message||'')));
      if(!retry||attempt===retries)throw e;
      await pause(300*(attempt+1));
    }
  }
  throw Error('Imagem não obtida');
}

function argumentsFrom(argv){
  const flags=new Set(), options=new Map();
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(['--plan','--prepare','--validate','--promote','--resume',
      '--confirm-drive-write'].includes(token)){
      if(flags.has(token))throw Error('Opção duplicada');
      flags.add(token);
      continue;
    }
    if(['--generation','--slug','--expected-active'].includes(token)){
      if(options.has(token)||!argv[i+1]||argv[i+1].startsWith('--'))
        throw Error('Parâmetro ausente ou duplicado: '+token);
      options.set(token,argv[++i]);
      continue;
    }
    throw Error('Opção de migração desconhecida: '+token);
  }
  const modes=['--plan','--prepare','--validate','--promote','--resume']
    .filter(x=>flags.has(x));
  if(modes.length>1)throw Error('Selecionar apenas uma fase');
  const mode=modes[0]||'--plan';
  if(mode!=='--plan'){
    assertGeneration(options.get('--generation'));
    if(!driveConfigured())throw Error('Google Drive não está configurado');
  }
  if(['--prepare','--promote','--resume'].includes(mode)&&
    !flags.has('--confirm-drive-write'))
    throw Error('Esta operação exige --confirm-drive-write');
  if(options.has('--slug')&&mode!=='--prepare')
    throw Error('--slug só é permitido em --prepare');
  if(mode==='--promote'&&!options.has('--expected-active'))
    throw Error('Promoção exige --expected-active none|ID');
  if(mode==='--plan'&&options.size>0)
    throw Error('--plan não aceita identificadores remotos');
  return {mode,options};
}

async function loadLocal(){
  const library=JSON.parse(await readFile('public/library.json','utf8'));
  const plan=JSON.parse(await readFile('public/expansion-plan.json','utf8'));
  const catalogs={};
  for(const e of library.filter(e=>e.status==='active'))
    catalogs[e.id]=JSON.parse(await readFile('public/data/'+e.id+'.json','utf8'));
  return {library,plan,catalogs};
}

export async function runCli(argv=process.argv.slice(2)){
  const {mode,options}=argumentsFrom(argv);
  const source=['--plan','--prepare','--resume'].includes(mode)?
    await loadLocal():null;
  if(mode==='--plan'){
    const active=source.library.filter(x=>x.status==='active');
    const missing=active.flatMap(x=>source.catalogs[x.id].cards)
      .filter(x=>x.available===false||!x.image).length;
    console.log(JSON.stringify({mode:'plan-only',network:false,
      writes:false,collections:active.length,
      positions:active.reduce((sum,x)=>sum+x.count,0),withoutImages:missing,
      instruction:'Usar fases prepare, validate, promote separadas; NUNCA activar backend automaticamente'}));
    return;
  }
  const store={
    folder:folderIds(),
    findFile,readJson,readImage,putFile,ensureFolder,
    fetchImage:downloadImage
  };
  const generation=options.get('--generation');
  // Não logar IDs Drive, segredos, URLs de tokens nem objetos de erro internos.
  let result;
  if(mode==='--prepare')result=await prepareGeneration({
    store,source,generation,onlySlug:options.get('--slug')||null
  });
  else if(mode==='--validate')result=await validateGeneration({store,generation});
  else if(mode==='--resume')result=await recoverGeneration({store,source,generation});
  else if(mode==='--promote'){
    const requested=options.get('--expected-active');
    const expectedActive=requested==='none'?null:assertGeneration(requested);
    result=await promoteGeneration({store,generation,expectedActive});
  }
  console.log(JSON.stringify(result));
}

const isMain=process.argv[1]&&
  pathToFileURL(resolve(process.argv[1])).href===import.meta.url;
if(isMain){
  runCli().catch(error=>{
    // Erros operacionais genéricos; não incluir dados de credenciais.
    const acceptable=[
      /Opção/,/Parâmetro/,/Selecionar/,/exige/,/Google Drive não está/,
      /Geração/,/Catálogo/,/Coleção/,/Manifesto/,/Imagem/,/SHA-256/,
      /Promocão/,/promoção/,/Checkpoint/,/Faltam/,/JSON/,/Tamanho/,
      /Ficheiro/,/Host/,/URL/,/MIME/
    ];
    const message=String(error?.message||'');
    console.error('FUT Drive migração:',
      acceptable.some(re=>re.test(message))?message.slice(0,140):
      'operação falhou; consultar o estado de staging sem credenciais');
    process.exitCode=1;
  });
}
