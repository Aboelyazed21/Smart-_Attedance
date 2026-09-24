/* Attendify service worker — offline-first shell caching.
   Versioned cache; old caches are purged on activate. */

const CACHE = "attendify-shell-v1";

const CORE = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* Never cache API traffic. */
  if (url.pathname.startsWith("/api")) {
    return;
  }

  /* Navigations: network first, fall back to cached shell. */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put("/index.html", copy);
          });
          return response;
        })
        .catch(() =>
          caches.match("/index.html").then(
            (cached) =>
              cached ||
              new Response("Offline", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              })
          )
        )
    );
    return;
  }

  /* Static assets: cache first, then network. */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (
          response.ok &&
          (url.origin === self.location.origin ||
            request.destination === "image")
        ) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(request, copy);
          });
        }
        return response;
      });
    })
  );
});
