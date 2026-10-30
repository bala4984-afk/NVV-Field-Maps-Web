const CACHE='line-survey-review-82';const FILES=['existing-lines.js?v=82','editing.js?v=82','project-storage.js?v=82','coordinates.js?v=82','survey-extras.js?v=82','./','index.html','style.css','field.css','field.css?v=82','app.js','app.js?v=82','workspace.js','workspace.js?v=82','vendor/leaflet-rotate.js','kml-projects.js','kml-projects.js?v=82','install.js','map-tools.js','map-tools.js?v=82','villages.js','boundary-core.js','boundaries.js','excel-report.js','excel-report.js?v=82','angles.js','forests.js','districts.js','vertex-labels.js','vertex-labels.js?v=82','data/ap-districts.json','data/forests/manifest.json','data/ap-villages.zip','data/ap-gazette.json','data/ap-villages-source.json','core.js','feature-style.js','feature-style.js?v=82','manifest.json','icon.svg','nvv-logo.png','icon-192.png','icon-512.png','vendor/leaflet.css','vendor/leaflet.js','vendor/jszip.min.js','vendor/proj4.js','vendor/exceljs.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('line-survey-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(async r=>{if(r.ok&&u.pathname.includes('/data/forests/')){try{const cache=await caches.open(CACHE);await cache.put(e.request,r.clone())}catch{}}return r}))) });





