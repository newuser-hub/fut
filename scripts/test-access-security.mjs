import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import storage from '../api/storage.js';
import { accessStatus, BASIC_CHALLENGE } from '../lib/access-control.js';
import { ACTIVE_POINTER, digest } from '../lib/drive-migration.js';

const password = randomBytes(24).toString('base64url');
const incorrect = randomBytes(24).toString('base64url');
const encode = (username, value) =>
  'Basic ' + Buffer.from(username + ':' + value).toString('base64');
const authorization = encode('fut', password);
const wrongAuth = encode('fut', incorrect);
const paths = [
  '/', '/index.html', '/library.json', '/expansion-plan.json',
  '/data/euro-2004.json', '/data/ligue-1-foot-2025-26.json',
  '/favicon.svg', '/api/storage?kind=library', '/api/storage?kind=plan',
  '/api/storage?kind=catalog&id=euro-2004', '/api/storage?kind=status'
];

const proxySource = readFileSync(new URL('../proxy.js', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../api/storage.js', import.meta.url), 'utf8');

function proxyHarness(initialPassword = password) {
  let passed = 0;
  const sandbox = {
    accessStatus, BASIC_CHALLENGE, Buffer, Response,
    process: { env: initialPassword === null ? {} : { FUT_ALBUM_PASSWORD: initialPassword } },
    next: (init) => { passed++; return new Response('next: passed', { status: 200,...init }); }
  };
  const code = proxySource.replace(/^import [^\n]*;\s*$/gm, '')
    .replace('export default function proxy', 'function proxy')
    .replace('export const config', 'const config');
  assert(!code.includes('import {'), 'Os imports do proxy mudaram; atualizar harness');
  const { proxy, config } = vm.runInNewContext(code + '\n({ proxy, config })', sandbox);
  return {
    config, sandbox,
    calls: () => passed,
    async call(path, method = 'GET', auth = undefined) {
      const headers = new Headers();
      if (auth !== undefined) headers.set('Authorization', auth);
      const req = { method, headers, url: 'https://test.example' + path };
      return proxy(req);
    }
  };
}

async function invoke(handler, { url, method='GET', auth=authorization }={}) {
  const headers = {};
  let reply = null;
  const res = {
    statusCode: 200,
    setHeader(name,value) { headers[name.toLowerCase()] = value; },
    end(body = '') {
      reply = { status: this.statusCode, headers, body };
      return this;
    }
  };
  await handler({ method, url, headers: auth===null ? {} : { authorization:auth } }, res);
  assert(reply, 'A função deve terminar a resposta');
  return reply;
}

async function withRealApi(passwordSetting, fn) {
  const p = process.env.FUT_ALBUM_PASSWORD;
  const backend = process.env.FUT_STORAGE_BACKEND;
  if (passwordSetting === null) delete process.env.FUT_ALBUM_PASSWORD;
  else process.env.FUT_ALBUM_PASSWORD = passwordSetting;
  delete process.env.FUT_STORAGE_BACKEND;
  try { return await fn(); }
  finally {
    if (p === undefined) delete process.env.FUT_ALBUM_PASSWORD;
    else process.env.FUT_ALBUM_PASSWORD = p;
    if (backend === undefined) delete process.env.FUT_STORAGE_BACKEND;
    else process.env.FUT_STORAGE_BACKEND = backend;
  }
}

function assertPrivate(reply) {
  assert.match(reply.headers.get?.('cache-control') ?? reply.headers['cache-control'],
    /\bno-store\b/);
  assert.match(reply.headers.get?.('cache-control') ?? reply.headers['cache-control'],
    /\bprivate\b/);
  assert.equal(reply.headers.get?.('vary') ?? reply.headers.vary, 'Authorization');
  assert.equal(reply.headers.get?.('x-content-type-options') ??
    reply.headers['x-content-type-options'], 'nosniff');
}

test('a configuração Vercel protege todas as rotas e mantém funcionalidades', () => {
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url),'utf8'));
  assert.equal(vercel.proxy.entrypoint, 'proxy.js');
  assert.equal(vercel.outputDirectory, 'public');
  assert.equal(vercel.buildCommand, 'npm run build');
  const global = vercel.headers.find(x => x.source === '/(.*)');
  assert(global, 'Faltam cabeçalhos aplicados ao site inteiro');
  const headers = Object.fromEntries(global.headers.map(x=>[x.key.toLowerCase(),x.value]));
  assert.equal(headers['cache-control'], 'private, no-store');
  assert.equal(headers.vary, 'Authorization');
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.match(headers['content-security-policy'], /object-src 'none'/);
  assert.match(headers['content-security-policy'], /base-uri 'none'/);
  assert(!/\b(?:img-src|script-src|style-src|connect-src)\b/.test(
    headers['content-security-policy']), 'CSP não pode bloquear imagens externas, CSS, JS ou fetch');
  assert.match(headers['permissions-policy'], /geolocation=\(\)/);
});

