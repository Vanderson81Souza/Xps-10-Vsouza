const CACHE_NAME = 'xps10-pwa-v1';

// Cache lista explícita (tudo que o app precisa para carregar sem rede)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-1024.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate event - clean old caches
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

// Fetch event
self.addEventListener('fetch', event => {
  // GET only (não cachear requests POST etc.)
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = new URL(req.url);

  // Para navegação (index.html e rotas), usar cache-first melhora MUITO o offline
  const isNavigateRequest = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html');

  if (isNavigateRequest) {
    event.respondWith(
      caches.match('./index.html')
        .then(cached => {
          // se tiver no cache, retorna imediatamente (offline friendly)
          if (cached) return cached;
          // senão tenta rede e salva no cache
          return fetch(req).then(response => {
            if (!response || !response.ok) return response;
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', responseClone));
            return response;
          });
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Para o resto: network-first com fallback
  event.respondWith(
    fetch(req)
      .then(response => {
        // Apenas recursos http(s)
        if (!response || !response.ok) return response;

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(req, responseClone);
        });

        return response;
      })
      .catch(() => {
        // fallback para cache
        return caches.match(req).then(cached => cached || caches.match('./index.html'));
      })
  );
});


