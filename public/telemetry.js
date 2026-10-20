/* Optional GA4 analytics — loaded only after affirmative consent. */
(function(){
'use strict';
let enabled=false;
window.ZYVOQIX_METRICS={track:function(name,params){
 if(!enabled||typeof window.gtag!=='function'||!/^[a-z][a-z0-9_]{1,39}$/.test(name))return;
 const clean={};
 for(const key of ['game_id','game_source','launch_mode'])if(params&&typeof params[key]==='string')clean[key]=params[key].slice(0,80);
 window.gtag('event',name,clean);
}};
fetch('/portal-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(config=>{
 const id=String(config.ga4MeasurementId||'').trim();
 if(!/^G-[A-Z0-9]{5,18}$/.test(id))return;
 let saved;try{saved=localStorage.getItem('zyvoqix_analytics_consent')}catch{saved='no'}
 function load(){
  if(enabled)return;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config',id,{send_page_view:true});
  const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
  document.head.appendChild(tag);enabled=true
 }
 if(saved==='yes'){load();return}
 if(saved==='no')return;
 const dialog=document.createElement('aside');
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-label','الخصوصية والتحليلات');
 dialog.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;margin:auto;max-width:650px;z-index:10000;background:#172542;color:#fff;border:1px solid #537aae;padding:16px;border-radius:13px;font:13px/1.8 system-ui;box-shadow:0 15px 45px #0009';
 const description=document.createElement('p');description.textContent='هل توافق على Google Analytics لقياس الزيارات وتطوير الألعاب؟ لن نحمّل كود التتبع قبل موافقتك. تفاصيل أكثر في صفحة الخصوصية.';
 const buttons=document.createElement('div');buttons.style.cssText='display:flex;gap:10px';
 for(const [label,value] of [['أوافق','yes'],['لا أوافق','no']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='background:#245dab;color:#fff;border:0;padding:8px 15px;border-radius:8px;cursor:pointer;font-weight:700';
  button.onclick=()=>{try{localStorage.setItem('zyvoqix_analytics_consent',value)}catch{}dialog.remove();if(value==='yes')load()};
  buttons.appendChild(button)
 }
 dialog.append(description,buttons);document.body.appendChild(dialog)
}).catch(e=>console.warn('Optional analytics unavailable',e));
})();