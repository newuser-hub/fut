#!/usr/bin/env node
// Testes de regressão do frontend real, sem DOM/browser externos nem Drive.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
const publicHtml=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.equal(html,publicHtml,'O build deve sincronizar public/index.html e src/index.html');
const match=html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert(match,'Script do frontend não encontrado');
assert(match[1].includes('    start();'),'O ponto de entrada do frontend mudou');
const runtime=match[1].replace('    start();',[
  'globalThis.__audit={',
  '  library:x=>{LIBRARY=x},',
  '  select:selectCollection,navigate,restoreHash,importProgress,save,',
  '  snapshot:()=>({id:activeCollectionId,view,epoch:selectionEpoch,',
  '    state,cardIds:catalog.cards.map(x=>x.id)})',
  '};'
].join('\n'));

const collections=[
  {id:'alpha',title:'Coleção A',description:'Teste A',category:'Clubes · Liga Portugal',year:'2024/25',count:2,sections:1,status:'active'},
  {id:'beta',title:'Coleção B',description:'Teste B',category:'Champions League',year:'2025/26',count:2,sections:1,status:'active'}
];
const cards=id=>['1','2'].map(n=>({
  id:id+'-'+n,name:'Cromo '+n,number:n,section:'Equipa de teste',
  sectionSlug:'equipa-de-teste',available:false
}));
const response=id=>({ok:true,status:200,json:async()=>({
  id,cards:cards(id),sections:['Equipa de teste'],year:'2024',
  subtitle:'Coleção de teste'
})});
const key=id=>'fut.album.'+id+'.progress.v1';
const backup=(collection,extra={})=>({
  app:'fut',collection,version:1,exportedAt:'2026-11-08T00:00:00Z',
  revealed:[collection+'-1'],favorites:[],...extra
});
const file=value=>({text:async()=>typeof value==='string'?value:JSON.stringify(value)});
const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((a,b)=>{resolve=a;reject=b});
  return {promise,resolve,reject};
};

function harness(){
  const store=new Map();
  const nodes=new Map();
  let fetcher=url=>Promise.resolve(response(new URL(url,'https://example.test').searchParams.get('id')));
  let readonly=false;
  const element=()=>({
    innerHTML:'',textContent:'',value:'',style:{},disabled:false,
    classList:{toggle(){},add(){},remove(){}},
    addEventListener(){},querySelector(){return null},
    scrollIntoView(){},setAttribute(){}
  });
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,element());
    return nodes.get(id);
  };
  const location={hash:'#/colecoes'};
  const context={
    document:{
      getElementById:node,querySelector:node,addEventListener(){},
      body:{style:{}}
    },
    window:{addEventListener(){},scrollTo(){}},
    location,
    history:{replaceState(_state,_unused,hash){location.hash=hash}},
    localStorage:{
      getItem:id=>store.get(id)??null,
      setItem(id,value){if(readonly)throw Error('QuotaExceededError');store.set(id,value)}
    },
    fetch:(url,options)=>fetcher(url,options),
    navigator:{},console,confirm:()=>true,
    setTimeout:()=>1,clearTimeout:()=>{}
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(runtime,context);
  const api=context.__audit;
  api.library(collections);
  return {api,location,store,
    setFetch(fn){fetcher=fn},
    setQuotaFail(value){readonly=value},
    notice:()=>node('toast').textContent
  };
}
const ids=obj=>Object.keys(obj).sort();

test('pedidos fora de ordem: a última coleção selecionada prevalece',async()=>{
  const h=harness(),a=deferred(),b=deferred();
  h.setFetch(url=>new URL(url,'https://x.test').searchParams.get('id')==='alpha'?a.promise:b.promise);
  const old=h.api.select('alpha');
  const latest=h.api.select('beta');
  b.resolve(response('beta'));
  assert.equal(await latest,true);
  a.resolve(response('alpha'));
  assert.equal(await old,false);
  assert.equal(h.api.snapshot().id,'beta');
  assert.deepEqual(h.api.snapshot().cardIds,['beta-1','beta-2']);
  assert.equal(h.location.hash,'#/c/beta/indice');
});

test('sair para o portal durante fetch não reabre a coleção antiga',async()=>{
  const h=harness(),pending=deferred();
  h.setFetch(()=>pending.promise);
  const loading=h.api.select('alpha');
  h.api.navigate('portal');
  pending.resolve(response('alpha'));
  assert.equal(await loading,false);
  assert.equal(h.api.snapshot().view,'portal');
  assert.equal(h.api.snapshot().id,null);
  assert.equal(h.location.hash,'#/colecoes');
});

test('hashes malformados, desconhecidos e rotas não suportadas regressam ao portal',async()=>{
  const h=harness();
  h.setFetch(()=>{throw Error('Não devia pedir dados')});
  for(const bad of ['#/c/%E0%A4%A','/c/alpha/indice','#/c/inexistente/indice',
    '#/c/alpha/secao/invalida/nan','#/c/alpha/nao-existe']){
    h.location.hash=bad;
    await h.api.restoreHash();
    assert.equal(h.api.snapshot().view,'portal');
    assert.equal(h.location.hash,'#/colecoes');
  }
});