test('função de verificação falha fechado sem password, sem aceitar esquema alternativo', () => {
  assert.equal(accessStatus(authorization, undefined), 'unconfigured');
  assert.equal(accessStatus(authorization, ''), 'unconfigured');
  assert.equal(accessStatus('', password), 'denied');
  assert.equal(accessStatus('Bearer ' + incorrect, password), 'denied');
  assert.equal(accessStatus(encode('outro', password), password), 'denied');
  assert.equal(accessStatus(authorization + 'a', password), 'denied');
  assert.equal(accessStatus('Basic ' + 'a'.repeat(6000), password), 'denied');
  assert.equal(accessStatus(authorization, password), 'authorized');
});

test('proxy sem password configurada devolve 503 em todas as superfícies', async () => {
  const h = proxyHarness(null);
  for (const path of paths) {
    const reply = await h.call(path, 'GET', authorization);
    assert.equal(reply.status, 503, path);
    assertPrivate(reply);
    assert.doesNotMatch(await reply.text(), new RegExp(password));
  }
  assert.equal(h.calls(), 0);
});

test('proxy sem credenciais devolve 401 em pagina, manifesto, roteiro, catálogos, API e favicon', async () => {
  const h = proxyHarness();
  for (const path of paths) {
    const reply = await h.call(path);
    assert.equal(reply.status, 401, path);
    assertPrivate(reply);
    assert.equal(reply.headers.get('www-authenticate'), BASIC_CHALLENGE);
    assert.equal(reply.headers.get('location'), null);
    assert.doesNotMatch(await reply.text(), new RegExp(password));
  }
  assert.equal(h.calls(), 0);
});

test('proxy rejeita credenciais incorretas, esquema Bearer e identidade errada', async () => {
  const h=proxyHarness();
  for (const auth of [wrongAuth, encode('intruso',password), 'Bearer '+wrongAuth,
     'Basic not-base64', 'Basic '+ 'x'.repeat(5000)]) {
    const reply = await h.call('/api/storage?kind=catalog&id=euro-2004','GET',auth);
    assert.equal(reply.status,401);
    assertPrivate(reply);
  }
  assert.equal(h.calls(),0);
});

test('proxy só deixa passar requests com autenticação correta, GET ou HEAD', async () => {
  const h=proxyHarness();
  for (const path of paths) {
    const reply=await h.call(path,'GET',authorization);
    assert.equal(reply.status,200,path);
  }
  assert.equal((await h.call('/index.html','HEAD',authorization)).status,200);
  assert.equal(h.calls(),paths.length+1);
  assert.equal(h.config.runtime,'nodejs');
});

test('proxy rejeita métodos inesperados mesmo após autenticação', async () => {
  const h=proxyHarness();
  for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS','TRACE']){
    const reply=await h.call('/api/storage?kind=library',method,authorization);
    assert.equal(reply.status,405,method);
    assert.equal(reply.headers.get('allow'),'GET, HEAD');
    assertPrivate(reply);
  }
  assert.equal(h.calls(),0);
  assert.equal((await h.call('/api/storage?kind=library','POST',wrongAuth)).status,401);
});

test('API real falha fechada sem palavra-passe e para credenciais ausentes ou erradas', async () => {
  await withRealApi(null, async () => {
    const reply=await invoke(storage,{url:'/api/storage?kind=library'});
    assert.equal(reply.status,503);
    assertPrivate(reply);
    assert.equal(reply.headers.location,undefined);
  });
  await withRealApi(password, async () => {
    for(const auth of [null,wrongAuth,'Bearer whatever']){
      for(const url of ['/api/storage?kind=library','/api/storage?kind=status',
        '/api/storage?kind=catalog&id=euro-2004']){
        const reply=await invoke(storage,{url,auth});
        assert.equal(reply.status,401,url);
        assertPrivate(reply);
        assert.equal(reply.headers['www-authenticate'],BASIC_CHALLENGE);
        assert.equal(reply.headers.location,undefined);
      }
    }
  });
});

