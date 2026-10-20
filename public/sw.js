/* Static shell + original games are offline-capable after first successful visit.
   External games always require access to their providers and are never cached. */
const VERSION='zyvoqix-3d-lab-v7-20261020';
const SHELL=['/','/index.html','/nextgen.html','/nextgen.css','/nextgen.js','/styles.css','/app.js','/games.js','/arcade-pack.js','/ultra-catalog.js','/manifest.webmanifest','/assets/zyvoqix-hero-small.webp','/assets/zyvoqix-hero.webp','/assets/zyvoqix-brand.svg','/icons/zyvoqix-icon-192.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('zyvoqix-')||key.startsWith('gamezone-')).filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(VERSION).then(cache=>cache.put(event.request,copy)).catch(()=>{}))}return response}).catch(()=>caches.match(event.request).then(response=>response||(event.request.mode==='navigate'?caches.match('/index.html'):Response.error()))));
});