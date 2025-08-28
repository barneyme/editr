// sw.js - Service Worker

// Define a name for the cache
const CACHE_NAME = "edit-cache-v1";

// List of essential files to cache for the app shell.
// We'll only cache local files here to make installation more reliable.
// External resources like fonts and TailwindCSS will be cached on-the-fly.
const appShellFiles = ["/", "/index.html"];

/**
 * Installation event
 * This is called when the service worker is first installed.
 * We open a cache and add our essential app shell files to it.
 */
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll(appShellFiles);
    }),
  );
});

/**
 * Fetch event
 * This is called for every network request.
 * We're using a "cache-first" strategy.
 * It checks if the request is in the cache. If so, it serves from the cache.
 * If not, it fetches from the network, adds the response to the cache, and then returns it.
 */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If the request is in the cache, return it
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch the request from the network
      return fetch(event.request)
        .then((networkResponse) => {
          // Open the cache and add the new response for future use
          return caches.open(CACHE_NAME).then((cache) => {
            // Clone the response because a response is a stream and can only be consumed once.
            // We need one for the cache and one for the browser.
            // We only cache successful GET requests.
            if (
              event.request.method === "GET" &&
              networkResponse.status === 200
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch((error) => {
          // This will be triggered if the network request fails, e.g., when offline.
          console.log(
            "[Service Worker] Fetch failed; user is likely offline.",
            error,
          );
          // Optional: You could return a custom offline fallback page here.
          // For example: return caches.match('/offline.html');
        });
    }),
  );
});

/**
 * Activate event
 * This is where we clean up old, unused caches.
 */
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate");
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // If the cache key is not the current cache name, delete it.
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  // Tell the active service worker to take immediate control of all open pages.
  return self.clients.claim();
});
