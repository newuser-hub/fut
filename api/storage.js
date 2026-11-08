import {
  driveEnabled, driveConfigured, folderIds, readJson, readImage
} from '../lib/drive-store.js';
import { accessStatus, BASIC_CHALLENGE } from '../lib/access-control.js';
import { ACTIVE_POINTER, digest } from '../lib/drive-migration.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const cardPattern = /^[A-Za-z0-9_-]+$/;
const limitText = v => typeof v === 'string' && v.length <= 120 ? v : '';
const noStore = res => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Vary', 'Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
};
const jsonReply = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  noStore(res);
  return res.end(JSON.stringify(body));
};
const internalError = (res, message, status = 502) =>
  jsonReply(res, status, { error: message });

const route = (kind, id) => {
  if (kind === 'library') return '/library.json';
  if (kind === 'plan') return '/expansion-plan.json';
  if (kind === 'catalog' && slugPattern.test(id)) return '/data/' + id + '.json';
  return null;
};

// Aceitar apenas as formas utilizadas no frontend; impedir queries ambíguas,
// parâmetros duplicados e redirecionamentos construídos a partir de dados livres.
function parseRequest(rawUrl) {
  const url = new URL(rawUrl, 'http://localhost');
  if (url.pathname !== '/api/storage') return null;
  const p = url.searchParams;
  const kind = limitText(p.get('kind'));
  const allowed = {
    status: ['kind'], library: ['kind'], plan: ['kind'],
    catalog: ['kind', 'id'], cover: ['kind', 'id'],
    image: ['kind', 'id', 'card']
  }[kind];
  if (!allowed || [...p.keys()].length !== allowed.length ||
      allowed.some(k => p.getAll(k).length !== 1) ||
      [...p.keys()].some(k => !allowed.includes(k))) return null;

  const id = limitText(p.get('id'));
  const card = limitText(p.get('card'));
  if (allowed.includes('id') && (!id || !slugPattern.test(id))) return null;
  if (allowed.includes('card') && (!card || !cardPattern.test(card))) return null;
  return { kind, id, card };
}


const digestPattern=/^[a-f0-9]{64}$/i;
const folderPattern=/^[A-Za-z0-9_-]{10,200}$/;
async function promotedSnapshot(rootFolder) {
  // Ler unicamente o apontador da geração ativa; catálogos legados e
  // checkpoints em preparação nunca são visíveis por este endpoint.
  const pointer=await readJson(rootFolder,ACTIVE_POINTER);
  if(pointer?.version!==1||
     !folderPattern.test(pointer.folderId||'')||
     !slugPattern.test(pointer.generation||'')||
     !digestPattern.test(pointer.manifestSha256||'')||
     !digestPattern.test(pointer.planSha256||'')||
     !pointer.catalogSha256||typeof pointer.catalogSha256!=='object')
    throw Error('Não existe geração Drive promovida válida');
  const library=await readJson(pointer.folderId,'library.json');
  if(!Array.isArray(library)||!library.length||
     digest(library)!==pointer.manifestSha256)
    throw Error('Manifesto da geração ativa inconsistente');
  const active=library.filter(x=>x.status==='active');
  if(active.length!==pointer.catalogCount||
     active.reduce((n,x)=>n+x.count,0)!==pointer.totalCards||
     Object.keys(pointer.catalogSha256).length!==active.length)
    throw Error('Geração ativa incompleta');
  return {pointer,library,folder: pointer.folderId};
}

function requireStagedImage(card) {
  if(!card.driveFileId||!folderPattern.test(card.driveFileId)||
     !digestPattern.test(card.sha256||'')||
     !Number.isSafeInteger(card.bytes)||card.bytes<1000)
    throw Error('Imagem de catálogo sem proveniência validada');
}

function checkedCatalogue(snapshot,entry,data) {
  if(data?.id!==entry.id||!Array.isArray(data.cards)||
     data.cards.length!==entry.count||
     !Array.isArray(data.sections)||data.sections.length!==entry.sections||
     digest(data)!==snapshot.pointer.catalogSha256[entry.id])
    throw Error('Catálogo Drive inconsistente');
  const seen=new Set();
  for(const c of data.cards){
    if(typeof c.id!=='string'||seen.has(c.id))throw Error('IDs de cromo repetidos');
    seen.add(c.id);
    if(c.available!==false&&c.image)requireStagedImage(c);
  }
  return data;
}

