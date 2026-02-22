/**
 * BroadcastChannel helper untuk real-time communication antar tab
 */

import { BroadcastMessage, AlertMessage } from '@/types';

const CHANNEL_NAME = 'brimob_panic_channel';

/**
 * Create and return BroadcastChannel instance
 */
export function createBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    return new BroadcastChannel(CHANNEL_NAME);
  }
  return null;
}

/**
 * Send panic alert via BroadcastChannel
 */
export function sendPanicAlert(alert: AlertMessage): void {
  const channel = createBroadcastChannel();
  if (channel) {
    const message: BroadcastMessage = {
      type: 'panic_alert',
      data: alert,
    };
    console.log('Broadcasting message:', message);
    channel.postMessage(message);
    // Delay close to ensure message is delivered
    setTimeout(() => {
      channel.close();
      console.log('Broadcast channel closed');
    }, 100);
  } else {
    console.error('BroadcastChannel not supported or failed to create');
  }
}

/**
 * Subscribe to panic alerts
 */
export function subscribeToPanicAlerts(
  callback: (alert: AlertMessage) => void
): BroadcastChannel | null {
  const channel = createBroadcastChannel();
  if (channel) {
    console.log('BroadcastChannel created for subscription:', CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      console.log('Message received on channel:', event.data);
      if (event.data.type === 'panic_alert') {
        callback(event.data.data);
      }
    };
    return channel;
  } else {
    console.error('BroadcastChannel not supported or failed to create');
  }
  return null;
}
