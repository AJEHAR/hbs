// HBS PWA Service Worker
const CACHE_NAME = 'hbs-cache-v1';
const STATIC_ASSETS = [
  '/hbs/',
  '/hbs/index.html',
  '/hbs/manifest.json',
  '/hbs/icon-192.png',
  '/hbs/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: bypass GAS/Google domains, serve static from cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // BYPASS — never cache these
  const bypass = [
    'script.google.com',
    'googleapis.com',
    'google.com',
    'accounts.google.com'
  ];

  if (bypass.some(domain => url.hostname.includes(domain))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/hbs/index.html'))
  );
});
