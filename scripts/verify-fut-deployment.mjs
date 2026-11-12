#!/usr/bin/env node
/**
 * Prova de proteção em produção APENAS se ambos os aliases indicarem
 * deployment production READY com o SHA EXATO pedido.
 * Nunca usa credenciais Basic do site. A API Vercel requer token de leitura;
 * sem token ou sem SHA READY, regista PENDENTE e sai com código de erro.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

export const HOSTS=Object.freeze([
  'fut-rosy.vercel.app',
  'fut-pjr-s-projects.vercel.app'
]);
export const PATHS=Object.freeze([
  '/', '/index.html', '/library.json', '/expansion-plan.json',
  '/data/idolos-pt-2026-27.json',
  '/data/ucl-topps-2025-26.json',
  '/data/ligue-1-foot-2025-26.json',
  '/api/storage?kind=library',
  '/api/storage?kind=plan',
  '/api/storage?kind=catalog&id=euro-2004'
]);

export function identifyChallenge(status,headers){
  const challenge=headers.get('www-authenticate')||'';
  const location=headers.get('location')||'';
  const cache=headers.get('cache-control')||'';
  if(status===401 && /^Basic realm="FUT - Cadernetas"(?:,|$)/i.test(challenge) &&
     /\bno-store\b/i.test(cache))return 'application_basic_401';
  if(/(?:\/_vercel\/|vercel\.com\/login)/i.test(location) ||
     (status===401||status===403) && /Vercel|SSO|Bearer/i.test(challenge))
    return 'platform_or_deployment_protection';
  return 'unverified_or_unprotected';
}

export function inspectDeployment(payload,expectedSha){
  const d=payload?.deployment||payload;
  if(!d||typeof d!=='object')return {ok:false,reason:'metadata_missing'};
  const sha=d.meta?.githubCommitSha||d.gitSource?.sha||null;
  const sourceSha=d.gitSource?.sha;
  if(!sha||sha!==expectedSha||(sourceSha&&sourceSha!==expectedSha))
    return {ok:false,reason:'wrong_commit'};
  if(d.readyState!=='READY')
    return {ok:false,reason:'not_ready'};
  if(d.target!=='production')
    return {ok:false,reason:'not_production'};
  if(typeof d.id!=='string'||!d.id.startsWith('dpl_'))
    return {ok:false,reason:'deployment_id_missing'};
  return {ok:true,id:d.id,sha};
}

export async function fetchDeployment(host,token,fetcher=fetch){
  const url='https://api.vercel.com/v13/deployments/'+
    encodeURIComponent(host)+'?withGitRepoInfo=true';
  const response=await fetcher(url,{
    method:'GET',
    redirect:'manual',
    headers:{Authorization:'Bearer '+token,Accept:'application/json'},
    signal:AbortSignal.timeout(12000)
  });
  if(response.status!==200)
    return {error:'deployment_api_http_'+response.status};
  try{return {data:await response.json()};}
  catch{return {error:'deployment_metadata_unreadable'};}
}

export async function confirmExactDeployment(expectedSha,token,{
  fetcher=fetch,attempts=20,pause=ms=>new Promise(r=>setTimeout(r,12000))
}={}){
  if(!/^[a-f0-9]{40}$/.test(expectedSha))throw Error('SHA pretendido inválido');
  if(!token)throw Error('PENDENTE: VERCEL_TOKEN de leitura indisponível');
  for(let attempt=1;attempt<=attempts;attempt++){
    const results=[];
    for(const host of HOSTS){
      const item=await fetchDeployment(host,token,fetcher);
      results.push(item.error?
        {ok:false,reason:item.error}:inspectDeployment(item.data,expectedSha));
    }
    const valid=results.every(x=>x.ok)&&results[0].id===results[1].id;
    if(valid)return {id:results[0].id,sha:expectedSha,aliases:[...HOSTS]};
    if(attempt===attempts){
      const reasons=results.map(x=>x.reason||'alias_differs').join(',');
      throw Error('PENDENTE: não foi confirmado READY do SHA exato nos dois aliases ('+
        reasons+')');
    }
    await pause(12000);
  }
}

export async function auditHostPaths(host,fetcher=fetch){
  const findings=[];
  for(const path of PATHS){
    let status,challenge;
    try{
      const response=await fetcher('https://'+host+path,{
        method:'GET',redirect:'manual',
        headers:{Accept:'*/*'},
        signal:AbortSignal.timeout(12000)
      });
      status=response.status;
      challenge=identifyChallenge(status,response.headers);
      await response.body?.cancel?.();
    }catch{
      status=null;
      challenge='network_unverified';
    }
    findings.push({host,path,status,challenge});
  }
  return findings;
}

export async function run({
  expectedSha=process.env.FUT_EXPECTED_SHA||process.env.GITHUB_SHA,
  token=process.env.VERCEL_TOKEN,fetcher=fetch,
  attempts=20,pause
}={}){
  // Primeiro ambos os aliases têm de confirmar a MESMA publicação.
  const deployment=await confirmExactDeployment(expectedSha,token,{
    fetcher,attempts,pause
  });
  const checks=[];
  for(const host of HOSTS)checks.push(...await auditHostPaths(host,fetcher));
  const counts=Object.fromEntries([...new Set(checks.map(x=>x.challenge))]
    .map(x=>[x,checks.filter(y=>y.challenge===x).length]));
  console.log(JSON.stringify({
    expectedSha,confirmedDeployment:deployment.id,
    aliases:HOSTS,checks:checks.length,counts,
    applicationAuthConfirmed:checks.every(x=>x.challenge==='application_basic_401')
  }));
  if(checks.some(x=>x.challenge!=='application_basic_401'))
    throw Error('PENDENTE: proteção da aplicação não confirmada em todas as rotas');
  return {deployment,checks};
}

const isMain=process.argv[1]&&
  pathToFileURL(resolve(process.argv[1])).href===import.meta.url;
if(isMain){
  run().catch(err=>{
    // Não mostrar token, headers de autenticação, body ou URLs privadas.
    console.error(String(err.message||'PENDENTE: falha de validação do deployment'));
    process.exitCode=1;
  });
}
