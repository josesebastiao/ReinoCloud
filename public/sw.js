const CACHE_NAME = "reinocloud-shell-v1";
const APP_SHELL_URLS = ["/", "/manifest.json", "/icon.svg", "/icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
});

// Estratégia simples: tenta rede, cai para cache para o shell básico
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Apenas GET
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      // Se não tiver no cache, tenta voltar para a home (SPA)
      if (request.mode === "navigate") {
        return caches.match("/");
      }

      return Promise.reject("Offline e recurso não encontrado em cache");
    }),
  );
});

