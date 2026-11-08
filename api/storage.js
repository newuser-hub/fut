import {
  driveEnabled, driveConfigured, folderIds, readJson, readImage
} from '../lib/drive-store.js';
import { accessStatus, BASIC_CHALLENGE } from '../lib/access-control.js';

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

  if (kind === 'status') return jsonReply(res, 200, {
    backend: driveEnabled() ? 'drive' : 'vercel',
    ready: driveEnabled() ? driveConfigured() : true,
    imageBackend: driveEnabled() ? 'drive' : 'external'
  });

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
    const folder = folderIds();
    if (kind === 'plan')
      return jsonReply(res, 200, await readJson(folder.catalog, 'expansion-plan.json'));

    const library = await readJson(folder.catalog, 'library.json');
    if (!Array.isArray(library) || !library.length)
      throw Error('Manifesto Drive inválido');

    if (kind === 'library') {
      for (const item of library) {
        if (item.coverDriveFileId)
          item.cover = '/api/storage?kind=cover&id=' + encodeURIComponent(item.id);
        else item.cover = null;
      }
      return jsonReply(res, 200, library);
    }

    const item = library.find(x => x.id === id && x.status === 'active');
    if (!item) return internalError(res, 'Coleção não encontrada', 404);
    if (kind === 'cover') {
      if (!item.coverDriveFileId)
        return internalError(res, 'Capa indisponível', 404);
      const image = await readImage(item.coverDriveFileId, item.coverSha256);
      res.statusCode = 200;
      res.setHeader('Content-Type', image.mime);
      noStore(res);
      return res.end(image.bytes);
    }

    const data = await readJson(folder.catalog, id + '.json');
    if (data.id !== id || !Array.isArray(data.cards) ||
        data.cards.length !== item.count ||
        !Array.isArray(data.sections) || data.sections.length !== item.sections)
      throw Error('Catálogo Drive inconsistente');

    if (kind === 'catalog') {
      for (const c of data.cards) {
        if (c.available === false || !c.image) {
          c.image = null;
          c.source = '';
        } else {
          if (!c.driveFileId) throw Error('Imagem não migrada para o Drive');
          c.image = '/api/storage?kind=image&id=' + encodeURIComponent(id) +
            '&card=' + encodeURIComponent(c.id);
          c.source = ''; // Nunca recorrer a imagem externa após falha do Drive.
        }
      }
      return jsonReply(res, 200, data);
    }

    const card = data.cards.find(x => x.id === cardId);
    if (!card || !card.driveFileId || card.available === false || !card.image)
      return internalError(res, 'Imagem não encontrada', 404);
    const image = await readImage(card.driveFileId, card.sha256);
    res.statusCode = 200;
    res.setHeader('Content-Type', image.mime);
    noStore(res);
    return res.end(image.bytes);
  } catch {
    // Nunca registar mensagens da biblioteca externa, identificadores, URLs,
    // tokens, caminhos, detalhes de credenciais ou stack traces.
    console.error('FUT storage: backend_read_failure');
    return internalError(res, 'Falha na leitura segura do arquivo Google Drive', 502);
  }
}
