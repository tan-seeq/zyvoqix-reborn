// Refresh the existing site worker before a private page is used; older releases cached all HTML.
export const privateWorkerReady=(async()=>{
 if(!('serviceWorker' in navigator))return;
 const reg=await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
 await reg.update();const worker=reg.installing||reg.waiting;
 if(worker&&worker.state!=='activated')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('WORKER_UPDATE')),15000);const changed=()=>{if(worker.state==='activated'){clearTimeout(timer);resolve();}else if(worker.state==='redundant'){clearTimeout(timer);reject(Error('WORKER_UPDATE'));}};worker.addEventListener('statechange',changed);changed();});
})();
const lang=document.documentElement.lang==='ar'?'ar':'en';
let session=null;
export async function requireAdmin(){await privateWorkerReady;const response=await fetch('/api/admin?operation=session',{credentials:'same-origin',cache:'no-store'});if(response.status===401){session=null;location.replace((lang==='ar'?'/ar':'')+'/admin/login/?next='+encodeURIComponent(location.pathname));throw Error('AUTH_REQUIRED');}if(!response.ok)throw Error('AUTH_UNAVAILABLE');session=await response.json();return session;}
export async function logout(){const current=await requireAdmin(),r=await fetch('/api/admin',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':current.csrf},body:JSON.stringify({action:'logout'})});if(!r.ok)throw Error('LOGOUT_FAILED');session=null;location.replace((lang==='ar'?'/ar':'')+'/admin/login/');}
