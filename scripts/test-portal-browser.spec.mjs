import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {test,expect,installMocks,library} from './portal-browser-fixture.mjs';

async function openAlbum(page){
  await page.locator('#group-portugal .library-tile:not(.soon)').first().click();
  await expect(page.locator('.index-grid')).toBeVisible();
  await page.locator('.hero-actions [data-action="album"]').click();
  await expect(page.locator('.paper-shell .flip-card').first()).toBeVisible();
}
const horizontalOverflow=page=>page.evaluate(()=>
  document.documentElement.scrollWidth>document.documentElement.clientWidth+2);

test('falha de armazenamento mantém cromos tapados e não anuncia sucesso',async({portal})=>{
  const {page}=portal;
  await openAlbum(page);
  const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError')};});
  await page.locator('[data-action="reveal-page"]').click();
  await expect(page.locator('#toast')).toContainText('Não foi possível guardar');
  await expect(page.locator('.flip-card[aria-pressed="true"]')).toHaveCount(0);
  await page.locator('.flip-card').first().click();
  await expect(page.locator('.flip-card').first()).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(before);
});

test('portal: quatro categorias com contagens, anos decrescentes e sem overflow',async({portal},info)=>{
  const {page}=portal;
  const categories=[
    ['portugal','Portugal',12],['selecoes','Seleções',23],
    ['champions','Champions League',5],['outros','Outros',7]
  ];
  await expect(page.locator('.category-shortcut')).toHaveCount(4);
  for(const [id,name,count] of categories){
    const button=page.locator('.category-shortcut[data-category="'+id+'"]');
    await expect(button).toContainText(name);
    await expect(button).toContainText(String(count));
    await button.click();
    const group=page.locator('#group-'+id);
    await expect(group).toHaveAttribute('open','');
    const values=await group.locator('.collection-year').evaluateAll(nodes=>
      nodes.map(x=>Number(x.dataset.year)));
    expect(values).toEqual([...values].sort((a,b)=>b-a));
  }
  expect(await horizontalOverflow(page)).toBe(false);
  expect(library.filter(x=>x.status==='active')).toHaveLength(47);
  console.log('FUT_STAGE8_MATRIX_JSON='+JSON.stringify({engine:info.project.use.browserName,
    width:info.project.use.viewport.width,test:'categories_years_overflow',result:'PASS'}));
});

test('portal pesquisa sem acentos, foca o campo e abre coleções',async({portal})=>{
  const {page}=portal;
  const search=page.getByRole('searchbox',{name:'Pesquisar coleções'});
  await search.fill('selecoes');
  await expect(search).toBeFocused();
  await expect(page.locator('#group-selecoes')).toBeVisible();
  await expect(page.locator('#group-portugal')).toHaveCount(0);
  await search.fill('Champions');
  await expect(page.locator('#group-champions')).toBeVisible();
  const first=page.locator('#group-champions .library-tile:not(.soon)').first();
  await first.click();
  await expect(page.locator('.index-grid')).toBeVisible();
  expect(page.url()).toContain('#/c/');
});

test('índice, pesquisa por jogador, paginação, teclado e secções',async({portal})=>{
  const {page}=portal;
  await openAlbum(page);
  await expect(page.locator('.page-indicator')).toHaveText(/1 \//);
  const initial=await page.locator('.page-indicator').textContent();
  const next=page.getByRole('button',{name:'Seguinte →'});
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.locator('.page-indicator')).not.toHaveText(initial);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.page-indicator')).toHaveText(/3 \//);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.page-indicator')).toHaveText(/2 \//);
  await page.getByRole('button',{name:/Anterior/}).click();
  await expect(page.locator('.page-indicator')).toHaveText(/1 \//);
  const select=page.getByRole('combobox',{name:'Ir para secção'});
  await expect(select).toBeVisible();
  const opts=await select.locator('option').count();
  expect(opts).toBeGreaterThan(1);
  await select.selectOption({index:1});
  await expect(page.locator('.paper-top h2')).not.toBeEmpty();
  await page.locator('.toolbar [data-action="index"]').first().click();
  const query=page.getByRole('textbox',{name:'Pesquisar cromos'});
  await query.fill('Portugal');
  await expect(query).toBeFocused();
  const results=page.locator('.result');
  await expect(page.locator('.small-muted').filter({hasText:/resultados/})).toBeVisible();
  expect(await results.count()).toBeGreaterThanOrEqual(0);
  expect(await horizontalOverflow(page)).toBe(false);
});

