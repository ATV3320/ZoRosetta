import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import { WagmiProvider } from '@/components/providers/WagmiProvider'

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
        <WagmiProvider>
          <div className="flex min-h-screen relative">
            <Sidebar />
            <main className="flex-1 p-8 overflow-auto">
              {children}
            </main>
          </div>
        </WagmiProvider>
      </body>
    </html>
  )
} 