require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// VAPID Configuration
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@brimob.id',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// In-memory storage (production: gunakan database)
const pushSubscriptions = new Map();
const connectedClients = new Set();

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  console.log('✅ New WebSocket connection established');
  connectedClients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received message:', data.type);

      switch (data.type) {
        case 'panic_alert':
          await handlePanicAlert(data);
          break;
        
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        
        default:
          console.log('⚠️  Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    connectedClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  // Send initial connection success
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket connection established'
  }));
});

// Handle Panic Alert
async function handlePanicAlert(alertData) {
  console.log('🚨 PANIC ALERT RECEIVED:', alertData);

  // 1. Broadcast to all connected WebSocket clients (real-time)
  const messageStr = JSON.stringify(alertData);
  let sentCount = 0;

  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
      sentCount++;
    }
  });

  console.log(`📡 Broadcasted to ${sentCount} connected clients`);

  // 2. Send Push Notifications to subscribed devices (background)
  if (pushSubscriptions.size > 0) {
    await sendPushNotifications(alertData);
  } else {
    console.log('⚠️  No push subscriptions available');
  }
}

// Send Push Notifications
async function sendPushNotifications(alertData) {
  const payload = JSON.stringify({
    title: '🚨 PANIC ALERT - BRIMOB',
    body: alertData.message || 'Emergency alert activated!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'panic-alert',
    timestamp: alertData.timestamp,
    data: alertData
  });

  const promises = Array.from(pushSubscriptions.values()).map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, payload);
      console.log('✅ Push notification sent to:', subscription.endpoint.substring(0, 50) + '...');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send push notification:', error.message);
      
      // Remove invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        pushSubscriptions.forEach((sub, key) => {
          if (sub.endpoint === subscription.endpoint) {
            pushSubscriptions.delete(key);
            console.log('🗑️  Removed invalid subscription');
          }
        });
      }
      return { success: false, error: error.message };
    }
  });

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  console.log(`📤 Push notifications: ${successCount}/${pushSubscriptions.size} sent successfully`);
}

// REST API Endpoints

// Get VAPID Public Key
app.get('/api/vapid-public-key', (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

// Subscribe to Push Notifications
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  // Store subscription (production: save to database)
  const subscriptionKey = subscription.endpoint;
  pushSubscriptions.set(subscriptionKey, subscription);

  console.log('✅ New push subscription added:', subscriptionKey.substring(0, 50) + '...');
  console.log('📊 Total subscriptions:', pushSubscriptions.size);

  res.status(201).json({
    success: true,
    message: 'Subscription added successfully'
  });
});

// Unsubscribe from Push Notifications
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint required' });
  }

  const deleted = pushSubscriptions.delete(endpoint);
  
  if (deleted) {
    console.log('✅ Subscription removed:', endpoint.substring(0, 50) + '...');
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } else {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

// Test Push Notification
app.post('/api/test-push', async (req, res) => {
  const testAlert = {
    type: 'panic_alert',
    id: 'test-' + Date.now(),
    message: 'Test notification - please ignore',
    location: 'Test Location',
    timestamp: new Date().toISOString(),
    severity: 'low'
  };

  await sendPushNotifications(testAlert);
  
  res.json({
    success: true,
    message: 'Test push sent',
    subscriptions: pushSubscriptions.size
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    websocket_clients: connectedClients.size,
    push_subscriptions: pushSubscriptions.size,
    uptime: process.uptime()
  });
});

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚨 BRIMOB Panic Alert Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔑 VAPID Public Key: ${process.env.VAPID_PUBLIC_KEY?.substring(0, 20)}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/vapid-public-key');
  console.log('  POST /api/subscribe');
  console.log('  POST /api/unsubscribe');
  console.log('  POST /api/test-push');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
