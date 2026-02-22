/**
 * User Dashboard Page - Menerima dan menampilkan panic alerts
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertMessage } from '@/types';
import {
  subscribeToAlerts,
  subscribeToPushNotifications,
  getConnectionStatus,
} from '@/lib/panic-alert-service';
import Header from '@/components/Header';
import AlertOverlay from '@/components/AlertOverlay';
import AlertHistory from '@/components/AlertHistory';

const ALERTS_STORAGE_KEY = 'brimob_user_alerts';

function UserDashboard() {
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [activeAlert, setActiveAlert] = useState<AlertMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connecting');
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // Initialize auth
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Load alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (stored) {
      try {
        setAlerts(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading alerts:', error);
      }
    }
  }, []);

  // Route protection
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'user') {
      router.push('/admin');
    }
  }, [isAuthenticated, user, router]);

  // Subscribe to panic alerts via WebSocket
  useEffect(() => {
    const unsubscribe = subscribeToAlerts((alert) => {
      console.log('Alert received via WebSocket:', alert);
      setActiveAlert(alert);

      // Save to history using functional update to avoid stale closure
      setAlerts((prevAlerts) => {
        const updatedAlerts = [alert, ...prevAlerts];
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
        return updatedAlerts;
      });
    });

    console.log('WebSocket alerts subscribed');

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(getConnectionStatus());
    }, 2000);

    return () => {
      console.log('WebSocket alerts unsubscribed');
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  // Listen for Service Worker messages (auto-alert trigger)
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('[User Page] Service Worker message:', event.data);

      if (event.data && event.data.type === 'PANIC_ALERT') {
        // Trigger alert from Service Worker message
        const alertData: AlertMessage = {
          type: 'panic_alert',
          id: Date.now().toString(),
          message: '🚨 PANIC ALERT - SITUASI DARURAT',
          location: 'Command Center',
          timestamp: new Date().toISOString(),
          severity: 'critical',
        };

        console.log('[User Page] Triggering alert from Service Worker');
        setActiveAlert(alertData);

        setAlerts((prevAlerts) => {
          const updatedAlerts = [alertData, ...prevAlerts];
          localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
          return updatedAlerts;
        });
      }
    };

    // Register Service Worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Check for auto_alert query parameter (from push notification)
  useEffect(() => {
    const autoAlert = searchParams.get('auto_alert');

    if (autoAlert === 'true') {
      console.log('[User Page] Auto-alert triggered from URL');

      // Check if there's recent alert in localStorage
      const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (stored) {
        try {
          const storedAlerts = JSON.parse(stored);
          if (storedAlerts.length > 0) {
            // Show most recent alert
            const latestAlert = storedAlerts[0];
            const alertAge = Date.now() - new Date(latestAlert.timestamp).getTime();

            // Only show if alert is less than 30 seconds old
            if (alertAge < 30000) {
              console.log('[User Page] Showing recent alert:', latestAlert);
              setActiveAlert(latestAlert);
            }
          }
        } catch (error) {
          console.error('Error loading recent alert:', error);
        }
      }

      // Clean URL (remove auto_alert parameter)
      const url = new URL(window.location.href);
      url.searchParams.delete('auto_alert');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Request notification permission and subscribe to push
  useEffect(() => {
    const setupNotifications = async () => {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          const subscribed = await subscribeToPushNotifications();
          setNotificationEnabled(subscribed);
        }
      }
    };

    setupNotifications();
  }, []);

  const handleEnableNotifications = async () => {
    const subscribed = await subscribeToPushNotifications();
    setNotificationEnabled(subscribed);
  };

  const handleAcknowledge = () => {
    if (activeAlert) {
      // Mark as acknowledged
      const acknowledgedAlert = { ...activeAlert, acknowledged: true };
      const updatedAlerts = alerts.map((a) => (a.id === activeAlert.id ? acknowledgedAlert : a));
      setAlerts(updatedAlerts);
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
    }
    setActiveAlert(null);
  };

  if (!isAuthenticated || user?.role !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header title="Dashboard Anggota" showStatus={true} />

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Connection Status */}
        <div
          className={`rounded-lg p-4 border ${
            connectionStatus === 'connected'
              ? 'bg-green-900/20 border-green-900/50'
              : connectionStatus === 'connecting'
                ? 'bg-yellow-900/20 border-yellow-900/50'
                : 'bg-red-900/20 border-red-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              {connectionStatus === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              ></span>
            </span>
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  connectionStatus === 'connected'
                    ? 'text-green-400'
                    : connectionStatus === 'connecting'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {connectionStatus === 'connected' && '✅ Terhubung ke Server'}
                {connectionStatus === 'connecting' && '🔄 Menghubungkan...'}
                {connectionStatus === 'disconnected' && '❌ Tidak Terhubung'}
              </p>
              <p className="text-sm text-gray-400">
                {connectionStatus === 'connected' && 'Siap menerima alert real-time'}
                {connectionStatus === 'connecting' && 'Menghubungkan ke server...'}
                {connectionStatus === 'disconnected' && 'Periksa koneksi internet Anda'}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Permission */}
        {!notificationEnabled && Notification.permission !== 'denied' && (
          <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔔</span>
              <div className="flex-1">
                <h3 className="text-blue-400 font-bold mb-2">Aktifkan Notifikasi Push</h3>
                <p className="text-blue-200 text-sm mb-4">
                  Terima alert bahkan saat aplikasi ditutup atau HP dalam mode standby
                </p>
                <button
                  onClick={handleEnableNotifications}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Aktifkan Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {notificationEnabled && (
          <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <p className="text-green-400 font-semibold">
                Notifikasi push aktif - Anda akan menerima alert meski aplikasi ditutup
              </p>
            </div>
          </div>
        )}

        {/* Status Section */}
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
          <div className="text-6xl mb-4">{activeAlert ? '🚨' : '✅'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {activeAlert ? 'ALERT AKTIF!' : 'Tidak ada alert aktif'}
          </h2>
          <p className="text-gray-400">
            {activeAlert
              ? 'Segera cek notifikasi alert'
              : 'Menunggu instruksi... Sistem monitoring aktif'}
          </p>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">Nama Anggota</h3>
            <p className="text-xl font-bold text-white">{user?.name}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">Alert Diterima</h3>
            <p className="text-xl font-bold text-white">{alerts.length}</p>
          </div>
        </div>

        {/* Alert History */}
        <AlertHistory alerts={alerts} type="received" />

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">📱 Informasi Sistem</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Aplikasi akan menampilkan alert full screen saat menerima panic alert</li>
            <li>• Alarm akan berbunyi otomatis (jika izin browser diberikan)</li>
            <li>• Tekan tombol &quot;SIAP&quot; untuk mengonfirmasi penerimaan alert</li>
            <li>• Riwayat semua alert dapat dilihat di halaman ini</li>
            <li>• Pastikan aplikasi tetap terbuka untuk menerima alert real-time</li>
          </ul>
        </div>

        {/* System Status */}
        <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
            <div>
              <h3 className="text-green-400 font-bold">Sistem Terhubung</h3>
              <p className="text-green-300 text-sm">Siap menerima alert dari command center</p>
            </div>
          </div>
        </div>

        {/* Important Notice about BroadcastChannel */}
        <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-6">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-bold mb-2">
                Penting - Cara Kerja Real-time Alert
              </h3>
              <div className="text-yellow-200 text-sm space-y-1">
                <p>• Alert real-time menggunakan BroadcastChannel (komunikasi antar tab browser)</p>
                <p>
                  • Pastikan aplikasi dibuka di <strong>browser yang SAMA</strong> (bukan
                  incognito/samaran)
                </p>
                <p>
                  • Admin dan User harus di tab/window yang sama browser-nya (contoh: keduanya di
                  Chrome)
                </p>
                <p>• Jangan gunakan mode incognito/private saat testing</p>
                <p className="pt-2 text-yellow-300">
                  💡 <strong>Tip:</strong> Buka 2 tab normal di Chrome - Tab 1: Admin, Tab 2: User
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Alert Overlay */}
      {activeAlert && <AlertOverlay alert={activeAlert} onAcknowledge={handleAcknowledge} />}
    </div>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    }>
      <UserDashboard />
    </Suspense>
  );
}
