// AssetExp — Service Worker
// Versão do cache — aumente esse número sempre que fizer uma atualização
var CACHE = "assetexp-v1";

// Arquivos que ficam salvos para funcionar offline
var ARQUIVOS = [
  "/equipcontrol/",
  "/equipcontrol/index.html",
  "/equipcontrol/manifest.json",
  "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
  "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js",
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
];

// Instala e salva arquivos no cache
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ARQUIVOS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Ativa e limpa caches antigos
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

// Intercepta requisições
self.addEventListener("fetch", function(e) {
  var url = e.request.url;

  // Requisições ao Supabase sempre vão para a rede (dados em tempo real)
  if (url.indexOf("supabase.co") >= 0) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Para tudo mais: tenta rede primeiro, cai para cache se offline
  e.respondWith(
    fetch(e.request).then(function(res) {
      // Salva cópia no cache
      var clone = res.clone();
      caches.open(CACHE).then(function(cache) {
        cache.put(e.request, clone);
      });
      return res;
    }).catch(function() {
      // Offline: serve do cache
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match("/equipcontrol/index.html");
      });
    })
  );
});

// Recebe mensagem para forçar atualização
self.addEventListener("message", function(e) {
  if (e.data === "skipWaiting") {
    self.skipWaiting();
  }
});
