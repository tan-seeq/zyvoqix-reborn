import {parse} from 'acorn';
import fs from 'node:fs/promises';import path from 'node:path';
import translations from './game-english.json' with {type:'json'};
for(const dictionary of Object.values(translations))for(const key of Object.keys(dictionary))if(!/[\u3040-\u30ff\u3400-\u9fff\uff1a]/.test(key))throw Error('Translation keys must contain original CJK text');
export const pointerGames=new Set(['space-pirates','dust-corridor','sketchbook','parapet','blockverse','island-survival','stardust-isles','mineworld','roundcraft','decay','obbyverse','tricky-track','horror-house','dead-signal','voxelcraft-survival','voxel-musou','misty-bunny','operation-ironhold','regolith','jungle-trail','drakonas']);
export function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const value of Object.values(node))if(Array.isArray(value))for(const child of value)walk(child,visit);else if(value&&typeof value==='object')walk(value,visit);}
export function patchJavaScript(code,{pointer=false,english=false,bilingual=false,game=''}={}){
 const dictionary=translations[game]||{};
 const tree=parse(code,{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true});let edits=[];
 const quote=s=>JSON.stringify(s).replaceAll('<','\\u003c');
 walk(tree,node=>{
  if(pointer&&node.type==='CallExpression'&&node.callee.type==='MemberExpression'){
   const method=node.callee.property.name,target=code.slice(node.callee.object.start,node.callee.object.end);
   // Island Survival also has an application method with the same name.
   if(method==='requestPointerLock'&&!['c','this.input'].includes(target))edits.push([node.start,node.end,`window.ZyvoqixPointerLock.request(${target}${node.arguments.length?','+node.arguments.map(a=>code.slice(a.start,a.end)).join(','):''})`]);
   if(method==='exitPointerLock')edits.push([node.start,node.end,`window.ZyvoqixPointerLock.release(${target})`]);
  }
  if(english){
   if(node.type==='Literal'&&typeof node.value==='string'){
    let value=Object.hasOwn(dictionary,node.value)?dictionary[node.value]:undefined;
    if(value===undefined&&(node.value.includes('<')||bilingual)&&/[\u3040-\u30ff\u3400-\u9fff]/.test(node.value)){value=node.value;for(const[from,to]of Object.entries(dictionary).sort((a,b)=>b[0].length-a[0].length))value=value.split(from).join(to);}
    if(value!==undefined&&value!==node.value)edits.push([node.start,node.end,quote(value)]);
   }
   if(node.type==='TemplateElement'&&node.value.cooked){let value=node.value.cooked;for(const [from,to]of Object.entries(dictionary).sort((a,b)=>b[0].length-a[0].length))value=value.split(from).join(to);if(value!==node.value.cooked)edits.push([node.start,node.end,value.replaceAll('\\','\\\\').replaceAll('`','\\`').replaceAll('${','\\${')]);}
   if(bilingual&&node.type==='ObjectExpression'){
    const zh=node.properties.find(p=>(p.key?.name||p.key?.value)==='zh'),en=node.properties.find(p=>(p.key?.name||p.key?.value)==='en');
    if(zh&&en&&(en.value.type==='Literal'&&typeof en.value.value==='string'||en.value.type==='ArrayExpression'&&en.value.elements.every(e=>e?.type==='Literal'&&typeof e.value==='string')))edits.push([zh.value.start,zh.value.end,code.slice(en.value.start,en.value.end)]);
   }
   if(bilingual&&node.type==='ArrayExpression'&&node.elements.length===2){const[a,b]=node.elements;if(a?.type==='Literal'&&b?.type==='Literal'&&typeof a.value==='string'&&typeof b.value==='string'&&/[\u3400-\u9fff]/.test(a.value)&&!/[\u3400-\u9fff]/.test(b.value)&&/[A-Za-z]{3}/.test(b.value))edits.push([a.start,a.end,quote(b.value)]);}
  }
 });
 // Prefer the encompassing bilingual/property edit over edits to its child literal.
 edits.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);const chosen=[];for(const edit of edits)if(!chosen.length||edit[0]>=chosen.at(-1)[1])chosen.push(edit);
 for(const[start,end,replacement]of chosen.reverse())code=code.slice(0,start)+replacement+code.slice(end);
 parse(code,{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true});return {code,count:chosen.length};
}
const englishGames=new Set(['mineworld','mastermind-3d','niulai-arena','skyline-rush','stardust-drifter','voxel-musou','rubiks-cube','hypeometry','crossroad','desire-path']);
async function files(dir){const entries=await fs.readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
export async function patchRuntime(id,dir){
 let pointerEdits=0,englishEdits=0;
 for(const file of await files(dir)){
  if(!/\.(?:js|html)$/.test(file)||/three(?:\.core|\.module|\.min)?\.js$|\/partytown|opentype|\/tools\/|\/checks\//.test(file))continue;
  let code=await fs.readFile(file,'utf8'),original=code;
  const patch=s=>{const result=patchJavaScript(s,{pointer:pointerGames.has(id),english:englishGames.has(id),bilingual:id==='voxel-musou',game:id});if(pointerGames.has(id))pointerEdits+=(s.match(/\.requestPointerLock\s*(?:\?\.)?\(/g)||[]).length;if(englishGames.has(id))englishEdits+=result.count;return result.code;};
  if(file.endsWith('.js')){
   if(pointerGames.has(id)&&/requestPointerLock|exitPointerLock/.test(code)||englishGames.has(id)&&/[\u3040-\u30ff\u3400-\u9fff]|\\u[0-9a-fA-F]{4}/.test(code))code=patch(code);
   if(id==='stardust-isles'&&path.basename(file)==='index-DsKI-fZA.js'){
    const before='function Md(){try{let e=localStorage.getItem(kd);if(e&&(e===`zh`||Ad[e]))return e}catch{}return`zh`}';
    if(!code.includes(before))throw Error('Stardust locale patch no longer matches');code=code.replace(before,before.replace('return`zh`','return`en`'));
   }
   if(id==='voxel-musou'&&/\/(?:src\/core\/input|vendor\/entry-0)\.js$/.test(file))code=code.replace(/(const p = window\.ZyvoqixPointerLock\.request\(canvas2?\);\s*if \(p && p\.catch\) )p\.catch\(\(\) => \{\s*\}\)/g,'$1p.catch(() => { if (clickLock) noLock = true; })');
   // Give patched modules a fresh URL in existing browsers, including nested imports.
   code=code.replace(/((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'`])((?:\.\/|\.\.\/|\/)[^"'`\s]+\.m?js)(["'`])/g,'$1$2?zyvoqixRelease=16$3');
  }else{
   code=code.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(all,attrs,body)=>/src\s*=|application\/|importmap|shader/i.test(attrs)||!body.trim()||!(pointerGames.has(id)&&/requestPointerLock|exitPointerLock/.test(body)||englishGames.has(id))?all:`<script${attrs}>${patch(body)}</script>`);
   if(englishGames.has(id)){
    // Only HTML text and visible attributes; comments and script identifiers stay intact.
    code=code.replace(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|[^<]+|<[^>]+>/gi,part=>{
     if(/^<!--|^<script|^<style/i.test(part))return part;
     for(const[from,to]of Object.entries(translations[id]||{}).sort((a,b)=>b[0].length-a[0].length))part=part.split(from).join(to.replaceAll('&','&amp;').replaceAll('"','&quot;'));
     return part;
    }).replace(/lang="zh(?:-[^"]*)?"/i,'lang="en"');
   }
   if(!code.includes('/game-input.js'))code=code.replace(/<head[^>]*>/i,'$&<script src="/game-input.js?v=16"></script>');
   code=code.replace(/\/game-bridge\.js\?v=\d+/g,'/game-bridge.js?v=16');
   code=code.replace(/(<script\b[^>]*\bsrc=["'])([^"']+\.js)(["'])/gi,'$1$2?zyvoqixRelease=16$3');
   if(id==='glimmer-box')code=code.replaceAll('defaultLocale:"zh"','defaultLocale:"en"').replaceAll('fallbackLocale:""','fallbackLocale:"en"');
  }
  if(code!==original)await fs.writeFile(file,code);
 }
 return {pointerEdits,englishEdits};
}
