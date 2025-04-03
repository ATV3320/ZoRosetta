import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Zorosetta - AI-Powered Zora Network Analytics',
  description: 'Your Rosetta Stone for the Zora network - AI-driven insights, trend analysis, and token creation platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-white min-h-screen`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
} 