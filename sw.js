// A very simple service worker for caching the app shell
const CACHE_NAME = 'peersync-shell-v1';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  // Note: In a real build process, you'd cache the specific JS/CSS bundles
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache first: if we have a cache hit, return it
        if (response) {
          return response;
        }
        // Otherwise, fetch from the network
        return fetch(event.request);
      })
  );
});