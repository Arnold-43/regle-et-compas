// Service worker : le jeu reste jouable hors ligne, et les mises à jour arrivent à l'ouverture suivante.
// Stratégie « réseau d'abord » : en ligne on sert toujours la dernière version, hors ligne le cache.
// __CACHE__ est remplacé au build par un nom unique par version.
const CACHE = '__CACHE__';
const CORE = [
  './', './index.html', './styles.css', './game.js', './engine.js', './levels.js', './version.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !isFont) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))),
  );
});
