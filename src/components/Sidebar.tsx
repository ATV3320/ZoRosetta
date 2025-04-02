'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HomeIcon, ChartBarIcon, LightBulbIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Market Trends', href: '/market-trends', icon: ChartBarIcon },
  { name: 'AI Insights', href: '/ai-insights', icon: LightBulbIcon },
 // { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Sidebar() {
  const [currentPath, setCurrentPath] = useState('/')

  return (
    <nav className="w-64 bg-background-light p-4">
      <div className="space-y-8">
        <div className="flex items-center justify-center">
          <span className="text-xl font-bold">Zora Platform</span>
        </div>
        
        <div className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setCurrentPath(item.href)}
              className={clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                currentPath === item.href
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-background hover:text-white'
              )}
            >
              <item.icon className="w-6 h-6" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
} 