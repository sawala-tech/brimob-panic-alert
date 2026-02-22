// WebSocket & Push Notification Manager
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface AlertMessage {
  type: 'panic_alert';
  id: string;
  message: string;
  location: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PanicAlertService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: ((message: AlertMessage) => void)[] = [];
  private pushSubscription: PushSubscription | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize() {
    // Connect WebSocket
    this.connect();
    
    // Register Service Worker
    await this.registerServiceWorker();
  }

  // WebSocket Connection
  private connect() {
    try {
      console.log('[WebSocket] Connecting to:', WS_URL);
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('[WebSocket] ✅ Connected successfully');
        this.reconnectAttempts = 0;
        
        // Send ping to keep connection alive
        setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Every 30 seconds
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', data.type);

          if (data.type === 'panic_alert') {
            this.notifyListeners(data);
          } else if (data.type === 'connected') {
            console.log('[WebSocket]', data.message);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] ❌ Error:', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] 🔌 Connection closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
    }
  }

  // Service Worker Registration
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[Service Worker] ✅ Registered successfully');

        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('[Service Worker] Update found');
        });

        return registration;
      } catch (error) {
        console.error('[Service Worker] ❌ Registration failed:', error);
      }
    } else {
      console.warn('[Service Worker] Not supported in this browser');
    }
  }

  // Request Notification Permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[Notification] Not supported in this browser');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      console.log('[Notification] Permission already granted');
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.warn('[Notification] Permission denied');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('[Notification] Permission:', permission);
    return permission;
  }

  // Subscribe to Push Notifications
  async subscribeToPushNotifications(): Promise<boolean> {
    try {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('[Push] Notification permission not granted');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const response = await fetch(`${API_URL}/api/vapid-public-key`);
      const { publicKey } = await response.json();

      // Subscribe to push service
      this.pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey),
      });

      console.log('[Push] ✅ Subscribed successfully');

      // Send subscription to backend
      await this.sendSubscriptionToServer(this.pushSubscription);

      return true;
    } catch (error) {
      console.error('[Push] ❌ Subscription failed:', error);
      return false;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (response.ok) {
        console.log('[Push] Subscription sent to server');
      } else {
        console.error('[Push] Failed to send subscription to server');
      }
    } catch (error) {
      console.error('[Push] Error sending subscription:', error);
    }
  }

  // Unsubscribe from Push Notifications
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.pushSubscription) {
        const registration = await navigator.serviceWorker.ready;
        this.pushSubscription = await registration.pushManager.getSubscription();
      }

      if (!this.pushSubscription) {
        console.warn('[Push] No active subscription');
        return false;
      }

      const endpoint = this.pushSubscription.endpoint;
      const unsubscribed = await this.pushSubscription.unsubscribe();

      if (unsubscribed) {
        // Notify server
        await fetch(`${API_URL}/api/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
        console.log('[Push] ✅ Unsubscribed successfully');
      }

      return unsubscribed;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      return false;
    }
  }

  // Send Panic Alert
  sendPanicAlert(alert: AlertMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Sending panic alert:', alert);
      this.ws.send(JSON.stringify(alert));
    } else {
      console.error('[WebSocket] Cannot send alert - connection not open');
      // Try to reconnect
      this.connect();
    }
  }

  // Subscribe to alerts
  subscribe(callback: (message: AlertMessage) => void): () => void {
    this.listeners.push(callback);
    console.log('[PanicAlertService] Listener added, total:', this.listeners.length);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      console.log('[PanicAlertService] Listener removed, remaining:', this.listeners.length);
    };
  }

  private notifyListeners(message: AlertMessage) {
    console.log('[PanicAlertService] Notifying listeners:', this.listeners.length);
    this.listeners.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('[PanicAlertService] Error in listener callback:', error);
      }
    });
  }

  // Utility: Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CONNECTING:
        return 'connecting';
      default:
        return 'disconnected';
    }
  }

  // Cleanup
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = [];
  }
}

// Singleton instance
const panicAlertService = new PanicAlertService();

// Export functions
export const sendPanicAlert = (alert: AlertMessage) => {
  panicAlertService.sendPanicAlert(alert);
};

export const subscribeToAlerts = (callback: (message: AlertMessage) => void) => {
  return panicAlertService.subscribe(callback);
};

export const requestNotificationPermission = () => {
  return panicAlertService.requestNotificationPermission();
};

export const subscribeToPushNotifications = () => {
  return panicAlertService.subscribeToPushNotifications();
};

export const unsubscribeFromPush = () => {
  return panicAlertService.unsubscribeFromPush();
};

export const getConnectionStatus = () => {
  return panicAlertService.getConnectionStatus();
};

export default panicAlertService;
