import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOSTS,PATHS,identifyChallenge,inspectDeployment,
  confirmExactDeployment,run
} from './verify-fut-deployment.mjs';

const SHA='1'.repeat(40);
const OLD='2'.repeat(40);
const ID='dpl_syntheticReady0001';
const AUTH='Basic realm="FUT - Cadernetas", charset="UTF-8"';
const ready=(sha=SHA,id=ID)=>({
  id,readyState:'READY',target:'production',
  meta:{githubCommitSha:sha},gitSource:{sha}
});
const reply=(object,opts={})=>new Response(
  JSON.stringify(object),{status:opts.status||200,
    headers:opts.headers||{'Content-Type':'application/json'}});

function network({domainSha={},domainId={},phase={},challenge='app'}={}){
  const calls=[];
  const fetcher=async(url,opts)=>{
    calls.push({url,headers:opts.headers,method:opts.method});
    if(url.startsWith('https://api.vercel.com/')){
      const host=HOSTS.find(h=>url.includes('/'+h+'?'));
      assert(host,'Domínio da API Vercel desconhecido');
      const state=phase[host]||'READY';
      return reply({
        ...ready(domainSha[host]??SHA,domainId[host]??ID),
        readyState:state
      });
    }
    if(challenge==='app')return new Response(null,{status:401,headers:{
      'WWW-Authenticate':AUTH,'Cache-Control':'private, no-store'}});
    if(challenge==='platform')return new Response(null,{status:401,headers:{
      'WWW-Authenticate':'Bearer realm="Vercel Authentication"',
      'Cache-Control':'private, no-store'}});
    if(challenge==='redirect')return new Response(null,{status:302,
      headers:{Location:'/_vercel/sso-api/login'}});
    return new Response('{}',{status:200});
  };
  return {calls,fetcher};
}

test('confirmar READY exige SHA exato em AMBOS os domínios',async()=>{
  for(const host of HOSTS){
    const n=network({domainSha:{[host]:OLD}});
    await assert.rejects(()=>confirmExactDeployment(SHA,'synthetic-token',{
      fetcher:n.fetcher,attempts:1,pause:async()=>{}
    }),/PENDENTE/);
  }
  const n=network();
  const result=await confirmExactDeployment(SHA,'synthetic-token',{
    fetcher:n.fetcher,attempts:1,pause:async()=>{}
  });
  assert.equal(result.id,ID);
  assert.deepEqual(result.aliases,[...HOSTS]);
  assert.equal(n.calls.length,2);
});

test('READY de SHA diferente ou deployment não production NÃO conta',async()=>{
  assert.equal(inspectDeployment(ready(OLD),SHA).ok,false);
  assert.equal(inspectDeployment({...ready(),readyState:'BUILDING'},SHA).ok,false);
  assert.equal(inspectDeployment({...ready(),target:'preview'},SHA).ok,false);
  assert.equal(inspectDeployment({...ready(),gitSource:{sha:OLD}},SHA).ok,false);
  assert.equal(inspectDeployment({...ready(),id:'unknown'},SHA).ok,false);
  const n=network({domainId:{[HOSTS[1]]:'dpl_otherSynthethic'}});
  await assert.rejects(()=>confirmExactDeployment(SHA,'synthetic-token',{
    fetcher:n.fetcher,attempts:1
  }),/PENDENTE/);
});

test('sem Vercel token, não faz pedidos nem aceita deployment antigo',async()=>{
  const n=network();
  await assert.rejects(()=>run({
    expectedSha:SHA,token:'',fetcher:n.fetcher,attempts:1
  }),/PENDENTE: VERCEL_TOKEN/);
  assert.equal(n.calls.length,0);
});

test('GET da aplicação só após o READY exato, ambos domínios e todas rotas',async()=>{
  const n=network();
  const oldLog=console.log;
  const messages=[];
  console.log=(...x)=>messages.push(...x);
  try{
    const result=await run({expectedSha:SHA,token:'synthetic-token',
      fetcher:n.fetcher,attempts:1});
    assert.equal(result.checks.length,HOSTS.length*PATHS.length);
    assert(result.checks.every(x=>x.challenge==='application_basic_401'));
    assert(n.calls.slice(0,2).every(x=>x.url.startsWith('https://api.vercel.com/')));
    assert(n.calls.slice(2).every(x=>x.url.startsWith('https://fut-')));
    assert(!JSON.stringify(messages).includes('synthetic-token'));
  }finally{console.log=oldLog;}
});

test('bloqueio da plataforma não é prova de autenticação Basic da aplicação',async()=>{
  for(const variant of ['platform','redirect','unprotected']){
    const n=network({challenge:variant});
    const oldLog=console.log;
    console.log=()=>{};
    try{
      await assert.rejects(()=>run({expectedSha:SHA,token:'synthetic-token',
        fetcher:n.fetcher,attempts:1
      }),/PENDENTE: proteção da aplicação/);
    }finally{console.log=oldLog;}
  }
  const platform=new Headers({'WWW-Authenticate':'Bearer realm="Vercel"'});
  assert.equal(identifyChallenge(401,platform),'platform_or_deployment_protection');
  assert.equal(identifyChallenge(401,new Headers()),'unverified_or_unprotected');
  assert.equal(identifyChallenge(401,new Headers({
    'WWW-Authenticate':AUTH,'Cache-Control':'private, no-store'
  })),'application_basic_401');
});

test('se um alias não está READY, não enviar GET ao site (sem deployment antigo)',async()=>{
  const n=network({phase:{[HOSTS[1]]:'BUILDING'}});
  await assert.rejects(()=>run({expectedSha:SHA,token:'synthetic-token',
    fetcher:n.fetcher,attempts:2,pause:async()=>{}
  }),/PENDENTE/);
  assert(n.calls.every(x=>x.url.startsWith('https://api.vercel.com/')));
});
