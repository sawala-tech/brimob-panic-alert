/**
 * AlertOverlay Component - WhatsApp-like Incoming Call Experience
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { AlertMessage } from '@/types';
import { playSiren, stopSiren, isSirenPlaying } from '@/lib/audio';

interface AlertOverlayProps {
  alert: AlertMessage;
  onAcknowledge: () => void;
}

export default function AlertOverlay({ alert, onAcknowledge }: AlertOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // WHATSAPP-LIKE EXPERIENCE: Fullscreen takeover with continuous ringing

    // 1. Try to play continuous ringing sound
    try {
      // Create audio element for continuous ringing
      const audio = new Audio('/alert-sound.mp3');
      audio.loop = true; // Loop continuously like phone ringing
      audio.volume = 1.0;
      audioRef.current = audio;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[Alert] Audio playing - WhatsApp call mode');
          })
          .catch((error) => {
            console.error('[Alert] Autoplay blocked:', error);
            setAutoplayBlocked(true);
          });
      }
    } catch (error) {
      console.error('[Alert] Audio error:', error);
      setAutoplayBlocked(true);
    }

    // 2. Continuous vibration (mobile)
    if ('vibrate' in navigator) {
      // Vibrate continuously every 2 seconds (like incoming call)
      const vibrateInterval = setInterval(() => {
        navigator.vibrate([800, 200, 800, 200, 800]);
      }, 2500);
      
      intervalRef.current = vibrateInterval;
    }

    // 3. Pulsing animation effect
    let intensity = 0;
    let direction = 1;
    const pulseInterval = setInterval(() => {
      intensity += direction * 0.1;
      if (intensity >= 1 || intensity <= 0) direction *= -1;
      setPulseIntensity(intensity);
    }, 100);

    // 4. Prevent page from sleeping
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch(() => {
        console.log('[Alert] Wake lock not supported');
      });
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(pulseInterval);
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    };
  }, []);

  const handleToggleSound = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(console.error);
        setIsMuted(false);
        setAutoplayBlocked(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  const handleAcknowledge = () => {
    // Stop everything
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    onAcknowledge();
  };

  const handleReject = () => {
    handleAcknowledge();
  };

  // Calculate background intensity (pulsing effect)
  const bgIntensity = Math.floor(50 + pulseIntensity * 50);

  return (
    <>
      {/* Fullscreen overlay - WhatsApp call style */}
      <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-0 transition-colors duration-300"
        style={{
          background: `linear-gradient(180deg, 
            rgb(127, 29, 29) 0%, 
            rgb(${bgIntensity + 80}, 27, 27) 50%, 
            rgb(127, 29, 29) 100%)`
        }}
      >
        {/* Top section - Alert info */}
        <div className="w-full pt-12 px-6 text-center">
          {/* Caller ID style badge */}
          <div className="mb-8">
            <div className="inline-block px-6 py-2 bg-red-900/50 rounded-full text-white text-sm font-semibold">
              🚨 PANIC ALERT SYSTEM
            </div>
          </div>

          {/* Large animated icon - like incoming call avatar */}
          <div className="mb-6">
            <div 
              className="w-48 h-48 mx-auto rounded-full flex items-center justify-center shadow-2xl transition-all duration-300"
              style={{
                backgroundColor: `rgba(220, 38, 38, ${0.8 + pulseIntensity * 0.2})`,
                transform: `scale(${1 + pulseIntensity * 0.1})`,
                boxShadow: `0 0 ${40 + pulseIntensity * 40}px rgba(220, 38, 38, 0.8)`
              }}
            >
              <span className="text-8xl animate-pulse">🚨</span>
            </div>
          </div>

          {/* Alert title - like caller name */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 uppercase tracking-wide drop-shadow-lg">
            SITUASI DARURAT
          </h1>

          {/* Alert message */}
          <p className="text-xl md:text-2xl font-bold text-red-100 mb-4">
            {alert.message}
          </p>

          {/* Location info */}
          <div className="inline-block bg-black/30 backdrop-blur-sm rounded-lg px-6 py-3 mb-4">
            <p className="text-white font-semibold text-lg">
              📍 {alert.location}
            </p>
          </div>

          {/* Timestamp */}
          <p className="text-red-200 text-sm">
            {new Date(alert.timestamp).toLocaleString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>

        {/* Middle section - Status indicators */}
        <div className="flex flex-col items-center gap-4">
          {/* Ringing indicator */}
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full bg-red-300 animate-pulse"
              style={{ animationDuration: '1s' }}
            />
            <span className="text-red-100 text-lg font-semibold">
              {autoplayBlocked ? '🔇 Tap untuk aktifkan suara' : '🔊 Ringing...'}
            </span>
            <div 
              className="w-3 h-3 rounded-full bg-red-300 animate-pulse" 
              style={{ animationDuration: '1s' }}
            />
          </div>

          {/* Sound control (if autoplay blocked) */}
          {autoplayBlocked && (
            <button
              onClick={handleToggleSound}
              className="px-6 py-3 bg-red-800 text-white rounded-full font-semibold hover:bg-red-700 transition-all shadow-lg"
            >
              🔊 Aktifkan Suara
            </button>
          )}
        </div>

        {/* Bottom section - Action buttons (WhatsApp call style) */}
        <div className="w-full pb-16 px-6">
          <div className="max-w-md mx-auto flex items-center justify-around gap-8">
            {/* Reject button */}
            <button
              onClick={handleReject}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
                <span className="text-4xl">✕</span>
              </div>
              <span className="text-white font-semibold text-sm">Tutup</span>
            </button>

            {/* Mute button */}
            <button
              onClick={handleToggleSound}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-red-800/50 hover:bg-red-800 flex items-center justify-center shadow-xl transition-all group-hover:scale-110">
                <span className="text-2xl">{isMuted ? '🔇' : '🔊'}</span>
              </div>
              <span className="text-red-200 font-semibold text-sm">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>

            {/* Acknowledge button (Accept call style) */}
            <button
              onClick={handleAcknowledge}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 animate-pulse">
                <span className="text-4xl">✓</span>
              </div>
              <span className="text-white font-semibold text-sm">Terima</span>
            </button>
          </div>

          {/* Swipe hint (mobile) */}
          <div className="mt-8 text-center">
            <p className="text-red-200/70 text-sm">
              Tekan tombol untuk merespons alert
            </p>
          </div>
        </div>
      </div>

      {/* Background overlay dimmer */}
      <div className="fixed inset-0 z-[9998] bg-black/90" />
    </>
  );
}
