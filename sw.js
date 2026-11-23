// Service worker : garde l'application en cache pour qu'elle s'ouvre sans réseau.
// Quand tu modifies un fichier de l'appli, change le numéro de version ci-dessous.
var CACHE = 'consultation-equine-v4';
var FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './logo.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(noms.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // l'envoi vers Google ne passe jamais par le cache
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (rep) {
        if (rep && rep.ok) { var copie = rep.clone(); caches.open(CACHE).then(function (c) { c.put(req, copie); }); }
        return rep;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
