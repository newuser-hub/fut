import { createHash } from 'node:crypto';

export const ACTIVE_POINTER = 'fut-active.json';
export const READY_MARKER = 'fut-ready.json';
const digestPattern=/^[a-f0-9]{64}$/i;
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXT={ 'image/jpeg':'.jpg', 'image/png':'.png', 'image/webp':'.webp',
  'image/gif':'.gif','image/avif':'.avif' };

export function digest(value) {
  const bytes=Buffer.isBuffer(value)?value:
    Buffer.from(typeof value==='string'?value:JSON.stringify(value));
  return createHash('sha256').update(bytes).digest('hex');
}

export function assertGeneration(generation) {
  if(typeof generation!=='string'||generation.length>60||
    !slugPattern.test(generation))throw Error('Nome de geração inválido');
  return generation;
}

function checkHash(hash,description) {
  if(typeof hash!=='string'||!digestPattern.test(hash))
    throw Error(description+' sem SHA-256 válido');
  return hash.toLowerCase();
}

function activeItems(library) {
  if(!Array.isArray(library)||!library.length)throw Error('Manifesto inválido');
  const act=library.filter(e=>e.status==='active');
  if(!act.length||new Set(library.map(e=>e.id)).size!==library.length)
    throw Error('IDs duplicados ou sem coleções ativas');
  for(const e of act) {
    if(!slugPattern.test(e.id)||!Number.isInteger(e.count)||e.count<1||
       !Number.isInteger(e.sections)||e.sections<1)
      throw Error('Entrada inválida no manifesto');
  }
  return act;
}

function checkCatalogue(entry,catalogue) {
  if(!catalogue||catalogue.id!==entry.id||
     !Array.isArray(catalogue.cards)||catalogue.cards.length!==entry.count||
     !Array.isArray(catalogue.sections)||catalogue.sections.length!==entry.sections)
    throw Error('Catálogo incompleto ou diferente do manifesto: '+entry.id);
  const ids=new Set();
  for(const card of catalogue.cards) {
    if(typeof card.id!=='string'||!card.id.startsWith(entry.id+'-')||
       ids.has(card.id)||typeof card.number!=='string')
      throw Error('IDs ou números inválidos: '+entry.id);
    ids.add(card.id);
  }
}

function entrySourceDigest(entry,catalogue) {
  return digest({id:entry.id,cover:entry.cover||null,catalogue});
}

async function optionalJson(store,folder,name) {
  const file=await store.findFile(folder,name,{optional:true});
  return file?store.readJson(folder,name,{fresh:true}):null;
}

async function putJsonChecked(store,folder,name,object) {
  await store.putFile(folder,name,Buffer.from(JSON.stringify(object)),'application/json');
  const received=await store.readJson(folder,name,{fresh:true});
  if(digest(received)!==digest(object))
    throw Error('JSON gravado no Drive diverge: '+name);
}

async function stageFolder(store,generation,{create=false}={}) {
  assertGeneration(generation);
  const name='fut-stage-'+generation;
  if(create)return store.ensureFolder(store.folder.catalog,name);
  const found=await store.findFile(store.folder.catalog,name,{optional:true});
  if(!found)throw Error('Geração preparada não encontrada');
  if(found.mimeType!=='application/vnd.google-apps.folder')
    throw Error('A geração não é uma pasta Drive');
  return found.id;
}

function findEntryCheckpoint(checkpoint,card) {
  const found=checkpoint.cards?.[card.id];
  if(!found||found.sourceUrl!==card.image||
     !digestPattern.test(found.sha256||'')||!found.driveFileId||
     !Number.isSafeInteger(found.bytes)||found.bytes<1000||
     !EXT[found.mime])return null;
  return found;
}

async function checkedImage(store,ref,expected) {
  const hash=checkHash(ref.sha256,'Imagem preparada');
  if(expected&&hash!==checkHash(expected,'Imagem de origem'))
    throw Error('Imagem preparada diverge do hash original');
  const image=await store.readImage(ref.driveFileId,hash);
  if(image.bytes.length!==ref.bytes||
     image.mime!==ref.mime||
     digest(image.bytes)!==hash)
    throw Error('Imagem Drive alterada desde o checkpoint');
  return image;
}

