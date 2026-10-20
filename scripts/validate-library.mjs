#!/usr/bin/env node
import fs from 'node:fs';
const p=process.argv[2]||'public/library.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));const rows=d.games;if(!Array.isArray(rows))throw Error('games array missing');
const ids=new Set();const urlkeys=new Set();let broken=0;
for(const [i,g] of rows.entries()){
 if(!g.id||!g.name||!g.source||!g.mode||!g.cat) {console.error('Incomplete game at '+i);broken++;continue}
 if(ids.has(g.id)){console.error('Duplicate id '+g.id);broken++}ids.add(g.id);
 let u;try{u=new URL(g.url)}catch{console.error('Invalid URL '+g.id);broken++;continue}
 if(u.protocol!=='https:'||u.username||u.password){console.error('Unsafe URL '+g.id);broken++}
 const key=g.source==='playgama'?u.origin+u.pathname:u.href;
 if(urlkeys.has(key)){console.error('Duplicate URL '+g.id);broken++}urlkeys.add(key);
 if(g.mode==='embed'&&g.source==='playgama'&&!(u.hostname==='playgama.com'&&u.pathname.startsWith('/export/game/')&&u.searchParams.has('clid'))){console.error('Unsafe partner embed '+g.id);broken++}
 if(g.mode==='embed'&&g.source==='community'&&!u.href.startsWith('https://sausi-7.github.io/games/games/')){console.error('Unsupported community embed '+g.id);broken++}
 if(g.mode==='embed'&&!['playgama','community'].includes(g.source)){console.error('Unexpected embed source '+g.id);broken++}
 if(g.cover){try{let im=new URL(g.cover);if(im.protocol!=='https:')throw Error('non https')}catch{console.error('Unsafe cover '+g.id);broken++}}
}
console.log('Validated '+rows.length+' entries; '+broken+' validation errors.');
if(broken)process.exit(1);
