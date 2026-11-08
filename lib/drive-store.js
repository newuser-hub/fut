import { createSign, createHash } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const SCOPE = 'https://www.googleapis.com/auth/drive';
const cache = new Map();
let cachedToken = null;

export const driveEnabled = () => process.env.FUT_STORAGE_BACKEND === 'drive';
export const folderIds = () => ({
  catalog: process.env.FUT_DRIVE_CATALOGS_FOLDER_ID || '',
  images: process.env.FUT_DRIVE_IMAGES_FOLDER_ID || '',
});
export const driveAuthMode = () => {
  // My Drive uses human-owner OAuth: service accounts cannot own uploaded files.
  if(process.env.FUT_DRIVE_OAUTH_CLIENT_ID &&
     process.env.FUT_DRIVE_OAUTH_CLIENT_SECRET &&
     process.env.FUT_DRIVE_OAUTH_REFRESH_TOKEN) return 'oauth';
  // Service accounts can upload only into a Google Workspace Shared Drive.
  if(process.env.FUT_DRIVE_SERVICE_ACCOUNT_JSON &&
     process.env.FUT_DRIVE_SHARED_DRIVE_ID) return 'service-account';
  return 'none';
};
export const driveConfigured = () =>
  Boolean(folderIds().catalog && folderIds().images && driveAuthMode()!=='none');

function parseCredentials() {
  let credentials;
  try {
    credentials = JSON.parse(process.env.FUT_DRIVE_SERVICE_ACCOUNT_JSON || '{}');
  } catch {
    throw Error('Credenciais Drive em formato inválido');
  }
  if (!credentials.client_email || !credentials.private_key ||
      !credentials.client_email.endsWith('.gserviceaccount.com')) {
    throw Error('Conta de serviço Google Drive não configurada');
  }
  return credentials;
}
const base64url = text => Buffer.from(text).toString('base64url');

export async function getAccessToken() {
  const mode=driveAuthMode();
  if(mode==='none')throw Error('Autenticação Google Drive não configurada');
  if(cachedToken && cachedToken.mode===mode && Date.now()<cachedToken.expires-90_000)
    return cachedToken.access;
  let body;
  if(mode==='oauth'){
    body=new URLSearchParams({
      grant_type:'refresh_token',
      client_id:process.env.FUT_DRIVE_OAUTH_CLIENT_ID,
      client_secret:process.env.FUT_DRIVE_OAUTH_CLIENT_SECRET,
      refresh_token:process.env.FUT_DRIVE_OAUTH_REFRESH_TOKEN
    });
  }else{
    const c=parseCredentials();
    const now=Math.floor(Date.now()/1000);
    const signingInput=base64url(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+
      base64url(JSON.stringify({
        iss:c.client_email,scope:SCOPE,aud:TOKEN_URL,iat:now,exp:now+3600
      }));
    const signer=createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const assertion=signingInput+'.'+signer.sign(c.private_key).toString('base64url');
    body=new URLSearchParams({
      grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion
    });
  }
  const response=await fetch(TOKEN_URL,{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body,signal:AbortSignal.timeout(20000)
  });
  if(!response.ok)throw Error('Falha na autenticação Google Drive (HTTP '+response.status+')');
  const payload=await response.json();
  if(!payload.access_token)throw Error('O Google não devolveu token de acesso');
  cachedToken={mode,access:payload.access_token,
    expires:Date.now()+(payload.expires_in||3600)*1000};
  return cachedToken.access;
}

async function driveRequest(path, options={}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', 'Bearer '+token);
  const response = await fetch(DRIVE_API+path, {...options, headers, signal: AbortSignal.timeout(30000)});
  if (!response.ok) {
    const err = Error('Google Drive respondeu HTTP '+response.status);
    err.status = response.status;
    throw err;
  }
  return response;
}
const nameEsc = name => String(name).replaceAll('\\','\\\\').replaceAll("'","\\'");
const validateId = id => {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) throw Error('Identificador Drive inválido');
  return id;
};

export async function findFile(folderId, name, { optional=false }={}) {
  validateId(folderId);
  if (!name || name.length > 200 || name.includes('/')) throw Error('Nome de ficheiro inválido');
  const query = "'" + nameEsc(folderId) + "' in parents and name = '" + nameEsc(name) +
    "' and trashed = false";
  const qs = new URLSearchParams({
    q: query, pageSize: '3', supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    fields: 'nextPageToken,files(id,name,size,mimeType,md5Checksum)'
  });
  const response = await driveRequest('/files?'+qs);
  const payload = await response.json();
  const files = payload.files || [];
  if (files.length > 1) throw Error('Duplicação de ficheiros no arquivo Drive: '+name);
  if (files.length === 0) {
    if (optional) return null;
    throw Error('Ficheiro não encontrado no arquivo Drive: '+name);
  }
  return files[0];
}

