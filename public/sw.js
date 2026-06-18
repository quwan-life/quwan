const CACHE = 'quwan-v5'
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/','/index.html','/manifest.json','/icons/icon-192.png','/icons/icon-512.png'])
    )
  )
  self.skipWaiting()
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k =>
    Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))
  ))
  self.clients.claim()
})
// 缓存优先，同时后台更新（Stale-While-Revalidate）
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(r => {
        if (r.ok) {
          caches.open(CACHE).then(x => x.put(e.request, r.clone()))
        }
        return r
      })
      return cached || fetched
    })
  )
})
