import {screenMode} from './screen-mode.js';
import './navigation.js';
import {copy,setLanguage} from './language.js';
const game=JSON.parse(document.getElementById('gamePageData').textContent),lang=setLanguage(game.lang),t=k=>copy[lang][k]||k;
const $=id=>document.getElementById(id);let timer,lastStatus;const pageScreen=screenMode($('gameStage'),$('fullscreenGame'));
for(const link of document.querySelectorAll('[data-site-language]'))link.addEventListener('click',()=>setLanguage(link.dataset.siteLanguage));
let favorites=[];try{const v=JSON.parse(localStorage.getItem('zyvoqix_v8_favorites')||'[]');if(Array.isArray(v))favorites=v.filter(x=>typeof x==='string');}catch{}
function paintFavorite(){const selected=favorites.includes(game.id);$('favoriteGame').setAttribute('aria-pressed',String(selected));$('favoriteGame').textContent=selected?(lang==='ar'?'♥ في المفضلة':'♥ Saved'):(lang==='ar'?'♡ إضافة للمفضلة':'♡ Save game');}
$('favoriteGame').addEventListener('click',()=>{favorites=favorites.includes(game.id)?favorites.filter(x=>x!==game.id):[...favorites,game.id];try{localStorage.setItem('zyvoqix_v8_favorites',JSON.stringify(favorites));}catch{}paintFavorite();});paintFavorite();
function status(value,detail=''){
 lastStatus=value;if(value==='error')clearTimeout(timer);const box=$('launchStatus');box.replaceChildren();box.hidden=value==='ready'||value==='loaded'&&game.id!=='space-pirates';if(box.hidden){clearTimeout(timer);return;}
 const h=document.createElement('h2');h.textContent=t(value==='error'?'gameFailed':'loadingGame');box.append(h);const p=document.createElement('p');p.textContent=t(value==='error'?'failureHelp':value==='slow'?'slowGame':'download').replace('{n}',game.runtimeMB);box.append(p);
 if(value==='error'&&detail){const d=document.createElement('details'),s=document.createElement('summary'),text=document.createElement('p');s.textContent=lang==='ar'?'تفاصيل الخطأ':'Error details';text.textContent=String(detail).slice(0,600);d.append(s,text);box.append(d);clearTimeout(timer);}
 if(value==='error'||value==='slow'){const b=document.createElement('button');b.className='play';b.textContent=t('retryGame');b.onclick=launch;box.append(b);}
}
function launch(){
 clearTimeout(timer);const frame=document.createElement('iframe');frame.title=game.name;frame.src=game.entry+'?zyvoqixRelease=14';frame.allow='fullscreen; gamepad; autoplay';frame.allowFullscreen=true;$('gameMount').replaceChildren(frame);$('startGame').hidden=true;$('restartGame').hidden=false;$('fullscreenGame').hidden=false;$('openDirectGame').hidden=false;status('loading');
 frame.addEventListener('load',()=>frame.focus());timer=setTimeout(()=>status('slow'),60000);
 try{const v=JSON.parse(localStorage.getItem('zyvoqix_v13_recent')||'[]');const ids=Array.isArray(v)?v.filter(x=>typeof x==='string'):[];localStorage.setItem('zyvoqix_v13_recent',JSON.stringify([game.id,...ids.filter(x=>x!==game.id)].slice(0,12)));}catch{}
}
$('startGame').addEventListener('click',launch);$('restartGame').addEventListener('click',launch);
window.addEventListener('message',e=>{const frame=$('gameMount').querySelector('iframe');if(!frame||e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='zyvoqix-game-status')return;if(['boot','ready','loaded','slow','error'].includes(e.data.status))status(e.data.status,typeof e.data.detail==='string'?e.data.detail:'');});
if(matchMedia('(pointer:coarse)').matches&&game.desktop)$('deviceNotice').hidden=false;
try{const c=document.createElement('canvas');const gl=c.getContext('webgl2')||(!game.webgl2&&c.getContext('webgl'));if(!gl){$('graphicsNotice').hidden=false;}else gl.getExtension('WEBGL_lose_context')?.loseContext();}catch{$('graphicsNotice').hidden=false;}
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