async function putImage(store,folderId,name,url,kind,collection,expectedSha) {
  const fetched=await store.fetchImage(url,{kind,collection});
  if(!fetched||!Buffer.isBuffer(fetched.bytes)||
     !EXT[fetched.mime]||fetched.bytes.length<1200||
     fetched.bytes.length>6_000_000)
    throw Error('Imagem de origem inválida');
  const sha256=digest(fetched.bytes);
  if(expectedSha&&checkHash(expectedSha,'Imagem de origem')!==sha256)
    throw Error('SHA-256 da origem diverge do catálogo');
  const saved=await store.putFile(folderId,name+EXT[fetched.mime],
    fetched.bytes,fetched.mime);
  if(!saved?.id)throw Error('Drive não confirmou a imagem');
  const ref={
    driveFileId:saved.id,sourceUrl:url,sha256,bytes:fetched.bytes.length,
    mime:fetched.mime
  };
  await checkedImage(store,ref,expectedSha);
  return ref;
}

export async function prepareGeneration({
  store,source,generation,onlySlug=null,checkpointEvery=25,onProgress=()=>{}
}) {
  assertGeneration(generation);
  const entries=activeItems(source.library);
  if(onlySlug&&(!slugPattern.test(onlySlug)||
     !entries.some(e=>e.id===onlySlug)))throw Error('Coleção desconhecida');
  if(!Number.isInteger(checkpointEvery)||checkpointEvery<1||checkpointEvery>100)
    throw Error('Intervalo de checkpoint inválido');
  if(!source.plan||!source.catalogs||typeof source.catalogs!=='object')
    throw Error('Faltam plano ou catálogos locais');
  for(const entry of entries)
    checkCatalogue(entry,source.catalogs[entry.id]);
  const srcDigest=digest({library:source.library,plan:source.plan,
    catalogs:entries.map(x=>[x.id,source.catalogs[x.id]])});
  const folderId=await stageFolder(store,generation,{create:true});
  const ready=await optionalJson(store,folderId,READY_MARKER);
  if(ready) {
    if(ready.sourceSha256!==srcDigest)
      throw Error('Geração já selada com origem diferente');
    return {state:'prepared',generation,folderId,alreadyReady:true,
      count:ready.catalogCount};
  }
  const imageRoot=await store.ensureFolder(store.folder.images,'fut-stage-'+generation);
  for(const entry of entries) {
    if(onlySlug&&entry.id!==onlySlug)continue;
    const original=source.catalogs[entry.id];
    const entryDigest=entrySourceDigest(entry,original);
    const fileName='fut-checkpoint-'+entry.id+'.json';
    const checkpoint=await optionalJson(store,folderId,fileName)||
      {version:1,generation,sourceSha256:entryDigest,cards:{},cover:null};
    if(checkpoint.version!==1||checkpoint.generation!==generation||
       checkpoint.sourceSha256!==entryDigest)
      throw Error('Checkpoint com origem diferente: '+entry.id);
    const imageFolder=await store.ensureFolder(imageRoot,entry.id);
    const copy=structuredClone(original);
    const manifestEntry=structuredClone(entry);
    let sinceSave=0;
    async function saveCheckpoint() {
      await putJsonChecked(store,folderId,fileName,checkpoint);
      sinceSave=0;
    }
    try {
      for(const card of copy.cards){
        delete card.driveFileId;
        if(card.available===false||!card.image)continue;
        if(typeof card.image!=='string')throw Error('URL de imagem inválido');
        if(card.sha256!==null&&card.sha256!==undefined)
          checkHash(card.sha256,'Cromo');
        let ref=findEntryCheckpoint(checkpoint,card);
        if(ref){
          try{
            await checkedImage(store,ref,card.sha256);
          }catch{
            // Apagado, alterado ou hash divergente: nunca reutilizar por ID.
            ref=null;
          }
        }
        if(!ref){
          ref=await putImage(store,imageFolder,card.id,
            card.image,'card',entry.id,card.sha256);
          checkpoint.cards[card.id]=ref;
          sinceSave++;
        }
        card.driveFileId=ref.driveFileId;
        card.sha256=ref.sha256;
        card.bytes=ref.bytes;
        if(card.imageKind==='official-preview-link')
          card.imageKind='official-preview';
        if(sinceSave>=checkpointEvery)await saveCheckpoint();
      }
      if(manifestEntry.cover){
        let ref=checkpoint.cover;
        if(!ref||ref.sourceUrl!==manifestEntry.cover){
          ref=null;
        }else{
          try{await checkedImage(store,ref);}catch{ref=null;}
        }
        if(!ref){
          ref=await putImage(store,imageFolder,'_cover',manifestEntry.cover,
            'cover',entry.id,null);
          checkpoint.cover=ref;
        }
        manifestEntry.coverDriveFileId=ref.driveFileId;
        manifestEntry.coverSha256=ref.sha256;
      }
      await saveCheckpoint();
      copy.coverDriveFileId=manifestEntry.coverDriveFileId||null;
      copy.coverSha256=manifestEntry.coverSha256||null;
      await putJsonChecked(store,folderId,entry.id+'.json',copy);
      await putJsonChecked(store,folderId,'fut-cover-'+entry.id+'.json',{
        version:1,generation,sourceSha256:entryDigest,
        cover:checkpoint.cover
      });
      onProgress({type:'prepared',slug:entry.id,count:copy.cards.length});
    }catch(e){
      // Checkpoint fica exclusivamente na pasta de staging, nunca no catálogo ativo.
      await saveCheckpoint().catch(()=>{});
      throw e;
    }
  }
  if(onlySlug)return {state:'partial',generation,folderId,
    preparedSlug:onlySlug,promotable:false};

  // A publicação de metadados globais só acontece depois de existir cada catálogo.
  const stagedLibrary=structuredClone(source.library);
  const digests={};
  for(const entry of entries) {
    const orig=source.catalogs[entry.id];
    const digestInput=entrySourceDigest(entry,orig);
    const cover=await optionalJson(store,folderId,'fut-cover-'+entry.id+'.json');
    if(!cover||cover.sourceSha256!==digestInput)
      throw Error('Coleção não preparada: '+entry.id);
    const staged=await optionalJson(store,folderId,entry.id+'.json');
    checkCatalogue(entry,staged);
    digests[entry.id]=digest(staged);
    const manifest=stagedLibrary.find(e=>e.id===entry.id);
    manifest.coverDriveFileId=cover.cover?.driveFileId||null;
    manifest.coverSha256=cover.cover?.sha256||null;
  }
  await putJsonChecked(store,folderId,'library.json',stagedLibrary);
  await putJsonChecked(store,folderId,'expansion-plan.json',source.plan);
  const marker={
    version:1,generation,folderId,imageRootId:imageRoot,
    sourceSha256:srcDigest,manifestSha256:digest(stagedLibrary),
    planSha256:digest(source.plan),catalogSha256:digests,
    catalogCount:entries.length,totalCards:entries.reduce((s,e)=>s+e.count,0)
  };
  // Revalidar no Drive todos os bytes antes de selar a geração.
  await validatePreparedContent(store,folderId,marker,onProgress);
  await putJsonChecked(store,folderId,READY_MARKER,marker);
  return {state:'prepared',generation,folderId,alreadyReady:false,
    count:marker.catalogCount,totalCards:marker.totalCards};
}

