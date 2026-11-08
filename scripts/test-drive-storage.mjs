import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/storage.js';

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
