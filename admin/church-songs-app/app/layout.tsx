import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'
import SystemBars from '@/components/SystemBars'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Church Songs - Worship Lyrics & Audio',
  description: 'A comprehensive collection of church songs with lyrics and audio',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster 
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        <SystemBars />
        </Providers>
      </body>
    </html>
  )
}