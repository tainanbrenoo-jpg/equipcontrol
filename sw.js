// AssetExp — Service Worker v2
var CACHE = "assetexp-v2";

var ARQUIVOS = [
  "/",
  "/index.html",
  "/manifest.json",
  "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
  "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ARQUIVOS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(e) {
  var url = e.request.url;
  if (url.indexOf("supabase.co") >= 0 || url.indexOf("emailjs") >= 0) {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response("[]", { headers: { "Content-Type": "application/json" } });
    }));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res) {
      var clone = res.clone();
      caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      return res;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match("/index.html");
      });
    })
  );
});

self.addEventListener("message", function(e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});
