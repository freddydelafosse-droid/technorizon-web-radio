const CACHE='technorizon-v2-shell-8';
const SHELL=['/style-v2.css?v=13','/ImageLogoFinal.png','/Fond-Technorizon-V2.png.png','/jeux.css?v=3','/jeux.js?v=8','/jeux-data.js?v=1'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return}

  // HTML/navigation must always be network-first and is deliberately NOT stored in the app shell.
  // This prevents an installed PWA or an old browser tab from reopening a stale index.html.
  if(event.request.mode==='navigate'||event.request.destination==='document'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('/index.html')));
    return;
  }

  // JavaScript must also be refreshed first so player/navigation fixes take effect immediately.
  if(event.request.destination==='script'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
