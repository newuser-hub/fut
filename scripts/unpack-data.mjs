import {gunzipSync} from 'node:zlib';
import {readdirSync,readFileSync,mkdirSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';

const jobs=[
 ['club-world-cup-2025.json.gz','public/data/club-world-cup-2025.json'],
 ['euro-2004.json.gz','public/data/euro-2004.json']
];
mkdirSync('public/data',{recursive:true});

function unpack(name,output){
 const parts=readdirSync('archives').filter(x=>x.startsWith(name+'.part')).sort();
 if(!parts.length)throw new Error('Missing archive: '+name);
 const bytes=gunzipSync(Buffer.concat(parts.map(x=>readFileSync('archives/'+x))));
 writeFileSync(output,bytes);
 console.log(output+': '+bytes.length+' bytes');
}

for(const [name,output] of jobs){
 if(!existsSync(output))unpack(name,output);
}

if(existsSync('src/index.html')){
 copyFileSync('src/index.html','public/index.html');
 console.log('public/index.html: copied from editable src/index.html');
}else{
 unpack('index.html.gz','public/index.html');
}

