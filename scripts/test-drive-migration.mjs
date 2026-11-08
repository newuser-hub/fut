import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  ACTIVE_POINTER, READY_MARKER, digest, prepareGeneration,
  validateGeneration, promoteGeneration, recoverGeneration, readActivePointer
} from '../lib/drive-migration.js';
import {
  PREMIER_LEAGUE_COVER, authorizeSource, downloadImage, boundedImage
} from './migrate-drive.mjs';

const h=data=>createHash('sha256').update(data).digest('hex');
const photo1=Buffer.alloc(1800,0x51);
const photo2=Buffer.alloc(2100,0x52);
const photo3=Buffer.alloc(1600,0x53);
const cover1=Buffer.alloc(1900,0x54);
const cover2=Buffer.alloc(1850,0x55);

function source() {
  const entries=[
    {id:'album-alpha',title:'A',status:'active',count:3,sections:1,
      cover:'https://www.cromos.pt/covers/album-a.jpg'},
    {id:'album-beta',title:'B',status:'active',count:1,sections:1,
      cover:PREMIER_LEAGUE_COVER}
  ];
  // A capa exata do Blogger só é autorizada para o slug real.
  entries[1].id='premier-league-flagship-2026-27';
  const catA={
    id:'album-alpha',sections:[{name:'Team'}],
    cards:[
      {id:'album-alpha-1',number:'1',originalNumber:'1',available:true,
       image:'https://www.cromos.pt/cards/alpha-1.jpg',sha256:h(photo1),
       bytes:photo1.length},
      {id:'album-alpha-2',number:'2',originalNumber:'2',available:true,
       image:'https://www.cromos.pt/cards/alpha-2.jpg',sha256:null,bytes:0,
       imageKind:'official-preview-link'},
      {id:'album-alpha-3',number:'3',originalNumber:'3',
       available:false,image:null,sha256:null,bytes:0}
    ]
  };
  const slug=entries[1].id;
  const catB={
    id:slug,sections:[{name:'Team'}],
    cards:[{id:slug+'-4',number:'4',originalNumber:'4',available:true,
      image:'https://images.topps.com/cards/flagship.jpg',sha256:h(photo3),
      bytes:photo3.length}]
  };
  return {library:entries,plan:{version:1,goal:2,collections:[]},
    catalogs:{'album-alpha':catA,[slug]:catB}};
}

class MemoryDrive {
  constructor(){
    this.folder={catalog:'test-catalog-root',images:'test-images-root'};
    this.sequence=0;
    this.files=new Map();
    this.byId=new Map();
    this.fetchCalls=[];
    this.writes=[];
    this.network=new Map([
      ['https://www.cromos.pt/cards/alpha-1.jpg',photo1],
      ['https://www.cromos.pt/cards/alpha-2.jpg',photo2],
      ['https://images.topps.com/cards/flagship.jpg',photo3],
      ['https://www.cromos.pt/covers/album-a.jpg',cover1],
      [PREMIER_LEAGUE_COVER,cover2]
    ]);
    this.failOnce=null;
  }

  key(folder,name){return folder+'::'+name;}
  makeId(){return 'synthetic-drive-id-'+(++this.sequence);}
  ensureFolder=async(folder,name)=>{
    const key=this.key(folder,name);
    if(this.files.has(key)){
      const value=this.files.get(key);
      if(value.mimeType!=='application/vnd.google-apps.folder')
        throw Error('Pasta em conflito');
      return value.id;
    }
    const ref={id:this.makeId(),mimeType:'application/vnd.google-apps.folder',
      bytes:Buffer.alloc(0)};
    this.files.set(key,ref);this.byId.set(ref.id,ref);
    this.writes.push({folder,name,type:'folder'});
    return ref.id;
  };

  findFile=async(folder,name,{optional=false}={})=>{
    const f=this.files.get(this.key(folder,name));
    if(!f){if(optional)return null;throw Error('FileNotFound');}
    return {id:f.id,name,mimeType:f.mimeType,size:f.bytes.length};
  };

