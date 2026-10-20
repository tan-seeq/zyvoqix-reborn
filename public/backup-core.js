const CORE=new Set(['zyvoqix_language','zyvoqix_v6_profiles','zyvoqix_v8_favorites','zyvoqix_v13_recent','zyvoqix_hub_visited','gz_local_players',...['tierBoard','tierBoard_before_reset','lists','posts','xp','done','profile','likes'].map(x=>'gz2_'+x)]);
const LEGACY=new Set(['kr.controls.v1','dust-corridor.settings.v3','parapet.best','parapet.splits','blockverse-settings','flightsim.flyby.v1','polytrack_best_time','contrarun.preferences.v1','island-survival:active-slot',...['1','2','3'].map(x=>'island-survival:save:'+x)]);
export function allowedKey(key){return typeof key==='string'&&key.length<=1100&&(CORE.has(key)||LEGACY.has(key)||/^gz_local_gamer_[^\x00-\x1f]{1,100}$/.test(key)||/^zyvoqix_game_[a-z0-9-]+_[^\x00-\x1f]{1,1000}$/.test(key));}
function validValue(key,value){
 if(key==='zyvoqix_language')return ['en','ar'].includes(value);
 if(!CORE.has(key)&&!key.startsWith('gz_local_gamer_'))return true;
 let v;try{v=JSON.parse(value);}catch{return false;}
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 if(['zyvoqix_v8_favorites','zyvoqix_v13_recent','gz2_done','gz_local_players'].includes(key))return Array.isArray(v)&&v.every(x=>typeof x==='string');
 if(['gz2_lists','gz2_posts'].includes(key))return Array.isArray(v)&&v.every(object);
 if(key==='gz2_xp')return typeof v==='number'&&Number.isFinite(v)&&v>=0;
 if(key==='zyvoqix_hub_visited')return typeof v==='boolean';
 if(key==='zyvoqix_v6_profiles')return object(v)&&v.v===6&&typeof v.active==='string'&&object(v.profiles)&&Object.values(v.profiles).every(object);
 if(['gz2_tierBoard','gz2_tierBoard_before_reset'].includes(key))return object(v)&&['S','A','B','C','D','pool'].every(z=>Array.isArray(v[z])&&v[z].every(x=>object(x)&&typeof x.name==='string'));
 return object(v);
}
export function snapshot(storage,origin=''){const entries=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(allowedKey(key)){const value=storage.getItem(key);if(value!==null)entries.push({key,value});}}entries.sort((a,b)=>a.key.localeCompare(b.key));return {format:'ZYVOQIX_SITE_BACKUP',version:1,createdAt:new Date().toISOString(),origin,entries};}
export function parseBackup(text){
 if(typeof text!=='string'||text.length>32*1024*1024)throw Error('size');let data;try{data=JSON.parse(text);}catch{throw Error('format');}
 if(data?.format==='ZYVOQIX_HUB_BACKUP'&&data.version===1&&data.values&&typeof data.values==='object'&&!Array.isArray(data.values)){const entries=Object.entries(data.values).filter(([,v])=>v!==null).map(([k,v])=>({key:'gz2_'+k,value:JSON.stringify(v)}));data={...data,format:'ZYVOQIX_SITE_BACKUP',entries};}
 if(!data||data.format!=='ZYVOQIX_SITE_BACKUP'||data.version!==1||!Array.isArray(data.entries)||data.entries.length>10000)throw Error('format');
 const seen=new Set();for(const entry of data.entries){if(!entry||!allowedKey(entry.key)||typeof entry.value!=='string'||entry.value.length>8*1024*1024||!validValue(entry.key,entry.value)||seen.has(entry.key))throw Error('entry');seen.add(entry.key);}
 return {entries:data.entries.map(({key,value})=>({key,value})),createdAt:typeof data.createdAt==='string'?data.createdAt.slice(0,80):'',origin:typeof data.origin==='string'?data.origin.slice(0,200):''};
}
export function restorePlan(storage,backup,replace=false){const entries=[],kept=[];for(const e of backup.entries){const current=storage.getItem(e.key);if(current===null||replace&&current!==e.value)entries.push({...e,previous:current});else kept.push(e.key);}return {entries,kept};}
export function applyRestore(storage,plan){
 const written=[];try{for(const e of plan.entries){if(storage.getItem(e.key)!==e.previous)throw Error('changed');storage.setItem(e.key,e.value);written.push(e);}}
 catch(cause){let rollbackFailed=false;for(const e of written.reverse())try{if(storage.getItem(e.key)!==e.value){rollbackFailed=true;continue;}if(e.previous===null)storage.removeItem(e.key);else storage.setItem(e.key,e.previous);}catch{rollbackFailed=true;}throw Error(rollbackFailed?'rollback':cause.message==='changed'?'changed':'storage');}
 return written.length;
}
