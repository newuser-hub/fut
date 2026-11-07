import { gunzipSync } from 'node:zlib';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const jobs = [
  ['index.html.gz','public/index.html'],
  ['club-world-cup-2025.json.gz','public/data/club-world-cup-2025.json'],
  ['euro-2004.json.gz','public/data/euro-2004.json']
];
mkdirSync('public/data', {recursive:true});
for (const [name, output] of jobs) {
  const parts=readdirSync('archives').filter(p=>p.startsWith(name+'.part')).sort();
  if (!parts.length) throw new Error('Missing archive: '+name);
  const compressed=Buffer.concat(parts.map(p=>readFileSync('archives/'+p)));
  const data=gunzipSync(compressed);
  writeFileSync(output,data);
  console.log(output+': '+data.length+' bytes from '+parts.length+' verified archive parts');
}
