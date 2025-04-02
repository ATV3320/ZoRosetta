'use client'

import { useState } from 'react'
import TopGainers from '@/components/market/TopGainers'
import TopVolume from '@/components/market/TopVolume'
import NewCoins from '@/components/market/NewCoins'
import MostValuable from '@/components/market/MostValuable'
import WalletConnect from '@/components/WalletConnect'

const tabs = [
  { id: 'gainers', name: 'Top Gainers' },
  { id: 'volume', name: 'Top Volume' },
  { id: 'valuable', name: 'Most Valuable' },
  { id: 'new', name: 'New Coins' },
]

export default function MarketTrends() {
  const [activeTab, setActiveTab] = useState('gainers')

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-background py-4">
        <h1 className="text-3xl font-bold flex-shrink-0 mr-4">Market Trends</h1>
        <div className="flex-shrink-0">
          <WalletConnect />
        </div>
      </header>

      <main className="flex-grow">
        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-xl bg-background-light p-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2.5 px-3 text-sm font-medium rounded-lg
                ${activeTab === tab.id 
                  ? 'bg-primary text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-background'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid gap-6">
          {activeTab === 'gainers' && <TopGainers />}
          {activeTab === 'volume' && <TopVolume />}
          {activeTab === 'valuable' && <MostValuable />}
          {activeTab === 'new' && <NewCoins />}
        </div>
      </main>
    </div>
  )
} 