test('API real rejeita métodos inesperados mesmo com credenciais certas', async () => {
  await withRealApi(password,async()=>{
    for (const method of ['POST','PUT','PATCH','DELETE','HEAD','OPTIONS']) {
      const reply=await invoke(storage,{url:'/api/storage?kind=library',method});
      assert.equal(reply.status,405,method);
      assert.equal(reply.headers.allow,'GET');
      assertPrivate(reply);
    }
  });
});

test('API real não aceita parâmetros duplicados, extras, inválidos ou traversal', async () => {
  await withRealApi(password,async()=>{
    for (const url of [
      '/api/storage', '/api/storage?kind=',
      '/api/storage?kind=unknown', '/api/storage?kind=library&kind=plan',
      '/api/storage?kind=library&id=euro-2004',
      '/api/storage?kind=plan&card=123',
      '/api/storage?kind=status&extra=1',
      '/api/storage?kind=catalog',
      '/api/storage?kind=catalog&id=',
      '/api/storage?kind=catalog&id=../secrets',
      '/api/storage?kind=catalog&id=%2e%2e%2fsecrets',
      '/api/storage?kind=catalog&id=euro-2004&id=world-cup-1998',
      '/api/storage?kind=catalog&id=https%3A%2F%2Fevil.example',
      '/api/storage?kind=catalog&id=foo%00bar',
      '/api/storage?kind=image&id=euro-2004',
      '/api/storage?kind=cover&id=euro-2004&card=x',
      '/api/storage/?kind=library'
    ]) {
      const reply=await invoke(storage,{url});
      assert.equal(reply.status,400,url);
      assert.equal(reply.headers.location,undefined);
      assertPrivate(reply);
    }
  });
});

test('API real usa redirecionamentos internos 307 sem cache, nunca hosts externos', async () => {
  await withRealApi(password,async()=>{
    for(const [url,location] of [
      ['/api/storage?kind=library','/library.json'],
      ['/api/storage?kind=plan','/expansion-plan.json'],
      ['/api/storage?kind=catalog&id=euro-2004','/data/euro-2004.json'],
      ['/api/storage?kind=catalog&id=liga-portugal-2014-15','/data/liga-portugal-2014-15.json']
    ]){
      const reply=await invoke(storage,{url});
      assert.equal(reply.status,307,url);
      assert.equal(reply.headers.location,location);
      assert.match(reply.headers.location,/^\/(?!\/)/);
      assertPrivate(reply);
    }
    const state=await invoke(storage,{url:'/api/storage?kind=status'});
    assert.equal(state.status,200);
    assertPrivate(state);
    assert.deepEqual(JSON.parse(state.body),{
      backend:'vercel',ready:true,imageBackend:'external'
    });
  });
});

