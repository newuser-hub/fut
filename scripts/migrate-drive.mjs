#!/usr/bin/env node
/**
 * FUT -> arquivo privado Google Drive. Execute a partir da raiz do repositório.
 *
 * 1) Sem --images: arquiva os catálogos JSON no Drive, mas NÃO publica o manifesto.
 * 2) Com --images: copia todas as imagens disponíveis, verifica hash, publica
 *    os 29 catálogos e só no fim publica library.json como ponto de ativação.
 *
 * Requer FUT_DRIVE_SERVICE_ACCOUNT_JSON, FUT_DRIVE_CATALOGS_FOLDER_ID e
 * FUT_DRIVE_IMAGES_FOLDER_ID. O folder precisa de permissão de escrita para
 * o client_email da conta de serviço. Não comita segredos ou imagens.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';
import {
  driveConfigured, folderIds, findFile, readRawFile, putFile, ensureFolder
} from '../lib/drive-store.js';

const withImages=process.argv.includes('--images');
const onlySlugArg=process.argv.indexOf('--slug');
const onlySlug=onlySlugArg>=0 ? process.argv[onlySlugArg+1] : null;
if(!driveConfigured()){
  throw Error('Defina FUT_DRIVE_SERVICE_ACCOUNT_JSON, FUT_DRIVE_CATALOGS_FOLDER_ID e FUT_DRIVE_IMAGES_FOLDER_ID');
}
if(onlySlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(onlySlug))throw Error('Slug inválido');
const folder=folderIds();
const library=JSON.parse(await readFile('public/library.json','utf8'));
const active=library.filter(x=>x.status==='active');
if(active.length<2||new Set(active.map(x=>x.id)).size!==active.length)
  throw Error('Manifesto local inválido');

const allowedHosts = new Set([
  'www.cromos.pt','cromos.pt','www.stickersone.com','stickersone.com',
  'www.topps.com','topps.com','images.topps.com','cdn.shopify.com',
  'www.paniniamerica.net','paniniamerica.net'
]);
function remoteUrl(value){
  const url=new URL(value);
  if(url.protocol!=='https:'||!allowedHosts.has(url.hostname)||
     url.username||url.password||url.port) throw Error('Origem de imagem não autorizada: '+url.hostname);
  return url.href;
}
function contentType(value){
  const t=value.split(';')[0].toLowerCase();
  if(!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(t))
    throw Error('Content-Type inesperado: '+t);
  return t;
}
async function downloadImage(address,hash){
  const url=remoteUrl(address);
  for(let attempt=0;attempt<4;attempt++){
    try{
      const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},redirect:'follow',
        signal:AbortSignal.timeout(25000)});
      if(!r.ok)throw Error('HTTP '+r.status+' '+url);
      const finalUrl=new URL(r.url);
      if(!allowedHosts.has(finalUrl.hostname))throw Error('Redirecionamento não permitido');
      const mime=contentType(r.headers.get('Content-Type')||'');
      const bytes=Buffer.from(await r.arrayBuffer());
      if(bytes.length<1200||bytes.length>6_000_000)throw Error('Tamanho de imagem inválido');
      const digest=createHash('sha256').update(bytes).digest('hex');
      if(hash && /^[a-f0-9]{64}$/i.test(hash) && hash.toLowerCase()!==digest)
        throw Error('SHA-256 diferente do catálogo: '+url);
      return {bytes,mime,digest};
    }catch(e){
      if(attempt===3)throw e;
      await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
    }
  }
}
async function currentCatalog(slug){
  const file=await findFile(folder.catalog,slug+'.json',{optional:true});
  if(!file)return null;
  try{
    const raw=await readRawFile(file.id,3_000_000);
    return JSON.parse(raw.bytes.toString('utf8'));
  }catch{return null}
}
const manifest=structuredClone(library);
let ready=0,totalImages=0;
for(const entry of active){
  if(onlySlug && onlySlug!==entry.id)continue;
  const catalog=JSON.parse(await readFile(join('public','data',entry.id+'.json'),'utf8'));
  if(catalog.id!==entry.id || catalog.cards.length!==entry.count)
    throw Error('Catálogo incoerente: '+entry.id);
  const prior=await currentCatalog(entry.id);
  const previousIds=new Map((prior?.cards||[]).filter(c=>c.driveFileId).map(c=>[c.id,c.driveFileId]));
  if(!withImages){
    await putFile(folder.catalog,entry.id+'.json',
      Buffer.from(JSON.stringify(catalog)), 'application/json');
    console.log('Arquivado JSON sem imagens:',entry.id,entry.count);
    continue;
  }
  const imageFolder=await ensureFolder(folder.images,entry.id);
  const copy=structuredClone(catalog);
  for(let i=0;i<copy.cards.length;i++){
    const card=copy.cards[i];
    if(card.available===false||!card.image)continue;
    if(previousIds.has(card.id)){
      card.driveFileId=previousIds.get(card.id);
      continue;
    }
    const image=await downloadImage(card.image,card.sha256);
    const ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp',
      'image/gif':'.gif','image/avif':'.avif'}[image.mime];
    const uploaded=await putFile(imageFolder,card.id+ext,image.bytes,image.mime);
    if(!uploaded.id)throw Error('Drive não confirmou a imagem '+card.id);
    card.driveFileId=uploaded.id;
    totalImages++;
    if((i+1)%50===0){
      await putFile(folder.catalog,entry.id+'.json',
        Buffer.from(JSON.stringify(copy)), 'application/json');
      console.log('Checkpoint:',entry.id,i+1+'/'+copy.cards.length);
    }
  }
  const incomplete=copy.cards.filter(x=>x.available!==false&&x.image&&!x.driveFileId);
  if(incomplete.length)throw Error('Imagens não migradas: '+entry.id+' ('+incomplete.length+')');
  const manifestEntry=manifest.find(x=>x.id===entry.id);
  if(manifestEntry.cover){
    const previousCover=prior?.coverDriveFileId;
    if(previousCover){
      manifestEntry.coverDriveFileId=previousCover;
      manifestEntry.coverSha256=prior?.coverSha256 || '';
    }else{
      const image=await downloadImage(manifestEntry.cover,null);
      const ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp',
        'image/gif':'.gif','image/avif':'.avif'}[image.mime];
      const saved=await putFile(imageFolder,'_cover'+ext,image.bytes,image.mime);
      manifestEntry.coverDriveFileId=saved.id;
      manifestEntry.coverSha256=image.digest;
    }
  }
  copy.coverDriveFileId=manifestEntry.coverDriveFileId||null;
  copy.coverSha256=manifestEntry.coverSha256||null;
  await putFile(folder.catalog,entry.id+'.json',
    Buffer.from(JSON.stringify(copy)),'application/json');
  // Ler do Drive e verificar a contagem antes de concluir cada coleção.
  const stored=await currentCatalog(entry.id);
  if(!stored||stored.cards.length!==entry.count ||
     stored.cards.some(x=>x.available!==false&&x.image&&!x.driveFileId))
    throw Error('Verificação pós-upload falhou: '+entry.id);
  ready++;
  console.log('Drive:',entry.id,'OK',entry.count,'posições');
}
if(withImages && !onlySlug){
  if(ready!==active.length)throw Error('Nem todas as coleções estão prontas');
  const plan=await readFile('public/expansion-plan.json');
  await putFile(folder.catalog,'expansion-plan.json',plan,'application/json');
  // Manter library.json por último: nunca expor um manifesto incompleto.
  await putFile(folder.catalog,'library.json',
    Buffer.from(JSON.stringify(manifest)),'application/json');
  const registered=await findFile(folder.catalog,'library.json');
  if(!registered)throw Error('Manifesto Drive não publicado');
  console.log('MIGRAÇÃO COMPLETA:',ready,'coleções;',totalImages,'novas imagens');
  console.log('Só agora é seguro ativar FUT_STORAGE_BACKEND=drive no Vercel.');
}else if(!withImages){
  console.log('Arquivo dos catálogos concluído; o portal NÃO foi alterado.');
}else{
  console.log('Coleção concluída; manifesto global será publicado após migrar todas.');
}
