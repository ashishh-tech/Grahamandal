const CACHE_NAME = 'graha-tracker-v1.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './transit-calendar.html',
  './styles.css',
  './mobile-nav.css',
  './mobile-nav.js',
  './favicon.svg',
  './favicon.png',
  './manifest.json',
  './js/astrology-engine-v8.js',
  './js/chart-renderer.js',
  './js/graha-tracker.js',
  './js/transit-calendar.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});