// Carrega o corpo original da função com o backend Drive substituído apenas por
// mocks: não existe acesso a serviços externos e nenhum segredo é utilizado.
function driveHarness({configured=true,throwOnRead=false,missingPointer=false,
  missingHash=false,incomplete=false,corruptImage=false}={}) {
  const errors=[];
  const bytes=Buffer.alloc(1200,0x63);
  const sha256=digest(bytes);
  const library=[{
    id:'euro-2004',status:'active',count:2,sections:1,
    cover:'https://external.example/cover.jpg',
    coverDriveFileId:'mock-cover',coverSha256:sha256
  }];
  const plan={goal:30,collections:[]};
  const catalogue={
    id:'euro-2004',sections:['Portugal'],cards:[
      {id:'euro-2004-1',number:'1',name:'Player',available:true,
       image:'https://external.example/player.jpg',source:'external',
       driveFileId:'mock-image',sha256:missingHash?null:sha256,
       bytes:bytes.length},
      {id:'euro-2004-2',number:'2',name:'Missing',available:false,
       image:null,source:'external',sha256:null}
    ]
  };
  if(incomplete)catalogue.cards.pop();
  const pointer={
    version:1,generation:'mock-generation',folderId:'mock-stage-folder-id',
    manifestSha256:digest(library),planSha256:digest(plan),
    catalogSha256:{'euro-2004':digest(catalogue)},catalogCount:1,totalCards:2
  };
  const clone=x=>structuredClone(x);
  const context={
    URL,Buffer,accessStatus,BASIC_CHALLENGE,ACTIVE_POINTER,digest,
    process:{env:{FUT_ALBUM_PASSWORD:password}},
    console:{error(...args){errors.push(args.join(' '));}},
    driveEnabled:()=>true,
    driveConfigured:()=>configured,
    folderIds:()=>({catalog:'mock-catalogue-folder',images:'mock-image-folder'}),
    readJson:async(_folder,file)=>{
      if(throwOnRead)throw Error('PRIVATE_CANARY_SHOULD_NEVER_APPEAR');
      if(file===ACTIVE_POINTER){
        if(missingPointer)throw Error('Ficheiro ausente');
        return clone(pointer);
      }
      if(file==='library.json')return clone(library);
      if(file==='expansion-plan.json')return clone(plan);
      if(file==='euro-2004.json')return clone(catalogue);
      throw Error('PRIVATE_CANARY_SHOULD_NEVER_APPEAR');
    },
    readImage:async(_id,hash)=>{
      if(!hash||hash!==sha256)throw Error('hash inválido');
      if(corruptImage)throw Error('SHA-256 divergente');
      return {mime:'image/jpeg',bytes};
    }
  };
  const code=apiSource.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/g,'')
    .replace('export default async function handler','async function handler');
  assert(!code.includes('import {'),'Alteraram-se os imports da API, atualizar o mock');
  const {handler}=vm.runInNewContext(code+'\n({handler})',context);
  return {handler,errors,bytes,context};
}

test('Drive sem configuração não revela dados; status autenticado comunica a falta',async()=>{
  const h=driveHarness({configured:false});
  const info=await invoke(h.handler,{url:'/api/storage?kind=status'});
  assert.equal(info.status,200);
  assert.equal(JSON.parse(info.body).ready,false);
  const lib=await invoke(h.handler,{url:'/api/storage?kind=library'});
  assert.equal(lib.status,503);
  assertPrivate(lib);
  assert.equal(lib.headers.location,undefined);
});

test('Drive autenticado devolve manifesto e plano sem externos nem cache público',async()=>{
  const h=driveHarness();
  const info=await invoke(h.handler,{url:'/api/storage?kind=status'});
  assert.equal(JSON.parse(info.body).backend,'drive');
  const lib=await invoke(h.handler,{url:'/api/storage?kind=library'});
  assert.equal(lib.status,200);
  assert.equal(JSON.parse(lib.body)[0].cover,'/api/storage?kind=cover&id=euro-2004');
  assertPrivate(lib);
  const plan=await invoke(h.handler,{url:'/api/storage?kind=plan'});
  assert.equal(plan.status,200);
  assert.equal(JSON.parse(plan.body).goal,30);
  assertPrivate(plan);
});

test('Drive serve catalogo sem fallback externo, capa e imagem privadas no-store',async()=>{
  const h=driveHarness();
  const cat=await invoke(h.handler,{url:'/api/storage?kind=catalog&id=euro-2004'});
  assert.equal(cat.status,200);
  const data=JSON.parse(cat.body);
  assert.equal(data.cards[0].image,
    '/api/storage?kind=image&id=euro-2004&card=euro-2004-1');
  assert.equal(data.cards[0].source,'');
  assert.equal(data.cards[1].image,null);
  assert.equal(data.cards[1].source,'');
  assertPrivate(cat);
  for(const kind of ['cover','image']){
    const url=kind==='cover'?'/api/storage?kind=cover&id=euro-2004':
      '/api/storage?kind=image&id=euro-2004&card=euro-2004-1';
    const reply=await invoke(h.handler,{url});
    assert.equal(reply.status,200);
    assert.equal(reply.headers['content-type'],'image/jpeg');
    assertPrivate(reply);
    assert(Buffer.isBuffer(reply.body));
    assert.equal(reply.body.length,h.bytes.length);
  }
});

