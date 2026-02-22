/**
 * Admin Dashboard Page - Panic button dan monitoring
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertMessage } from '@/types';
import { getTotalUsers } from '@/lib/auth';
import Header from '@/components/Header';
import PanicButton from '@/components/PanicButton';
import AlertHistory from '@/components/AlertHistory';

const ALERTS_STORAGE_KEY = 'brimob_admin_alerts';

export default function AdminPage() {
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [lastAlertSent, setLastAlertSent] = useState<AlertMessage | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

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

    if (user?.role !== 'admin') {
      router.push('/user');
    }
  }, [isAuthenticated, user, router]);

  const handleAlertSent = (alert: AlertMessage) => {
    const updatedAlerts = [alert, ...alerts];
    setAlerts(updatedAlerts);
    setLastAlertSent(alert);
    setShowFeedback(true);

    // Save to localStorage
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));

    // Hide feedback after 5 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 5000);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header title="Admin Panel" showStatus={false} />

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">Total Anggota</h3>
            <p className="text-3xl font-bold text-white">{getTotalUsers()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">Alert Terkirim</h3>
            <p className="text-3xl font-bold text-white">{alerts.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">Status Sistem</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-400 font-bold">Aktif</span>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        {showFeedback && lastAlertSent && (
          <div className="bg-green-900/50 border border-green-500 rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">✅</span>
              <h3 className="text-xl font-bold text-green-400">Alert Berhasil Terkirim!</h3>
            </div>
            <p className="text-gray-300">
              Dikirim pada: {new Date(lastAlertSent.timestamp).toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Semua anggota yang membuka aplikasi akan menerima notifikasi
            </p>
          </div>
        )}

        {/* Panic Button Section */}
        <div className="bg-gray-800 rounded-lg p-8 border border-red-900/50">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Tombol Panic Alert
          </h2>
          <div className="flex justify-center">
            <PanicButton 
              senderName={user?.name || 'Admin'} 
              onAlertSent={handleAlertSent}
            />
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Tekan tombol untuk mengirim alert ke semua anggota
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Konfirmasi 2 langkah untuk mencegah alert tidak disengaja
            </p>
          </div>
        </div>

        {/* Alert History */}
        <AlertHistory alerts={alerts} type="sent" />

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">📋 Petunjuk Penggunaan</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Tekan tombol PANIC untuk mengirim alert darurat</li>
            <li>• Konfirmasi dengan menekan tombol kedua kali dalam 5 detik</li>
            <li>• Alert akan dikirim ke semua anggota yang sedang membuka aplikasi</li>
            <li>• Anggota akan menerima notifikasi layar penuh dengan alarm berbunyi</li>
            <li>• Riwayat alert dapat dilihat di bagian bawah halaman</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