  putFile=async(folder,name,bytes,mimeType)=>{
    if(this.failOnce&&this.failOnce.name===name){
      const error=this.failOnce.error;
      this.failOnce=null;
      throw error;
    }
    const key=this.key(folder,name);
    let file=this.files.get(key);
    if(!file){
      file={id:this.makeId(),mimeType,bytes:Buffer.from(bytes)};
      this.files.set(key,file);this.byId.set(file.id,file);
    }else{
      file.bytes=Buffer.from(bytes);
      file.mimeType=mimeType;
    }
    this.writes.push({folder,name,type:'file'});
    return {id:file.id};
  };

  readRawFile=async(id,max=3000000)=>{
    const file=this.byId.get(id);
    if(!file)throw Error('Drive file removed');
    if(file.bytes.length>max)throw Error('Limite de bytes');
    return {bytes:Buffer.from(file.bytes),mime:file.mimeType};
  };

  readImage=async(id,expected)=>{
    if(!/^[a-f0-9]{64}$/i.test(expected||''))
      throw Error('Sem hash');
    const {bytes,mime}=await this.readRawFile(id,6000000);
    if(h(bytes)!==expected.toLowerCase())
      throw Error('SHA-256 divergente');
    if(!mime.startsWith('image/'))throw Error('MIME divergente');
    return {bytes,mime,sha256:h(bytes)};
  };

  readJson=async(folder,name)=>{
    const file=await this.findFile(folder,name);
    const raw=await this.readRawFile(file.id);
    return JSON.parse(raw.bytes.toString('utf8'));
  };

  fetchImage=async(url,context)=>{
    this.fetchCalls.push({url,kind:context.kind,collection:context.collection});
    authorizeSource(url,context);
    const bytes=this.network.get(url);
    if(!bytes)throw Error('HTTP 404 da origem');
    return {bytes:Buffer.from(bytes),mime:'image/jpeg'};
  };

  corrupt(id){
    const file=this.byId.get(id);
    if(file)file.bytes=Buffer.alloc(file.bytes.length,0x75);
  }
  remove(id){
    const file=this.byId.get(id);
    if(!file)return;
    for(const [key,value] of this.files){
      if(value.id===id)this.files.delete(key);
    }
    this.byId.delete(id);
  }
  fileName(name){return [...this.files].filter(([key])=>key.endsWith('::'+name));}
}

test('exceção Blogger apenas para a capa exata da Premier League',()=>{
  assert.equal(authorizeSource(PREMIER_LEAGUE_COVER,{
    kind:'cover',collection:'premier-league-flagship-2026-27'
  }),PREMIER_LEAGUE_COVER);
  for(const ctx of [
    {kind:'card',collection:'premier-league-flagship-2026-27'},
    {kind:'cover',collection:'album-alpha'},
    {kind:'cover',collection:'premier-league-flagship-2026-27'}
  ]){
    const u=ctx.kind==='cover'&&ctx.collection==='premier-league-flagship-2026-27'?
      PREMIER_LEAGUE_COVER+'?extra=1':PREMIER_LEAGUE_COVER;
    assert.throws(()=>authorizeSource(u,ctx),/Host ou caminho/);
  }
  assert.throws(()=>authorizeSource('http://www.cromos.pt/test.jpg',
    {kind:'card',collection:'album-alpha'}),/URL de origem/);
  assert.throws(()=>authorizeSource('https://127.0.0.1/private',
    {kind:'card',collection:'album-alpha'}),/Host ou caminho/);
});

test('download usa GET com limites, hash e não segue redirect externo',async()=>{
  const fake=async(u)=>new Response(photo1,{
    status:200,headers:{'Content-Type':'image/jpeg'}
  });
  const result=await downloadImage('https://www.cromos.pt/cards/alpha-1.jpg',
    {kind:'card',collection:'album-alpha'},{fetcher:fake,retries:0});
  assert.equal(result.sha256,h(photo1));
  assert.equal(result.bytes.length,photo1.length);
  const redirect=async()=>new Response(null,{
    status:302,headers:{Location:'https://evil.example/file.jpg'}
  });
  await assert.rejects(()=>downloadImage('https://www.cromos.pt/cards/alpha-1.jpg',
    {kind:'card',collection:'album-alpha'},{fetcher:redirect,retries:0}),
    /Host ou caminho/);
  const big=async()=>new Response(photo1,{
    status:200,headers:{'Content-Type':'image/jpeg','Content-Length':'999999999'}
  });
  await assert.rejects(()=>downloadImage('https://www.cromos.pt/cards/alpha-1.jpg',
    {kind:'card',collection:'album-alpha'},{fetcher:big,retries:0}),
    /content-length/);
  const oversized=new Response(Buffer.alloc(6_000_001),{
    headers:{'Content-Type':'image/jpeg'}
  });
  await assert.rejects(()=>boundedImage(oversized),/limite de leitura/);
});

