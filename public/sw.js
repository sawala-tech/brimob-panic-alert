// Service Worker for BRIMOB Panic Alert System
const CACHE_NAME = 'brimob-panic-v1';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/admin',
  '/user',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(ASSETS_TO_CACHE.filter(url => url !== '/offline'));
      })
      .catch((error) => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
  
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  return self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip WebSocket and external requests
  if (event.request.url.startsWith('ws://') || 
      event.request.url.startsWith('wss://') ||
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Push Event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] 🚨 Push notification received');
  
  let notificationData = {
    title: '🚨 PANIC ALERT - BRIMOB',
    body: 'Emergency alert activated!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'panic-alert',
    requireInteraction: true,
    // Extended vibration pattern (5 seconds total)
    vibrate: [
      500, 200, 500, 200, 500, 200,  // 3 burst
      1000, 500,                      // pause
      500, 200, 500, 200, 500, 200,  // 3 burst
      1000, 500,                      // pause
      500, 200, 500, 200, 500         // final burst
    ],
    data: {
      url: '/user?auto_alert=true',
      timestamp: Date.now(),
      autoOpen: true
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: true,
        vibrate: [
          500, 200, 500, 200, 500, 200,
          1000, 500,
          500, 200, 500, 200, 500, 200,
          1000, 500,
          500, 200, 500, 200, 500
        ],
        data: {
          ...data.data,
          url: '/user?auto_alert=true',
          autoOpen: true,
          timestamp: Date.now()
        },
        actions: [
          {
            action: 'open',
            title: '🚨 Buka Sekarang',
            icon: '/icon-192.png'
          },
          {
            action: 'dismiss',
            title: 'Tutup'
          }
        ]
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    (async () => {
      console.log('[Service Worker] 🚨 WHATSAPP-LIKE AUTO-OPEN INITIATED');
      
      // STRATEGY: Show notification WITH immediate auto-click to open app
      // This is more reliable than trying to open before notification
      
      // Show notification FIRST (with auto-open flag)
      await self.registration.showNotification(notificationData.title, notificationData);
      console.log('[Service Worker] ✅ Notification shown');
      
      // IMMEDIATELY try to open/focus app (within 100ms)
      const clients = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      let appOpened = false;
      
      // Try to focus existing window first
      for (let client of clients) {
        if (client.url.includes('/user')) {
          console.log('[Service Worker] 🎯 FOCUSING existing window');
          if ('focus' in client) {
            await client.focus();
          }
          // Send alert message
          client.postMessage({
            type: 'PANIC_ALERT',
            data: notificationData.data,
            timestamp: Date.now()
          });
          appOpened = true;
          break;
        }
      }
      
      // If no window open, OPEN NEW WINDOW
      if (!appOpened) {
        console.log('[Service Worker] 🚀 OPENING new window (app was closed)');
        
        // Try to open window (this might fail on some browsers/situations)
        if (self.clients.openWindow) {
          try {
            const newClient = await self.clients.openWindow('/user?auto_alert=true&t=' + Date.now());
            if (newClient) {
              console.log('[Service Worker] ✅ Window opened successfully');
              appOpened = true;
            }
          } catch (error) {
            console.warn('[Service Worker] ⚠️ openWindow failed (expected on some browsers):', error.message);
            // This is expected on some browsers - notification will handle it via click
          }
        }
      }
      
      // AGGRESSIVE RETRY: Keep trying to focus for next 3 seconds
      // This handles race conditions and ensures window stays focused
      if (appOpened) {
        const startTime = Date.now();
        while (Date.now() - startTime < 3000) {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const clientsAgain = await self.clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
          });
          
          for (let client of clientsAgain) {
            if (client.url.includes('/user') && 'focus' in client) {
              try {
                await client.focus();
                client.postMessage({
                  type: 'PANIC_ALERT',
                  data: notificationData.data,
                  timestamp: Date.now()
                });
              } catch (e) {
                // Ignore focus errors
              }
            }
          }
        }
      }
      
      console.log('[Service Worker] ✅ AUTO-OPEN SEQUENCE COMPLETE');
    })()
  );
});

// Notification Click Event - IMMEDIATE OPEN
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 🚨 Notification clicked - FORCE OPEN');
  
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('[Service Worker] User dismissed notification');
    return;
  }

  // ALWAYS open/focus app on notification click
  const urlToOpen = event.notification.data?.url || '/user?auto_alert=true&t=' + Date.now();
  
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      // Try to focus existing window first
      for (let client of clientList) {
        if (client.url.includes('/user')) {
          console.log('[Service Worker] Focusing existing user window');
          if ('focus' in client) {
            await client.focus();
          }
          // Send alert trigger
          client.postMessage({
            type: 'PANIC_ALERT',
            data: event.notification.data,
            timestamp: Date.now()
          });
          return;
        }
      }
      
      // No window found - open new one
      console.log('[Service Worker] Opening new window from notification click');
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Notification Close Event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed by user');
});

// Play siren sound (simplified version)
function playSiren() {
  // Note: Audio playback in service workers has limited support
  // The actual siren will be played by the web app when opened
  console.log('[Service Worker] Siren triggered');
}

// Background Sync (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

async function syncAlerts() {
  // Future: Sync missed alerts when coming back online
  console.log('[Service Worker] Syncing alerts...');
}

// Message Event - Communication with main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded successfully');
