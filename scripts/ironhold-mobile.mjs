// MIT adaptation for StarKnightt/operation-ironhold, pinned upstream 4098330664d66085cb1775c0783597070c32172b.
// Original code and license stay in the runtime archive. Only input/UI and mobile resolution are adapted.
export function touchState(keys,player,look){
 const movement=new Map();let aim=null;
 function move(){for(const key of ['KeyW','KeyS','KeyA','KeyD'])keys[key]=false;for(const {x,y}of movement.values()){if(y<-.22)keys.KeyW=true;if(y>.22)keys.KeyS=true;if(x<-.22)keys.KeyA=true;if(x>.22)keys.KeyD=true;}}
 return {movement(id,x,y){movement.set(id,{x,y});move();},endMove(id){movement.delete(id);move();},aim(id,x,y){if(aim&&aim.id!==id)return;aim={id,x,y};},look(id,x,y){if(aim?.id!==id)return;look(x-aim.x,y-aim.y);aim={id,x,y};},endAim(id){if(aim?.id===id)aim=null;},fire(down){player.triggerHeld=down;if(down)player.clickBuf=.12;else player.triggerReleased=true;},reset(){movement.clear();move();aim=null;player.triggerHeld=false;player.triggerReleased=true;keys.Space=false;keys.ShiftLeft=false;keys.ControlLeft=false;}};
}
const inputCode=()=>`
// ZYVOQIX V15: iPhone/touch controls; does not emulate an unsupported Pointer Lock API.
const mobileMode=matchMedia('(pointer:coarse)').matches||typeof document.body.requestPointerLock!=='function';
const mobileState=(${touchState.toString()})(keys,player,(dx,dy)=>{mouseDX+=dx*1.5;mouseDY+=dy*1.5;});
let mobileHUD;
function mobileClear(){mobileState.reset();}
function mobileHide(){mobileClear();if(mobileHUD)mobileHUD.hidden=true;}
function mobilePause(){if(!mobileMode||!G.started||G.over)return;G.paused=true;G.running=false;mobileHide();UI.pause.classList.add('on');player.ads=false;SFX.suspend();}
function mobileControls(){
 if(!mobileHUD){
  const ar=(()=>{try{return localStorage.getItem('zyvoqix_language')==='ar';}catch{return false;}})();
  const w=ar?['حركة','اسحب للتصويب','إطلاق','تعبئة','قفز','تقريب','سلاح','إيقاف','جري','انحناء']:['Move','Drag to aim','Fire','Reload','Jump','Aim','Weapon','Pause','Run','Crouch'];
  document.documentElement.classList.add('zy-touch');
  const style=document.createElement('style');style.textContent=\`
   #zy-touch[hidden]{display:none!important}#zy-touch{position:fixed;inset:0;z-index:25;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none}
   #zy-pad{position:absolute;left:max(18px,env(safe-area-inset-left));bottom:max(28px,env(safe-area-inset-bottom));width:124px;height:124px;border:2px solid #e0eeff66;border-radius:50%;background:#0a142977;display:grid;place-items:center;pointer-events:auto;color:#fff;font:13px Arial;touch-action:none}
   #zy-look{position:absolute;right:0;top:25%;width:52%;height:50%;pointer-events:auto;touch-action:none}#zy-look span{position:absolute;top:10%;left:12%;font:12px Arial;color:#fff9}
   #zy-touch .zy-buttons{position:absolute;bottom:max(22px,env(safe-area-inset-bottom));right:max(14px,env(safe-area-inset-right));width:200px;display:grid;grid-template-columns:repeat(3,1fr);gap:7px;pointer-events:auto}
   #zy-touch button{font:12px Arial;color:white;background:#15273acc;border:1px solid #b9d1e988;border-radius:10px;min-height:43px;touch-action:none;padding:6px}#zy-touch .zy-fire{background:#a44d25cc;grid-column:span 2;font-weight:bold}#zy-pause{position:absolute;right:15px;top:15px;pointer-events:auto}
   .zy-touch .screen{overflow:auto;padding:25px 22px}.zy-touch #startScreen .title{font-size:clamp(30px,8vw,64px)}.zy-touch #startScreen .keys{display:none}.zy-touch #startScreen .cta{font-size:17px;letter-spacing:3px;margin-top:25px}.zy-touch #startScreen .slug{display:none}.zy-touch #mapWrap{transform:scale(.6);transform-origin:top left;top:12px;left:10px}.zy-touch #slots{display:none}.zy-touch #ammo{bottom:170px;right:12px;transform:scale(.72);transform-origin:bottom right}.zy-touch #vitals{bottom:170px;left:14px;width:115px}.zy-touch #top{top:15px;font-size:12px}.zy-touch #timer{font-size:26px}.zy-touch #objective{font-size:10px}
   @media(orientation:landscape) and (max-height:520px){#zy-pad{width:105px;height:105px;bottom:12px}#zy-touch .zy-buttons{bottom:10px;width:205px}#zy-touch button{min-height:35px}.zy-touch #ammo{bottom:140px}.zy-touch #vitals{bottom:140px}.zy-touch #mapWrap{transform:scale(.45)}}
  \`;document.head.append(style);
  mobileHUD=document.createElement('div');mobileHUD.id='zy-touch';mobileHUD.hidden=true;
  const pad=document.createElement('div');pad.id='zy-pad';pad.textContent=w[0];pad.setAttribute('aria-label',w[0]);
  const look=document.createElement('div');look.id='zy-look';const hint=document.createElement('span');hint.textContent=w[1];look.append(hint);
  const buttons=document.createElement('div');buttons.className='zy-buttons';
  function down(el,fn,up){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);fn(e);});for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,e=>{e.preventDefault();e.stopPropagation();up?.(e);});el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});}
  function button(label,fn,up,cl=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cl;down(b,fn,up);buttons.append(b);return b;}
  down(pad,e=>{const r=pad.getBoundingClientRect();pad._center={x:r.left+r.width/2,y:r.top+r.height/2,r:r.width/2};mobileState.movement(e.pointerId,(e.clientX-pad._center.x)/pad._center.r,(e.clientY-pad._center.y)/pad._center.r);},e=>mobileState.endMove(e.pointerId));
  pad.addEventListener('pointermove',e=>{if(!pad.hasPointerCapture(e.pointerId)||!pad._center)return;e.preventDefault();const c=pad._center;mobileState.movement(e.pointerId,(e.clientX-c.x)/c.r,(e.clientY-c.y)/c.r);});
  down(look,e=>mobileState.aim(e.pointerId,e.clientX,e.clientY),e=>mobileState.endAim(e.pointerId));look.addEventListener('pointermove',e=>{if(!look.hasPointerCapture(e.pointerId))return;e.preventDefault();mobileState.look(e.pointerId,e.clientX,e.clientY);});
  button(w[2],()=>{if(G.running)mobileState.fire(true);},()=>mobileState.fire(false),'zy-fire');button(w[3],()=>{if(G.running)startReload();});
  button(w[4],()=>{keys.Space=true;player.spaceEdge=true;},()=>{keys.Space=false;});button(w[5],()=>{if(G.running)toggleADS();});button(w[6],()=>{if(G.running)switchWeapon((player.weapon+1)%WEAPONS.length);});
  button(w[8],()=>{keys.ShiftLeft=true;},()=>{keys.ShiftLeft=false;});button(w[9],()=>{keys.ControlLeft=true;},()=>{keys.ControlLeft=false;});
  const pause=document.createElement('button');pause.id='zy-pause';pause.type='button';pause.textContent=w[7];down(pause,mobilePause);
  mobileHUD.append(pad,look,buttons,pause);document.body.append(mobileHUD);
 }
 mobileHUD.hidden=false;
}
if(mobileMode){
 document.documentElement.classList.add('zy-touch');
 const description=document.querySelector('#startScreen .hint');if(description)description.textContent='Touch: left pad to move · drag right to aim · Fire / Reload / Jump. Rotate for a wider view.';
 // Prepare controls while the opening screen remains in charge of starting the round.
 mobileControls();mobileHide();
 addEventListener('blur',mobilePause);document.addEventListener('visibilitychange',()=>{if(document.hidden)mobilePause();});
}
`;
export function patchIronhold(html){
 if(html.includes('ZYVOQIX V15: iPhone/touch controls'))return html;
 const marker="document.addEventListener('pointerlockchange', ()=>{";
 if(!html.includes(marker)||!html.includes('const p = document.body.requestPointerLock();'))throw Error('Ironhold input source changed; review mobile patch');
 html=html.replace(marker,inputCode()+"\ndocument.addEventListener('pointerlockchange', ()=>{\n  if(mobileMode)return;");
 html=html.replace('function requestLock(){\n  const p = document.body.requestPointerLock();',`function requestLock(){
  if(mobileMode){mobileControls();G.paused=false;UI.pause.classList.remove('on');if(G.started&&!G.over){G.running=true;SFX.resume();}return;}
  let p;try{p=document.body.requestPointerLock();}catch{G.paused=true;G.running=false;UI.pause.classList.add('on');return;}`);
 html=html.replace('function endGame(win){','function endGame(win){\n  if(mobileMode)mobileHide();');
 html=html.replace('if (document.pointerLockElement) document.exitPointerLock();',"if(document.pointerLockElement&&typeof document.exitPointerLock==='function')document.exitPointerLock();");
 html=html.replace('const DPR = Math.min(window.devicePixelRatio||1, 1.5);',"const DPR = Math.min(window.devicePixelRatio||1, matchMedia('(pointer:coarse)').matches?1:1.5);");
 return html;
}