test('preparação, validação e promoção completa: apenas o pointer fica ativo',async()=>{
  const store=new MemoryDrive();
  const src=source();
  await store.putFile(store.folder.catalog,'library.json',
    Buffer.from(JSON.stringify({previous:'legacy-root-catalog'})),'application/json');
  const result=await prepareGeneration({store,source:src,generation:'stage-a'});
  assert.equal(result.state,'prepared');
  assert.equal(result.count,2);
  assert.equal(await readActivePointer(store),null);
  assert.deepEqual(await store.readJson(store.folder.catalog,'library.json'),
    {previous:'legacy-root-catalog'});
  const stage=await store.findFile(store.folder.catalog,'fut-stage-stage-a');
  const prepared=await store.readJson(stage.id,'album-alpha.json');
  assert.equal(prepared.cards[0].id,src.catalogs['album-alpha'].cards[0].id);
  assert.equal(prepared.cards[0].originalNumber,'1');
  assert.equal(prepared.cards[1].sha256,h(photo2));
  assert.equal(prepared.cards[1].bytes,photo2.length);
  assert.equal(prepared.cards[1].imageKind,'official-preview');
  assert.equal(prepared.cards[2].driveFileId,undefined);
  const validation=await validateGeneration({store,generation:'stage-a'});
  assert.equal(validation.state,'validated');
  assert.equal(validation.imagesValidated,5); // 3 cromos + 2 capas
  await assert.rejects(()=>promoteGeneration({
    store,generation:'stage-a',expectedActive:'unexpected'
  }),/Geração ativa mudou/);
  assert.equal(await readActivePointer(store),null);
  const promoted=await promoteGeneration({
    store,generation:'stage-a',expectedActive:null
  });
  assert.equal(promoted.state,'promoted');
  const active=await readActivePointer(store);
  assert.equal(active.generation,'stage-a');
  assert.equal(active.catalogCount,2);
  assert.equal(active.totalCards,4);
  assert(active.catalogSha256['album-alpha']);
  assert.deepEqual(await store.readJson(store.folder.catalog,'library.json'),
    {previous:'legacy-root-catalog'});
  assert(!store.writes.some(w=>w.folder===store.folder.catalog&&
    w.name==='album-alpha.json'),'Não gravar catálogo ativo na raiz');
  assert.equal((await promoteGeneration({
    store,generation:'stage-a',expectedActive:null})).state,'already-active');
  assert.equal((await recoverGeneration({
    store,source:src,generation:'stage-a'})).state,'already-active');
  const writes=store.writes.length;
  assert.equal((await prepareGeneration({
    store,source:src,generation:'stage-a'})).alreadyReady,true);
  assert.equal(store.writes.length,writes,'Geração selada não pode ser reescrita');
});

test('interrupção e retoma: não publica checkpoint parcial na raiz',async()=>{
  const store=new MemoryDrive(),src=source();
  store.failOnce={name:'album-alpha-2.jpg',error:Error('interrupted')};
  await assert.rejects(()=>prepareGeneration({
    store,source:src,generation:'stage-stop',checkpointEvery:2
  }),/interrupted/);
  assert.equal(await readActivePointer(store),null);
  const stage=await store.findFile(store.folder.catalog,'fut-stage-stage-stop');
  const checkpoint=await store.readJson(stage.id,'fut-checkpoint-album-alpha.json');
  assert(checkpoint.cards['album-alpha-1']);
  const before=store.fetchCalls.length;
  const result=await recoverGeneration({
    store,source:src,generation:'stage-stop',checkpointEvery:2
  });
  assert.equal(result.state,'prepared');
  const newCalls=store.fetchCalls.slice(before);
  assert(!newCalls.some(x=>x.url.endsWith('/alpha-1.jpg')),
    'Imagem validada não deve ser descarregada novamente');
  assert.equal(await readActivePointer(store),null);
  const valid=await validateGeneration({store,generation:'stage-stop'});
  assert.equal(valid.imagesValidated,5);
  assert.equal((await recoverGeneration({
    store,source:src,generation:'stage-stop'})).state,
    'ready-for-promotion');
});

