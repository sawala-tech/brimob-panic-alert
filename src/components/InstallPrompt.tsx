/**
 * PWA Install Prompt - Banner untuk install app ke home screen
 */

'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isPWAInstalled = (window.navigator as any).standalone || isStandalone;

    if (isPWAInstalled) {
      console.log('✅ PWA already installed');
      return;
    }

    // Listen for install prompt (Chrome, Edge, etc)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
      console.log('💾 Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show manual instructions after 3 seconds
    if (ios && !isPWAInstalled) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted install');
    } else {
      console.log('❌ User dismissed install');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  useEffect(() => {
    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
      <div className="max-w-lg mx-auto bg-red-900/90 backdrop-blur-sm border border-red-700 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-3xl flex-shrink-0">📱</div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">Install BRIMOB Alert</h3>

            {isIOS ? (
              // iOS Instructions
              <p className="text-sm text-red-100 mb-3">
                Tap{' '}
                <span className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-blue-500 rounded text-xs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1 1 0 011 1V11h3.5a1 1 0 010 2H11v6.5a1 1 0 01-2 0V13H5.5a1 1 0 010-2H9V4.5a1 1 0 011-1z" />
                  </svg>
                </span>{' '}
                lalu pilih <strong>&quot;Add to Home Screen&quot;</strong> untuk akses cepat
              </p>
            ) : (
              // Android/Desktop
              <p className="text-sm text-red-100 mb-3">
                Install app untuk notifikasi lebih cepat dan akses offline
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-white text-red-900 font-bold py-2 px-4 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  ✓ Install Sekarang
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 bg-red-800/50 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-800 transition-colors text-sm"
              >
                Nanti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
