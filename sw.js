// Service worker: lets the portfolio install as an app and open even with a weak or no connection.
const CACHE = 'leonel-portfolio-v1';
const CORE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/og-image.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                       // fonts, forms, counters: straight to the network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return;

  // Pages: try the network first (so updates show right away), fall back to the saved copy when offline or slow.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await Promise.race([
          fetch(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
        ]);
        if (net && net.ok) cache.put('/', net.clone());
        return net;
      } catch {
        return (await cache.match('/')) || Response.error();
      }
    })());
    return;
  }

  // Other files: answer from the saved copy at once, refresh it in the background.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const net = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
