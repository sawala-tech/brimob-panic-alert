// Service Worker for BRIMOB Panic Alert System
const CACHE_NAME = 'brimob-panic-v1';

// Assets to cache on install - only cache what exists
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json'
];

// Install Event - Cache static assets with error handling
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        // Cache assets individually to avoid failure if one is missing
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, error.message);
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
      })
      .catch((error) => {
        console.error('[Service Worker] Cache installation error:', error);
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
            // Return a basic error response for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response(
                '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
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
    body: '⚠️ SITUASI DARURAT! Klik untuk membuka',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'panic-alert',
    requireInteraction: true, // Cannot be dismissed without interaction
    silent: false, // Play sound
    renotify: true, // Alert even if notification exists
    // Continuous vibration pattern (like incoming call)
    vibrate: [
      1000, 500, 1000, 500, 1000, 500,  // Long vibrations
      1000, 500, 1000, 500, 1000, 500,
      1000, 500, 1000, 500, 1000
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
        body: data.body || data.message || '⚠️ SITUASI DARURAT! Klik untuk membuka',
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: true, // Cannot be dismissed easily
        silent: false,
        renotify: true,
        vibrate: [
          1000, 500, 1000, 500, 1000, 500,
          1000, 500, 1000, 500, 1000, 500,
          1000, 500, 1000, 500, 1000
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
            title: '🚨 BUKA SEKARANG',
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
      console.log('[Service Worker] 🚨 FORCE OPEN - MAXIMUM AGGRESSION MODE');
      
      // AGGRESSIVE STRATEGY: Try EVERYTHING to open the app
      
      // STEP 1: Try to open window IMMEDIATELY (before notification)
      let windowOpened = false;
      
      try {
        console.log('[Service Worker] 🚀 Attempting to FORCE OPEN window...');
        
        // Check for existing windows
        const clients = await self.clients.matchAll({ 
          type: 'window', 
          includeUncontrolled: true 
        });
        
        let targetClient = null;
        
        // Find any user window
        for (let client of clients) {
          if (client.url.includes('/user')) {
            targetClient = client;
            console.log('[Service Worker] ✅ Found existing user window');
            break;
          }
        }
        
        // If window exists, FORCE FOCUS multiple times
        if (targetClient) {
          console.log('[Service Worker] 💪 FORCING FOCUS on existing window');
          
          // Focus aggressively (5 times in a row)
          for (let i = 0; i < 5; i++) {
            try {
              await targetClient.focus();
              console.log(`[Service Worker] Focus attempt ${i + 1}/5`);
            } catch (e) {
              console.warn(`[Service Worker] Focus attempt ${i + 1} failed:`, e.message);
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Send alert message
          targetClient.postMessage({
            type: 'PANIC_ALERT',
            data: notificationData.data,
            timestamp: Date.now(),
            forceFocus: true
          });
          
          windowOpened = true;
        } else {
          // No window exists - TRY TO OPEN NEW ONE
          console.log('[Service Worker] 🚀 No window found - OPENING NEW WINDOW');
          
          if (self.clients.openWindow) {
            try {
              const newClient = await self.clients.openWindow('/user?auto_alert=true&force=1&t=' + Date.now());
              if (newClient) {
                console.log('[Service Worker] ✅✅✅ NEW WINDOW OPENED SUCCESSFULLY!');
                windowOpened = true;
                
                // Wait a bit for window to load, then send message
                setTimeout(() => {
                  newClient.postMessage({
                    type: 'PANIC_ALERT',
                    data: notificationData.data,
                    timestamp: Date.now(),
                    forceFocus: true
                  });
                }, 800);
              }
            } catch (error) {
              console.error('[Service Worker] ❌ openWindow BLOCKED:', error.message);
              console.log('[Service Worker] Browser security blocked auto-open - will rely on notification click');
            }
          }
        }
      } catch (error) {
        console.error('[Service Worker] Error in force open:', error);
      }
      
      // STEP 2: Show notification (required for user to click if auto-open failed)
      await self.registration.showNotification(notificationData.title, notificationData);
      console.log('[Service Worker] 📢 Notification displayed');
      
      // STEP 3: SUPER AGGRESSIVE RETRY - Keep trying to focus for 5 seconds
      if (windowOpened) {
        console.log('[Service Worker] 🔄 Starting aggressive focus retry loop...');
        
        const startTime = Date.now();
        let retryCount = 0;
        
        while (Date.now() - startTime < 5000) { // 5 seconds
          await new Promise(resolve => setTimeout(resolve, 200)); // Every 200ms
          
          const clientsAgain = await self.clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
          });
          
          for (let client of clientsAgain) {
            if (client.url.includes('/user')) {
              try {
                await client.focus();
                retryCount++;
                
                // Keep sending messages
                client.postMessage({
                  type: 'PANIC_ALERT',
                  data: notificationData.data,
                  timestamp: Date.now(),
                  forceFocus: true,
                  retryCount: retryCount
                });
              } catch (e) {
                // Silent fail
              }
            }
          }
        }
        
        console.log(`[Service Worker] 🎯 Completed ${retryCount} focus attempts in 5 seconds`);
      }
      
      console.log('[Service Worker] ✅ FORCE OPEN SEQUENCE COMPLETE');
      
      // STEP 4: If still no success, the notification click handler will handle it
      if (!windowOpened) {
        console.log('[Service Worker] ⚠️ Auto-open failed - User MUST click notification');
      }
    })()
  );
});

// Notification Click Event - GUARANTEED OPEN
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 🚨🚨🚨 NOTIFICATION CLICKED - GUARANTEED OPEN');
  
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('[Service Worker] User dismissed notification');
    return;
  }

  // ALWAYS open/focus app on notification click - THIS ALWAYS WORKS
  const urlToOpen = event.notification.data?.url || '/user?auto_alert=true&clicked=1&t=' + Date.now();
  
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      console.log(`[Service Worker] Found ${clientList.length} window(s)`);
      
      // Try to focus existing window first
      for (let client of clientList) {
        if (client.url.includes('/user')) {
          console.log('[Service Worker] ✅ FOCUSING existing user window from click');
          
          // Focus multiple times to ensure it works
          for (let i = 0; i < 3; i++) {
            if ('focus' in client) {
              await client.focus();
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Send alert trigger
          client.postMessage({
            type: 'PANIC_ALERT',
            data: event.notification.data,
            timestamp: Date.now(),
            fromClick: true
          });
          
          console.log('[Service Worker] ✅ Existing window focused and message sent');
          return;
        }
      }
      
      // No window found - MUST open new one
      console.log('[Service Worker] 🚀 No user window found - OPENING NEW WINDOW');
      if (self.clients.openWindow) {
        const newClient = await self.clients.openWindow(urlToOpen);
        if (newClient) {
          console.log('[Service Worker] ✅✅✅ NEW WINDOW OPENED from notification click!');
        } else {
          console.error('[Service Worker] ❌ Failed to open new window');
        }
      } else {
        console.error('[Service Worker] ❌ openWindow not supported');
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
