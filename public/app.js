import { createGame, stopCurrentGame } from './games.js';
import { PACK, createExpansionGame } from './arcade-pack.js';
import { ULTRA_PC_GAMES } from './ultra-catalog.js';

const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
const FAVORITES_KEY='zyvoqix_v5_favorites';
const SCORE_KEY='zyvoqix_v5_scores';
const readJSON=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch{return fallback}};
const saveJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
let favorites=new Set(readJSON(FAVORITES_KEY,[]));
let scores=readJSON(SCORE_KEY,{});
let category='all',query='',sort='featured',toastTimer=null,current=null;

const catLabels={all:'كل الألعاب',war:'حرب وتصويب',cars:'سيارات وسباقات',air:'طيارات وطيران',multiplayer:'ألعاب جماعية',action:'أكشن وتحديات',adventure:'مغامرات'};
const categories=[['war','⚔','حرب وتصويب'],['cars','🏎','سيارات وسباقات'],['air','✈','طيران ومعارك'],['multiplayer','♛','أونلاين وجماعي'],['action','⚡','أكشن حماسي'],['adventure','✦','مغامرات']];
const ext=(id,name,cat,desc,url,host,device='الكمبيوتر والموبايل')=>({id,name,cat,desc,url,host,device,type:'external'});
const local=(id,name,cat,desc)=>({id,name,cat,desc,type:'local',host:'ZYVOQIX Arcade',device:'كمبيوتر وموبايل'});
const ultra=g=>({...g,type:'pc',device:'PC download'});
const GAMES=[
 local('arena','NEON STRIKE','war','ساحة قتال سريعة؛ اهرب من الأعداء، اجمع الطاقة وحقق أعلى نقاط.'),
 local('racer','NITRO RUSH','cars','انطلق بأقصى سرعة، تفادى السيارات واستخدم النيترو للوصول للقمة.'),
 local('sky','SKY DEFENDER','air','معارك جوية، طائرات عدوة، إطلاق نار متواصل وزعماء جويين.'),
 local('undead','ZOMBIE OUTBREAK','war','الزومبي بيهاجموا من كل اتجاه؛ أكشن بقاء وإطلاق نار.'),
 local('tanks','IRON TANKS','war','معركة دبابات وتصويب صاروخي وتفادي القذائف.'),
 local('citadel','CITADEL DEFENSE','war','دفاع مستميت عن القاعدة بمدفع ليزر ضد الموجات.'),
 local('sharpshot','SHARPSHOT OPS','war','قنص أهداف متحركة وسرعة رد فعل وعدّاد وقت.'),
 local('titan','TITAN BOSS RAID','war','مواجهة زعيم آلي عملاق وهجوم شامل في الساحة.'),
 local('pursuit','MIDNIGHT PURSUIT','cars','مطاردة بوليس على الطريق الليلي المزدحم.'),
 local('driftx','DRIFT X CIRCUIT','cars','قيادة دريفت بحرية دوران وفرامل يد على حلبة.'),
 local('dust','DUST RALLY','cars','رالي صحراوي وحلبة ترابية وحواجز متحركة.'),
 local('nitrobike','NITRO BIKE','cars','دراجة نارية تتسابق وسط مرور سريع.'),
 local('demolition','DEMO DERBY','cars','تحطيم سيارات مدرعة وسباق تصادمات.'),
 local('intercept','JET INTERCEPTOR','air','مقاتلات جوية وإطلاق نار وصواريخ متقدمة.'),
 local('bomber','BOMBER COMMAND','air','مهمة قصف قواعد العدو من الطائرة.'),
 local('chopper','HELI RESCUE','air','مروحية لإنقاذ المدنيين والعودة إلى المنصة.'),
 local('meteor','METEOR STORM','air','اشتباك سفن فضاء مع النيازك المتساقطة.'),
 local('cloudrush','SKY SLALOM','air','تحديات الطيران بين الحلقات والصواعق.'),
 local('crypt','CRYPT ESCAPE','adventure','استكشف متاهة واجمع البلورات للهروب.'),
 local('treasure','TREASURE RAID','adventure','رحلة الكنوز والمفاتيح وحراس المتاهة.'),
 local('tomb','TEMPLE DASH','adventure','عداء داخل معبد ملئ بالفخاخ والحواجز.'),
 local('jungle','JUNGLE RUN','adventure','جري ومطاردات وقفزات داخل الغابة.'),
 local('parkour','NEON PARKOUR','adventure','منصات وقفز مزدوج وألغاز الوصول للنهاية.'),
 local('gravity','GRAVITY FLIP','adventure','مغامرة منصات بقلب الجاذبية.'),
 ext('warbrokers','War Brokers','war','معارك فرق، Battle Royale، سيارات ودبابات.', 'https://warbrokers.io/','warbrokers.io','كمبيوتر'),
 ext('krunker','Krunker','war','تصويب منظور أول بمواجهات سريعة مع لاعبين.', 'https://krunker.io/','krunker.io','كمبيوتر'),
 ext('shell','Shell Shockers','war','قتال FPS جماعي بأسلوب مرح وسريع.', 'https://shellshock.io/','shellshock.io','كمبيوتر'),
 ext('narrow','Narrow One','war','معركة أقواس وسهام أونلاين بنظام الفرق.', 'https://narrow.one/','narrow.one','كمبيوتر وموبايل'),
 ext('bullet','Bullet Force','war','تصويب عسكري ثلاثي الأبعاد متعدد اللاعبين.', 'https://www.crazygames.com/game/bullet-force-multiplayer','CrazyGames','كمبيوتر'),
 ext('battledudes','BattleDudes.io','war','دبابات وأسلحة واشتباكات مع لاعبين آخرين.', 'https://www.crazygames.com/game/battledudes-io','CrazyGames'),
 ext('venge','Venge.io','war','تصويب FPS سريع وأبطال بقدرات مختلفة.', 'https://venge.io/','venge.io','كمبيوتر'),
 ext('kirka','Kirka.io','war','ساحات تصويب جماعية برسوم ثلاثية الأبعاد.', 'https://kirka.io/','kirka.io','كمبيوتر'),
 ext('zombs','Zombs Royale','war','معركة بقاء أونلاين تجمع عشرات اللاعبين.', 'https://zombsroyale.io/','zombsroyale.io'),
 ext('ev','Ev.io','war','حرب مستقبلية وتصويب خيال علمي في المتصفح.', 'https://ev.io/','ev.io','كمبيوتر'),
 ext('slowroads','Slow Roads','cars','قيادة واقعية في طرق ومناطق طبيعية بلا نهاية.', 'https://slowroads.io/','Slow Roads'),
 ext('smash','Smash Karts','cars','سباق كارت مع أسلحة ومعارك جماعية مباشرة.', 'https://www.crazygames.com/game/smash-karts','CrazyGames'),
 ext('madalin','Madalin Stunt Cars 2','cars','سيارات خارقة وقفزات مجنونة في عالم ثلاثي الأبعاد.', 'https://www.crazygames.com/game/madalin-stunt-cars-2','CrazyGames','كمبيوتر'),
 ext('drift','Drift Hunters','cars','سيارات وتعديلات وتحديات دريفت احترافية.', 'https://www.crazygames.com/game/drift-hunters','CrazyGames','كمبيوتر'),
 ext('skyriders','Sky Riders','cars','قيادة سيارات ودراجات فوق مضامير مرتفعة.', 'https://www.crazygames.com/game/sky-riders-buk','CrazyGames'),
 ext('superstar','Super Star Car','cars','سباق فورمولا وتطوير سيارتك وتحدي الحلبات.', 'https://www.crazygames.com/game/super-star-car','CrazyGames','كمبيوتر'),
 ext('rally','Rally Racer Dirt','cars','رالي ودريفت على مسارات أسفلت وتراب.', 'https://www.crazygames.com/game/rally-racer-dirt','CrazyGames'),
 ext('highway','Highway Racer','cars','سباقات وتحديات مراوغة السيارات في الشوارع.', 'https://www.crazygames.com/game/highway-racer','CrazyGames'),
 ext('traffic','Traffic Rider','cars','سباق دراجات نارية بمنظور الشخص الأول.', 'https://www.crazygames.com/game/traffic-rider-vvq','CrazyGames'),
 ext('polytrack','PolyTrack','cars','حلبات ثلاثية الأبعاد وتجارب قيادة بزمن قياسي.', 'https://www.crazygames.com/game/polytrack','CrazyGames'),
 ext('nightcity','Night City Racing','cars','سباقات سيارات داخل المدينة وتحديات قيادة.', 'https://www.crazygames.com/game/night-city-racing','CrazyGames'),
 ext('drive-mad','Drive Mad','cars','عقبات صعبة ومحاولات مجنونة للوصول للنهاية.', 'https://poki.com/en/g/drive-mad','Poki'),
 ext('geofs','GeoFS Flight Simulator','air','محاكي طيران مفتوح مع طائرات ومطارات حول العالم.', 'https://www.geo-fs.com/','GeoFS','كمبيوتر'),
 ext('starblast','Starblast.io','air','معارك سفن فضاء وجمع الموارد في مجرة تنافسية.', 'https://starblast.io/','starblast.io','كمبيوتر'),
 ext('airwars','Air Wars 3','air','معارك جوية وطائرات حربية ثلاثية الأبعاد.', 'https://www.crazygames.com/game/air-wars-3','CrazyGames','كمبيوتر'),
 ext('aces','Aces of the Sky','air','واجه أسراب الطائرات في معارك جوية ثلاثية الأبعاد.', 'https://www.crazygames.com/game/aces-of-the-sky-epic-dogfights','CrazyGames','كمبيوتر'),
 ext('fighterpilot','Fighter Aircraft Pilot','air','محاكي قيادة الطائرات المقاتلة ومهام عسكرية.', 'https://www.crazygames.com/game/fighter-aircraft-pilot','CrazyGames','كمبيوتر'),
 ext('spacewaves','Space Waves','air','تحكم بمركبة سريعة وتجاوز العقبات الفضائية.', 'https://www.crazygames.com/game/space-waves','CrazyGames'),
 ext('rocketbot','Rocket Bot Royale','multiplayer','معركة روبوتات ودبابات صاروخية وجزر قابلة للتدمير.', 'https://winterpixel.itch.io/rbr','Winterpixel'),
 ext('smash-multi','Smash Karts Online','multiplayer','معارك سيارات كارت مع لاعبين حقيقيين.', 'https://smashkarts.io/','Smash Karts'),
 ext('agar','Agar.io','multiplayer','كبر خليتك واستحوذ على الساحة في لعبة جماعية.', 'https://agar.io/','agar.io'),
 ext('slither','Slither.io','multiplayer','نافس لاعبين عالميين للبقاء كأطول ثعبان.', 'https://slither.io/','slither.io'),
 ext('skribbl','Skribbl.io','multiplayer','ارسم وخمن مع أصدقائك في غرف لعب مشتركة.', 'https://skribbl.io/','skribbl.io'),
 ext('gartic','Gartic Phone','multiplayer','تحدي رسومات وعبارات مع أصدقائك أونلاين.', 'https://garticphone.com/','Gartic Phone'),
 ext('bloxd','Bloxd.io','multiplayer','عالم بناء وباركور وتحديات أونلاين متعددة.', 'https://bloxd.io/','bloxd.io'),
 ext('diep','Diep.io','action','تحكم بدبابة، طوّر المدافع واهزم المنافسين.', 'https://diep.io/','diep.io'),
 ext('paper','Paper.io 2','action','احتل أكبر مساحة واحذر المنافسين حولك.', 'https://poki.com/en/g/paperio-2','Poki'),
 ext('jetrush','Jet Rush','action','طائرة نفاثة وسرعات مجنونة وتحديات تفادي العقبات.', 'https://www.crazygames.com/game/jet-rush','CrazyGames'),
 ext('subway','Subway Surfers','action','مراوغة متواصلة وقفزات سريعة في شوارع المدينة.', 'https://poki.com/en/g/subway-surfers','Poki'),
 ext('temple','Temple Run 2','action','مغامرة ركض وإثارة وتفادي فخاخ.', 'https://poki.com/en/g/temple-run-2','Poki'),
 ext('stickman','Stickman Hook','action','تعلق بالحبال وانطلق في مستويات سريعة.', 'https://poki.com/en/g/stickman-hook','Poki'),
 ext('littlealchemy','Little Alchemy 2','adventure','امزج العناصر واكتشف مئات الأشياء.', 'https://littlealchemy2.com/','Little Alchemy'),
 ext('wanderers','Wanderers.io','adventure','ابن قبيلتك واستكشف الجزيرة وادخل مواجهات.', 'https://wanderers.io/','wanderers.io'),
 ext('temple-1','Temple Run','adventure','مغامرة جري وهروب من الوحوش في أطلال معبد.', 'https://poki.com/en/g/temple-run','Poki'),
 ext('zombotron','Zombotron Re-Boot','adventure','استكشف عالمًا غريبًا وقاتل مخلوقات شرسة.', 'https://antkarlov.itch.io/zombotron-reboot','itch.io'),
 ...ULTRA_PC_GAMES.map(ultra),
];
const localGames=GAMES.filter(x=>x.type==='local');
const primaryLocal=localGames.map(x=>x.id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const shape={
 war:`<svg viewBox="0 0 300 160" fill="none"><path d="M28 128 100 75 155 83 220 35 271 98 194 132Z" stroke="#8df9ff" stroke-width="4" opacity=".5"/><circle cx="150" cy="76" r="46" stroke="#cfa5ff" stroke-width="7"/><circle cx="150" cy="76" r="29" stroke="#6ce8ff" stroke-width="2"/><path d="M150 12v36m0 56v37M84 76h38m57 0h38" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="76" r="8" fill="#d5f9ff"/></svg>`,
 cars:`<svg viewBox="0 0 300 160" fill="none"><path d="M30 114 72 80l29-36q9-12 22-13h80q17 0 26 17l24 31 15 11v29H30Z" fill="#253b91" stroke="#98ddff" stroke-width="5"/><path d="m100 43-24 39h142l-24-39Z" fill="#62d5ff" opacity=".75"/><rect x="27" y="104" width="246" height="29" rx="12" fill="#101a3b" stroke="#ab82ff" stroke-width="5"/><path d="M55 116h41m106 0h39" stroke="#eafcff" stroke-width="9" stroke-linecap="round"/><path d="M13 152h100m74 0h100" stroke="#7ce6ff" stroke-width="5"/></svg>`,
 air:`<svg viewBox="0 0 300 160" fill="none"><path d="M146 4q11 0 14 13l15 52 95 48v18l-107-17-15 29h-8l-15-29-105 17v-18l96-48 16-52q3-13 14-13Z" fill="#67baff" stroke="#d2eeff" stroke-width="4"/><path d="M146 4v138M116 70l60 0" stroke="#15265c" stroke-width="7"/><path d="M146 24 135 50h22Z" fill="#222e89"/><path d="M113 150h68" stroke="#ec86ff" stroke-width="4"/></svg>`,
 multiplayer:`<svg viewBox="0 0 300 160" fill="none"><circle cx="104" cy="54" r="26" fill="#61e8ff"/><circle cx="199" cy="55" r="26" fill="#cf86ff"/><path d="M44 139q4-57 60-57 57 0 60 57" fill="#2766c8" stroke="#8defff" stroke-width="4"/><path d="M140 139q4-54 59-54t60 54" fill="#5b35ad" stroke="#f2b4ff" stroke-width="4"/><path d="m131 78 21 21 22-21" stroke="#fff" stroke-width="6"/></svg>`,
 action:`<svg viewBox="0 0 300 160" fill="none"><path d="M169 5 79 94h60l-17 61 100-97h-64Z" fill="#60ccff" stroke="#f0ebff" stroke-width="4"/><path d="M169 15 95 90h56l-17 50 76-78h-61Z" fill="#8756ec" opacity=".85"/><circle cx="150" cy="84" r="79" stroke="#a765ff" stroke-dasharray="15 16" stroke-width="3"/></svg>`,
 adventure:`<svg viewBox="0 0 300 160" fill="none"><path d="M150 9 224 65 193 141H105L75 65Z" fill="#7256cc" stroke="#9fe7ff" stroke-width="6"/><path d="m150 9-19 59 19 73 19-73Z" fill="#83f1ff"/><path d="m75 65 56 3 19 73-45 0Zm149 0-55 3-19 73 43 0Z" fill="#c17aff" opacity=".7"/><path d="M53 31h35m-18-17v35m150-24h32m-16-16v32" stroke="#bceaff" stroke-width="4"/></svg>`
};
const artColors={war:'linear-gradient(135deg,#202052,#503183,#0d2f61)',cars:'linear-gradient(135deg,#602a40,#3d3879,#132e61)',air:'linear-gradient(135deg,#144e70,#25478c,#16194e)',multiplayer:'linear-gradient(135deg,#1c4c78,#5d2b78,#21255a)',action:'linear-gradient(135deg,#563271,#232d7a,#15315c)',adventure:'linear-gradient(135deg,#2e3976,#4a2861,#13516f)'};
const categoryName=c=>catLabels[c]||c;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300)}
function heart(id){return favorites.has(id)?'♥':'♡'}
function gameCard(g){let isLocal=g.type==='local';let labels=isLocal?'العب الآن':g.type==='pc'?'التحميل الرسمي':'افتح اللعبة';let score=(scores[g.id]||0);return `<article class="game-card" data-id="${g.id}"><div class="game-art" style="--card-bg:${artColors[g.cat]}">${isLocal?`<img class="game-thumb" loading="lazy" src="/assets/games/${g.id}.webp" alt="معاينة لعبة ${escapeHTML(g.name)}">`:shape[g.cat]}<span class="game-category-badge">${categoryName(g.cat)}</span><span class="game-device-label">${isLocal?'داخل الموقع':g.type==='pc'?'PC ULTRA - DOWNLOAD':g.device==='كمبيوتر'?'كمبيوتر فقط':'موقع خارجي ↗'}</span><button type="button" class="favorite-toggle ${favorites.has(g.id)?'active':''}" data-fav="${g.id}" aria-label="${favorites.has(g.id)?'إزالة من':'إضافة إلى'} المفضلة" aria-pressed="${favorites.has(g.id)}">${heart(g.id)}</button></div><div class="game-card-content"><h3>${escapeHTML(g.name)}</h3><p>${escapeHTML(g.desc)}</p><div class="game-card-bottom"><span class="game-host">${isLocal?`★ BEST ${score}`:escapeHTML(g.host)}</span><button type="button" class="open-game" data-play="${g.id}">${labels} <span>${isLocal?'▶':'↗'}</span></button></div></div></article>`}
function renderFeatured(){
 const list=['war','cars','air','adventure'].flatMap(cat=>localGames.filter(g=>g.cat===cat).slice(0,3));
 $('#featuredGrid').innerHTML=list.map((g,i)=>`<article class="featured-card" data-type="${g.id}"><span class="feature-tag">${i<3?'ORIGINAL CLASSIC':'INSTANT PLAY · V6'}</span><div class="feature-art"><img class="feature-thumb" loading="lazy" src="/assets/games/${g.id}.webp" alt="لقطة من لعبة ${escapeHTML(g.name)}"></div><div class="feature-content"><h3>${escapeHTML(g.name)}</h3><p>${escapeHTML(g.desc)}</p><div class="feature-bottom"><button type="button" class="cta-button" data-play="${g.id}">العب الآن <span>←</span></button><span class="feature-best" data-score="${g.id}">BEST ${scores[g.id]||0}</span></div></div></article>`).join('');
}
function renderCategories(){const nums=Object.fromEntries(categories.map(([id])=>[id,GAMES.filter(g=>g.cat===id).length]));$('#categoryTiles').innerHTML=categories.map(([id,icon,name])=>`<button type="button" class="category-tile ${id===category?'active':''}" data-category="${id}"><span class="cat-icon">${icon}</span><strong>${name}</strong><small>${nums[id]} ألعاب</small></button>`).join('')}
function renderFilters(){$('#filterChips').innerHTML=[['all','كل الألعاب'],...categories.map(([a,b,c])=>[a,c]),['local','العب داخل الموقع'],['pc','PC ULTRA - تحميل']].map(([id,label])=>`<button type="button" class="filter-chip ${id===category?'active':''}" data-category="${id}">${label}</button>`).join('')}
function getFiltered(){let arr=GAMES.filter(g=>(category==='all'||(category==='local'?g.type==='local':category==='pc'?g.type==='pc':g.cat===category))&&(!query||(g.name+' '+g.desc+' '+categoryName(g.cat)+' '+g.host).toLowerCase().includes(query)));
 if(sort==='name')arr.sort((a,b)=>a.name.localeCompare(b.name));if(sort==='category')arr.sort((a,b)=>categoryName(a.cat).localeCompare(categoryName(b.cat)));
 return arr}
