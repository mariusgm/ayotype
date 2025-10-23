// Enhanced EmojiFusion Service Worker - Offline-first with performance optimization
const CACHE_NAME = 'emojifusion-v2.0.0';
const STATIC_CACHE = 'emojifusion-static-v2';
const DYNAMIC_CACHE = 'emojifusion-dynamic-v2';
const API_CACHE = 'emojifusion-api-v2';

// Assets to cache immediately for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/mobile-main.tsx',
  '/src/MobileApp-v2.tsx',
  '/src/mobile-styles-v2.css',
  '/src/font-optimizer.ts',
  '/src/emoji-meta.json',
  '/src/fusion.ts',
  '/manifest.webmanifest'
];

// Network timeout for dynamic requests
const NETWORK_TIMEOUT = 3000;

// API request queue for offline handling
let apiQueue = [];

self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache with network-first strategy
    event.respondWith(handleApiRequest(request));
  } else if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('/', '')))) {
    // Static assets - cache-first strategy
    event.respondWith(handleStaticRequest(request));
  } else {
    // Dynamic content - network-first with cache fallback
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle API requests with offline queue
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await Promise.race([
      fetch(request.clone()),
      timeoutPromise(NETWORK_TIMEOUT)
    ]);
    
    if (networkResponse && networkResponse.ok) {
      // Cache successful API responses
      cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', error);
    
    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API response from cache');
      return cachedResponse;
    }
    
    // Queue for later if offline
    if (!navigator.onLine) {
      console.log('[SW] Queueing API request for later');
      queueApiRequest(request);
      
      // Return a fallback response
      return new Response(
        JSON.stringify({
          emoji: [
            { name: "Offline Mode", combo: "📱🔌⚡" },
            { name: "Cached Response", combo: "💾🔄📋" }
          ],
          ascii: [
            { name: "Offline", combo: "[ OFFLINE ]\n[ MODE   ]" }
          ],
          meta: { mode: 'both', tone: 'minimal', cached: true }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving static asset from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request.clone(), networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', error);
    // Return a fallback for critical assets
    if (request.url.includes('.css')) {
      return new Response('/* Offline fallback styles */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    throw error;
  }
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await Promise.race([
      fetch(request.clone()),
      timeoutPromise(NETWORK_TIMEOUT)
    ]);
    
    if (networkResponse && networkResponse.ok) {
      cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[SW] Dynamic request failed, checking cache');
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/index.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Queue API requests for when back online
function queueApiRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.body,
    timestamp: Date.now()
  };
  
  apiQueue.push(requestData);
  
  // Limit queue size
  if (apiQueue.length > 10) {
    apiQueue = apiQueue.slice(-10);
  }
}

// Process queued requests when back online
async function processApiQueue() {
  if (apiQueue.length === 0) return;
  
  console.log('[SW] Processing queued API requests:', apiQueue.length);
  
  const queue = [...apiQueue];
  apiQueue = [];
  
  for (const requestData of queue) {
    try {
      await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body
      });
      console.log('[SW] Processed queued request:', requestData.url);
    } catch (error) {
      console.error('[SW] Failed to process queued request:', error);
      // Re-queue if still failing
      apiQueue.push(requestData);
    }
  }
}

// Utility: Create timeout promise
function timeoutPromise(timeout) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });
}

// Listen for network status changes
self.addEventListener('online', () => {
  console.log('[SW] Back online, processing queue');
  processApiQueue();
});

// Background sync for when network returns
self.addEventListener('sync', event => {
  if (event.tag === 'api-queue-sync') {
    event.waitUntil(processApiQueue());
  }
});

// Handle push notifications (for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New EmojiFusion features available!',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      data: data.url || '/',
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'EmojiFusion', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Cache management - clean up old entries
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(cleanOldCacheEntries());
  }
});

async function cleanOldCacheEntries() {
  const caches = await caches.keys();
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  for (const cacheName of caches) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');
      
      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        if (responseDate < oneWeekAgo) {
          await cache.delete(request);
        }
      }
    }
  }
}

console.log('[SW] Service Worker loaded and ready!');