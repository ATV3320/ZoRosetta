'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TrendingProjects from '@/components/TrendingProjects'
import TrendAnalysis from '@/components/TrendAnalysis'
import AIScore from '@/components/AIScore'
import TokenCreation from '@/components/TokenCreation'
import MetadataGeneration from '@/components/MetadataGeneration'
import WalletConnect from '@/components/WalletConnect'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited')
    if (!hasVisited) {
      router.push('/welcome')
    }
  }, [router])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-background py-4">
        <h1 className="text-2xl font-bold flex-shrink-0 mr-4">AI-Powered Insight & Trading Platform for Zora</h1>
        <div className="flex-shrink-0">
          <WalletConnect />
        </div>
      </header>

      <main className="flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <TrendingProjects />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AIScore />
              <TokenCreation />
            </div>
          </div>
          <div className="space-y-8">
            <TrendAnalysis />
            <MetadataGeneration />
          </div>
        </div>
      </main>
    </div>
  )
} 