function renderLibrary(){const items=getFiltered();$('#gamesGrid').innerHTML=items.map(gameCard).join('');$('#gameCount').textContent=`${items.length} لعبة`;$('#emptyState').hidden=items.length!==0;renderFilters();renderCategories()}
function renderFavorites(){const items=GAMES.filter(x=>favorites.has(x.id));$('#favoritesGrid').innerHTML=items.map(gameCard).join('');$('#favoritesEmpty').hidden=items.length!==0}
function setCategory(id){category=id;renderLibrary();const section=$('#library');section.scrollIntoView({behavior:'smooth',block:'start'})}
function toggleFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);saveJSON(FAVORITES_KEY,[...favorites]);renderLibrary();renderFavorites();toast(favorites.has(id)?'اتضافت للمفضلة ♥':'اتشالت من المفضلة')}
function enterSite(){const overlay=$('#welcome');overlay.classList.add('exiting');overlay.style.opacity='0';overlay.style.transition='opacity .35s';setTimeout(()=>{overlay.hidden=true;document.body.classList.remove('modal-open');$('#goHome').focus({preventScroll:true})},360)}
function setOverlay(title,text,button='ابدأ اللعب'){$('#gameOverlayTitle').textContent=title;$('#gameOverlayText').textContent=text;$('#startGame').textContent=button;$('#gameOverlay').hidden=false}
function openLocal(g){
 $('#gameModal').hidden=false;document.body.classList.add('modal-open');$('#modalTitle').textContent=g.name;
 const pack=PACK[g.id];
 const defaultHelp=g.id==='arena'?'الأسهم / WASD — إطلاق تلقائي — Space اندفاع':g.id==='racer'?'← → للتوجيه — Space للنيترو — تجنب التصادم':'الأسهم / WASD — إطلاق تلقائي — Space صواريخ';
 $('#gameInfo').textContent=pack?pack.help:defaultHelp;
 setOverlay(g.name,pack?pack.detail:g.desc,'ابدأ اللعب ←');
 const finish=(finalScore)=>{let old=scores[g.id]||0;if(finalScore>old){scores[g.id]=finalScore;saveJSON(SCORE_KEY,scores);toast('رقم قياسي جديد! '+finalScore)}$$(`[data-score="${g.id}"]`).forEach(el=>el.textContent='BEST '+(scores[g.id]||0));renderLibrary();renderFavorites()};
 current=pack?createExpansionGame(g.id,$('#gameCanvas'),finish,setOverlay):createGame(g.id,$('#gameCanvas'),finish,setOverlay);
 $('#closeGame').focus({preventScroll:true})
}
function closeLocal(){if(current)current.destroy();stopCurrentGame();current=null;$('#gameModal').hidden=true;document.body.classList.remove('modal-open');$('#gameOverlay').hidden=false;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
function playGame(id){let g=GAMES.find(x=>x.id===id);if(!g)return;if(g.type==='local'){openLocal(g)}else{const link=document.createElement('a');link.href=g.url;link.target='_blank';link.rel='noopener noreferrer';link.click()}}
function resetGame(){if(!current)return;current.reset();setOverlay($('#modalTitle').textContent,'جاهز لجولة جديدة؟','ابدأ من جديد ←')}
function showInfo(){ $('#infoModal').hidden=false;document.body.classList.add('modal-open');$('#closeInfo').focus() }
function closeInfo(){ $('#infoModal').hidden=true;document.body.classList.remove('modal-open') }
function navigate(){let hash=location.hash.replace('#','');if(hash==='favorites'){$('#favorites').hidden=false;renderFavorites();setTimeout(()=>$('#favorites').scrollIntoView({behavior:'smooth'}),30)}else{$('#favorites').hidden=true}$$('.nav-link').forEach(a=>a.classList.toggle('active',a.dataset.nav===(hash==='favorites'?'favorites':hash==='arcade'?'arcade':hash==='library'?'library':'home')));$('#menuToggle').setAttribute('aria-expanded','false');$('.top-nav').classList.remove('open')}

$('#enterBtn').addEventListener('click',enterSite);$('#skipWelcome').addEventListener('click',enterSite);
$('#welcome').addEventListener('keydown',ev=>{if(ev.key==='Escape'){enterSite()}if(ev.key==='Tab'&&!ev.shiftKey&&document.activeElement===$('#skipWelcome')){ev.preventDefault();$('#enterBtn').focus()} });
$('#focusSearch').addEventListener('click',()=>{location.hash='library';$('#searchInput').focus({preventScroll:false})});
$('#surpriseMe').addEventListener('click',()=>playGame(localGames[Math.floor(Math.random()*localGames.length)].id));
$('#menuToggle').addEventListener('click',()=>{const el=$('.top-nav');let opened=el.classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(opened))});
$('#searchInput').addEventListener('input',ev=>{query=ev.target.value.trim().toLowerCase();renderLibrary()});
$('#sortBy').addEventListener('change',ev=>{sort=ev.target.value;renderLibrary()});
$('#clearFilters').addEventListener('click',()=>{query='';category='all';$('#searchInput').value='';renderLibrary()});
document.addEventListener('click',ev=>{const fav=ev.target.closest('[data-fav]');if(fav){toggleFavorite(fav.dataset.fav);return}const play=ev.target.closest('[data-play]');if(play){playGame(play.dataset.play);return}const cat=ev.target.closest('[data-category]');if(cat){setCategory(cat.dataset.category)}});
$('#closeGame').addEventListener('click',closeLocal);$('#startGame').addEventListener('click',()=>{if(!current)return;$('#gameOverlay').hidden=true;current.start();$('#gameCanvas').focus({preventScroll:true})});$('#restartGame').addEventListener('click',resetGame);
$('#fullscreenBtn').addEventListener('click',()=>{let el=$('.modal-window');if(!document.fullscreenElement){el.requestFullscreen?.().catch(()=>toast('ملء الشاشة غير متاح'))}else document.exitFullscreen?.()});
$('#gameModal').addEventListener('click',ev=>{if(ev.target===$('#gameModal'))closeLocal()});
$('#aboutBtn').addEventListener('click',showInfo);$('#closeInfo').addEventListener('click',closeInfo);$('#infoOk').addEventListener('click',closeInfo);$('#infoModal').addEventListener('click',ev=>{if(ev.target===$('#infoModal'))closeInfo()});
window.addEventListener('hashchange',navigate);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(!$('#gameModal').hidden)closeLocal();else if(!$('#infoModal').hidden)closeInfo()}if(ev.key==='/'&&!ev.ctrlKey&&ev.target.tagName!=='INPUT'&&$('#welcome').hidden){ev.preventDefault();$('#searchInput').focus();location.hash='library'}});
for(const el of $$('[data-control]')){const code=el.dataset.control;const key={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',special:'Space'}[code];const change=pressed=>{if(current)current.setKey(key,pressed)};el.addEventListener('pointerdown',ev=>{ev.preventDefault();el.setPointerCapture(ev.pointerId);change(true)});for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,()=>change(false))}
renderFeatured();renderLibrary();renderFavorites();navigate();document.body.classList.add('modal-open');
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
