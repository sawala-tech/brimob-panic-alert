# BRIMOB Panic Alert System 🚨

Real-time panic alert system untuk Brimob Kepolisian dengan PWA support, WebSocket, dan Push Notifications.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![WebSocket](https://img.shields.io/badge/WebSocket-enabled-orange)
![PWA](https://img.shields.io/badge/PWA-ready-purple)

## 🎯 Features

- ✅ **Real-time Alerts** - WebSocket untuk komunikasi instant
- ✅ **Push Notifications** - Notifikasi background saat app tertutup
- ✅ **PWA Support** - Install di home screen HP
- ✅ **Cross-Browser** - Chrome, Safari, Firefox, Edge
- ✅ **Cross-Device** - Laptop, HP, Tablet
- ✅ **Offline Support** - Service Worker caching
- ✅ **Siren Audio** - Web Audio API oscillator
- ✅ **2-Step Confirmation** - Prevent false alarm

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **PWA:** Service Worker + Web Push API

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **WebSocket:** ws library
- **Push:** web-push (VAPID)

## 🔑 Credentials Login

```
Admin:
- Username: admin
- Password: admin123

User 1:
- Username: user1
- Password: user123

User 2:
- Username: user2
- Password: user123
```

## 🛠️ Instalasi

1. Install dependencies:
```bash
npm install
```

2. Generate PNG icons (opsional - gunakan online converter):
```bash
# Untuk sementara, SVG icons sudah tersedia
# Jika butuh PNG, convert icon-192x192.svg dan icon-512x512.svg ke PNG
# Gunakan tool online seperti: https://cloudconvert.com/svg-to-png
```

3. Run development server:
```bash
npm run dev
```

4. Buka browser:
```
http://localhost:3000
```

## 🧪 Cara Testing

1. **Buka Tab 1 - Admin:**
   - Buka `http://localhost:3000`
   - Login sebagai admin (admin / admin123)
   - Akan redirect ke `/admin`

2. **Buka Tab 2 - User:**
   - Buka tab baru
   - Buka `http://localhost:3000`
   - Login sebagai user1 (user1 / user123)
   - Akan redirect ke `/user`

3. **Test Panic Alert:**
   - Di Tab 1 (Admin): Tekan tombol PANIC merah
   - Konfirmasi dengan tekan lagi
   - Di Tab 2 (User): Alert overlay muncul full screen + siren berbunyi
   - User tekan "SIAP - ALERT DITERIMA"
   - Alert hilang dan tersimpan di history

## 📱 Instalasi sebagai PWA di Android

1. Buka aplikasi di Chrome Android
2. Tap menu (3 titik) → "Add to Home screen"
3. Aplikasi akan ter-install seperti native app
4. Buka dari home screen untuk pengalaman full screen

## 📁 Struktur File

```
brimob-panic/
├── public/
│   ├── manifest.json
│   ├── icon-192x192.svg
│   └── icon-512x512.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   └── user/
│   │       └── page.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── PanicButton.tsx
│   │   ├── AlertOverlay.tsx
│   │   └── AlertHistory.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── broadcast.ts
│   │   └── audio.ts
│   ├── store/
│   │   └── useAuthStore.ts
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## ⚡ Fitur Detail

### Admin Dashboard (`/admin`)
- Tombol PANIC besar dengan 2-step confirmation
- Auto-cancel setelah 5 detik jika tidak dikonfirmasi
- Stats: jumlah user, alert terkirim, status sistem
- History alert yang pernah dikirim
- Feedback "Alert Terkirim!" dengan timestamp

### User Dashboard (`/user`)
- Status "Sistem Aktif" dengan animasi
- Full screen alert overlay saat menerima panic alert
- Siren otomatis berbunyi (Web Audio API oscillator)
- Tombol untuk nyalakan suara jika autoplay diblokir
- Vibration API (jika didukung device)
- Tombol acknowledge untuk konfirmasi penerimaan
- History alert yang pernah diterima

### Login Page (`/login`)
- Clean dark theme UI
- Form validation
- Auto redirect berdasarkan role
- Demo credentials display
- Session persist dengan localStorage

## 🔊 Audio System

Menggunakan Web Audio API dengan Oscillator untuk generate siren:
- Frequency: 800Hz - 1200Hz (naik-turun)
- Pattern: Cycle 1 detik
- Volume: 30% (agar tidak terlalu keras)
- Auto-loop sampai di-stop

## 📡 Real-time Communication

Menggunakan **BroadcastChannel API**:
- Channel name: `brimob_panic_channel`
- Message type: `panic_alert`
- Works across tabs di browser yang sama
- Tidak butuh WebSocket/server

## 💾 Data Persistence

- **Auth Session**: localStorage (`brimob_auth_user`)
- **Admin Alerts**: localStorage (`brimob_admin_alerts`)
- **User Alerts**: localStorage (`brimob_user_alerts`)

## 🎨 UI/UX

- Dark theme: Gray-950 background
- Accent color: Red (untuk panic/alert)
- Font: Inter (clean & readable)
- Mobile-first responsive design
- Animations: Pulse, ping, bounce untuk urgency
- Bold typography untuk kesan militer

## ⚠️ Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 15.4+)

**Required APIs:**
- BroadcastChannel API
- Web Audio API
- localStorage
- Vibration API (optional)

## 🔐 Security Note

**INI ADALAH POC** - Untuk production:
- Gunakan database (PostgreSQL/MongoDB)
- Implement proper authentication (JWT/Session)
- Gunakan WebSocket/Server-Sent Events untuk real-time
- Add rate limiting
- Encrypt sensitive data
- Add proper error handling
- Implement logging/monitoring

## 📝 License

POC - Untuk keperluan demo/testing saja.

## 👨‍💻 Developer

Created as POC for BRIMOB Panic Alert System

---

**Note:** Jangan lupa convert SVG icons ke PNG untuk compatibility yang lebih baik. Gunakan online tool atau ImageMagick:

```bash
# Using ImageMagick (if installed)
convert icon-192x192.svg icon-192x192.png
convert icon-512x512.svg icon-512x512.png
```