export async function validatePreparedContent(store,folderId,marker,onProgress=()=>{}) {
  if(marker.version!==1||marker.folderId!==folderId||
     !checkHash(marker.manifestSha256,'Manifesto')||
     !checkHash(marker.planSha256,'Plano')||
     !marker.catalogSha256||typeof marker.catalogSha256!=='object')
    throw Error('Marcador de geração inconsistente');
  const library=await store.readJson(folderId,'library.json',{fresh:true});
  const plan=await store.readJson(folderId,'expansion-plan.json',{fresh:true});
  if(digest(library)!==marker.manifestSha256||digest(plan)!==marker.planSha256)
    throw Error('Manifesto ou plano modificado depois da preparação');
  const entries=activeItems(library);
  if(entries.length!==marker.catalogCount||
     entries.reduce((s,e)=>s+e.count,0)!==marker.totalCards||
     Object.keys(marker.catalogSha256).length!==entries.length)
    throw Error('Manifesto de geração incompleto');
  let seenImages=0;
  for(const entry of entries) {
    const staged=await store.readJson(folderId,entry.id+'.json',{fresh:true});
    checkCatalogue(entry,staged);
    if(digest(staged)!==marker.catalogSha256[entry.id])
      throw Error('Catálogo modificado após preparação: '+entry.id);
    for(const card of staged.cards) {
      if(card.available===false||!card.image)continue;
      if(!card.driveFileId||!checkHash(card.sha256,'Cromo')||
         !Number.isSafeInteger(card.bytes)||card.bytes<1000)
        throw Error('Imagem de cromo não migrada');
      const img=await store.readImage(card.driveFileId,card.sha256);
      if(img.bytes.length!==card.bytes)
        throw Error('Tamanho da imagem Drive divergente');
      seenImages++;
    }
    if(entry.cover) {
      if(!entry.coverDriveFileId||!entry.coverSha256)
        throw Error('Capa não preparada: '+entry.id);
      const cover=await store.readImage(entry.coverDriveFileId,
        checkHash(entry.coverSha256,'Capa'));
      if(cover.bytes.length<1200)throw Error('Capa inválida');
      seenImages++;
    }
    onProgress({type:'validated',slug:entry.id,count:staged.cards.length});
  }
  return {state:'validated',generation:marker.generation,
    count:entries.length,totalCards:marker.totalCards,imagesValidated:seenImages};
}

