import {
  driveEnabled, driveConfigured, folderIds, readJson, readImage
} from '../lib/drive-store.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const limitText = v => typeof v==='string' && v.length<=120 ? v : '';
const jsonReply = (res, status, body, cache='private, no-store') => {
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control',cache);
  res.end(JSON.stringify(body));
};
const internalError = (res, message, status=502) =>
  jsonReply(res,status,{error:message});

const route = (kind,id) => {
  if(kind==='library') return '/library.json';
  if(kind==='plan') return '/expansion-plan.json';
  if(kind==='catalog' && slugPattern.test(id))return '/data/'+id+'.json';
  return null;
};

export default async function handler(req,res) {
  if(req.method!=='GET') return internalError(res,'Método não permitido',405);
  const url=new URL(req.url,'http://localhost');
  const kind=limitText(url.searchParams.get('kind'));
  const id=limitText(url.searchParams.get('id'));
  if(kind==='status')return jsonReply(res,200,{
    backend:driveEnabled()?'drive':'vercel',
    ready:driveEnabled()?driveConfigured():true,
    imageBackend:driveEnabled()?'drive':'external'
  });
  if(!driveEnabled()){
    const dest=route(kind,id);
    if(!dest)return internalError(res,'Pedido inválido',400);
    res.statusCode=307;
    res.setHeader('Location',dest);
    res.setHeader('Cache-Control','private, no-store');
    return res.end();
  }
  if(!driveConfigured())return internalError(res,'Armazenamento Drive indisponível',503);
  if(!['library','plan','catalog','image','cover'].includes(kind))
    return internalError(res,'Tipo de pedido inválido',400);
  if(['catalog','image','cover'].includes(kind)&&!slugPattern.test(id))
    return internalError(res,'Coleção inválida',400);

  try {
    const folder=folderIds();
    if(kind==='plan')return jsonReply(res,200,
      await readJson(folder.catalog,'expansion-plan.json'));

    const library=await readJson(folder.catalog,'library.json');
    if(!Array.isArray(library)||!library.length)throw Error('Manifesto Drive inválido');
    if(kind==='library'){
      for(const item of library){
        if(item.coverDriveFileId) item.cover=
          '/api/storage?kind=cover&id='+encodeURIComponent(item.id);
        else item.cover=null; // Nunca carregar capas de fontes externas em modo Drive.
      }
      return jsonReply(res,200,library);
    }
    const item=library.find(x=>x.id===id&&x.status==='active');
    if(!item)return internalError(res,'Coleção não encontrada',404);
    if(kind==='cover'){
      if(!item.coverDriveFileId)return internalError(res,'Capa indisponível',404);
      const image=await readImage(item.coverDriveFileId,item.coverSha256);
      res.statusCode=200;
      res.setHeader('Content-Type',image.mime);
      res.setHeader('Cache-Control','private, max-age=3600');
      return res.end(image.bytes);
    }
    const data=await readJson(folder.catalog,id+'.json');
    if(data.id!==id||!Array.isArray(data.cards)||data.cards.length!==item.count||
      !Array.isArray(data.sections)||data.sections.length!==item.sections)
      throw Error('Catálogo Drive inconsistente');
    if(kind==='catalog'){
      for(const c of data.cards){
        if(c.available===false||!c.image){
          c.image=null;
          c.source='';
        }else{
          if(!c.driveFileId)throw Error('Imagem não migrada para o Drive: '+c.id);
          c.image='/api/storage?kind=image&id='+encodeURIComponent(id)+
            '&card='+encodeURIComponent(c.id);
          c.source=''; // Não recorrer a URL externa após falha de leitura do Drive.
        }
      }
      return jsonReply(res,200,data);
    }
    const cardId=limitText(url.searchParams.get('card'));
    const card=data.cards.find(x=>x.id===cardId);
    if(!card||!card.driveFileId)return internalError(res,'Imagem não encontrada',404);
    const image=await readImage(card.driveFileId,card.sha256);
    res.statusCode=200;
    res.setHeader('Content-Type',image.mime);
    res.setHeader('Cache-Control','private, max-age=3600');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.end(image.bytes);
  }catch(e){
    // Erros internos (IDs, credenciais, paths) nunca são enviados ao navegador.
    console.error('FUT Drive backend:',String(e.message).slice(0,160));
    return internalError(res,'Falha na leitura segura do arquivo Google Drive',502);
  }
}
