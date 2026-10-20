const res = await fetch('/library-catalog.json');
if (!res.ok) throw new Error('Game catalog unavailable');
const games = await res.json();
const $ = id => document.getElementById(id);
let category = 'all', previousFocus, activeGame;
let favorites = [];
try { favorites = JSON.parse(localStorage.getItem('zyvoqix_v8_favorites') || '[]'); if(!Array.isArray(favorites)) favorites=[]; } catch {}
const escape = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
  const q = $('search').value.trim().toLocaleLowerCase();
  const list = games.filter(g => (category==='all'||category==='favorites'&&favorites.includes(g.id)||g.categories.includes(category)) && `${g.name} ${g.description} ${g.search}`.toLocaleLowerCase().includes(q));
  $('count').textContent = `${list.length} تجارب متاحة داخل الموقع`;
  $('gameGrid').innerHTML = list.length ? list.map(g=>`<article class="game"><div class="cover">${g.cover ? `<img src="${g.cover}" alt="${escape(g.name)} — صورة من المشروع الأصلي" loading="lazy" width="620" height="320">` : '<div class="tactical-cover"><strong>DUST<br>CORRIDOR</strong></div>'}<span class="badge">${escape(g.tag)}</span><span class="type">${escape(g.genre)}</span></div><div class="game-body"><div class="game-title"><h3>${escape(g.name)}</h3><button class="heart-new" data-fav="${g.id}" aria-label="إضافة ${escape(g.name)} إلى المفضلة" aria-pressed="${favorites.includes(g.id)}">${favorites.includes(g.id)?'♥':'♡'}</button></div><p>${escape(g.description)}</p><div class="pills"><span>${escape(g.device)}</span><span>${escape(g.kind)}</span><span>${g.runtimeMB} MB ملفات تشغيل</span></div><div class="game-bottom"><button class="play" data-play="${g.id}">العب الآن ←</button><a class="license-link" href="#credit-${g.id}">${escape(g.author)} · حقوق النشر</a></div></div></article>`).join('') : '<p class="empty">لا توجد ألعاب مطابقة. جرّب اسمًا أو تصنيفًا آخر.</p>';
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
}
function persist(){try{localStorage.setItem('zyvoqix_v8_favorites',JSON.stringify(favorites));}catch{}}
function supports(g){const c=document.createElement('canvas');try {const gl=c.getContext(g.webgl2?'webgl2':'webgl2')||(!g.webgl2&&c.getContext('webgl')); if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}catch{return false;}}
function open(id){
  const game=games.find(g=>g.id===id);if(!game)return;
  previousFocus=document.activeElement;activeGame=game;
  $('player').hidden=false;document.body.style.overflow='hidden';$('playerTitle').textContent=game.name;
  $('restart').hidden=true;$('fullscreen').hidden=true;$('help').textContent=game.controls;
  const ok=supports(game);
  $('playerArea').innerHTML=`<div class="launch-panel"><span class="eyebrow">ZYVOQIX · DIRECT PLAY</span><h2>${escape(game.name)}</h2><p>${escape(game.description)}</p><div class="controls">${escape(game.controls)}</div>${!ok?'<p class="warning">المتصفح الحالي لا يتيح الرسوم ثلاثية الأبعاد المطلوبة. جرّب متصفحًا يدعم WebGL وتسريع الرسوم؛ لن تعمل اللعبة هنا حاليًا.</p>':''}${matchMedia('(pointer:coarse)').matches&&game.desktop?'<p class="warning">هذه اللعبة تحتاج كيبورد وماوس. اختَر جهاز كمبيوتر للاستمتاع بها.</p>':''}<button class="play" id="launch">${ok?'بدء اللعبة':'فتح شاشة اللعبة'}</button><p style="font-size:12px">تُحمّل ملفات اللعبة عند البدء فقط · ${game.runtimeMB} MB تقريبًا</p></div>`;
  $('launch').addEventListener('click',launch);$('close').focus();
  history.replaceState(null,'',`#play-${game.id}`);
}
function launch(){
  if(!activeGame)return;
  const f=document.createElement('iframe');f.title=activeGame.name;f.src=activeGame.entry;
  f.allow='fullscreen; gamepad; autoplay';f.allowFullscreen=true;
  $('playerArea').replaceChildren(f);$('restart').hidden=false;$('fullscreen').hidden=false;
  f.addEventListener('load',()=>f.focus());
}
function close(){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});$('playerArea').replaceChildren();$('player').hidden=true;document.body.style.overflow='';activeGame=null;history.replaceState(null,'','#library');previousFocus?.focus();}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.play)open(b.dataset.play);if(b.dataset.fav){favorites=favorites.includes(b.dataset.fav)?favorites.filter(x=>x!==b.dataset.fav):[...favorites,b.dataset.fav];persist();render();}if(b.dataset.filter){category=b.dataset.filter;render();}});
$('search').addEventListener('input',render);$('close').addEventListener('click',close);$('restart').addEventListener('click',launch);
$('fullscreen').addEventListener('click',()=>{$('player').requestFullscreen?.().catch(()=>{});});
$('player').addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement){e.preventDefault();close();}if(e.key==='Tab'){const items=[...$('player').querySelectorAll('button:not([hidden]),iframe')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('creditsGrid').innerHTML=games.map(g=>`<article class="credit" id="credit-${g.id}"><strong>${escape(g.name)}</strong><p>${escape(g.author)} · ${escape(g.license)}</p><p>${escape(g.notice)}</p><a href="${g.source}" target="_blank" rel="noopener noreferrer">المصدر الأصلي</a> · <a href="/licenses/${g.id}.txt">الترخيص والإسناد</a></article>`).join('');
render();
const requested=location.hash.startsWith('#play-')&&location.hash.slice(6);if(requested)open(requested);
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