export default async function handler(req, res) {
  const auth = accessStatus(req.headers?.authorization || '',
    process.env.FUT_ALBUM_PASSWORD);
  if (auth === 'unconfigured')
    return internalError(res, 'Acesso temporariamente indisponível', 503);
  if (auth !== 'authorized') {
    res.setHeader('WWW-Authenticate', BASIC_CHALLENGE);
    return internalError(res, 'Acesso privado ao arquivo FUT', 401);
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return internalError(res, 'Método não permitido', 405);
  }

  let params;
  try {
    params = parseRequest(req.url);
  } catch {
    return internalError(res, 'Pedido inválido', 400);
  }
  if (!params) return internalError(res, 'Pedido inválido', 400);
  const { kind, id, card: cardId } = params;

  if (kind === 'status') {
    if (!driveEnabled())
      return jsonReply(res, 200, {backend:'vercel',ready:true,imageBackend:'external'});
    if (!driveConfigured())
      return jsonReply(res, 200, {backend:'drive',ready:false,imageBackend:'drive'});
    try {
      await promotedSnapshot(folderIds().catalog);
      return jsonReply(res, 200, {backend:'drive',ready:true,imageBackend:'drive'});
    } catch {
      return jsonReply(res, 200, {backend:'drive',ready:false,imageBackend:'drive'});
    }
  }

  if (!driveEnabled()) {
    const dest = route(kind, id);
    if (!dest) return internalError(res, 'Pedido inválido', 400);
    res.statusCode = 307;
    res.setHeader('Location', dest);
    noStore(res);
    return res.end();
  }

  if (!driveConfigured())
    return internalError(res, 'Armazenamento Drive indisponível', 503);

  try {
    const snapshot=await promotedSnapshot(folderIds().catalog);
    const {library,folder,pointer}=snapshot;
    if (kind === 'plan') {
      const plan=await readJson(folder,'expansion-plan.json');
      if(digest(plan)!==pointer.planSha256)
        throw Error('Plano Drive divergente');
      return jsonReply(res,200,plan);
    }

    if (kind === 'library') {
      for (const item of library) {
        if(item.coverDriveFileId){
          if(!digestPattern.test(item.coverSha256||'')||
             !folderPattern.test(item.coverDriveFileId))
            throw Error('Capa Drive sem hash');
          item.cover='/api/storage?kind=cover&id='+encodeURIComponent(item.id);
        }else item.cover=null; // Nunca usar URL externo em modo Drive.
      }
      return jsonReply(res,200,library);
    }

    const item=library.find(x=>x.id===id&&x.status==='active');
    if(!item)return internalError(res,'Coleção não encontrada',404);
    if (kind === 'cover') {
      if(!item.coverDriveFileId)return internalError(res,'Capa indisponível',404);
      requireStagedImage({driveFileId:item.coverDriveFileId,
        sha256:item.coverSha256,bytes:1200});
      const image=await readImage(item.coverDriveFileId,item.coverSha256);
      res.statusCode=200;
      res.setHeader('Content-Type',image.mime);
      noStore(res);
      return res.end(image.bytes);
    }

    const data=checkedCatalogue(snapshot,item,
      await readJson(folder,id+'.json'));
    if(kind==='catalog'){
      for(const c of data.cards){
        if(c.available===false||!c.image){
          c.image=null;
          c.source='';
        }else{
          // driveFileId e SHA já foram confirmados para TODO o catálogo.
          c.image='/api/storage?kind=image&id='+encodeURIComponent(id)+
            '&card='+encodeURIComponent(c.id);
          c.source='';
        }
      }
      return jsonReply(res,200,data);
    }
    const card=data.cards.find(x=>x.id===cardId);
    if(!card||card.available===false||!card.image)
      return internalError(res,'Imagem não encontrada',404);
    requireStagedImage(card);
    const image=await readImage(card.driveFileId,card.sha256);
    if(image.bytes.length!==card.bytes)
      throw Error('Bytes da imagem Drive divergentes');
    res.statusCode=200;
    res.setHeader('Content-Type',image.mime);
    noStore(res);
    return res.end(image.bytes);
  }catch{
    // Não fazer fallback para URLs externos, catálogos ativos antigos nem
    // staging incompleto. Não expor tokens, IDs ou mensagens de biblioteca.
    console.error('FUT storage: backend_read_failure');
    return internalError(res,'Falha na leitura segura do arquivo Google Drive',502);
  }
}
