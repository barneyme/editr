const CACHE_NAME = "editr-v1";
const ASSETS_TO_CACHE = ["/", "/index.html", "/sw.js"];

// Install event: cache all essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

// Fetch event: serve from cache first, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // Not in cache - fetch from network
      return fetch(event.request);
    }),
  );
});
