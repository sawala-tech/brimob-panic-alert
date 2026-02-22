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
      console.log('[Service Worker] 🚨 AGGRESSIVE AUTO-OPEN STARTED');
      
      // STEP 1: IMMEDIATELY OPEN/FOCUS APP (WhatsApp-like behavior)
      // This runs BEFORE showing notification for instant app opening
      const clients = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      let appOpened = false;
      
      // Check if app already open
      for (let client of clients) {
        if (client.url.includes('/user')) {
          console.log('[Service Worker] ✅ App already open - FORCING FOCUS');
          // Focus the existing window IMMEDIATELY
          if ('focus' in client) {
            await client.focus();
          }
          // Send PANIC_ALERT message to trigger alert
          client.postMessage({
            type: 'PANIC_ALERT',
            data: notificationData.data,
            forceOpen: true
          });
          appOpened = true;
          break;
        }
      }
      
      // If no app open, OPEN IT NOW (before notification)
      if (!appOpened && self.clients.openWindow) {
        console.log('[Service Worker] 🚀 OPENING NEW WINDOW IMMEDIATELY');
        try {
          const newClient = await self.clients.openWindow('/user?auto_alert=true');
          if (newClient) {
            console.log('[Service Worker] ✅ New window opened successfully');
            appOpened = true;
            // Give window a moment to load, then send message
            setTimeout(() => {
              newClient.postMessage({
                type: 'PANIC_ALERT',
                data: notificationData.data,
                forceOpen: true
              });
            }, 500);
          }
        } catch (error) {
          console.error('[Service Worker] ❌ Failed to open window:', error);
        }
      }
      
      // STEP 2: Show notification AFTER opening app
      // This ensures app opens first (like WhatsApp)
      await self.registration.showNotification(notificationData.title, notificationData);
      console.log('[Service Worker] ✅ Notification shown (after app opened)');
      
      // STEP 3: Keep trying to focus for next 2 seconds (aggressive)
      // This handles race conditions where window might not be ready
      if (appOpened) {
        for (let i = 0; i < 4; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const clientsAgain = await self.clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
          });
          for (let client of clientsAgain) {
            if (client.url.includes('/user') && 'focus' in client) {
              client.focus();
              client.postMessage({
                type: 'PANIC_ALERT',
                data: notificationData.data,
                forceOpen: true
              });
            }
          }
        }
      }
      
      console.log('[Service Worker] 🎯 AGGRESSIVE AUTO-OPEN COMPLETE');
    })()
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  const urlToOpen = event.notification.data?.url || '/user';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not already open
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
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
