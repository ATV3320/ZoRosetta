'use client'

import Sidebar from '@/components/Sidebar'
import { WagmiProvider } from '@/components/providers/WagmiProvider'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <WagmiProvider>
      <div className="flex min-h-screen relative">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </WagmiProvider>
  )
} 