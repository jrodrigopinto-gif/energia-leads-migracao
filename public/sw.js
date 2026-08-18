// Service worker mínimo do LeadVolt PWA: cacheia o shell estático para o
// app abrir instantâneo/offline; dados (leads, sessão) sempre vêm da rede.
const CACHE_NAME = "leadvolt-shell-v1";
const SHELL_URLS = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Nunca cachear API/HTML dinâmico — só o shell estático (ícones/manifest).
  if (url.pathname.startsWith("/api/") || request.mode === "navigate") return;

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request))
  );
});
