/*
 * Yugantra 2026 service worker: the site works offline at the venue.
 * Same-origin files are served cache-first and refreshed in the background;
 * Google Fonts are cached the first time they load. Bump VERSION on deploy.
 */
const VERSION = 'yugantra-2026-v2';
const CORE = [
  './',
  'index.html',
  'assets/css/main.css',
  'assets/js/content.js',
  'assets/js/dial.js',
  'assets/js/main.js',
  'manifest.webmanifest',
  'assets/img/icon-192.png',
  'assets/img/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: url.origin === self.location.origin });
      const fresh = fetch(req)
        .then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
        .catch(() => hit || (req.mode === 'navigate' ? cache.match('index.html') : Response.error()));
      return hit || fresh;
    })
  );
});
