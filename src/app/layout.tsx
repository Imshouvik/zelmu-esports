import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import NotificationSetup from './NotificationSetup'
import AuthSyncProvider from './AuthSyncProvider'
import LiveStreamIndicator from '@/components/LiveStreamIndicator'
import { AudioProvider } from '@/contexts/AudioContext'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zelmu Esports - Professional Mobile Gaming Platform',
  description: 'Join the ultimate mobile gaming platform for BGMI and Free Fire tournaments',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Zelmu Esports",
              "url": "https://zelmu.com",
              "logo": "https://zelmu.com/app/images/esports%20bg.webp"
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        <NotificationSetup />
        <AudioProvider>
          <Providers>
            <AuthSyncProvider>
              {children}
              <LiveStreamIndicator />
            </AuthSyncProvider>
            <Toaster position="top-center" />
          </Providers>
        </AudioProvider>
      </body>
    </html>
  )
} 