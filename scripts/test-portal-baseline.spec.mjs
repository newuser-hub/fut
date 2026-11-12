import AxeBuilder from '@axe-core/playwright';
import {test,expect,installMocks,library} from './portal-browser-fixture.mjs';

test('BASELINE antes de qualquer alteração de UI: tempos, overflow, modal, foco, alvos e WCAG',async({page},testInfo)=>{
  const width=testInfo.project.use.viewport.width;
  const engine=testInfo.project.use.browserName;
  // Não usar o fixture portal para medir também o arranque frio.
  const findings={stage:'before',engine,width,environment:'browser-engine-automation',
    authenticDevice:false};
  const t0=Date.now();
  await installMocks(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.collection-browser')).toBeVisible();
  findings.portalReadyMs=Date.now()-t0;
  findings.categoryNames=await page.locator('.category-shortcut').allTextContents();
  findings.categories=await page.locator('.collection-group').count();
  findings.allLibraryRecords=library.length;
  findings.horizontalOverflow=await page.evaluate(()=>({
    doc:document.documentElement.scrollWidth,
    viewport:document.documentElement.clientWidth,
    overflowing:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
  }));
  findings.portalSearch=await page.evaluate(()=>{
    const el=document.getElementById('portal-search');
    const t=performance.now();
    el.value='Portugal';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return {durationMs:Math.round((performance.now()-t)*100)/100,
      visibleTiles:document.querySelectorAll('.library-tile:not(.soon)').length};
  });
  const search=page.locator('#portal-search');
  await expect(search).toBeFocused();
  await search.fill('');
  const button=page.locator('#group-portugal .library-tile').first();
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator('.index-grid')).toBeVisible();
  findings.collectionOpen=true;
  findings.cardSearch=await page.evaluate(()=>{
    const el=document.getElementById('search');
    const t=performance.now();
    el.value='Portugal';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return {durationMs:Math.round((performance.now()-t)*100)/100,
      resultCount:document.querySelectorAll('.result').length};
  });
  await page.locator('#search').fill('');
  await page.locator('[data-action=album]').last().click();
  await expect(page.locator('.flip-card').first()).toBeVisible();
  const star=page.locator('.star').first();
  findings.favoriteTarget=await star.boundingBox();
  await page.locator('.flip-card').first().click();
  await page.waitForTimeout(560);
  const flip=page.locator('.flip-card').first();
  await flip.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  findings.modalInitialFocus=await page.evaluate(()=>{
    const modal=document.querySelector('[role=dialog]');
    return {isInside:modal?.contains(document.activeElement),
      tag:document.activeElement?.tagName,
      label:document.activeElement?.getAttribute('aria-label')||null};
  });
  await page.keyboard.press('Tab');
  findings.modalTabContainsFocus=await page.evaluate(()=>
    document.querySelector('[role=dialog]')?.contains(document.activeElement));
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  findings.modalRestoredFocus=await page.evaluate(()=>
    document.activeElement?.matches?.('.flip-card')||false);
  const axe=new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']);
  const results=await axe.analyze();
  findings.axeViolations=results.violations.map(v=>({id:v.id,impact:v.impact,
    nodes:v.nodes.length,selectors:v.nodes.slice(0,3).map(n=>n.target.join(' '))}));
  console.log('FUT_STAGE8_BASELINE_JSON='+JSON.stringify(findings));
  await testInfo.attach('baseline.json',{body:JSON.stringify(findings,null,2),
    contentType:'application/json'});
});

test('BASELINE rede lenta: tempo de início e pesquisa depois de 400 ms por API',async({page},testInfo)=>{
  const latencyMs=400;
  const start=Date.now();
  await installMocks(page,{latencyMs});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.collection-browser')).toBeVisible();
  const boot=Date.now()-start;
  const data=await page.evaluate(()=>{
    const el=document.getElementById('portal-search'),t=performance.now();
    el.value='Champions';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return {durationMs:Math.round((performance.now()-t)*100)/100,
      matching:document.querySelectorAll('.library-tile:not(.soon)').length};
  });
  console.log('FUT_STAGE8_SLOW_BASELINE_JSON='+JSON.stringify({
    stage:'before',engine:testInfo.project.use.browserName,
    width:testInfo.project.use.viewport.width,latencyMs,bootMs:boot,search:data
  }));
});
