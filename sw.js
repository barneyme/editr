// Editr Service Worker for Offline Functionality
const CACHE_NAME = 'editr-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './sw.js',
    'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Editr Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Editr Service Worker caching resources');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Editr Service Worker installed successfully');
                // Force activation of new service worker
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Editr Service Worker installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Editr Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete old caches that don't match current version
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('editr-')) {
                        console.log('Editr Service Worker deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Editr Service Worker activated successfully');
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip non-HTTP(S) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    console.log('Editr Service Worker serving from cache:', event.request.url);
                    return response;
                }

                // If not in cache, try to fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response since it can only be consumed once
                        const responseToCache = response.clone();

                        // Add successful responses to cache for future offline use
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.log('Editr Service Worker fetch failed, serving offline fallback:', error);
                        
                        // If it's a navigation request and we're offline, serve the main app
                        if (event.request.mode === 'navigate') {
                            return caches.match('./');
                        }
                        
                        // For other requests, throw the error
                        throw error;
                    });
            })
    );
});

// Handle messages from the main app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Notify clients when a new version is available
self.addEventListener('updatefound', () => {
    console.log('Editr Service Worker update found');
});

console.log('Editr Service Worker script loaded');