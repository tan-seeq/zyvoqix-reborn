// Bundle observed browser module graphs and retain public CDN dependencies locally.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const require=createRequire('/tmp/zyvoqix-build-tools/package.json');const esbuild=require('esbuild');
const root=path.resolve(process.argv[2]),id=process.argv[3],built=process.argv.includes('--built');const cache=process.env.ZYVOQIX_DOWNLOAD_CACHE||'/tmp/zyvoqix-runtime-downloads';await fs.mkdir(cache,{recursive:true});await fs.mkdir(path.join(root,'vendor'),{recursive:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,20),seen=new Map(),records={};
async function download(url){url=url.replace(/^http:/,'https:');const p=path.join(cache,hash(url));try{return await fs.readFile(p);}catch{}execFileSync('curl',['--fail','--location','--silent','--show-error','--max-time','60',url,'--output',p],{maxBuffer:2048});const b=await fs.readFile(p);records[url]=crypto.createHash('sha256').update(b).digest('hex');return b;}
async function asset(url){if(seen.has(url))return seen.get(url);const ext=path.extname(new URL(url).pathname)||'.bin',name='asset-'+hash(url)+ext;seen.set(url,'./vendor/'+name);await fs.writeFile(path.join(root,'vendor',name),await download(url));return './vendor/'+name;}
async function css(text,url){const matches=[...text.matchAll(/url\(\s*["']?([^\s)'";]+)["']?\s*\)/g)];for(const m of matches){if(m[1].startsWith('data:')||m[1].startsWith('#'))continue;const target=new URL(m[1],url).href;const local=await asset(target);text=text.replace(m[0],`url("${path.basename(local)}")`);}return text.replace(/@import\s+(?:url\()?\s*["']https?:[^;]+;/g,'');}
let html=await fs.readFile(path.join(root,'index.html'),'utf8');let importmap={};for(const m of html.matchAll(/<script\b[^>]*type=["']importmap["'][^>]*>([\s\S]*?)<\/script>/gi)){Object.assign(importmap,JSON.parse(m[1]).imports||{});html=html.replace(m[0],'');}
function mapped(name){if(importmap[name])return importmap[name];for(const [k,v]of Object.entries(importmap))if(k.endsWith('/')&&name.startsWith(k))return v+name.slice(k.length);return name;}
const plugin={name:'observed-http-deps',setup(build){
 build.onResolve({filter:/.*/},args=>{let p=mapped(args.path);if(/^https?:/.test(p))return{path:p.replace(/^http:/,'https:'),namespace:'http'};if(args.namespace==='http')return{path:new URL(p,args.importer).href,namespace:'http'};if(p!==args.path)return{path:path.resolve(root,p.replace(/^\//,''))};return null;});
 build.onLoad({filter:/.*/,namespace:'http'},async args=>{let text=(await download(args.path)).toString();text=await localizeStrings(text,args.path);return{contents:text,loader:'js',resolveDir:root};});
}};
const assetRoots=(await fs.readdir(root,{withFileTypes:true})).filter(x=>x.isDirectory()&&!['node_modules','.git'].includes(x.name)).map(x=>x.name);
async function localizeStrings(text,base){
 for(const m of [...text.matchAll(/["'`]\/([^"'`\n]+)["'`]/g)]){const local=m[1].split(/[?#]/)[0];if(local.startsWith('/')||local.includes('..'))continue;try{if((await fs.stat(path.join(root,local))).isFile())text=text.replaceAll(m[0],m[0][0]+'/games/'+id+'/'+m[1]+m[0].slice(-1));}catch{}}

 for(const folder of assetRoots){const safe=folder.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');text=text.replace(new RegExp("([\"'`])/"+safe+"/",'g'),(_m,q)=>q+'/games/'+id+'/'+folder+'/');}

 for(const m of [...text.matchAll(/new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g)]){
  let target;if(/^https?:/.test(base)){target=await asset(new URL(m[1],base).href);target='/games/'+id+'/'+target.slice(2);}else{const f=path.resolve(path.dirname(base),m[1]);try{if(!(await fs.stat(f)).isFile())continue;}catch{continue;}target='/games/'+id+'/'+path.relative(root,f).replaceAll(path.sep,'/');}
  text=text.replace(m[0],`new URL(${JSON.stringify(target)},location.origin)`);
 }
 // Explicit static data dependencies are downloaded only when actually referenced by source.
 for(const m of [...text.matchAll(/["'](https?:\/\/[^"'`\s]+\.(?:glb|hdr|jpg|jpeg|png|webp|mp3|ogg|woff2?|wasm)(?:\?[^"'\s]*)?)["']/g)]){const local=await asset(m[1]);text=text.replaceAll(m[1],'/games/'+id+'/'+local.slice(2));}
 return text;
}
// Rewrite import.meta-relative local assets before bundling changes module locations.
for(const p of await files(root))if(/\.(m?js|ts)$/.test(p)&&!p.includes('/node_modules/')&&!p.includes('/vendor/')){const s=await fs.readFile(p,'utf8');const out=await localizeStrings(s,p);if(out!==s)await fs.writeFile(p,out);}
async function files(dir){let out=[];for(const x of await fs.readdir(dir,{withFileTypes:true})){if(x.name==='.git'||x.name==='node_modules')continue;const p=path.join(dir,x.name);if(x.isDirectory())out.push(...await files(p));else out.push(p);}return out;}
for(const m of [...html.matchAll(/\b(src|href)=["']\/([^"']+)["']/g)]){try{if((await fs.stat(path.join(root,m[2].split('?')[0]))).isFile())html=html.replace(m[0],m[1]+'="./'+m[2]+'"');}catch{}}
for(const m of [...html.matchAll(/<link\b[^>]*>/gi)]){const href=m[0].match(/href=["']([^"']+)["']/i)?.[1];if(href&&/rel=["'](?:shortcut )?icon["']/i.test(m[0])&&!/^https?:/.test(href)){try{await fs.stat(path.join(root,href.replace(/^\//,'')));}catch{html=html.replace(m[0],'<link rel="icon" href="/assets/icon.png">');}}}
let index=0;for(const m of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]){
 const attrs=m[1],src=attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
 if(src&&/umami|google-?analytics|googletagmanager|vconsole|\/_vercel\//i.test(src)){html=html.replace(m[0],'<!-- Optional third-party analytics/debug loader removed. -->');continue;}
 if(/\btype\s*=\s*["']module["']/i.test(attrs)){
  if(built&&src&&!/^https?:/.test(src))continue;
  let entry;if(src){if(/^https?:/.test(src)){entry=path.join(root,'vendor','input-'+index+'.js');await fs.writeFile(entry,`import ${JSON.stringify(src)}`);}else entry=path.resolve(root,src.replace(/^\//,''));}else{entry=path.join(root,'.zy-entry-'+index+'.js');await fs.writeFile(entry,await localizeStrings(m[2],path.join(root,'index.html')));}
  const outfile=path.join(root,'vendor','entry-'+index+'.js');await esbuild.build({entryPoints:[entry],outfile,bundle:true,format:'esm',target:'es2020',plugins:[plugin],absWorkingDir:root,loader:{'.png':'file','.jpg':'file','.glb':'file','.wasm':'file','.svg':'file','.woff':'file','.woff2':'file'},logLevel:'warning',legalComments:'inline'});html=html.replace(m[0],`<script type="module" src="./vendor/entry-${index}.js"></script>`);index++;
 }else if(src&&src.includes('node_modules/')){const original=path.resolve(root,src.replace(/^\//,''));const name='local-script-'+index+++'.js';await fs.copyFile(original,path.join(root,'vendor',name));html=html.replace(m[0],`<script src="./vendor/${name}"></script>`);}
 else if(src&&/^https?:/.test(src)){const local=await asset(src);html=html.replace(m[0],`<script src="${local}"></script>`);}
 else if(!src){const s=await localizeStrings(m[2],path.join(root,'index.html'));html=html.replace(m[0],`<script${attrs}>${s}</script>`);}
}
for(const m of [...html.matchAll(/<link\b[^>]*>/gi)]){const href=m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];if(!href||!/^https?:/.test(href))continue;if(/fonts\.googleapis|fonts\.gstatic/.test(href)||!/\brel=["']stylesheet["']/.test(m[0])){html=html.replace(m[0],'');continue;}const content=await css((await download(href)).toString(),href);const name='style-'+hash(href)+'.css';await fs.writeFile(path.join(root,'vendor',name),content);html=html.replace(m[0],`<link rel="stylesheet" href="./vendor/${name}">`);}
await fs.writeFile(path.join(root,'index.html'),html);await fs.writeFile(path.join(root,'vendor-network.json'),JSON.stringify(records,null,2));