test('ficheiro Drive removido ou hash alterado no checkpoint é descarregado de novo',async()=>{
  for(const mode of ['removed','corrupt']){
    const store=new MemoryDrive(),src=source();
    store.failOnce={name:'album-alpha-2.jpg',error:Error('interrupted')};
    await assert.rejects(()=>prepareGeneration({
      store,source:src,generation:'stage-'+mode,checkpointEvery:1
    }),/interrupted/);
    const stage=await store.findFile(store.folder.catalog,'fut-stage-stage-'+mode);
    const cp=await store.readJson(stage.id,'fut-checkpoint-album-alpha.json');
    const id=cp.cards['album-alpha-1'].driveFileId;
    if(mode==='removed')store.remove(id);
    else store.corrupt(id);
    const calls=store.fetchCalls.length;
    const status=await recoverGeneration({
      store,source:src,generation:'stage-'+mode
    });
    assert.equal(status.state,'prepared');
    assert(store.fetchCalls.slice(calls).some(x=>x.url.endsWith('/alpha-1.jpg')),
      'Imagem apagada ou corrompida deve ser obtida novamente');
    assert.equal((await validateGeneration({store,
      generation:'stage-'+mode})).imagesValidated,5);
    assert.equal(await readActivePointer(store),null);
  }
});

test('catálogo incompleto, imagem sem hash ou imagem alterada impedem promoção',async()=>{
  const store=new MemoryDrive(),src=source();
  await prepareGeneration({store,source:src,generation:'stage-incomplete'});
  const stage=await store.findFile(store.folder.catalog,
    'fut-stage-stage-incomplete');
  const file=await store.findFile(stage.id,'album-alpha.json');
  const staged=await store.readJson(stage.id,'album-alpha.json');
  const imageId=staged.cards[0].driveFileId;
  store.corrupt(imageId);
  await assert.rejects(()=>validateGeneration({
    store,generation:'stage-incomplete'}),/SHA-256/);
  await assert.rejects(()=>promoteGeneration({
    store,generation:'stage-incomplete',expectedActive:null
  }),/SHA-256/);
  assert.equal(await readActivePointer(store),null);
  // Restaurar a imagem, mas danificar a estrutura de catálogo.
  const driveImage=store.byId.get(imageId);
  driveImage.bytes=Buffer.from(photo1);
  staged.cards.pop();
  store.byId.get(file.id).bytes=Buffer.from(JSON.stringify(staged));
  await assert.rejects(()=>validateGeneration({
    store,generation:'stage-incomplete'}),/Catálogo incompleto/);
  assert.equal(await readActivePointer(store),null);
});

test('origem com hash errado nunca entra no Drive nem atualiza ponteiro',async()=>{
  const store=new MemoryDrive(),src=source();
  src.catalogs['album-alpha'].cards[0].sha256='a'.repeat(64);
  await assert.rejects(()=>prepareGeneration({
    store,source:src,generation:'stage-wrong'
  }),/SHA-256 da origem diverge/);
  assert.equal(await readActivePointer(store),null);
  assert.equal(store.fileName(READY_MARKER).length,0);
});

test('gênero parcial não promove; retoma completa e só depois troca snapshot',async()=>{
  const store=new MemoryDrive(),src=source();
  const partial=await prepareGeneration({
    store,source:src,generation:'stage-partial',onlySlug:'album-alpha'
  });
  assert.equal(partial.promotable,false);
  await assert.rejects(()=>validateGeneration({
    store,generation:'stage-partial'}),/não está preparada/);
  await assert.rejects(()=>promoteGeneration({
    store,generation:'stage-partial',expectedActive:null
  }),/não está preparada/);
  assert.equal(await readActivePointer(store),null);
  await recoverGeneration({store,source:src,generation:'stage-partial'});
  const result=await promoteGeneration({
    store,generation:'stage-partial',expectedActive:null
  });
  assert.equal(result.state,'promoted');
});

