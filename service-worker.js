const CACHE_NAME = "editr-cache-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./service-worker.js",
  "./html2canvas.js",
  "./jspdf.js",
  "./marked.js",
  "./manifest.json",
  "./editr192.svg",
  "./editr512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Pre-caching app shell");
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log("[ServiceWorker] Installation complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[ServiceWorker] Pre-cache error:", error);
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("editr-") && cacheName !== CACHE_NAME,
            )
            .map((cacheName) => {
              console.log("[ServiceWorker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Claiming clients");
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Try to get the resource from the cache.
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // If found in cache, return it.
        // And fetch a fresh version in the background.
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse);
          }
        });
        return cachedResponse;
      }

      // If not in cache, try to fetch from the network.
      try {
        const networkResponse = await fetch(event.request);
        // If the fetch is successful, cache the response.
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          cache.put(event.request, responseToCache);
        }
        return networkResponse;
      } catch (error) {
        // If the network fails, and it's a navigation request,
        // serve the offline page from the cache.
        if (event.request.mode === "navigate") {
          const offlinePage = await caches.match("./index.html");
          if (offlinePage) {
            return offlinePage;
          }
        }
        // For other types of requests, just fail.
        console.error("Fetch failed:", error);
        throw error;
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title || "editr Notification", {
        body: data.body || "Something important happened in editr",
        icon: "./editr192.png",
        data: data,
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open.
        for (let client of windowClients) {
          if (client.url.endsWith("/") && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new one.
        if (clients.openWindow) {
          return clients.openWindow("./");
        }
      }),
  );
});
