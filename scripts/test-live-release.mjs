// Runs only as an operator-invoked build probe in the existing Vercel project.
// Secrets stay in memory. Never expose headers, response bodies or fetch errors.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function trustedHost(host){
  return ['fut-rosy.vercel.app','fut-pjr-s-projects.vercel.app'].includes(host)||
    /^fut-[a-z0-9]+-pjr-s-projects\.vercel\.app$/.test(host);
}
export async function probe({hosts,sha,password,oidc,library,fetcher=fetch}){
  if(!password||!/^[a-f0-9]{40}$/.test(sha)||!hosts.length||hosts.some(h=>!trustedHost(h)))throw Error('CONFIG');
  const auth='Basic '+Buffer.from('fut:'+password).toString('base64');
  let checks=0;
  for(const host of hosts){
    const origin='https://'+host;
    const platform=oidc&&host!=='fut-rosy.vercel.app'&&host!=='fut-pjr-s-projects.vercel.app'
      ? {'x-vercel-trusted-oidc-idp-token':oidc}:{};
    const paths=['/','/library.json','/expansion-plan.json','/api/storage?kind=status',
      '/api/storage?kind=library','/api/storage?kind=plan',
      ...library.filter(x=>x.status==='active').flatMap(x=>['/data/'+x.id+'.json','/api/storage?kind=catalog&id='+x.id])];
    for(const path of paths){
      const url=origin+path;
      const anonymous=await fetcher(url,{redirect:'manual',headers:platform,signal:AbortSignal.timeout(15000)});
      if(anonymous.status!==401||!/^Basic realm="FUT - Cadernetas"/.test(anonymous.headers.get('www-authenticate')||''))throw Error('ANON');
      if(!/no-store/.test(anonymous.headers.get('cache-control')||''))throw Error('CACHE');
      await anonymous.body?.cancel();checks++;
      let current=url,response;
      for(let i=0;i<3;i++){
        response=await fetcher(current,{redirect:'manual',headers:{...platform,Authorization:auth},signal:AbortSignal.timeout(15000)});
        if(response.status!==307)break;
        const redirect=new URL(response.headers.get('location'),current);
        await response.body?.cancel();
        if(redirect.origin!==origin||redirect.username||redirect.password)throw Error('REDIRECT');
        current=redirect.href;
      }
      if(response.status!==200||response.headers.get('x-fut-commit')!==sha)throw Error('AUTH_OR_SHA');
      if(path==='/'){
        if(!(await response.text()).includes('fut.album.'))throw Error('HTML');
      }else{
        const data=await response.json();
        if(path.includes('kind=status')){if(data.backend!=='vercel'||!data.ready)throw Error('BACKEND');}
        else if(path.includes('library')){if(!Array.isArray(data)||data.length!==library.length)throw Error('LIBRARY');}
        else if(path.includes('plan')){if(!Array.isArray(data.collections))throw Error('PLAN');}
        else {
          const id=path.startsWith('/data/')?path.slice(6,-5):new URL(url).searchParams.get('id');
          const entry=library.find(x=>x.id===id);
          if(!entry||data.id!==id||data.cards?.length!==entry.count)throw Error('CATALOG');
        }
      }
      checks++;
    }
  }
  return {result:'PASS',sha,hosts,checks,authenticated:true,anonymous401:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const args=process.argv.slice(2),hosts=args.filter(x=>x.startsWith('--host=')).map(x=>x.slice(7));
  const sha=args.find(x=>x.startsWith('--sha='))?.slice(6);
  try{
    const result=await probe({hosts,sha,password:process.env.FUT_ALBUM_PASSWORD,
      oidc:process.env.VERCEL_OIDC_TOKEN,library:JSON.parse(readFileSync('public/library.json','utf8'))});
    console.log('FUT_LIVE_RELEASE='+JSON.stringify(result));
  }catch(error){
    const safeCodes=['CONFIG','ANON','CACHE','REDIRECT','AUTH_OR_SHA','HTML','BACKEND','LIBRARY','PLAN','CATALOG'];
    console.error('FUT_LIVE_RELEASE=FAIL code='+(safeCodes.includes(error.message)?error.message:'NETWORK_OR_CONTENT'));
    process.exitCode=1;
  }
}
