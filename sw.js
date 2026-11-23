// Service worker : l'appli s'ouvre tout de suite depuis le cache (même sans réseau),
// et se met à jour toute seule en arrière-plan quand il y a du réseau.
// Mise à jour : ferme l'appli et rouvre-la deux fois avec du réseau.
// Si tu modifies sw.js, change le numéro de version ci-dessous.
var CACHE = 'consultation-nutri-v5';
var FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './logo.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: 'reload' évite de recopier une ancienne version gardée par le navigateur
      return Promise.all(FICHIERS.map(function (u) {
        return fetch(u, { cache: 'reload' }).then(function (r) {
          if (!r.ok) throw new Error('échec ' + u);
          return c.put(u, r);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
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
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        // Vérification en arrière-plan : la version à jour sera servie à l'ouverture suivante
        var maj = fetch(req, { cache: 'no-cache' }).then(function (rep) {
          if (rep && rep.ok) { cache.put(req, rep.clone()); }
          return rep;
        }).catch(function () { return null; });
        if (hit) { e.waitUntil(maj); return hit; }
        return maj.then(function (rep) {
          return rep || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
        });
      });
    })
  );
});