test('hash antigo não força a reabertura após saída para o portal',async()=>{
  const h=harness(),pending=deferred();
  h.setFetch(()=>pending.promise);
  h.location.hash='#/c/alpha/indice';
  const loading=h.api.restoreHash();
  h.api.navigate('portal');
  pending.resolve(response('alpha'));
  await loading;
  assert.equal(h.api.snapshot().id,null);
  assert.equal(h.location.hash,'#/colecoes');
});

test('save comunica falha de quota e importação não anuncia sucesso nem altera estado',async()=>{
  const h=harness();
  assert.equal(await h.api.select('alpha'),true);
  h.setQuotaFail(true);
  assert.equal(h.api.save(),false);
  assert.match(h.notice(),/Não foi possível guardar/);
  assert.equal(await h.api.importProgress(file(backup('alpha'))),false);
  assert.equal(h.store.has(key('alpha')),false);
  assert.deepEqual(ids(h.api.snapshot().state.revealed),[]);
  assert.doesNotMatch(h.notice(),/sucesso/i);
});

test('JSON inválido, versão não suportada e backup de outra coleção são rejeitados',async()=>{
  const h=harness();
  await h.api.select('alpha');
  for(const value of ['{', backup('alpha',{version:2}),
    backup('beta'), backup('alpha',{revealed:'texto'}),
    backup('alpha',{version:undefined})]){
    assert.equal(await h.api.importProgress(file(value)),false);
    assert.equal(h.store.has(key('alpha')),false);
    assert.deepEqual(ids(h.api.snapshot().state.revealed),[]);
    assert.doesNotMatch(h.notice(),/sucesso/i);
  }
});

test('IDs desconhecidos e valores não textuais são filtrados sem poluir backups',async()=>{
  const h=harness();
  await h.api.select('alpha');
  const value=backup('alpha',{
    revealed:['alpha-1','inexistente',42,'__proto__','alpha-1',null],
    favorites:['alpha-2','beta-1',{},'constructor']
  });
  assert.equal(await h.api.importProgress(file(value)),true);
  assert.deepEqual(ids(h.api.snapshot().state.revealed),['alpha-1']);
  assert.deepEqual(ids(h.api.snapshot().state.favorites),['alpha-2']);
  const saved=JSON.parse(h.store.get(key('alpha')));
  assert.deepEqual(Object.keys(saved.revealed),['alpha-1']);
  assert.deepEqual(Object.keys(saved.favorites),['alpha-2']);
  assert.match(h.notice(),/sucesso/i);
});

test('progresso histórico permanece na mesma chave e IDs inválidos são ignorados na leitura',async()=>{
  const h=harness();
  const legacy={revealed:{'alpha-1':true,'beta-1':true},favorites:{'alpha-2':true,invalid:false}};
  const original=JSON.stringify(legacy);
  h.store.set(key('alpha'),original);
  assert.equal(await h.api.select('alpha'),true);
  assert.deepEqual(ids(h.api.snapshot().state.revealed),['alpha-1']);
  assert.deepEqual(ids(h.api.snapshot().state.favorites),['alpha-2']);
  assert.equal(h.store.get(key('alpha')),original,'Carregar não migra nem apaga dados antigos');
});

test('importação de outra coleção nunca substitui progresso nem contamina coleções',async()=>{
  const h=harness();
  await h.api.select('alpha');
  assert.equal(await h.api.importProgress(file(backup('alpha'))),true);
  const alphaValue=h.store.get(key('alpha'));
  await h.api.select('beta');
  assert.deepEqual(ids(h.api.snapshot().state.revealed),[]);
  assert.equal(await h.api.importProgress(file(backup('alpha'))),false);
  assert.equal(h.store.has(key('beta')),false);
  assert.equal(await h.api.importProgress(file(backup('beta',{favorites:['beta-2']}))),true);
  assert.equal(h.store.get(key('alpha')),alphaValue);
  assert.deepEqual(ids(h.api.snapshot().state.revealed),['beta-1']);
  await h.api.select('alpha');
  assert.deepEqual(ids(h.api.snapshot().state.revealed),['alpha-1']);
  assert.deepEqual(ids(h.api.snapshot().state.favorites),[]);
});

test('leitura assíncrona de backup é cancelada se a seleção mudar',async()=>{
  const h=harness(),pending=deferred();
  await h.api.select('alpha');
  const importing=h.api.importProgress({text:()=>pending.promise});
  await h.api.select('beta');
  pending.resolve(JSON.stringify(backup('alpha')));
  assert.equal(await importing,false);
  assert.equal(h.store.has(key('alpha')),false);
  assert.equal(h.store.has(key('beta')),false);
  assert.equal(h.api.snapshot().id,'beta');
});
