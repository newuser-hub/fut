import test from 'node:test';
import assert from 'node:assert/strict';
import {probe} from './test-live-release.mjs';

const sha='a'.repeat(40),host='fut-test123-pjr-s-projects.vercel.app';
const library=[{id:'alpha',count:1,status:'active'}];
const opts={hosts:[host],sha,password:'synthetic-test-only',oidc:'synthetic-oidc',library};
function fixture(change=()=>null){
  const calls=[];
  return {calls,fetcher:async(url,options)=>{
    calls.push({url,options});
    const override=change(url,options);if(override)return override;
    if(!options.headers.Authorization)return new Response('',{status:401,headers:{'www-authenticate':'Basic realm="FUT - Cadernetas"','cache-control':'private, no-store'}});
    const u=new URL(url);
    const body=u.pathname==='/'?'fut.album.':u.searchParams.get('kind')==='status'?{backend:'vercel',ready:true}:url.includes('library')?library:url.includes('plan')?{collections:[]}:{id:'alpha',cards:[{}]};
    return new Response(typeof body==='string'?body:JSON.stringify(body),{headers:{'x-fut-commit':sha}});
  }};
}
test('probe checks every route anonymously and authenticated with exact SHA',async()=>{
  const f=fixture();const result=await probe({...opts,...f});
  assert.equal(result.checks,16);assert.equal(result.result,'PASS');
  assert(f.calls.every(x=>x.options.redirect==='manual'));
  assert(f.calls.every(x=>x.options.headers['x-vercel-trusted-oidc-idp-token']===opts.oidc));
});
test('probe never sends credentials to untrusted hosts or missing configuration',async()=>{
  for(const hosts of [['evil.example'],['fut-test123-pjr-s-projects.vercel.app.evil.example'],['fut-rosy.vercel.app@evil.example'],[]]){
    const f=fixture();await assert.rejects(probe({...opts,...f,hosts}),/CONFIG/);assert.equal(f.calls.length,0);
  }
  const f=fixture();await assert.rejects(probe({...opts,...f,password:''}),/CONFIG/);assert.equal(f.calls.length,0);
});
test('probe rejects redirects to other origins before forwarding credentials',async()=>{
  const f=fixture((url,o)=>o.headers.Authorization?new Response(null,{status:307,headers:{location:'https://evil.example/'}}):null);
  await assert.rejects(probe({...opts,...f}),/REDIRECT/);assert.equal(f.calls.length,2);
});
test('platform 401, wrong deployed SHA and wrong catalog block release',async()=>{
  for(const [code,change] of [
    ['ANON',(u,o)=>!o.headers.Authorization?new Response('',{status:401}):null],
    ['AUTH_OR_SHA',(u,o)=>o.headers.Authorization?new Response('fut.album.',{headers:{'x-fut-commit':'b'.repeat(40)}}):null],
    ['CATALOG',(u,o)=>o.headers.Authorization&&u.includes('/data/')?new Response(JSON.stringify({id:'wrong',cards:[{}]}),{headers:{'x-fut-commit':sha}}):null]
  ])await assert.rejects(probe({...opts,...fixture(change)}),new RegExp(code));
});
test('production probes never forward platform OIDC token',async()=>{
  const f=fixture();const result=await probe({...opts,...f,hosts:['fut-rosy.vercel.app','fut-pjr-s-projects.vercel.app']});
  assert.equal(result.checks,32);
  assert(f.calls.every(x=>!x.options.headers['x-vercel-trusted-oidc-idp-token']));
});
