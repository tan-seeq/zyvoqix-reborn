#!/usr/bin/env node
// Imports a Playgama Partners catalog downloaded by the account holder.
// No scraping, credentials, or direct unapproved game hosting.
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const file=args.find(a=>!a.startsWith('--'));
const write=args.includes('--write');
const suppliedClid=(args.find(a=>a.startsWith('--clid='))||'').slice(7);
const outputArg=(args.find(a=>a.startsWith('--out='))||'').slice(6);
const output=path.resolve(outputArg || 'public/library.json');
if(!file){console.error('Usage: node scripts/import-playgama.mjs YOUR_PARTNER_EXPORT.json [--clid=YOUR_CLID] [--write] [--out=public/library.json]');process.exit(2)}
if(suppliedClid && !/^[A-Za-z0-9_-]{2,100}$/.test(suppliedClid)){console.error('Invalid CLID');process.exit(2)}
function arrayOf(root){
  if(Array.isArray(root)) return root;
  const a=[root?.games,root?.items,root?.results,root?.data?.games,root?.data?.items,root?.data];
  return a.find(Array.isArray)||[];
}
function str(v){if(typeof v==='string')return v.trim();if(typeof v==='number')return String(v);return ''}
function field(v){if(typeof v==='string')return v.trim();if(typeof v==='object'&&v) return str(v.en||v.english||v.title||v.name||v.ar||v.url);return ''}
function urlOf(v){let t=field(v);if(!t)return '';try{const u=new URL(t);if(u.protocol!=='https:'||u.username||u.password)return '';return u.toString()}catch{return ''}}
function imgOf(g){const candidates=[g.thumbnail,g.thumbnailUrl,g.thumbnailURL,g.image,g.imageUrl,g.imageURL,g.icon,g.iconUrl,g.cover,g.picture,g.images?.[0],g.thumbnails?.[0],g.assets?.thumbnail,g.assets?.image];for(const v of candidates){const u=urlOf(v);if(u)return u}return ''}
function category(g){
 const z=[g.genre,g.category,g.categories,g.tags,g.type].flat(Infinity).map(x=>field(x)).join(' ').toLowerCase();
 if(/racing|driving|car|vehicle|drift|motor|truck|speed|bike/.test(z))return 'cars';
 if(/flight|flying|plane|aircraft|airplane|aviat|helicopter/.test(z))return 'air';
 if(/fps|shooter|shooting|military|tank|war|battle|gun/.test(z))return 'war';
 if(/horror|scary|zombie|ghost|survival horror/.test(z))return 'horror';
 if(/multiplayer|mmo|online battle/.test(z))return 'multiplayer';
 if(/adventure|rpg|quest|explore|platformer|open world/.test(z))return 'adventure';
 if(/puzzle|word|board|logic|match|quiz|mahjong|cards/.test(z))return 'puzzle';
 return 'action';
}
function slug(v){return str(v).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,96)}
function parseGame(g){
 const input=str(g.gameURL||g.gameUrl||g.embedUrl||g.embed_url||g.iframeUrl||g.url);
 let u;try{u=new URL(input)}catch{return {error:'missing playable gameURL'}}
 if(u.protocol!=='https:'||u.hostname!=='playgama.com'||!/^\/export\/game\/[a-z0-9][a-z0-9_-]*\/?$/i.test(u.pathname)||u.username||u.password)return {error:'unapproved Playgama export URL'};
 const clid=u.searchParams.get('clid')||suppliedClid;
 if(!clid||!/^[A-Za-z0-9_-]{2,100}$/.test(clid))return {error:'missing valid CLID: download signed export or pass --clid'};
 if(!u.searchParams.has('clid'))u.searchParams.set('clid',clid);
 const name=field(g.title||g.name||g.gameName||g.gameTitle||g.localizations?.en?.title)||u.pathname.split('/').filter(Boolean).pop().replace(/-/g,' ');
 const id='playgama-'+slug(u.pathname.split('/').filter(Boolean).pop());
 if(id==='playgama-')return {error:'missing slug'};
 return {id,name,cat:category(g),desc:field(g.description||g.shortDescription||g.subtitle).slice(0,240)||'لعبة HTML5 من Playgama Partners',url:u.toString(),host:'Playgama',mode:'embed',source:'playgama',cover:imgOf(g),provider:'playgama'};
}
let incoming,catalog;
try{incoming=JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));catalog=JSON.parse(fs.readFileSync(output,'utf8'))}catch(e){console.error('Could not read catalog/partner export:',e.message);process.exit(2)}
const records=arrayOf(incoming),errors=[],imported=[],names=new Set();
if(!records.length){console.error('Export contains no games array');process.exit(2)}
for(let i=0;i<records.length;i++){
 const result=parseGame(records[i]);
 if(result.error){errors.push({row:i+1,reason:result.error});continue}
 if(names.has(result.id))continue;
 names.add(result.id);imported.push(result);
}
if(!imported.length){console.error('No valid Playgama partner games, first errors:',JSON.stringify(errors.slice(0,5)));process.exit(2)}
const existing=Array.isArray(catalog.games)?catalog.games:[];
const existingNoPlaygama=existing.filter(g=>g.source!=='playgama');
const all=[...existingNoPlaygama,...imported];
const report={input:records.length,accepted:imported.length,rejected:errors.length,total:all.length,topErrors:errors.slice(0,8),write};
console.log(JSON.stringify(report,null,2));
if(errors.length){console.warn('Invalid games were skipped; inspect export:',JSON.stringify(errors.slice(0,10)))}
if(write){
 const updated={...catalog,version:'8.2',partnerCatalogImported:true,games:all};
 fs.writeFileSync(output,JSON.stringify(updated,null,2)+'\n');
 console.log('Wrote '+output);
}else console.log('DRY RUN ONLY. Add --write to update file.');
