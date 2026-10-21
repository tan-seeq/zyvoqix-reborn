// Native Pointer Lock adapter. Never fabricates a lock or changes browser prototypes.
(()=>{
 const doc=document;let pending=null,panel=null,lastTarget=null,lastOptions;
 const ar=()=>doc.documentElement.lang==='ar';
 const locked=el=>(doc.pointerLockElement||doc.mozPointerLockElement||doc.webkitPointerLockElement)===el;
 function remove(){panel?.remove();panel=null;}
 function notice(unsupported){
  const paint=()=>{
   if(!doc.body)return;remove();panel=doc.createElement('aside');panel.id='zyvoqix-input-notice';panel.setAttribute('role','status');panel.dir=ar()?'rtl':'ltr';
   panel.style.cssText='position:fixed;z-index:2147483646;bottom:16px;left:16px;right:16px;max-width:640px;margin:auto;padding:16px;border:1px solid #71d7ff;border-radius:12px;background:#0a142af5;color:#fff;font:15px/1.6 Arial,sans-serif;box-shadow:0 8px 32px #0008';
   const text=doc.createElement('p');text.style.margin='0 0 12px';text.textContent=unsupported?(ar()?'المتصفح لا يدعم قفل الماوس. إذا كانت هذه اللعبة تحتاجه، افتحها على كمبيوتر بلوحة مفاتيح وماوس. الألعاب المزودة بتحكم بديل يمكنها الاستمرار.':'This browser does not support mouse lock. Games that require it need a computer with a keyboard and mouse. Games with alternative controls can continue.'):(ar()?'لم يتم قفل الماوس. اضغط إعادة المحاولة للسماح بالتحكم، أو استخدم التحكم البديل إن توفر. اضغط Esc لتحرير الماوس.':'Mouse lock was not granted. Retry to enable mouse controls, or use the game’s alternative controls if available. Press Esc to release the mouse.');panel.append(text);
   if(!unsupported){const retry=doc.createElement('button');retry.textContent=ar()?'إعادة قفل الماوس':'Retry mouse lock';retry.style.cssText='padding:8px 12px;margin:0 8px 0 0;cursor:pointer';retry.onclick=()=>request(lastTarget,lastOptions).catch(()=>{});panel.append(retry);}
   const close=doc.createElement('button');close.textContent=ar()?'إغلاق الرسالة':'Dismiss';close.style.cssText='padding:8px 12px;cursor:pointer';close.onclick=remove;panel.append(close);
   const back=doc.createElement('a');back.href='/#library';back.target='_top';back.textContent=ar()?'مكتبة الألعاب':'Game library';back.style.cssText='color:#9ce4ff;margin:0 12px';panel.append(back);doc.body.append(panel);
  };doc.body?paint():doc.addEventListener('DOMContentLoaded',paint,{once:true});
 }
 function request(target,options){
  if(locked(target))return Promise.resolve();
  if(pending)return pending;
  lastTarget=target;lastOptions=options;
  const native=target&&(target.requestPointerLock||target.mozRequestPointerLock||target.webkitRequestPointerLock);
  const unsupported=typeof native!=='function';
  const promise=new Promise((resolve,reject)=>{
   if(unsupported){reject(Object.assign(new Error('Mouse lock is unavailable in this browser'),{name:'NotSupportedError'}));return;}
   let done=false,timer;
   const events=['pointerlockchange','mozpointerlockchange','webkitpointerlockchange'];
   function finish(error){if(done)return;done=true;clearTimeout(timer);for(const event of events)doc.removeEventListener(event,change);doc.removeEventListener('pointerlockerror',denied);error?reject(error):resolve();}
   function change(){if(locked(target))finish();}
   function denied(){finish(Object.assign(new Error('Mouse lock was not granted'),{name:'NotAllowedError'}));}
   for(const event of events)doc.addEventListener(event,change);doc.addEventListener('pointerlockerror',denied);
   timer=setTimeout(denied,2000);
   try{const result=native.call(target,options);if(result&&typeof result.then==='function')result.then(change,error=>finish(error));change();}catch(error){finish(error);}
  });
  pending=promise;
  // Attach both handlers immediately: old upstream callers ignore the return value.
  // Return the original rejection so games with their own fallback still receive it.
  promise.then(()=>{if(pending===promise)pending=null;remove();},()=>{if(pending===promise)pending=null;notice(unsupported);});
  return promise;
 }
 function release(owner=doc){const native=owner&&(owner.exitPointerLock||owner.mozExitPointerLock||owner.webkitExitPointerLock);if(typeof native!=='function')return;try{const result=native.call(owner);if(result&&typeof result.catch==='function')result.catch(()=>{});}catch{/* Releasing an absent or already released lock is harmless. */}}
 doc.addEventListener('pointerlockchange',()=>{if(doc.pointerLockElement)remove();});
 window.ZyvoqixPointerLock=Object.freeze({request,release});
})();
