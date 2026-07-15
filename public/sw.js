/* Finan PWA service worker */
const CACHE_NAME = "finan-shell-v2";
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png"];

function offlineResponse(message = "Offline") {
  return new Response(message, {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function fromCache(request) {
  const cached = await caches.match(request);
  return cached ?? null;
}

async function putInCache(request, response) {
  if (
    !response ||
    !response.ok ||
    response.type !== "basic" ||
    request.method !== "GET"
  ) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            // Ignora falhas de precache (ex.: SSO / rede)
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Deixa a rede pura para cross-origin (SSO da Vercel, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Manifest e service worker nunca devem passar por cache agressivo
  if (
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/sw.js"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => offlineResponse("Manifest offline")),
    );
    return;
  }

  // APIs: só rede
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: "Offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    return;
  }

  // Navegação: rede primeiro; fallback só com Response válida
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          // Não cacheia redirects (ex.: login / SSO)
          if (response.redirected || response.type !== "basic") {
            return response;
          }
          await putInCache(request, response);
          return response;
        } catch {
          const cached =
            (await fromCache(request)) ||
            (await fromCache("/")) ||
            (await fromCache("/login"));
          return cached || offlineResponse("Você está offline");
        }
      })(),
    );
    return;
  }

  // Demais assets: cache-first seguro
  event.respondWith(
    (async () => {
      const cached = await fromCache(request);
      if (cached) {
        void fetch(request)
          .then((response) => putInCache(request, response))
          .catch(() => undefined);
        return cached;
      }

      try {
        const response = await fetch(request);
        await putInCache(request, response);
        return response;
      } catch {
        return offlineResponse();
      }
    })(),
  );
});
