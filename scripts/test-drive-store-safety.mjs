import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, verify } from 'node:crypto';
import { getAccessToken, driveAuthMode, driveConfigured, readRawFile, readImage } from '../lib/drive-store.js';

const envNames=[
  'FUT_DRIVE_OAUTH_CLIENT_ID','FUT_DRIVE_OAUTH_CLIENT_SECRET',
  'FUT_DRIVE_OAUTH_REFRESH_TOKEN','FUT_DRIVE_SERVICE_ACCOUNT_JSON',
  'FUT_DRIVE_SHARED_DRIVE_ID','FUT_DRIVE_CATALOGS_FOLDER_ID',
  'FUT_DRIVE_IMAGES_FOLDER_ID'
];

async function withEnv(changes,fn){
  const old=Object.fromEntries(envNames.map(key=>[key,process.env[key]]));
  const previousFetch=globalThis.fetch;
  try{
    for(const key of envNames)delete process.env[key];
    for(const [key,value] of Object.entries(changes))
      process.env[key]=value;
    return await fn();
  }finally{
    globalThis.fetch=previousFetch;
    for(const key of envNames){
      if(old[key]===undefined)delete process.env[key];
      else process.env[key]=old[key];
    }
  }
}
const folders={
  FUT_DRIVE_CATALOGS_FOLDER_ID:'synthetic-catalogs-folder',
  FUT_DRIVE_IMAGES_FOLDER_ID:'synthetic-images-folder'
};
const oauth={
  ...folders,
  FUT_DRIVE_OAUTH_CLIENT_ID:'synthetic-oauth-client',
  FUT_DRIVE_OAUTH_CLIENT_SECRET:'synthetic-oauth-secret',
  FUT_DRIVE_OAUTH_REFRESH_TOKEN:'synthetic-oauth-refresh'
};

test('OAuth sintético: refresh token e invalidação quando config muda',async()=>{
  await withEnv(oauth,async()=>{
    assert.equal(driveAuthMode(),'oauth');
    assert.equal(driveConfigured(),true);
    let calls=0;
    globalThis.fetch=async(url,init)=>{
      assert.equal(url,'https://oauth2.googleapis.com/token');
      assert.equal(init.method,'POST');
      assert.equal(init.body.get('grant_type'),'refresh_token');
      assert.equal(init.body.get('refresh_token'),'synthetic-oauth-refresh');
      calls++;
      return new Response(JSON.stringify({access_token:'mock-access-token-a',
        expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    assert.equal(await getAccessToken(),'mock-access-token-a');
    assert.equal(await getAccessToken(),'mock-access-token-a');
    assert.equal(calls,1);
    process.env.FUT_DRIVE_OAUTH_REFRESH_TOKEN='synthetic-oauth-refresh-rotated';
    globalThis.fetch=async(_url,init)=>{
      assert.equal(init.body.get('refresh_token'),'synthetic-oauth-refresh-rotated');
      calls++;
      return new Response(JSON.stringify({access_token:'mock-access-token-b',
        expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    assert.equal(await getAccessToken(),'mock-access-token-b');
    assert.equal(calls,2);
  });
});

test('conta de serviço sintética: JWT assinado e Shared Drive exigida',async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const credentials={
    client_email:'test-synthetic@example.gserviceaccount.com',
    private_key:privateKey.export({type:'pkcs8',format:'pem'})
  };
  await withEnv({...folders,
    FUT_DRIVE_SERVICE_ACCOUNT_JSON:JSON.stringify(credentials),
    FUT_DRIVE_SHARED_DRIVE_ID:'synthetic-shared-drive'
  },async()=>{
    assert.equal(driveAuthMode(),'service-account');
    assert.equal(driveConfigured(),true);
    let calls=0;
    globalThis.fetch=async(url,init)=>{
      calls++;
      assert.equal(url,'https://oauth2.googleapis.com/token');
      assert.equal(init.method,'POST');
      assert.equal(init.body.get('grant_type'),
        'urn:ietf:params:oauth:grant-type:jwt-bearer');
      const compact=init.body.get('assertion');
      const parts=compact.split('.');
      assert.equal(parts.length,3);
      const jwt=JSON.parse(Buffer.from(parts[1],'base64url').toString());
      assert.equal(jwt.iss,credentials.client_email);
      assert.equal(jwt.aud,url);
      assert(verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),
        publicKey,Buffer.from(parts[2],'base64url')));
      return new Response(JSON.stringify({access_token:'synthetic-service-token',
        expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    assert.equal(await getAccessToken(),'synthetic-service-token');
    assert.equal(calls,1);
  });
  await withEnv({...folders,
    FUT_DRIVE_SERVICE_ACCOUNT_JSON:JSON.stringify(credentials)
  },async()=>{
    assert.equal(driveAuthMode(),'none');
    assert.equal(driveConfigured(),false);
  });
});

test('readImage exige hash SHA-256 mesmo se o URL parecer correto',async()=>{
  await assert.rejects(()=>readImage('synthetic-file-id',null),
    /sem SHA-256/);
  await assert.rejects(()=>readImage('synthetic-file-id','bad'),
    /sem SHA-256/);
});

test('leitura Drive em streaming limita Content-Length e payload efetivo',async()=>{
  await withEnv(oauth,async()=>{
    let readCount=0;
    globalThis.fetch=async(url)=>{
      if(url==='https://oauth2.googleapis.com/token'){
        return new Response(JSON.stringify({access_token:'synthetic-token-2',
          expires_in:3600}),{status:200});
      }
      assert.match(url,/googleapis.com\/drive\/v3\/files\//);
      readCount++;
      if(readCount===1)
        return new Response(new Uint8Array(1200),{
          headers:{'Content-Type':'application/octet-stream',
            'Content-Length':'1000000'}});
      return new Response(new Uint8Array(4096),{
        headers:{'Content-Type':'application/octet-stream'}});
    };
    await assert.rejects(()=>readRawFile('synthetic-file-id',1600),
      /Tamanho declarado/);
    await assert.rejects(()=>readRawFile('synthetic-file-id',1600),
      /excede o tamanho permitido/);
    assert.equal(readCount,2);
  });
});

test('readImage confirma MIME, tamanho e hash real antes de servir bytes',async()=>{
  const bytes=Buffer.alloc(1700,0x61);
  const sha=createHash('sha256').update(bytes).digest('hex');
  await withEnv({...oauth,FUT_DRIVE_OAUTH_REFRESH_TOKEN:'synthetic-hash-new'},async()=>{
    globalThis.fetch=async(url)=>{
      if(url==='https://oauth2.googleapis.com/token')
        return new Response(JSON.stringify({access_token:'synthetic-hash-token',
          expires_in:3600}),{status:200});
      return new Response(bytes,{status:200,headers:{
        'Content-Type':'image/jpeg','Content-Length':String(bytes.length)}});
    };
    const valid=await readImage('synthetic-file-hash',sha);
    assert.equal(valid.sha256,sha);
    assert.equal(valid.bytes.length,bytes.length);
    await assert.rejects(()=>readImage('synthetic-file-hash','b'.repeat(64)),
      /SHA-256 divergente/);
  });
});

test('nenhum teste configura o backend de produção ou acessa Drive real',()=>{
  assert.notEqual(process.env.FUT_STORAGE_BACKEND,'drive');
});
