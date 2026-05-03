import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import MobileBottomNav from '@/components/MobileBottomNav';
import PWARegister from '@/components/PWARegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Marzouq's Gaming Center",
    template: "%s | Marzouq's Gaming Center",
  },
  description:
    "Marzouq's Gaming Center — Where Precision Meets Play. A luxury, high-performance web gaming portal featuring chess, educational games, and legendary platformers.",
  keywords: ['gaming', 'chess', 'platformer', 'educational', 'browser games', 'PWA'],
  authors: [{ name: "Marzouq's Gaming Center" }],
  creator: "Marzouq's Gaming Center",
  metadataBase: new URL('https://marzouqs.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://marzouqs.com',
    title: "Marzouq's Gaming Center",
    description: "Where Precision Meets Play",
    siteName: "Marzouq's Gaming Center",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Marzouq's Gaming Center",
    description: "Where Precision Meets Play",
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Marzouq's Gaming",
  },
  formatDetection: { telephone: false },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0047FF' },
    { media: '(prefers-color-scheme: light)', color: '#0047FF' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-midnight text-white font-sans antialiased">
        {/* Cyber grid background */}
        <div className="fixed inset-0 cyber-bg pointer-events-none z-0" aria-hidden="true" />

        {/* Ambient glow blobs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cobalt/5 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-cobalt-bright/5 blur-[100px]" />
        </div>

        {/* Desktop navigation */}
        <Navigation />

        {/* Main content */}
        <main className="relative z-10 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom dock navigation */}
        <MobileBottomNav />

        {/* PWA service worker registration */}
        <PWARegister />
      </body>
    </html>
  );
}