test('Drive imagem ausente ou identificador inválido falha sem dados externos',async()=>{
  const h=driveHarness();
  for(const [url,status] of [
    ['/api/storage?kind=image&id=euro-2004',400],
    ['/api/storage?kind=image&id=euro-2004&card=foo%2fbar',400],
    ['/api/storage?kind=image&id=euro-2004&card=unknown',404],
    ['/api/storage?kind=image&id=euro-2004&card=euro-2004-2',404],
    ['/api/storage?kind=cover&id=unknown',404],
    ['/api/storage?kind=catalog&id=unknown',404]
  ]){
    const reply=await invoke(h.handler,{url});
    assert.equal(reply.status,status,url);
    assertPrivate(reply);
    assert.equal(reply.headers.location,undefined);
  }
});

test('backend Drive não expõe erros privados nem em logs nem na resposta',async()=>{
  const h=driveHarness({throwOnRead:true});
  const reply=await invoke(h.handler,{url:'/api/storage?kind=library'});
  assert.equal(reply.status,502);
  assertPrivate(reply);
  assert.equal(h.errors.length,1);
  assert.equal(h.errors[0],'FUT storage: backend_read_failure');
  assert(!reply.body.includes('PRIVATE_CANARY'));
  assert(!h.errors.join(' ').includes('PRIVATE_CANARY'));
  assert(!reply.body.includes(password));
});

test('API Drive não permite qualquer bypass por URL quando falta autorização',async()=>{
  const h=driveHarness();
  for(const path of [
    '/api/storage?kind=status',
    '/api/storage?kind=plan',
    '/api/storage?kind=library',
    '/api/storage?kind=catalog&id=euro-2004',
    '/api/storage?kind=image&id=euro-2004&card=euro-2004-1',
    '/api/storage?kind=cover&id=euro-2004'
  ]){
    for(const auth of [null,wrongAuth]){
      const reply=await invoke(h.handler,{url:path,auth});
      assert.equal(reply.status,401,path);
      assert.equal(reply.headers['www-authenticate'],BASIC_CHALLENGE);
      assertPrivate(reply);
    }
  }
});

test('chave de progresso e dados de cromos não são tocados pelo gate de segurança',()=>{
  const source=readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
  assert(source.includes('const stateKey = id => "fut.album."+id+".progress.v1"'));
  const manifest=JSON.parse(readFileSync(new URL('../public/library.json',import.meta.url),'utf8'));
  assert.equal(manifest.length,51);
  assert.equal(manifest.reduce((a,x)=>a+x.count,0),28594);
});

test('Drive não serve catálogo ou imagens sem pointer promovido',async()=>{
  const h=driveHarness({missingPointer:true});
  const info=await invoke(h.handler,{url:'/api/storage?kind=status'});
  assert.equal(info.status,200);
  assert.equal(JSON.parse(info.body).ready,false);
  for(const url of [
    '/api/storage?kind=library',
    '/api/storage?kind=catalog&id=euro-2004',
    '/api/storage?kind=image&id=euro-2004&card=euro-2004-1'
  ]){
    const reply=await invoke(h.handler,{url});
    assert.equal(reply.status,502,url);
    assert.equal(reply.headers.location,undefined);
  }
});

test('Drive falha fechado para imagem sem hash ou catálogo incompleto',async()=>{
  for(const opt of [{missingHash:true},{incomplete:true}]){
    const h=driveHarness(opt);
    const reply=await invoke(h.handler,{
      url:'/api/storage?kind=catalog&id=euro-2004'
    });
    assert.equal(reply.status,502);
    assert.equal(reply.headers.location,undefined);
  }
});

test('Drive com bytes divergentes responde erro 502 sem fallback externo',async()=>{
  const h=driveHarness({corruptImage:true});
  const reply=await invoke(h.handler,{
    url:'/api/storage?kind=image&id=euro-2004&card=euro-2004-1'
  });
  assert.equal(reply.status,502);
  assert.equal(reply.headers.location,undefined);
  assertPrivate(reply);
});

test('authenticated proxy identifies exact commit; anonymous reveals no commit',async()=>{
 const h=proxyHarness();h.sandbox.process.env.VERCEL_GIT_COMMIT_SHA='a'.repeat(40);
 assert.equal((await h.call('/','GET',authorization)).headers.get('x-fut-commit'),'a'.repeat(40));
 assert.equal((await h.call('/')).headers.get('x-fut-commit'),null);
});