export async function validateGeneration({store,generation,onProgress=()=>{}}) {
  const folderId=await stageFolder(store,generation);
  const marker=await optionalJson(store,folderId,READY_MARKER);
  if(!marker||marker.generation!==generation)
    throw Error('Geração não está preparada e selada');
  return validatePreparedContent(store,folderId,marker,onProgress);
}

export async function readActivePointer(store) {
  return optionalJson(store,store.folder.catalog,ACTIVE_POINTER);
}

export async function promoteGeneration({
  store,generation,expectedActive,onProgress=()=>{}
}) {
  // Revalidar obrigatoriamente, mesmo que haja uma verificação antiga.
  const result=await validateGeneration({store,generation,onProgress});
  const folderId=await stageFolder(store,generation);
  const marker=await store.readJson(folderId,READY_MARKER,{fresh:true});
  const previous=await readActivePointer(store);
  const oldGeneration=previous?.generation||null;
  if(oldGeneration===generation)
    return {state:'already-active',generation,validated:result.imagesValidated};
  if(expectedActive===undefined||expectedActive!==oldGeneration)
    throw Error('Geração ativa mudou: promoção exige expectedActive explícito');

  // Diário de promoção não é manifesto nem catálogo ativo.
  await putJsonChecked(store,store.folder.catalog,
    'fut-promotion-'+generation+'.json',
    {version:1,generation,previous:oldGeneration,markerSha256:digest(marker)});
  const pointer={
    version:1,generation,folderId,
    manifestSha256:marker.manifestSha256,
    planSha256:marker.planSha256,
    catalogSha256:marker.catalogSha256,
    catalogCount:marker.catalogCount,totalCards:marker.totalCards
  };
  // ÚNICA escrita que altera a geração ativa. Nunca modificar catálogos ativos.
  await putJsonChecked(store,store.folder.catalog,ACTIVE_POINTER,pointer);
  const active=await readActivePointer(store);
  if(digest(active)!==digest(pointer))
    throw Error('A promoção não foi confirmada; consultar diário de promoção');
  return {state:'promoted',generation,previous:oldGeneration,
    validated:result.imagesValidated};
}

export async function recoverGeneration({store,source,generation,
  checkpointEvery=25,onProgress=()=>{}}) {
  const active=await readActivePointer(store);
  if(active?.generation===generation) {
    const result=await validateGeneration({store,generation,onProgress});
    return {state:'already-active',generation,validated:result.imagesValidated};
  }
  const existing=await store.findFile(store.folder.catalog,
    'fut-stage-'+assertGeneration(generation),{optional:true});
  if(existing){
    const ready=await optionalJson(store,existing.id,READY_MARKER);
    if(ready){
      const result=await validateGeneration({store,generation,onProgress});
      return {state:'ready-for-promotion',generation,
        validated:result.imagesValidated,expectedActive:active?.generation||null};
    }
  }
  return prepareGeneration({store,source,generation,checkpointEvery,onProgress});
}
