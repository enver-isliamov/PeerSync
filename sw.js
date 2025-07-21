const CACHE_NAME = 'peersync-assets-v6'; // Bumped version for update
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './pwa-192x192.png',
  './pwa-512x512.png',

  // Core JS files
  './index.js',
  './App.js',
  './types.js',

  // Services
  './services/db.js',
  './services/webrtc.js',

  // Components
  './components/AddFolderModal.js',
  './components/BottomNav.js',
  './components/ConnectPeerModal.js',
  './components/DeleteFolderModal.js',
  './components/FolderDetail.js',
  './components/FolderList.js',
  './components/Instructions.js',
  './components/JoinSyncModal.js',
  './components/QrScanner.js',

  // Icons
  './components/icons/CheckCircleIcon.js',
  './components/icons/ChevronLeftIcon.js',
  './components/icons/CloudArrowDownIcon.js',
  './components/icons/CloudArrowUpIcon.js',
  './components/icons/CopyIcon.js',
  './components/icons/DevicePhoneMobileIcon.js',
  './components/icons/DotsVerticalIcon.js',
  './components/icons/ExclamationCircleIcon.js',
  './components/icons/FileIcon.js',
  './components/icons/FolderIcon.js',
  './components/icons/PauseIcon.js',
  './components/icons/PencilIcon.js',
  './components/icons/PhotographIcon.js',
  './components/icons/PlayIcon.js',
  './components/icons/PlusIcon.js',
  './components/icons/QrcodeIcon.js',
  './components/icons/QuestionMarkCircleIcon.js',
  './components/icons/Spinner.js',
  './components/icons/TrashIcon.js',
  './components/icons/UsersIcon.js',
  './components/icons/ViewGridIcon.js',
  './components/icons/ViewListIcon.js',
  './components/icons/XIcon.js',

  // External libraries
  'https://cdn.tailwindcss.com',
];

// On install, cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        const requests = urlsToCache.map(url => new Request(url, {cache: 'reload'}));
        return cache.addAll(requests);
      })
      .catch(err => {
          console.error('Failed to cache files during install:', err);
      })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// On fetch, use cache-first, then network, then cache the response.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return from cache if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check for valid response
            if (!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            const requestUrl = new URL(event.request.url);
            
            // Cache same-origin files and CDN files dynamically
            if (requestUrl.origin === self.location.origin || requestUrl.hostname === 'esm.sh' || requestUrl.hostname === 'cdn.tailwindcss.com') {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }

            return networkResponse;
          }
        ).catch(error => {
          console.error('Service Worker fetch failed:', error);
          throw error;
        });
      })
  );
});
