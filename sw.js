const CACHE_NAME = 'xps10-pwa-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-1024.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = new URL(req.url);
  const isNavigateRequest = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html');

  if (isNavigateRequest) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (!response || !response.ok) return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', responseClone));
          return response;
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(response => {
        if (!response || !response.ok) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(req, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(req).then(cached => cached || caches.match('./index.html'));
      })
  );
});
