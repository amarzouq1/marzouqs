// Marzouq's Gaming Center — Service Worker
// Handles offline caching, background asset streaming, and PWA install

const CACHE_VERSION = 'mgc-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const GAME_CACHE = `${CACHE_VERSION}-games`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/games/chess',
  '/games/academy/math',
  '/games/academy/physics',
  '/games/academy/language',
  '/games/sonic',
  '/games/platformer',
  '/profile',
];

// Install: pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Gracefully fail if some assets are unavailable during install
        console.log('[SW] Some static assets could not be cached on install');
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('mgc-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== GAME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Skip Supabase API calls — always go to network
  if (url.hostname.includes('supabase')) {
    event.respondWith(fetch(request));
    return;
  }

  // Game assets — cache-first with background update
  if (url.pathname.startsWith('/games/') || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(GAME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Everything else — network-first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for scores
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncPendingScores());
  }
});

async function syncPendingScores() {
  // Retrieve pending scores from IndexedDB and post to Supabase
  // This runs when the user comes back online
  try {
    const db = await openDB();
    const pending = await getAllPending(db);
    for (const entry of pending) {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      await removeFromDB(db, entry.id);
    }
  } catch {
    // Will retry on next sync
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('mgc-pending', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('scores', { keyPath: 'id', autoIncrement: true });
    };
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scores', 'readonly');
    const req = tx.objectStore('scores').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

function removeFromDB(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scores', 'readwrite');
    const req = tx.objectStore('scores').delete(id);
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: "Marzouq's Gaming", body: 'A new challenge awaits.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
