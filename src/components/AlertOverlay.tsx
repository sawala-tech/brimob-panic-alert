/**
 * AlertOverlay Component - Full screen alert dengan siren sound
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertMessage } from '@/types';
import { playSiren, stopSiren, isSirenPlaying } from '@/lib/audio';

interface AlertOverlayProps {
  alert: AlertMessage;
  onAcknowledge: () => void;
}

export default function AlertOverlay({ alert, onAcknowledge }: AlertOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    // Try to play siren automatically
    try {
      playSiren();
      
      // Check after delay if siren is actually playing
      setTimeout(() => {
        if (!isSirenPlaying()) {
          setAutoplayBlocked(true);
        }
      }, 100);
    } catch (error) {
      console.error('Autoplay blocked:', error);
      setAutoplayBlocked(true);
    }

    // Vibrate if supported
    if ('vibrate' in navigator) {
      // Pattern: vibrate for 500ms, pause 200ms, repeat
      const vibratePattern = [500, 200, 500, 200, 500];
      navigator.vibrate(vibratePattern);
    }

    // Cleanup
    return () => {
      stopSiren();
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    };
  }, []);

  const handleToggleSound = () => {
    if (isMuted) {
      playSiren();
      setIsMuted(false);
      setAutoplayBlocked(false);
    } else {
      stopSiren();
      setIsMuted(true);
    }
  };

  const handleAcknowledge = () => {
    stopSiren();
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    onAcknowledge();
  };

  return (
    <div className="fixed inset-0 z-50 bg-red-600 flex items-center justify-center p-4 animate-pulse">
      <div className="max-w-2xl w-full bg-red-700 rounded-2xl shadow-2xl p-8 text-center border-4 border-red-900">
        {/* Warning Icon */}
        <div className="text-9xl mb-6 animate-bounce">
          🚨
        </div>

        {/* Alert Title */}
        <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-wider">
          PANIC ALERT
        </h1>

        {/* Alert Message */}
        <p className="text-2xl font-bold text-white mb-6">
          {alert.message}
        </p>

        {/* Sender Info */}
        <div className="bg-red-900 rounded-lg p-4 mb-6">
          <p className="text-white font-semibold">Lokasi: {alert.location}</p>
          <p className="text-red-200 text-sm">
            {new Date(alert.timestamp).toLocaleString('id-ID')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Play Sound Button (jika autoplay diblokir) */}
          {autoplayBlocked && !isMuted && (
            <button
              onClick={handleToggleSound}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-6 rounded-lg text-xl transition-colors animate-pulse"
            >
              🔊 BUNYIKAN ALARM
            </button>
          )}

          {/* Mute/Unmute Button */}
          {!autoplayBlocked && (
            <button
              onClick={handleToggleSound}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isMuted ? '🔊 Nyalakan Suara' : '🔇 Matikan Suara'}
            </button>
          )}

          {/* Acknowledge Button */}
          <button
            onClick={handleAcknowledge}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
          >
            ✅ SIAP - ALERT DITERIMA
          </button>
        </div>

        {/* Instruction */}
        <p className="text-red-200 text-sm mt-6 font-semibold">
          Konfirmasi penerimaan alert dengan menekan tombol SIAP
        </p>
      </div>
    </div>
  );
}
