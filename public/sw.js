// StudentHub Service Worker — v1
const CACHE_NAME = 'studenthub-v1';
const OFFLINE_QUEUE_KEY = 'offline-queue';

const APP_SHELL = [
  '/',
  '/index.html',
];

// ── Install: cache app shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-First for assets, Network-First for API ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests to Supabase — handled by background sync
  if (event.request.method !== 'GET') return;

  // Cache-First: static assets (JS, CSS, fonts, images)
  if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/) &&
    !url.hostname.includes('supabase')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-First with cache fallback for Supabase API calls
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: network with cache fallback for navigation
  event.respondWith(
    fetch(event.request).catch(() => caches.match('/index.html'))
  );
});

// ── Background Sync ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  // Notify clients to process queue
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'PROCESS_QUEUE' }));
}

// ── Push messages from clients ──
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
