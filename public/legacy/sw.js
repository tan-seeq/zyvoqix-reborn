/* Zyvoqix v4 offline fallback - network first, never caches cloud API or posts. */
const CACHE='zyvoqix-v4-2-20261020';
const SHELL=['/','/index.html','/v4.css','/zy-home.css','/v4.js','/manifest.webmanifest','/icons/zyvoqix-icon.svg','/brand/zyvoqix-logo.svg','/brand/zyvoqix-hero.webp'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>{}))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE&&(n.startsWith('gamezone-')||n.startsWith('zyvoqix-'))).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(fetch(request).then(response=>{
   if(response.ok&&response.type!=='opaque'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}))}
   return response;
 }).catch(()=>caches.match(request).then(cached=>cached||(request.mode==='navigate'?caches.match('/index.html'):Response.error()))));
});
