import {OPEN_SOURCE_GAMES,LOCAL_GAMES} from '../public/data.js';
import { get, put, list } from '@vercel/blob';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const GAME_IDS = new Set(['minecraft','roblox','fortnite','valorant','rocket','terraria','among','stumble','brawl','fallguys','genshin','subnautica']);
const STATE_LIMIT = 120000;
const SESSION_MS = 180 * 24 * 60 * 60 * 1000;
const keyOf = name => createHash('sha256').update(name.toLowerCase()).digest('hex');
const digest = str => createHash('sha256').update(str).digest('hex');
const asText = (x,n=250) => typeof x === 'string' ? x.trim().slice(0,n) : '';
const asNumber = (x,min,max,otherwise=0) => typeof x === 'number' && Number.isFinite(x) ? Math.min(max,Math.max(min,Math.round(x))) : otherwise;
const cleanArray = (x,max) => Array.isArray(x) ? x.slice(0,max) : [];
const enabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
const nameOK = name => /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(name);
const pathFor = id => `players/${id}.json`;
function header(req,name){return req.headers?.get?.(name)||req.headers?.[name.toLowerCase()]||''}
const blobOpts = { access:'private', useCache:false };
const requestHeader = (req, key) => typeof req.headers?.get === 'function' ? req.headers.get(key) : req.headers?.[key.toLowerCase()];
function response(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
async function readPlayer(id){const value=await get(pathFor(id),blobOpts);if(!value||value.statusCode===404)return null;if(value.statusCode!==200||!value.stream)throw Error('Player storage unavailable');return JSON.parse(await new Response(value.stream).text())}
async function writePlayer(player,overwrite=true){return put(pathFor(player.id),JSON.stringify(player),{access:'private',allowOverwrite:overwrite,addRandomSuffix:false,contentType:'application/json',cacheControlMaxAge:60})}
const EXTRA_IDS = ['tictactoe','snake','merge','rps','mole','scramble','colors','guess','quiz','typing','simon','code'];
function sanitizeExtras(x){
 const out={}; if(!x||typeof x!=='object'||Array.isArray(x))return out;
 for(const id of EXTRA_IDS){
  const a=x[id];if(!a||typeof a!=='object'||Array.isArray(a))continue;
  const b={best:asNumber(a.best,0,100000),plays:asNumber(a.plays,0,100000),wins:asNumber(a.wins,0,100000),draws:asNumber(a.draws,0,100000),streak:asNumber(a.streak,0,100000)};
  if(id==='mole')b.partial=asNumber(a.partial,0,100000);
  if(id==='tictactoe'&&a.game&&typeof a.game==='object'){
   b.game={board:cleanArray(a.game.board,9).map(v=>v==='X'||v==='O'?v:''),finished:Boolean(a.game.finished),message:asText(a.game.message,120)};
   if(b.game.board.length!==9)delete b.game;
  }
  if(id==='snake'&&a.session?.body&&Array.isArray(a.session.body)){
   const body=cleanArray(a.session.body,225).map(p=>({x:asNumber(p?.x,0,14),y:asNumber(p?.y,0,14)}));
   b.session={body,food:a.session.food?{x:asNumber(a.session.food.x,0,14),y:asNumber(a.session.food.y,0,14)}:null,dir:['up','down','left','right'].includes(a.session.dir)?a.session.dir:'right',next:['up','down','left','right'].includes(a.session.next)?a.session.next:'right',score:asNumber(a.session.score,0,225),playing:false};
  }
  if(id==='merge'&&a.game&&Array.isArray(a.game.grid)&&a.game.grid.length===16)b.game={grid:a.game.grid.map(v=>asNumber(v,0,65536)),score:asNumber(a.game.score,0,100000),over:Boolean(a.game.over),won:Boolean(a.game.won)};
  if(id==='scramble'&&a.current)b.current={word:asText(a.current.word,20),hint:asText(a.current.hint,100),jumbled:asText(a.current.jumbled,20),seenHint:Boolean(a.current.seenHint)};
  if(id==='colors'&&a.game)b.game={round:asNumber(a.game.round,0,10),correct:asNumber(a.game.correct,0,10),finished:Boolean(a.game.finished),question:{target:asText(a.game.question?.target,15),options:cleanArray(a.game.question?.options,4).map(v=>asText(v,15))}};
  if(id==='guess'&&a.game)b.game={target:asNumber(a.game.target,1,100),tries:asNumber(a.game.tries,0,300),history:cleanArray(a.game.history,300).map(v=>asNumber(v,1,100)),finished:Boolean(a.game.finished)};
  if(id==='quiz'&&a.game)b.game={questions:cleanArray(a.game.questions,8).map(v=>asNumber(v,0,19)),round:asNumber(a.game.round,0,8),correct:asNumber(a.game.correct,0,8),finished:Boolean(a.game.finished)};
  if(id==='typing'&&a.game)b.game={text:asText(a.game.text,180),draft:asText(a.game.draft,180),remaining:asNumber(a.game.remaining,0,30000,30000),running:false,finished:Boolean(a.game.finished),wpm:asNumber(a.game.wpm,0,250),accuracy:asNumber(a.game.accuracy,0,100)};
  if(id==='simon'&&a.game)b.game={sequence:cleanArray(a.game.sequence,35).map(v=>asNumber(v,0,3)),index:asNumber(a.game.index,0,35),phase:'ready',level:asNumber(a.game.level,0,35)};
  if(id==='code'&&a.game){const secret=asText(a.game.secret,3);if(/^\d{3}$/.test(secret)&&new Set(secret).size===3)b.game={secret,guesses:cleanArray(a.game.guesses,8).filter(v=>v&&typeof v==='object'&&/^\d{3}$/.test(v.value)).map(v=>({value:asText(v.value,3),exact:asNumber(v.exact,0,3),misplaced:asNumber(v.misplaced,0,3)})),finished:Boolean(a.game.finished),won:Boolean(a.game.won)}};

  out[id]=b;
 }
 return out;
}
function sanitizeGame(arcade){
 const x=arcade && typeof arcade==='object'?arcade:{};
 const m=x.memory||{},q=x.math||{};
 return {
  memory:{level:asNumber(m.level,1,6,1),moves:asNumber(m.moves,0,1000),board:cleanArray(m.board,16).map(v=>asText(v,8)),matched:cleanArray(m.matched,16).map(v=>asNumber(v,0,15)),opened:cleanArray(m.opened,2).map(v=>asNumber(v,0,15)),cleared:cleanArray(m.cleared,6).map(v=>asNumber(v,1,6)).filter((v,i,a)=>a.indexOf(v)===i)},
  math:{round:asNumber(q.round,0,10),right:asNumber(q.right,0,10),best:asNumber(q.best,0,10),question:q.question&&typeof q.question==='object'?{text:asText(q.question.text,80),answer:asNumber(q.question.answer,-300,500),options:cleanArray(q.question.options,4).map(v=>asNumber(v,-300,500))}:null},
  tap:{best:asNumber(x.tap?.best,0,150),plays:asNumber(x.tap?.plays,0,10000)},
  reflex:{best:asNumber(x.reflex?.best,0,10000),plays:asNumber(x.reflex?.plays,0,10000)},
  extras:sanitizeExtras(x.extras)
 };
}
function sanitizeState(input){
 const s=input&&typeof input==='object'?input:{};
 const likes={},ratings={};
 for(const [k,v] of Object.entries(s.likes||{}))if(GAME_IDS.has(k))likes[k]=v===true;
 for(const [k,v] of Object.entries(s.ratings||{}))if(GAME_IDS.has(k)){const n=asNumber(v,0,5);if(n>=1)ratings[k]=n}
 const done=cleanArray(s.done,40).map(v=>asText(v,40)).filter(v=>/^(visit|favorite|tier|post|profile|three|arcade-[a-z]+(?:-L\d+)?)$/.test(v));
 const ids=new Set();
 const lists=cleanArray(s.lists,20).filter(x=>x&&typeof x==='object').map(x=>({id:asNumber(x.id,1,9007199254740990,Date.now()),title:asText(x.title,70),category:asText(x.category,60),summary:asText(x.summary,1800),date:asText(x.date,40)})).filter(x=>{if(ids.has(x.id))return false;ids.add(x.id);return true});
 const posts=cleanArray(s.posts,30).filter(x=>x&&typeof x==='object').map(x=>({text:asText(x.text,240),name:asText(x.name,24),date:asText(x.date,50)}));
 let tierBoard=null;
 if(s.tierBoard&&typeof s.tierBoard==='object'){
  tierBoard={};
  for(const tier of ['S','A','B','C','D','pool'])tierBoard[tier]=cleanArray(s.tierBoard[tier],25).filter(x=>x&&typeof x==='object').map(x=>({name:asText(x.name,45),icon:asText(x.icon,8)}));
 }
 return {xp:asNumber(s.xp,0,20000),done:[...new Set(done)],likes,ratings,lists,posts,profile:{name:asText(s.profile?.name,24),game:asText(s.profile?.game,30)||'Minecraft'},missionBonus:{favorite:s.missionBonus?.favorite===true,three:s.missionBonus?.three===true},arcade:sanitizeGame(s.arcade),tierBoard};
}
function mergeState(oldData,newData){
 const old=sanitizeState(oldData),incoming=sanitizeState(newData);
 const lists=[...incoming.lists,...old.lists].filter((x,i,a)=>a.findIndex(v=>v.id===x.id)===i).slice(0,20);
 const posts=[...old.posts,...incoming.posts].filter((x,i,a)=>a.findIndex(v=>v.date===x.date&&v.text===x.text&&v.name===x.name)===i).slice(-30);
 const arcade=incoming.arcade;
 arcade.memory.cleared=[...new Set([...old.arcade.memory.cleared,...arcade.memory.cleared])];
 arcade.memory.level=Math.max(old.arcade.memory.level,arcade.memory.level);
 arcade.math.best=Math.max(old.arcade.math.best,arcade.math.best);
 arcade.tap.best=Math.max(old.arcade.tap.best,arcade.tap.best);
 const bestReaction=old.arcade.reflex.best && arcade.reflex.best ? Math.min(old.arcade.reflex.best,arcade.reflex.best) : old.arcade.reflex.best||arcade.reflex.best;
 arcade.reflex.best=bestReaction;
 for(const id of EXTRA_IDS){
  const a=old.arcade.extras[id],b=arcade.extras[id];
  if(!a)continue;if(!b){arcade.extras[id]=a;continue}
  b.best=id==='guess'?(a.best&&b.best?Math.min(a.best,b.best):a.best||b.best):Math.max(a.best||0,b.best||0);
  b.wins=Math.max(a.wins||0,b.wins||0);b.plays=Math.max(a.plays||0,b.plays||0);b.draws=Math.max(a.draws||0,b.draws||0);
  if(!b.game&&a.game)b.game=a.game;
  if(!b.current&&a.current)b.current=a.current;
  if(!b.session&&a.session)b.session=a.session;
 }
 return {...incoming,xp:Math.max(old.xp,incoming.xp),done:[...new Set([...old.done,...incoming.done])].slice(0,40),ratings:{...old.ratings,...incoming.ratings},lists,posts,arcade};
}
function newSession(record){
 const secret=randomBytes(32).toString('hex');
 const token=`${record.id}.${secret}`;
 const now=Date.now();
 record.sessions=(record.sessions||[]).filter(x=>x.expires>now).slice(-4);
 record.sessions.push({hash:digest(token),expires:now+SESSION_MS});
 return token;
}
async function authorize(req){
 const match=/^Bearer ([a-f0-9]{64}\.[a-f0-9]{64})$/.exec(header(req,'authorization'));
 if(!match)return null;
 const token=match[1];
 const id=token.split('.')[0];
 const player=await readPlayer(id);
 if(!player)return null;
 const hash=Buffer.from(digest(token),'hex');
 const valid=(player.sessions||[]).some(s=>s.expires>Date.now()&& /^[a-f0-9]{64}$/.test(s.hash)&&timingSafeEqual(Buffer.from(s.hash,'hex'),hash));
 return valid?player:null;
}
async function publicStats(){
 const players=[];
 let cursor;
 for(let page=0;page<2;page++){
  const batch=await list({prefix:'players/',limit:100,...(cursor?{cursor}:{})});
  const docs=await Promise.all(batch.blobs.map(async b=>{try{return await readPlayer(b.pathname.split('/').pop().replace(/\.json$/,''))}catch{return null}}));
  players.push(...docs.filter(Boolean));
  if(!batch.hasMore||!batch.cursor)break;
  cursor=batch.cursor;
 }
 const ratings={};
 for(const id of GAME_IDS)ratings[id]={sum:0,votes:0};
 for(const p of players){
  for(const [id,value] of Object.entries(p.state?.ratings||{}))if(ratings[id]&&Number.isInteger(value)&&value>=1&&value<=5){ratings[id].sum+=value;ratings[id].votes++}
 }
 const rank=players.map(p=>({name:p.name,game:p.state?.profile?.game||'Gamer',xp:asNumber(p.state?.xp,0,20000),memory:Math.max(0,...(p.state?.arcade?.memory?.cleared||[])),math:asNumber(p.state?.arcade?.math?.best,0,10),tap:asNumber(p.state?.arcade?.tap?.best,0,150),reflex:asNumber(p.state?.arcade?.reflex?.best,0,10000)}));
 rank.sort((a,b)=>b.xp-a.xp||b.math-a.math||a.name.localeCompare(b.name));
 return {enabled:true,players:rank.slice(0,30),ratings:Object.fromEntries(Object.entries(ratings).map(([k,v])=>[k,{votes:v.votes,average:v.votes?Number((v.sum/v.votes).toFixed(2)):null}])),count:players.length,limited:players.length>=200};
}
function badOrigin(req){const origin=header(req,'origin');if(!origin)return false;try{return new URL(origin).host!==header(req,'host')}catch{return true}}
export default async function handler(req,res){
 try{
  res.setHeader?.('Cache-Control','no-store');
  res.setHeader?.('X-Content-Type-Options','nosniff');
  const url=new URL(req.url,`https://${requestHeader(req,'host')||'localhost'}`);
  if(req.method==='GET'){
   if(url.searchParams.get('action')==='catalog'){
    res.setHeader?.('Cache-Control','public, max-age=180, s-maxage=600');
    return res.status(200).json({version:'7.0',launchTypes:{gpu:'GPU accelerated local WebGL',canvas:'Original local HTML5',download:'Original developer download',source:'Reference source only'},browserGames:LOCAL_GAMES.map(g=>({id:g.id,title:g.name,category:g.category,launchMode:'play-here',engine:g.engine==='gpu'?'WebGL':'Canvas2D'})),officialPC:OPEN_SOURCE_GAMES.map(g=>({id:g.id,title:g.name,category:g.category,url:g.url,launchMode:g.launchMode,provider:g.provider})),notice:'Official PC games are not streamed or embedded. Cloud play is not enabled.'});
   }
   if(url.searchParams.get('action')==='capabilities')return res.status(200).json({version:'7.0',browser3D:true,hostedGPUGames:false,cloudStreaming:false,cloudSaves:enabled(),localSaves:true});
   if(url.searchParams.get('action')==='community')return res.status(200).json(enabled()?await publicStats():{enabled:false,players:[],ratings:{},count:0});
   if(url.searchParams.get('action')==='me'){
    if(!enabled())return res.status(503).json({error:'Cloud storage is not connected yet',code:'STORAGE_OFFLINE'});
    const p=await authorize(req);
    return p?res.status(200).json({name:p.name,state:p.state,updatedAt:p.updatedAt}):res.status(401).json({error:'Session expired. Sign in again.'});
   }
   return res.status(404).json({error:'Unknown endpoint'});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(badOrigin(req))return res.status(403).json({error:'Bad origin'});
  if(!enabled())return res.status(503).json({error:'Cloud storage not connected in Vercel project',code:'STORAGE_OFFLINE'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body!=='object'||JSON.stringify(body).length>STATE_LIMIT)return res.status(413).json({error:'Invalid request size'});
  const action=body.action;
  if(action==='register'){
   const name=asText(body.name,21),password=body.password;
   if(!nameOK(name))return res.status(400).json({error:'Gamer tag needs 3–20 letters, numbers or underscore and must start with a letter.'});
   if(typeof password!=='string'||password.length<8||password.length>128)return res.status(400).json({error:'Choose a password with at least 8 characters.'});
   const id=keyOf(name);
   if(await readPlayer(id))return res.status(409).json({error:'That gamer tag is already taken. Sign in instead.'});
   const salt=randomBytes(16).toString('hex');
   const state=sanitizeState(body.initialState||{});
   state.xp=Math.min(state.xp,450);state.profile.name=name;
   const p={id,name,salt,passwordHash:scryptSync(password,salt,64).toString('hex'),sessions:[],state,updatedAt:new Date().toISOString()};
   const token=newSession(p);
   try{await writePlayer(p,false)}catch(e){if(/conflict|already exist|blob already/i.test(e.message))return res.status(409).json({error:'Gamer tag was taken. Sign in instead.'});throw e}
   return res.status(201).json({token,name,state});
  }
  if(action==='login'){
   const name=asText(body.name,21),password=body.password;
   if(!nameOK(name)||typeof password!=='string'||password.length>128)return res.status(401).json({error:'Wrong gamer tag or password'});
   const p=await readPlayer(keyOf(name));
   if(!p)return res.status(401).json({error:'Wrong gamer tag or password'});
   const candidate=scryptSync(password,p.salt,64);
   if(!timingSafeEqual(candidate,Buffer.from(p.passwordHash,'hex')))return res.status(401).json({error:'Wrong gamer tag or password'});
   const token=newSession(p);p.updatedAt=new Date().toISOString();await writePlayer(p);
   return res.status(200).json({token,name:p.name,state:p.state});
  }
  const p=await authorize(req);
  if(!p)return res.status(401).json({error:'Session expired. Sign in again.'});
  if(action==='save'){
   const cleaned=mergeState(p.state,body.state||{});
   cleaned.profile.name=p.name;
   p.state=cleaned;p.updatedAt=new Date().toISOString();
   await writePlayer(p);
   return res.status(200).json({ok:true,updatedAt:p.updatedAt,state:p.state});
  }
  if(action==='logout'){
   const tok=(requestHeader(req,'authorization')||'').replace(/^Bearer /,'');
   p.sessions=(p.sessions||[]).filter(s=>s.hash!==digest(tok));await writePlayer(p);
   return res.status(200).json({ok:true});
  }
  return res.status(400).json({error:'Unknown action'});
 }catch(error){
  console.error('Zyvoqix API failure:',error?.name,error?.message);
  return res.status(503).json({error:'Cloud save temporarily unavailable. Your progress stays on this device.',code:'UNAVAILABLE'});
 }
}