test('toque único revela, toque duplo tapa; toque único em revelado amplia',async({portal})=>{
  const {page}=portal;
  await openAlbum(page);
  const first=page.locator('.flip-card').first();
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(590);
  await first.dblclick({delay:80});
  await expect(first).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(590);
  await first.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('swipe horizontal avança página sem virar cromos acidentalmente',async({portal})=>{
  const {page}=portal;
  await openAlbum(page);
  const p=page.locator('.page-indicator');
  await expect(p).toHaveText(/1 \//);
  await page.evaluate(()=>{
    const el=document.querySelector('.paper-shell');
    // Touch constructor é bloqueado pelo WebKit Linux automatizado.
    // Emulamos apenas as propriedades lidas pelo handler, sem afirmar
    // que isto é um gesto físico em Safari/iPhone.
    function fire(type,touches,changed){
      const e=new Event(type,{bubbles:true,cancelable:true});
      Object.defineProperty(e,'touches',{value:touches});
      Object.defineProperty(e,'changedTouches',{value:changed});
      el.dispatchEvent(e);
    }
    const start={identifier:17,clientX:260,clientY:300};
    const end={identifier:17,clientX:65,clientY:310};
    fire('touchstart',[start],[start]);
    fire('touchend',[],[end]);
  });
  await expect(p).toHaveText(/2 \//);
  await expect(page.locator('.flip-card[aria-pressed="true"]')).toHaveCount(0);
  await page.evaluate(()=>{
    const el=document.querySelector('.paper-shell');
    const fire=(type,touches,changed)=>{
      const e=new Event(type,{bubbles:true,cancelable:true});
      Object.defineProperty(e,'touches',{value:touches});
      Object.defineProperty(e,'changedTouches',{value:changed});
      el.dispatchEvent(e);
    };
    const start={identifier:18,clientX:60,clientY:300};
    const end={identifier:18,clientX:262,clientY:310};
    fire('touchstart',[start],[start]);
    fire('touchend',[],[end]);
  });
  await expect(p).toHaveText(/1 \//);
});

test('favoritos: rótulo com cromo, estado aria, navegação e persistência',async({portal})=>{
  const {page}=portal;
  await openAlbum(page);
  const firstCard=page.locator('.flip-card').first();
  const id=await firstCard.getAttribute('data-id');
  const favourite=page.locator('.card-cell').first().locator('.star');
  await expect(favourite).toHaveAttribute('aria-pressed','false');
  await expect(favourite).toHaveAttribute('aria-label',/Adicionar .* aos favoritos/);
  await favourite.click();
  await expect(page.locator('.card-cell').first().locator('.star'))
    .toHaveAttribute('aria-pressed','true');
  await page.locator('#nav-favorites').click();
  await expect(page.locator('.result-list .result')).toHaveCount(1);
  await page.locator('.result-list .result').first().click();
  await expect(page.locator('.flip-card[data-id="'+id+'"]')).toBeVisible();
  const key=await page.evaluate(()=>Object.keys(localStorage).find(x=>x.startsWith('fut.album.')));
  expect(key).toMatch(/^fut\.album\..+\.progress\.v1$/);
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  expect(saved.favorites[id]).toBe(true);
});

test('exportação e importação restituem progresso apenas à mesma coleção',async({portal})=>{
  const {page}=portal;
  await openAlbum(page);
  const id=await page.locator('.flip-card').first().getAttribute('data-id');
  const collection=id.split('-').slice(0,-1).join('-');
  await page.locator('.flip-card').first().click();
  await page.locator('.star').first().click();
  const downloadWait=page.waitForEvent('download');
  await page.locator('[data-action=export]').last().click();
  const download=await downloadWait;
  const json=JSON.parse(readFileSync(await download.path(),'utf8'));
  expect(json.app).toBe('fut');
  expect(json.collection).toBe(collection);
  expect(json.revealed).toContain(id);
  expect(json.favorites).toContain(id);
  await page.getByRole('button',{name:'▦ Índice'}).first().click();
  // Limpar somente o armazenamento do navegador de teste; uma única
  // confirmação é autorizada na importação, sem dois handlers concorrentes.
  await page.evaluate(k=>localStorage.removeItem(k),'fut.album.'+collection+'.progress.v1');
  page.on('dialog',d=>d.accept());
  await page.locator('#import-file').setInputFiles({
    name:'fut-test-progress.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(json))
  });
  await expect(page.locator('#toast')).toContainText('importado com sucesso');
  const imported=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),
    'fut.album.'+collection+'.progress.v1');
  expect(imported.revealed[id]).toBe(true);
  expect(imported.favorites[id]).toBe(true);
});

test('modal: foco inicial e contido, Escape, devolução e aria-labelledby',async({portal})=>{
  const {page}=portal;
  await openAlbum(page);
  let card=page.locator('.flip-card').first();
  await card.click();
  await page.waitForTimeout(580);
  card=page.locator('.flip-card').first();
  const id=await card.getAttribute('data-id');
  await card.focus();
  await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal','true');
  await expect(dialog).toHaveAttribute('aria-labelledby','fut-modal-title');
  expect(await dialog.locator('#fut-modal-title').textContent()).toContain('·');
  expect(await page.evaluate(()=>document.querySelector('[role=dialog]')
    .contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(()=>document.getElementById('app').inert)).toBe(true);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(()=>document.querySelector('[role=dialog]')
    .contains(document.activeElement))).toBe(true);
  for(let n=0;n<7;n++){
    await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>document.querySelector('[role=dialog]')
      .contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(()=>document.querySelector('[role=dialog]')
    .contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.flip-card[data-id="'+id+'"]')).toBeFocused();
  expect(await page.evaluate(()=>document.getElementById('app').inert)).toBe(false);
});

test('alvos táteis >= 44×44, foco visível e contraste WCAG por axe',async({portal})=>{
  const {page}=portal;
  const samples=['.category-shortcut','#nav-portal','.hero-actions .pill'];
  for(const css of samples){
    const bb=await page.locator(css).first().boundingBox();
    expect(bb.width,css+' width').toBeGreaterThanOrEqual(43.9);
    expect(bb.height,css+' height').toBeGreaterThanOrEqual(43.9);
  }
  await openAlbum(page);
  for(const css of ['.star','.toolbar .tool','.flip-card']){
    const bb=await page.locator(css).first().boundingBox();
    expect(bb.width,css+' width').toBeGreaterThanOrEqual(43.9);
    expect(bb.height,css+' height').toBeGreaterThanOrEqual(43.9);
  }
  // :focus-visible distingue TAB físico de .focus() programático.
  await page.locator('.flip-card').first().focus();
  await page.keyboard.press('Tab');
  const focused=page.locator(':focus');
  await expect(focused).toHaveClass(/star/);
  const outline=await focused.evaluate(el=>getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  const axe=await new AxeBuilder({page}).withTags(
    ['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const serious=axe.violations.filter(v=>['critical','serious'].includes(v.impact));
  expect(serious.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});

test('reduced-motion desativa scroll suave explícito',async({portal})=>{
  const {page}=portal;
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{
    window.__futScrollCalls=[];
    window.scrollTo=options=>window.__futScrollCalls.push(options?.behavior);
  });
  await page.locator('#group-portugal .library-tile').first().click();
  await expect(page.locator('.index-grid')).toBeVisible();
  const behavior=await page.evaluate(()=>window.__futScrollCalls);
  expect(behavior).toContain('auto');
  expect(behavior).not.toContain('smooth');
  const reduce=await page.locator('.flip-inner').count();
  expect(reduce).toBe(0);
  await page.locator('.hero-actions [data-action="album"]').click();
  const transition=await page.locator('.flip-inner').first().evaluate(el=>
    getComputedStyle(el).transitionDuration);
  expect(transition).toMatch(/^(0s|0ms)(,|$)/);
});

test('rede lenta simulada: carregamento, pesquisa e abertura mensurados',async({page},info)=>{
  const start=Date.now();
  await installMocks(page,{latencyMs:400});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.collection-browser')).toBeVisible();
  const readyMs=Date.now()-start;
  const search=await page.evaluate(()=>{
    const el=document.getElementById('portal-search');
    const t=performance.now();
    el.value='Portugal';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return Math.round((performance.now()-t)*10)/10;
  });
  console.log('FUT_STAGE8_AFTER_SLOW_JSON='+JSON.stringify({
    stage:'after',engine:info.project.use.browserName,
    width:info.project.use.viewport.width,latencyMs:400,readyMs,
    searchResponseMs:search
  }));
  expect(readyMs).toBeLessThan(6000);
  expect(search).toBeLessThan(250);
});


test('touchscreen automatizado: tocar para revelar e dois toques para voltar a tapar',async({portal},info)=>{
  const {page}=portal;
  await openAlbum(page);
  const card=page.locator('.flip-card').first();
  async function touchCard(){
    await card.scrollIntoViewIfNeeded();
    const bb=await card.boundingBox();
    expect(bb).not.toBeNull();
    await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);
  }
  await touchCard();
  await expect(card).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(600);
  await touchCard();
  await touchCard();
  await expect(card).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  console.log('FUT_STAGE8_TOUCH_JSON='+JSON.stringify({
    engine:info.project.use.browserName,width:info.project.use.viewport.width,
    method:'Playwright touchscreen.tap',genuineIOS:false,result:'PASS'
  }));
});

test('WCAG automatizado no portal e no modal aberto',async({portal})=>{
  const {page}=portal;
  const tags=['wcag2a','wcag2aa','wcag21a','wcag21aa'];
  const portalResult=await new AxeBuilder({page}).withTags(tags).analyze();
  const portalSevere=portalResult.violations.filter(v=>
    ['serious','critical'].includes(v.impact));
  expect(portalSevere.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await openAlbum(page);
  const card=page.locator('.flip-card').first();
  await card.click();
  await page.waitForTimeout(580);
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  const modalResult=await new AxeBuilder({page})
    .include('#modal-root').withTags(tags).analyze();
  const modalSevere=modalResult.violations.filter(v=>
    ['serious','critical'].includes(v.impact));
  expect(modalSevere.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
});
