import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import HeaderVisibility from '@/components/layout/HeaderVisibility'
import FooterVisibility from '@/components/layout/FooterVisibility'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PaceUp - Running Community',
  description: 'Join the PaceUp running community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <HeaderVisibility />
        <main className="min-h-screen">
          {children}
        </main>
        <FooterVisibility />
      </body>
    </html>
  )
}