export async function readRawFile(fileId, maxBytes=3_000_000) {
  validateId(fileId);
  if(!Number.isSafeInteger(maxBytes)||maxBytes<=0||maxBytes>8_000_000)
    throw Error('Limite de leitura Drive inválido');
  const response = await driveRequest('/files/'+encodeURIComponent(fileId)+'?alt=media&supportsAllDrives=true');
  const lengthText=response.headers.get('content-length');
  if(lengthText!==null){
    const declared=Number(lengthText);
    if(!Number.isSafeInteger(declared)||declared<0||declared>maxBytes){
      await response.body?.cancel?.();
      throw Error('Tamanho declarado do ficheiro Drive inválido');
    }
  }
  // Ler por blocos; arrayBuffer() sem limites permite alocar gigabytes antes da verificação.
  if(!response.body?.getReader)throw Error('Resposta Drive sem streaming');
  const reader=response.body.getReader();
  const chunks=[];
  let total=0;
  try {
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>maxBytes)throw Error('Ficheiro Drive excede o tamanho permitido');
      chunks.push(Buffer.from(value));
    }
  }catch(e){
    await reader.cancel().catch(()=>{});
    throw e;
  }finally{
    reader.releaseLock();
  }
  return {bytes:Buffer.concat(chunks,total),mime:response.headers.get('content-type')||''};
}

export async function readJson(folderId, name, {fresh=false}={}) {
  const cacheKey=folderId+':'+name;
  const prior=!fresh&&cache.get(cacheKey);
  if(prior&&prior.expires>Date.now())return structuredClone(prior.value);
  const file=await findFile(folderId,name);
  const declared=Number(file.size||0);
  if(!Number.isSafeInteger(declared)||declared>3_000_000)
    throw Error('JSON Drive demasiado grande');
  const raw=await readRawFile(file.id);
  let payload;
  try{payload=JSON.parse(raw.bytes.toString('utf8'));}
  catch{throw Error('JSON inválido no Google Drive');}
  cache.set(cacheKey,{value:payload,expires:Date.now()+30000});
  return structuredClone(payload);
}

export async function readImage(fileId, expectedDigest) {
  // Nunca servir imagens sem hash: para fotografias sem hash de origem,
  // a migração deve gerar um SHA-256 com os bytes que confirmou por GET.
  if(typeof expectedDigest!=='string'||!/^[a-f0-9]{64}$/i.test(expectedDigest))
    throw Error('Imagem Drive sem SHA-256 verificado');
  const raw=await readRawFile(fileId,6_000_000);
  const type=raw.mime.toLowerCase().split(';')[0].trim();
  if(!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(type)||
      raw.bytes.length<1000)
    throw Error('Imagem inválida no Drive');
  const digest=createHash('sha256').update(raw.bytes).digest('hex');
  if(digest!==expectedDigest.toLowerCase())
    throw Error('SHA-256 divergente na imagem Drive');
  return {...raw,mime:type,sha256:digest};
}

export async function putFile(folderId,name,bytes,mimeType='application/json') {
  validateId(folderId);
  const current = await findFile(folderId,name,{optional:true});
  const body = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  let response;
  const auth='Bearer '+await getAccessToken();
  if (current) {
    response = await fetch('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(current.id)+'?uploadType=media&fields=id,name,size&supportsAllDrives=true', {
      method:'PATCH',headers:{Authorization:auth,'Content-Type':mimeType},
      body,signal:AbortSignal.timeout(60000)
    });
  } else {
    const boundary='fut_upload_boundary_7c42b5';
    const header=Buffer.from('--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+
      JSON.stringify({name,mimeType,parents:[folderId]})+'\r\n--'+boundary+
      '\r\nContent-Type: '+mimeType+'\r\n\r\n');
    const tail=Buffer.from('\r\n--'+boundary+'--');
    response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size&supportsAllDrives=true', {
      method:'POST',headers:{Authorization:auth,'Content-Type':'multipart/related; boundary='+boundary},
      body:Buffer.concat([header,body,tail]),signal:AbortSignal.timeout(60000)
    });
  }
  if (!response.ok) throw Error('Falha no upload Drive (HTTP '+response.status+')');
  cache.delete(folderId+':'+name);
  return await response.json();
}

export async function ensureFolder(parentId,name) {
  const found=await findFile(parentId,name,{optional:true});
  if (found) {
    if (found.mimeType!=='application/vnd.google-apps.folder') throw Error('Pasta em conflito: '+name);
    return found.id;
  }
  const token=await getAccessToken();
  const response=await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType&supportsAllDrives=true',{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({name,mimeType:'application/vnd.google-apps.folder',parents:[parentId]}),
    signal:AbortSignal.timeout(30000)
  });
  if (!response.ok) throw Error('Falha ao criar pasta Drive (HTTP '+response.status+')');
  return (await response.json()).id;
}
