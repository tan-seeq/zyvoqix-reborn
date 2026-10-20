// ZYVOQIX local score store. No external database or sample players.
const key='crossroad_scores';
function read(){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>typeof x.username==='string'&&Number.isFinite(x.score)):[];}catch{return[];}}
export const supabase={from(){return{
 async insert(rows){const data=rows.filter(x=>Number.isFinite(x.score)).map(x=>({id:crypto.randomUUID(),username:String(x.username||'Guest').slice(0,40),score:x.score}));localStorage.setItem(key,JSON.stringify([...read(),...data].sort((a,b)=>b.score-a.score).slice(0,100)));return{data,error:null};},
 select(){return{order(){return{async limit(n){return{data:read().sort((a,b)=>b.score-a.score).slice(0,Math.min(n,100)),error:null};}};}};
}};}};
