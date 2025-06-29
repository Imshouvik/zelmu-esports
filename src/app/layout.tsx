import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import NotificationSetup from './NotificationSetup'
import AuthSyncProvider from './AuthSyncProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zelmu Esports - Professional Mobile Gaming Platform',
  description: 'Join the ultimate mobile gaming platform for BGMI and Free Fire tournaments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationSetup />
        <Providers>
          <AuthSyncProvider>
            {children}
          </AuthSyncProvider>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
} 