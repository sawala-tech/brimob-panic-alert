/**
 * PanicButton Component - Admin panic button dengan 2-step confirmation
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertMessage } from '@/types';
import { sendPanicAlert } from '@/lib/panic-alert-service';
import { playBeep } from '@/lib/audio';

interface PanicButtonProps {
  senderName: string;
  onAlertSent: (alert: AlertMessage) => void;
}

export default function PanicButton({ senderName, onAlertSent }: PanicButtonProps) {
  const [confirmMode, setConfirmMode] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!confirmMode) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setConfirmMode(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [confirmMode]);

  const handleFirstPress = () => {
    setConfirmMode(true);
    setCountdown(5);
    playBeep(100);
  };

  const handleConfirm = () => {
    // Create alert message
    const alert: AlertMessage = {
      type: 'panic_alert',
      id: Date.now().toString(),
      message: '🚨 PANIC ALERT - SITUASI DARURAT',
      location: 'Command Center',
      timestamp: new Date().toISOString(),
      severity: 'critical' as const,
    };

    console.log('Sending panic alert:', alert);

    // Send via BroadcastChannel
    sendPanicAlert(alert);
    
    console.log('Alert sent via BroadcastChannel');

    // Notify parent
    onAlertSent(alert);

    // Reset state
    setConfirmMode(false);
    setCountdown(5);
    playBeep(200);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <button
        onClick={confirmMode ? handleConfirm : handleFirstPress}
        className={`
          relative w-64 h-64 rounded-full font-bold text-2xl uppercase
          transition-all duration-300 shadow-2xl
          ${confirmMode 
            ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' 
            : 'bg-red-600 hover:bg-red-700'
          }
          text-white
          active:scale-95
          border-8
          ${confirmMode ? 'border-yellow-300' : 'border-red-800'}
        `}
      >
        {confirmMode ? (
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-2">⚠️</span>
            <span className="text-lg">KONFIRMASI?</span>
            <span className="text-sm mt-2">Tekan Lagi</span>
            <span className="text-4xl mt-2 font-mono">{countdown}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-5xl mb-3">🚨</span>
            <span>PANIC</span>
            <span>ALERT</span>
          </div>
        )}
      </button>

      {confirmMode && (
        <p className="text-yellow-400 text-sm animate-pulse font-semibold">
          Auto-cancel dalam {countdown} detik
        </p>
      )}
    </div>
  );
}
