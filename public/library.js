import {getLanguage,setLanguage,copy} from './language.js';
const $=id=>document.getElementById(id);
let lang=setLanguage(getLanguage()),games=[],category='all',previousFocus,activeGame;
const t=(key,values={})=>Object.entries(values).reduce((s,[k,v])=>s.replaceAll(`{${k}}`,String(v)),copy[lang][key]||key);
const local=g=>({...g,...g.i18n?.[lang]});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let favorites=[];try{const x=JSON.parse(localStorage.getItem('zyvoqix_v8_favorites')||'[]');if(Array.isArray(x))favorites=x.filter(v=>typeof v==='string');}catch{}
function render(){
 const q=$('search').value.trim().toLocaleLowerCase();
 const list=games.filter(g=>(category==='all'||category==='favorites'&&favorites.includes(g.id)||g.categories.includes(category))&&`${g.name} ${g.description} ${g.search} ${g.i18n?.en?.description||''}`.toLocaleLowerCase().includes(q));
 $('count').textContent=t('available',{n:list.length});$('totalGames').textContent=String(games.length).padStart(2,'0');
 $('gameGrid').innerHTML=list.length?list.map(base=>{const g=local(base);return `<article class="game"><div class="cover" data-art="${g.id}">${g.cover?`<img src="${g.cover}" alt="${escape(g.name)} — ${t('screenshot')}" loading="lazy" width="620" height="320">`:`<div class="tactical-cover" role="img" aria-label="${t('imageArt')}"><strong>${escape(g.name).replaceAll(' ','<br>')}</strong></div>`}<span class="badge">${escape(g.tag)}</span><span class="type">${escape(g.genre)}</span></div><div class="game-body"><div class="game-title"><h3>${escape(g.name)}</h3><button class="heart-new" data-fav="${g.id}" aria-label="${escape(t('favoriteLabel',{name:g.name}))}" aria-pressed="${favorites.includes(g.id)}">${favorites.includes(g.id)?'♥':'♡'}</button></div><p>${escape(g.description)}</p><div class="pills"><span>${escape(g.device)}</span><span>${escape(g.kind)}</span><span>${g.runtimeMB} MB ${t('files')}</span></div><div class="game-bottom"><button class="play" data-play="${g.id}">${t('play')}</button><a class="license-link" href="#credit-${g.id}">${escape(g.author)} · ${t('rights')}</a></div></div></article>`;}).join(''):`<p class="empty">${t('empty')}</p>`;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
}
function credits(){$('creditsGrid').innerHTML=games.map(base=>{const g=local(base);return `<article class="credit" id="credit-${g.id}"><strong>${escape(g.name)}</strong><p>${escape(g.author)} · ${escape(g.license)}</p><p>${escape(g.notice)}</p><a href="${g.source}" target="_blank" rel="noopener noreferrer">${t('originalSource')}</a> · <a href="/licenses/${g.id}.txt">${t('license')}</a></article>`;}).join('');}
function applyLanguage(value){
 lang=setLanguage(value);document.title=t('title');document.querySelector('meta[name="description"]').content=t('description');
 document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
 document.querySelectorAll('[data-t-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.tLabel)));
 $('search').placeholder=t('search');render();credits();
 if(activeGame){$('help').textContent=local(activeGame).controls;if(!$('playerArea').querySelector('iframe'))launchPanel();}
}
function supports(g){const c=document.createElement('canvas');try{const gl=c.getContext('webgl2')||(!g.webgl2&&c.getContext('webgl'));if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}catch{return false;}}
function launchPanel(){const g=local(activeGame),ok=supports(g);$('playerArea').innerHTML=`<div class="launch-panel"><span class="eyebrow">${t('direct')}</span><h2>${escape(g.name)}</h2><p>${escape(g.description)}</p><div class="controls">${escape(g.controls)}</div>${!ok?`<p class="warning">${t('unsupported')}</p>`:''}${matchMedia('(pointer:coarse)').matches&&g.desktop?`<p class="warning">${t('desktop')}</p>`:''}<button class="play" id="launch">${t(ok?'start':'openScreen')}</button><p class="launch-note">${t('download',{n:g.runtimeMB})}</p><p class="launch-note">${t('gameLanguage')}</p></div>`;$('launch').addEventListener('click',launch);}
function open(id){const game=games.find(g=>g.id===id);if(!game)return;previousFocus=document.activeElement;activeGame=game;$('player').hidden=false;document.body.style.overflow='hidden';$('playerTitle').textContent=game.name;$('restart').hidden=true;$('fullscreen').hidden=true;$('help').textContent=local(game).controls;launchPanel();$('close').focus();history.replaceState(null,'',`#play-${game.id}`);}
function launch(){if(!activeGame)return;const f=document.createElement('iframe');f.title=activeGame.name;f.src=activeGame.entry;f.allow='fullscreen; gamepad; autoplay';f.allowFullscreen=true;$('playerArea').replaceChildren(f);$('restart').hidden=false;$('fullscreen').hidden=false;f.addEventListener('load',()=>f.focus());}
function close(){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});$('playerArea').replaceChildren();$('player').hidden=true;document.body.style.overflow='';activeGame=null;history.replaceState(null,'','#library');(previousFocus?.isConnected?previousFocus:document.querySelector(`[data-play="${previousFocus?.dataset?.play||''}"]`))?.focus();}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.language)applyLanguage(b.dataset.language);if(b.dataset.play)open(b.dataset.play);if(b.dataset.fav){favorites=favorites.includes(b.dataset.fav)?favorites.filter(x=>x!==b.dataset.fav):[...favorites,b.dataset.fav];try{localStorage.setItem('zyvoqix_v8_favorites',JSON.stringify(favorites));}catch{}render();}if(b.dataset.filter){category=b.dataset.filter;render();}});
window.addEventListener('storage',e=>{if(e.key==='zyvoqix_language')applyLanguage(getLanguage());});
$('search').addEventListener('input',render);$('close').addEventListener('click',close);$('restart').addEventListener('click',launch);$('fullscreen').addEventListener('click',()=>{$('player').requestFullscreen?.().catch(()=>{});});
$('player').addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement){e.preventDefault();close();}if(e.key==='Tab'){const items=[...$('player').querySelectorAll('button:not([hidden]),iframe')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
applyLanguage(lang);
try{localStorage.setItem('zyvoqix_hub_visited','true');}catch{}
const oldHubRoutes={rankings:'/rankings.html',tiers:'/tiers.html',comments:'/community.html',community:'/community.html',missions:'/missions.html'};
const restoreRoute=()=>{const to=oldHubRoutes[location.hash.slice(1)];if(to)location.replace(to);};
window.addEventListener('hashchange',restoreRoute);restoreRoute();
try{const r=await fetch('/library-catalog.json');if(!r.ok)throw Error(r.status);games=await r.json();applyLanguage(lang);const id=location.hash.startsWith('#play-')&&location.hash.slice(6);if(id)open(id);}catch{$('count').textContent=t('catalogError');$('gameGrid').innerHTML=`<p class="empty">${t('catalogError')} <button class="play" id="retryCatalog">${t('reload')}</button></p>`;$('retryCatalog').onclick=()=>location.reload();}
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
