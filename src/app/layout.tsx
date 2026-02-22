/**
 * Root Layout - PWA meta tags dan global styles
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BRIMOB Alert System',
  description: 'Real-time Panic Alert System untuk Brimob Kepolisian',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BRIMOB Alert',
    startupImage: [
      {
        url: '/icon-512x512.svg',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  applicationName: 'BRIMOB Alert',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'BRIMOB Alert System',
    title: 'BRIMOB Alert System',
    description: 'Real-time Panic Alert System',
  },
};

export const viewport: Viewport = {
  themeColor: '#991b1b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Viewport - Optimized for PWA */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover"
        />

        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BRIMOB Alert" />

        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#991b1b" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* iOS Specific */}
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.svg" />

        {/* Standard Icons */}
        <link rel="icon" type="image/svg+xml" href="/icon-192x192.svg" />
        <link rel="shortcut icon" href="/icon-192x192.svg" />

        {/* Splash Screen Support */}
        <link rel="apple-touch-startup-image" href="/icon-512x512.svg" />
      </head>
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>{children}</body>
    </html>
  );
}
