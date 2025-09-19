const CACHE_NAME = "editr-v1";
const urlsToCache = [
  "./",
  "./index.html", // Caching the root URL as index.html
  "./manifest.json",
  "https://cdn.tailwindcss.com",
  // Cache the icons from the manifest file
  "https://placehold.co/192x192/282a36/f8f8f2?text=e",
  "https://placehold.co/512x512/282a36/f8f8f2?text=e",
  "https://placehold.co/512x512/282a36/f8f8f2?text=b&maskable=true",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response
      if (response) {
        return response;
      }
      return fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});