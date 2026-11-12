#!/usr/bin/env node
// Verificação limitada a GET sem Authorization. Nunca enviar credenciais.
// Não seguir redirects nem guardar conteúdos privados das respostas.
const base = 'https://fut-rosy.vercel.app';
const paths = [
  '/', '/index.html', '/favicon.svg',
  '/library.json', '/expansion-plan.json',
  '/data/euro-2004.json', '/data/ligue-1-foot-2025-26.json',
  '/api/storage?kind=library', '/api/storage?kind=plan',
  '/api/storage?kind=catalog&id=euro-2004',
  '/api/storage?kind=status'
];
const results = [];
for(const path of paths) {
  const observation = { path, method:'GET', status:null, basicChallenge:false,
    noStore:false, verdict:'pending' };
  try {
    const response = await fetch(base+path, {
      method:'GET', redirect:'manual',
      signal:AbortSignal.timeout(12000),
      headers:{'Accept':'*/*'}
    });
    observation.status=response.status;
    const challenge=response.headers.get('www-authenticate')||'';
    const cache=response.headers.get('cache-control')||'';
    observation.basicChallenge=/^Basic\b/i.test(challenge);
    observation.noStore=/\bno-store\b/i.test(cache);
    if(response.status===401 && observation.basicChallenge && observation.noStore)
      observation.verdict='unauthorized_blocked';
    else if(response.status>=200 && response.status<300)
      observation.verdict='potential_unprotected_content';
    else
      observation.verdict='pending';
    try { await response.body?.cancel(); } catch {}
  } catch {
    observation.verdict='pending_network';
  }
  results.push(observation);
  console.log('PRODUCTION_READONLY_RESULT_JSON='+JSON.stringify(observation));
}
const counts=Object.fromEntries([...new Set(results.map(x=>x.verdict))]
  .map(k=>[k,results.filter(x=>x.verdict===k).length]));
console.log('PRODUCTION_READONLY_SUMMARY_JSON='+JSON.stringify({
  base, withoutCredentials:true, method:'GET', checked:results.length,counts,
  authenticatedProductionTests:'pending_by_design'
}));
if(counts.potential_unprotected_content)process.exitCode=1;
