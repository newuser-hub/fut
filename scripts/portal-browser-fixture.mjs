import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {test as base, expect} from '@playwright/test';

const root=resolve(process.cwd(),'public');
export const library=JSON.parse(readFileSync(resolve(root,'library.json'),'utf8'));
export const plan=JSON.parse(readFileSync(resolve(root,'expansion-plan.json'),'utf8'));
const catalogs=new Map();
const jsonContent=value=>({status:200,contentType:'application/json; charset=utf-8',
  headers:{'Cache-Control':'private, no-store'},body:JSON.stringify(value)});

export function getCatalog(id){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))throw Error('slug inválido');
  if(!catalogs.has(id)){
    catalogs.set(id,JSON.parse(readFileSync(resolve(root,'data',id+'.json'),'utf8')));
  }
  return catalogs.get(id);
}

export async function installMocks(page,{latencyMs=0}={}){
  const events=[];
  await page.route('**/*',async route=>{
    const req=route.request();
    const url=new URL(req.url());
    const local=url.hostname==='127.0.0.1';
    if(!local){
      // Fotos/capas externas nunca são requisitadas neste teste offline.
      if(req.resourceType()==='image')return route.abort('blockedbyclient');
      return route.abort('blockedbyclient');
    }
    if(url.pathname==='/api/storage'){
      if(latencyMs)await new Promise(r=>setTimeout(r,latencyMs));
      const kind=url.searchParams.get('kind');
      let body;
      if(kind==='library')body=library;
      else if(kind==='plan')body=plan;
      else if(kind==='catalog')body=getCatalog(url.searchParams.get('id'));
      else return route.fulfill({status:400,body:'bad request'});
      events.push({kind,status:200});
      return route.fulfill(jsonContent(body));
    }
    return route.continue();
  });
  return events;
}

export const test=base.extend({
  portal:async({page},use)=>{
    const events=await installMocks(page);
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('.collection-browser')).toBeVisible();
    await use({page,events});
  }
});
export {expect};
