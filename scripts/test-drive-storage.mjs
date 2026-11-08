import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/storage.js';
import { driveAuthMode, driveConfigured, getAccessToken } from '../lib/drive-store.js';

async function request(url) {
  const headers={};
  let result;
  const res={
    statusCode:200,
    setHeader(name,value){headers[name.toLowerCase()]=value;},
    end(payload=''){result={status:this.statusCode,headers,body:String(payload)};}
  };
  await handler({method:'GET',url},res);
  return result;
}

test('site original mantém-se operacional enquanto Drive não está ativado',async()=>{
  const previous=process.env.FUT_STORAGE_BACKEND;
  delete process.env.FUT_STORAGE_BACKEND;
  try {
    for(const [path,destination] of [
      ['/api/storage?kind=library','/library.json'],
      ['/api/storage?kind=plan','/expansion-plan.json'],
      ['/api/storage?kind=catalog&id=euro-2004','/data/euro-2004.json']
    ]){
      const reply=await request(path);
      assert.equal(reply.status,307);
      assert.equal(reply.headers.location,destination);
      assert.equal(reply.headers['cache-control'],'private, no-store');
    }
    assert.equal((await request('/api/storage?kind=catalog&id=../password')).status,400);
    const state=await request('/api/storage?kind=status');
    assert.deepEqual(JSON.parse(state.body),{
      backend:'vercel',ready:true,imageBackend:'external'
    });
  }finally{
    if(previous===undefined)delete process.env.FUT_STORAGE_BACKEND;
    else process.env.FUT_STORAGE_BACKEND=previous;
  }
});

test('Drive privado sem credenciais falha fechado, nunca redireciona para fontes externas',async()=>{
  const current=process.env.FUT_STORAGE_BACKEND;
  process.env.FUT_STORAGE_BACKEND='drive';
  try {
    const reply=await request('/api/storage?kind=library');
    assert.equal(reply.status,503);
    assert.equal(reply.headers.location,undefined);
    assert.equal(JSON.parse(reply.body).error,'Armazenamento Drive indisponível');
    const state=await request('/api/storage?kind=status');
    assert.equal(JSON.parse(state.body).backend,'drive');
    assert.equal(JSON.parse(state.body).ready,false);
  }finally{
    if(current===undefined)delete process.env.FUT_STORAGE_BACKEND;
    else process.env.FUT_STORAGE_BACKEND=current;
  }
});

test('Meu disco utiliza refresh token OAuth, sem necessidade de conta de serviço', async()=>{
  const keys=['FUT_DRIVE_OAUTH_CLIENT_ID','FUT_DRIVE_OAUTH_CLIENT_SECRET',
    'FUT_DRIVE_OAUTH_REFRESH_TOKEN','FUT_DRIVE_CATALOGS_FOLDER_ID',
    'FUT_DRIVE_IMAGES_FOLDER_ID','FUT_DRIVE_SERVICE_ACCOUNT_JSON',
    'FUT_DRIVE_SHARED_DRIVE_ID'];
  const prev=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const originalFetch=globalThis.fetch;
  let requested=false;
  try{
    for(const key of keys)delete process.env[key];
    process.env.FUT_DRIVE_CATALOGS_FOLDER_ID='1YSBTawUnSfk76QM2fxJ6I7O2MYr3nf-f';
    process.env.FUT_DRIVE_IMAGES_FOLDER_ID='17qFZjaYOf_ALoQSIA9mI3zjc5_ZmxZg3';
    process.env.FUT_DRIVE_OAUTH_CLIENT_ID='fut-test-client';
    process.env.FUT_DRIVE_OAUTH_CLIENT_SECRET='fut-test-secret';
    process.env.FUT_DRIVE_OAUTH_REFRESH_TOKEN='fut-test-refresh';
    assert.equal(driveAuthMode(),'oauth');
    assert.equal(driveConfigured(),true);
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://oauth2.googleapis.com/token');
      assert.equal(options.method,'POST');
      assert.equal(options.body.get('grant_type'),'refresh_token');
      assert.equal(options.body.get('refresh_token'),'fut-test-refresh');
      requested=true;
      return {ok:true,json:async()=>({access_token:'fut-mocked-token',expires_in:120})};
    };
    assert.equal(await getAccessToken(),'fut-mocked-token');
    assert.equal(requested,true);
  }finally{
    globalThis.fetch=originalFetch;
    for(const key of keys){
      if(prev[key]===undefined)delete process.env[key];
      else process.env[key]=prev[key];
    }
  }
});

test('Conta de serviço sem Shared Drive não é um destino válido para uploads',()=>{
  const a=process.env.FUT_DRIVE_SERVICE_ACCOUNT_JSON;
  const b=process.env.FUT_DRIVE_SHARED_DRIVE_ID;
  const oauth=['FUT_DRIVE_OAUTH_CLIENT_ID','FUT_DRIVE_OAUTH_CLIENT_SECRET',
    'FUT_DRIVE_OAUTH_REFRESH_TOKEN'];
  const old=Object.fromEntries(oauth.map(k=>[k,process.env[k]]));
  try{
    oauth.forEach(k=>delete process.env[k]);
    process.env.FUT_DRIVE_SERVICE_ACCOUNT_JSON=JSON.stringify({client_email:'fut@example.iam.gserviceaccount.com',private_key:'unused'});
    delete process.env.FUT_DRIVE_SHARED_DRIVE_ID;
    assert.equal(driveAuthMode(),'none');
    process.env.FUT_DRIVE_SHARED_DRIVE_ID='shared-drive-test-id';
    assert.equal(driveAuthMode(),'service-account');
  }finally{
    if(a===undefined)delete process.env.FUT_DRIVE_SERVICE_ACCOUNT_JSON;
    else process.env.FUT_DRIVE_SERVICE_ACCOUNT_JSON=a;
    if(b===undefined)delete process.env.FUT_DRIVE_SHARED_DRIVE_ID;
    else process.env.FUT_DRIVE_SHARED_DRIVE_ID=b;
    for(const k of oauth){
      if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];
    }
  }
});
