// Whole-library static audit. This is not a claim of hardware/gameplay testing.
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {parse} from 'acorn';import {pointerGames,walk}from'./runtime-patches.mjs';
const root=path.resolve(import.meta.dirname,'..'),pub=path.join(root,'public');
const catalog=JSON.parse(await fs.readFile(path.join(pub,'library-catalog.json'),'utf8'));
const engineOnly=new Set(['connect-four-3d','infinity-parking','hypeometry','mortar-command']);
async function files(dir){return(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const report={version:16,scope:'Static audit of all pinned runtimes plus automated input regression tests; not physical-device gameplay certification.',games:[]};
for(const game of catalog){
 const dir=path.join(pub,'games',game.id),entry=await fs.readFile(path.join(dir,'index.html'),'utf8');
 assert(entry.includes('/game-input.js?v=16'),`${game.id}: missing input adapter`);
 let adaptedCalls=0,nativeCalls=[];
 for(const file of await files(dir)){
  if(!/\.(?:js|html)$/.test(file))continue;const text=await fs.readFile(file,'utf8');if(!/requestPointerLock|exitPointerLock|ZyvoqixPointerLock/.test(text))continue;
  const chunks=file.endsWith('.html')?[...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!/(?:src\s*=|application\/|importmap|shader)/i.test(m[1])).map(m=>m[2]):[text];
  for(const code of chunks){const tree=parse(code,{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true});walk(tree,n=>{if(n.type!=='CallExpression'||n.callee.type!=='MemberExpression')return;const target=code.slice(n.callee.object.start,n.callee.object.end),method=n.callee.property.name||n.callee.property.value;if(target==='window.ZyvoqixPointerLock')adaptedCalls++;if(['requestPointerLock','exitPointerLock'].includes(method)&&!(game.id==='island-survival'&&['c','this.input'].includes(target)))nativeCalls.push({file:path.relative(dir,file),call:code.slice(n.start,n.end)});});}
 }
 if(pointerGames.has(game.id)){assert.equal(nativeCalls.length,0,`${game.id}: an active native input call escaped the adapter`);assert(adaptedCalls>0,`${game.id}: no adapted calls`);}
 else assert.equal(nativeCalls.length>0,engineOnly.has(game.id),`${game.id}: unclassified pointer-lock use`);
 report.games.push({id:game.id,pointerLock:pointerGames.has(game.id)?'native calls adapted':engineOnly.has(game.id)?'dormant library capability; no active game pointer-lock configuration found':'no native pointer-lock calls',adaptedCalls,nativeLibraryCalls:nativeCalls.length,menus:game.menuLanguage||'original language',device:game.i18n?.en?.device||game.device});
}
report.summary={games:report.games.length,inputAdapted:report.games.filter(g=>g.adaptedCalls).length,adaptedCalls:report.games.reduce((n,g)=>n+g.adaptedCalls,0),english:report.games.filter(g=>g.menus==='en').length,partialEnglish:report.games.filter(g=>g.menus==='en-partial').length};
await fs.writeFile(path.join(pub,'game-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
