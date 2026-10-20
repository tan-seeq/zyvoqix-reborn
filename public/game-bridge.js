// ZYVOQIX browser runtime bridge: surface real startup failures, including inside same-origin frames.
(()=>{
 const ar=(()=>{try{return localStorage.getItem('zyvoqix_language')==='ar';}catch{return false;}})();
 // New library games receive their own save namespace; existing twelve retain their saves.
 const gameId=location.pathname.split('/')[2];
 const originalGames=new Set(['space-pirates','kart-royale','dust-corridor','sketchbook','parapet','blockverse','island-survival','flight-sim','circuit-sprint','bowling','contra-run','beachy-ball']);
 if(gameId&&!originalGames.has(gameId))try{
  const storage=window.localStorage,prefix='zyvoqix_game_'+gameId+'_';
  const keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k?.startsWith(prefix));
  const methods={getItem:k=>storage.getItem(prefix+k),setItem:(k,v)=>storage.setItem(prefix+k,String(v)),removeItem:k=>storage.removeItem(prefix+k),clear:()=>keys().forEach(k=>storage.removeItem(k)),key:i=>keys()[i]?.slice(prefix.length)||null};
  Object.defineProperty(window,'localStorage',{configurable:true,value:new Proxy({}, {get:(_,k)=>k==='length'?keys().length:methods[k]||(typeof k==='string'?methods.getItem(k):undefined),set:(_,k,v)=>{methods.setItem(k,v);return true;},deleteProperty:(_,k)=>{methods.removeItem(k);return true;},ownKeys:()=>keys().map(k=>k.slice(prefix.length)),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})})});
 }catch{/* Browser storage restrictions are handled by the original game. */}
 const space=location.pathname.includes('/space-pirates/');let ready=false,failed=false,panel,timer;
 const send=(status,detail='')=>{if(parent!==window)parent.postMessage({type:'zyvoqix-game-status',status,detail:String(detail).slice(0,600)},location.origin);};
 function notice(kind,detail){
  const paint=()=>{if(!document.body)return;panel?.remove();panel=document.createElement('section');panel.id='zyvoqix-runtime-notice';panel.dir=ar?'rtl':'ltr';panel.setAttribute('role',kind==='error'?'alert':'status');panel.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#080d20ed;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font:16px/1.7 Arial,sans-serif;box-sizing:border-box';
  const title=document.createElement('h2');title.textContent=kind==='error'?(ar?'تعذر بدء اللعبة':'The game could not start'):(ar?'جاري تحميل اللعبة…':'Loading game…');panel.append(title);
  const text=document.createElement('p');text.textContent=kind==='error'?(ar?'لم تكتمل تهيئة الرسوم أو تحميل أحد الملفات. يمكنك إعادة المحاولة أو العودة للمكتبة.':'Graphics initialization or a required file failed. You can retry or return to the library.'):(ar?'يتم تحميل الموديلات والخامات من الموقع. قد تستغرق البداية وقتا على اتصال الموبايل.':'Models and textures are loading from this site. The first start can take a while on a mobile connection.');panel.append(text);
  if(detail){const code=document.createElement('p');code.style.cssText='max-width:700px;overflow-wrap:anywhere;color:#c1d4e9;font-size:12px';code.textContent=detail;panel.append(code);}
  if(kind==='error'){const retry=document.createElement('button');retry.textContent=ar?'أعد المحاولة':'Retry';retry.style.cssText='font:inherit;padding:10px 24px;border:0;border-radius:8px;background:#6dd7ff;color:#081020;cursor:pointer';retry.onclick=()=>location.reload();panel.append(retry);const back=document.createElement('a');back.textContent=ar?'العودة للمكتبة':'Back to library';back.href='/#library';back.target='_top';back.style.cssText='color:#9cdbff;margin-top:18px';panel.append(back);}
  document.body.append(panel);};document.body?paint():document.addEventListener('DOMContentLoaded',paint,{once:true});
 }
 function error(detail){if(failed)return;failed=true;clearTimeout(timer);send('error',detail);if(parent===window)notice('error',detail);}
 window.addEventListener('error',e=>{if(e.message)error(e.message);else if(e.target?.tagName==='SCRIPT')error('Script failed to load: '+e.target.getAttribute('src'));},true);
 window.addEventListener('unhandledrejection',e=>error(e.reason?.message||String(e.reason)));
 window.addEventListener('zyvoqix-game-error',e=>error(e.detail));
 window.addEventListener('zyvoqix-game-ready',()=>{if(failed)return;ready=true;clearTimeout(timer);panel?.remove();send('ready');});
 document.addEventListener('webglcontextlost',()=>error(ar?'فقد المتصفح اتصال الرسوم WebGL.':'The browser lost its WebGL graphics context.'),true);
 send('boot');
 if(space){notice('loading');timer=setTimeout(()=>{if(!ready&&!failed)send('slow');},45000);}
 window.addEventListener('load',()=>{if(!space&&!failed)send('loaded');});
})();
