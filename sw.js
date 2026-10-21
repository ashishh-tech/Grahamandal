/**
 * Graha Tracker Service Worker v2.1.8
 * - CRITICAL: Navigation requests (HTML page loads) are NOT intercepted.
 *   This avoids Cloudflare Pages 308 redirect ERR_FAILED issues.
 * - Static assets (CSS, JS, Fonts, Images): Stale-while-revalidate caching.
 */

const CACHE_NAME = 'graha-tracker-v2.1.8';

const CORE_ASSETS = [
    './styles.css',
    './mobile-nav.css',
    './mobile-nav.js',
    './logo.svg',
    './favicon.svg',
    './favicon.png',
    './manifest.json',
    './js/astrology-engine-v8.js',
    './js/chart-renderer.js',
    './js/graha-tracker.js',
    './js/transit-calendar.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(
                CORE_ASSETS.map(url => cache.add(url).catch(() => {}))
            )
        )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;

    // CRITICAL: Let browser handle HTML navigation natively to prevent ERR_FAILED
    if (event.request.mode === 'navigate') return;

    if (event.request.mode === 'no-cors') return;
    if (url.origin !== self.location.origin && !url.hostname.includes('googleapis.com')) return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(cached => {
            if (cached) {
                event.waitUntil(
                    fetch(event.request).then(response => {
                        if (response && response.ok && response.type !== 'opaqueredirect') {
                            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
                        }
                    }).catch(() => {})
                );
                return cached;
            }
            return fetch(event.request).then(response => {
                if (response && response.ok && response.type !== 'opaqueredirect') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                }
                return response;
            }).catch(() =>
                new Response('', { status: 204, statusText: 'No Content' })
            );
        })
    );
});
