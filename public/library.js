import {screenMode} from './screen-mode.js';
import './navigation.js';
import {getLanguage,setLanguage,copy} from './language.js';
const $=id=>document.getElementById(id);
let lang=setLanguage(document.documentElement.dataset.locale||getLanguage()),games=JSON.parse(document.getElementById('initialCatalog')?.textContent||'[]'),category='all',previousFocus,activeGame,loadTimer,lastGameStatus;
const t=(key,values={})=>Object.entries(values).reduce((s,[k,v])=>s.replaceAll(`{${k}}`,String(v)),copy[lang][key]||key);
const local=g=>({...g,...g.i18n?.[lang]});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const featured=['voxel-musou','misty-bunny','regolith','kart-royale','space-pirates','tiny-town','vibe-basketball','orbit-golf','san-juan-kart','operation-ironhold','sketchbook'];
function readStoredIds(key,max=Infinity){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string').slice(0,max):[];}catch{return[];}}
let recent=readStoredIds('zyvoqix_v13_recent',12),favorites=readStoredIds('zyvoqix_v8_favorites');
function syncSavedState(){recent=readStoredIds('zyvoqix_v13_recent',12);favorites=readStoredIds('zyvoqix_v8_favorites');render();}

function render(){
 const q=$('search').value.trim().toLocaleLowerCase();
 const list=games.filter(g=>(category==='all'||category==='favorites'&&favorites.includes(g.id)||category==='recent'&&recent.includes(g.id)||category==='mobile'&&!g.desktop||g.categories.includes(category))&&`${g.name} ${g.description} ${g.search} ${g.i18n?.en?.description||''}`.toLocaleLowerCase().includes(q));
 const sort=$('sort')?.value||'featured';
 const priority=id=>{const n=featured.indexOf(id);return n<0?999:n;};
 list.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,lang):sort==='small'?a.runtimeMB-b.runtimeMB:sort==='new'?games.indexOf(b)-games.indexOf(a):priority(a.id)-priority(b.id));
 $('count').textContent=t('available',{n:list.length});$('totalGames').textContent=String(games.length).padStart(2,'0');
 $('gameGrid').innerHTML=list.length?list.map(base=>{const g=local(base);return `<article class="game"><div class="cover" data-art="${g.id}">${g.cover?`<img src="${g.cover}" alt="${escape(g.name)} — ${t('screenshot')}" loading="lazy" width="620" height="320">`:`<div class="tactical-cover" role="img" aria-label="${t('imageArt')}"><strong>${escape(g.name).replaceAll(' ','<br>')}</strong></div>`}<span class="badge">${escape(g.tag)}</span><span class="type">${escape(g.genre)}</span></div><div class="game-body"><div class="game-title"><h3><a href="${lang==='ar'?'/ar':''}/play/${g.id}/">${escape(g.name)}</a></h3><button class="heart-new" data-fav="${g.id}" aria-label="${escape(t('favoriteLabel',{name:g.name}))}" aria-pressed="${favorites.includes(g.id)}">${favorites.includes(g.id)?'♥':'♡'}</button></div><p>${escape(g.description)}</p><div class="pills"><span>${escape(g.device)}</span><span>${escape(g.kind)}</span><span>${g.runtimeMB} MB ${t('files')}</span></div><div class="game-bottom"><button class="play" data-play="${g.id}">${t('play')}</button><a class="license-link" href="#credit-${g.id}">${escape(g.author)} · ${t('rights')}</a></div></div></article>`;}).join(''):`<p class="empty">${t('empty')}</p>`;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
}
function credits(){$('creditsGrid').innerHTML=games.map(base=>{const g=local(base);return `<article class="credit" id="credit-${g.id}"><strong>${escape(g.name)}</strong><p>${escape(g.author)} · ${escape(g.license)}</p><p>${escape(g.notice)}</p><a href="${g.source}" target="_blank" rel="noopener noreferrer">${t('originalSource')}</a> · <a href="/licenses/${g.id}.txt">${t('license')}</a>${g.sourceArchive?` · <a href="${g.sourceArchive}">${t('modifiedSource')}</a>`:''}</article>`;}).join('');}
function applyLanguage(value){
 lang=setLanguage(value);
 const localePath=lang==='ar'?'/ar/':'/';
 if(['/', '/ar/', '/index.html'].includes(location.pathname)){
  if(location.pathname!==localePath)history.replaceState(null,'',localePath+location.search+location.hash);
  document.documentElement.dataset.locale=lang;
  const canonical=document.querySelector('link[rel=canonical]');if(canonical){const publicOrigin=new URL(canonical.href).origin;canonical.href=publicOrigin+localePath;document.querySelector('meta[property="og:url"]')?.setAttribute('content',publicOrigin+localePath);}
 }
 document.querySelectorAll('[data-data-link]').forEach(a=>a.href=(lang==='ar'?'/ar':'')+'/super-admin/');
 document.title=t('title');document.querySelector('meta[name="description"]').content=t('description');
 document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
 document.querySelectorAll('[data-t-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.tLabel)));
 $('search').placeholder=t('search');render();credits();
 playerScreen?.refresh();
 if(activeGame){$('help').textContent=local(activeGame).controls;if(!$('playerArea').querySelector('iframe'))launchPanel();else if(lastGameStatus)showGameStatus(lastGameStatus.status,lastGameStatus.detail);}
}
function supports(g){const c=document.createElement('canvas');try{const gl=c.getContext('webgl2')||(!g.webgl2&&c.getContext('webgl'));if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}catch{return false;}}
function launchPanel(){const g=local(activeGame),ok=supports(g);$('playerArea').innerHTML=`<div class="launch-panel"><span class="eyebrow">${t('direct')}</span><h2>${escape(g.name)}</h2><p>${escape(g.description)}</p><div class="controls">${escape(g.controls)}</div>${!ok?`<p class="warning">${t('unsupported')}</p>`:''}${matchMedia('(pointer:coarse)').matches&&g.desktop?`<p class="warning">${t('desktop')}</p>`:''}<button class="play" id="launch">${t(ok?'start':'openScreen')}</button><p class="launch-note">${t('download',{n:g.runtimeMB})}</p><p class="launch-note">${t('gameLanguage')}</p><p class="launch-note">${t('landscape')}</p></div>`;$('launch').addEventListener('click',launch);}
function open(id){const game=games.find(g=>g.id===id);if(!game)return;previousFocus=document.activeElement;activeGame=game;$('player').hidden=false;document.body.style.overflow='hidden';$('playerTitle').textContent=game.name;$('restart').hidden=true;$('fullscreen').hidden=true;$('directGameLink').hidden=true;$('help').textContent=local(game).controls;launchPanel();$('close').focus();history.replaceState(null,'',`#play-${game.id}`);}
function showGameStatus(status,detail=''){
 if(!activeGame)return;lastGameStatus={status,detail};$('gameStatus')?.remove();
 if(status==='error')clearTimeout(loadTimer);
 if(status==='ready'||status==='loaded'&&activeGame.id!=='space-pirates'){clearTimeout(loadTimer);return;}
 if(!['boot','loading','slow','error'].includes(status))return;
 const box=document.createElement('div');box.id='gameStatus';box.className='game-status'+(status==='error'?' is-error':'');box.setAttribute('role',status==='error'?'alert':'status');
 const h=document.createElement('h2');h.textContent=t(status==='error'?'gameFailed':'loadingGame');box.append(h);
 const p=document.createElement('p');p.textContent=t(status==='error'?'failureHelp':status==='slow'?'slowGame':'download',{n:activeGame.runtimeMB});box.append(p);
 if(status==='error'&&detail){const technical=document.createElement('details');const label=document.createElement('summary');label.textContent=lang==='ar'?'تفاصيل الخطأ':'Error details';const code=document.createElement('p');code.textContent=detail;technical.append(label,code);box.append(technical);clearTimeout(loadTimer);}
 if(status==='error'||status==='slow'){const retry=document.createElement('button');retry.type='button';retry.className='play';retry.textContent=t('retryGame');retry.onclick=launch;box.append(retry);const a=document.createElement('a');a.href=activeGame.entry+'?zyvoqixRelease=16';a.target='_blank';a.rel='noopener';a.textContent=t('directGame');box.append(a);}
 $('playerArea').append(box);
}
function launch(){
 if(!activeGame)return;clearTimeout(loadTimer);lastGameStatus=null;recent=[activeGame.id,...recent.filter(id=>id!==activeGame.id)].slice(0,12);try{localStorage.setItem('zyvoqix_v13_recent',JSON.stringify(recent));}catch{}
 const f=document.createElement('iframe');f.title=activeGame.name;const url=new URL(activeGame.entry,location.origin);url.searchParams.set('zyvoqixRelease','16');f.src=url.pathname+url.search;f.allow='fullscreen; gamepad; autoplay';f.allowFullscreen=true;
 $('playerArea').replaceChildren(f);$('restart').hidden=false;$('fullscreen').hidden=false;$('directGameLink').hidden=false;$('directGameLink').href=f.src;showGameStatus('loading');
 loadTimer=setTimeout(()=>showGameStatus('slow'),60000);
 f.addEventListener('load',()=>{f.focus();});
}
window.addEventListener('message',e=>{const f=$('playerArea').querySelector('iframe');if(!f||e.origin!==location.origin||e.source!==f.contentWindow||e.data?.type!=='zyvoqix-game-status')return;const {status,detail}=e.data;if(['boot','ready','loaded','slow','error'].includes(status))showGameStatus(status,typeof detail==='string'?detail.slice(0,600):'');});
function close(){playerScreen.exit();clearTimeout(loadTimer);lastGameStatus=null;$('directGameLink').hidden=true;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});$('playerArea').replaceChildren();$('player').hidden=true;document.body.style.overflow='';activeGame=null;history.replaceState(null,'','#library');(previousFocus?.isConnected?previousFocus:document.querySelector(`[data-play="${previousFocus?.dataset?.play||''}"]`))?.focus();}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.language)applyLanguage(b.dataset.language);if(b.dataset.play)open(b.dataset.play);if(b.dataset.fav){favorites=favorites.includes(b.dataset.fav)?favorites.filter(x=>x!==b.dataset.fav):[...favorites,b.dataset.fav];try{localStorage.setItem('zyvoqix_v8_favorites',JSON.stringify(favorites));}catch{}render();}if(b.dataset.filter){category=b.dataset.filter;render();}});
window.addEventListener('storage',e=>{if(e.key==='zyvoqix_language')applyLanguage(getLanguage());if(['zyvoqix_v8_favorites','zyvoqix_v13_recent'].includes(e.key))syncSavedState();});
window.addEventListener('pageshow',syncSavedState);
$('search').addEventListener('input',render);$('sort')?.addEventListener('change',render);$('close').addEventListener('click',close);$('restart').addEventListener('click',launch);const playerScreen=screenMode($('player'),$('fullscreen'));
$('player').addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement){e.preventDefault();close();}if(e.key==='Tab'){const items=[...$('player').querySelectorAll('button:not([hidden]),iframe')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
const query=new URLSearchParams(location.search).get('q');if(query)$('search').value=query.slice(0,200);
applyLanguage(lang);
try{localStorage.setItem('zyvoqix_hub_visited','true');}catch{}
const oldHubRoutes={rankings:'/rankings.html',tiers:'/tiers.html',comments:'/community.html',community:'/community.html',missions:'/missions.html'};
const restoreRoute=()=>{const to=oldHubRoutes[location.hash.slice(1)];if(to)location.replace(to);};
window.addEventListener('hashchange',restoreRoute);restoreRoute();
// The generated catalog is authoritative. Avoid replacing cards while a first click is in progress.
if(!games.length){try{const r=await fetch('/library-catalog.json');if(!r.ok)throw Error(r.status);const data=await r.json();if(!Array.isArray(data)||!data.every(g=>g&&typeof g.id==='string'))throw Error('catalog');games=data;applyLanguage(lang);}catch{$('count').textContent=t('catalogError');}}
const launchId=location.hash.startsWith('#play-')&&location.hash.slice(6);if(launchId)open(launchId);
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