test('alterações de origem invalidam checkpoint e impedem reuso cego',async()=>{
  const store=new MemoryDrive(),src=source();
  store.failOnce={name:'album-alpha-2.jpg',error:Error('interrupted')};
  await assert.rejects(()=>prepareGeneration({
    store,source:src,generation:'stage-source-diff'
  }),/interrupted/);
  src.catalogs['album-alpha'].cards[0].name='different source';
  await assert.rejects(()=>recoverGeneration({
    store,source:src,generation:'stage-source-diff'
  }),/Checkpoint com origem diferente/);
  assert.equal(await readActivePointer(store),null);
});

test('não existe migração de dados nem ativação do backend no processo de testes',()=>{
  assert.notEqual(process.env.FUT_STORAGE_BACKEND,'drive');
  assert.equal(typeof ACTIVE_POINTER,'string');
  assert.equal(typeof READY_MARKER,'string');
});

test('preview sem hash inicial: a retoma deteta conteúdo alterado na origem',async()=>{
  const store=new MemoryDrive(),src=source();
  store.failOnce={name:'_cover.jpg',error:Error('interrupted after cards')};
  await assert.rejects(()=>prepareGeneration({
    store,source:src,generation:'stage-preview-changed',checkpointEvery:2
  }),/interrupted/);
  const newPhoto=Buffer.alloc(2050,0x64);
  store.network.set('https://www.cromos.pt/cards/alpha-2.jpg',newPhoto);
  const result=await recoverGeneration({
    store,source:src,generation:'stage-preview-changed'
  });
  assert.equal(result.state,'prepared');
  const stage=await store.findFile(store.folder.catalog,
    'fut-stage-stage-preview-changed');
  const cat=await store.readJson(stage.id,'album-alpha.json');
  assert.equal(cat.cards[1].sha256,h(newPhoto));
  assert.equal(cat.cards[1].bytes,newPhoto.length);
  assert.equal((await validateGeneration({
    store,generation:'stage-preview-changed'})).imagesValidated,5);
  assert.equal(await readActivePointer(store),null);
});

test('capa sem hash inicial: URL novo não reutiliza bytes antigos de staging',async()=>{
  const store=new MemoryDrive(),src=source();
  store.failOnce={name:'premier-league-flagship-2026-27-4.jpg',
    error:Error('interrupted after first cover')};
  await assert.rejects(()=>prepareGeneration({
    store,source:src,generation:'stage-cover-changed',checkpointEvery:1
  }),/interrupted/);
  const newCover=Buffer.alloc(2050,0x72);
  store.network.set('https://www.cromos.pt/covers/album-a.jpg',newCover);
  const result=await recoverGeneration({
    store,source:src,generation:'stage-cover-changed'
  });
  assert.equal(result.state,'prepared');
  const stage=await store.findFile(store.folder.catalog,
    'fut-stage-stage-cover-changed');
  const lib=await store.readJson(stage.id,'library.json');
  assert.equal(lib[0].coverSha256,h(newCover));
  assert.equal((await validateGeneration({
    store,generation:'stage-cover-changed'})).imagesValidated,5);
});

test('geração já ativa nunca reabre staging se marcador ready desaparecer',async()=>{
  const store=new MemoryDrive(),src=source();
  await prepareGeneration({store,source:src,generation:'stage-immutable'});
  await promoteGeneration({store,generation:'stage-immutable',expectedActive:null});
  const stage=await store.findFile(store.folder.catalog,'fut-stage-stage-immutable');
  const marker=await store.findFile(stage.id,READY_MARKER);
  store.remove(marker.id);
  const count=store.writes.length;
  await assert.rejects(()=>prepareGeneration({
    store,source:src,generation:'stage-immutable'
  }),/Geração ativa é imutável/);
  assert.equal(store.writes.length,count,
    'A ausência do marcador não pode alterar geração ativa');
});
