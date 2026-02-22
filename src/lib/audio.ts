/**
 * Web Audio API helper untuk generate siren/alarm sound
 * Menggunakan oscillator untuk membuat efek sirene polisi (naik-turun)
 */

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;

/**
 * Initialize Audio Context
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Initialize and unlock audio context (call this on user interaction)
 */
export async function initAudio(): Promise<boolean> {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('[Audio] Context resumed successfully');
    }

    // Play silent sound to unlock audio (iOS fix)
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();

    console.log('[Audio] Audio context initialized and unlocked');
    return true;
  } catch (error) {
    console.error('[Audio] Failed to initialize audio:', error);
    return false;
  }
}

/**
 * Play siren sound dengan pola naik-turun
 */
export async function playSiren(): Promise<void> {
  if (isPlaying) return;

  try {
    const ctx = getAudioContext();

    // Force resume context (autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('[Audio] Context resumed');
    }

    // Create oscillator
    oscillator = ctx.createOscillator();
    gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Set initial frequency
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    // Set volume (louder for alert)
    gainNode.gain.value = 0.5;

    // Start oscillator
    oscillator.start();
    isPlaying = true;

    console.log('[Audio] Siren started successfully');

    // Animate frequency untuk efek siren (naik-turun)
    animateSirenFrequency();
  } catch (error) {
    console.error('Error playing siren:', error);
    throw error;
  }
}

/**
 * Animate frequency untuk create siren effect
 */
function animateSirenFrequency(): void {
  if (!oscillator || !isPlaying) return;

  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;

  // Pattern: 800Hz -> 1200Hz -> 800Hz (cycle 1 detik)
  oscillator.frequency.setValueAtTime(800, currentTime);
  oscillator.frequency.linearRampToValueAtTime(1200, currentTime + 0.5);
  oscillator.frequency.linearRampToValueAtTime(800, currentTime + 1);

  // Loop animation
  setTimeout(() => {
    if (isPlaying) {
      animateSirenFrequency();
    }
  }, 1000);
}

/**
 * Stop siren sound
 */
export function stopSiren(): void {
  if (!isPlaying) return;

  try {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    isPlaying = false;
  } catch (error) {
    console.error('Error stopping siren:', error);
  }
}

/**
 * Check if siren is currently playing
 */
export function isSirenPlaying(): boolean {
  return isPlaying;
}

/**
 * Play single beep (untuk feedback)
 */
export function playBeep(duration: number = 200): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const beepOscillator = ctx.createOscillator();
    const beepGain = ctx.createGain();

    beepOscillator.connect(beepGain);
    beepGain.connect(ctx.destination);

    beepOscillator.frequency.value = 1000;
    beepOscillator.type = 'sine';
    beepGain.gain.value = 0.2;

    beepOscillator.start();
    beepOscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.error('Error playing beep:', error);
  }
}
