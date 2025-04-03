'use client'

import { useState, useEffect } from 'react'

interface WelcomePageProps {
  onComplete: () => void
}

export default function WelcomePage({ onComplete }: WelcomePageProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleEnter = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEnter()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url("https://png.pngtree.com/thumb_back/fh260/background/20210828/pngtree-frosted-glass-texture-frosted-white-gray-background-image_771741.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-x`} />
      <div className={`relative z-10 text-center transition-opacity duration-2000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text animate-gradient-x">
          Welcome to Zorosetta
        </h1>
        <p className="text-2xl mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text animate-gradient-x">
          A go-to platform with friendly interface acting as the 'Rosetta Stone' for Zora
        </p>
        <p className="text-xl mb-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text animate-gradient-x">
          Enter the world of possibilities
        </p>
        <button
          onClick={handleEnter}
          className="px-8 py-4 text-xl font-semibold rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity animate-pulse"
        >
          Enter
        </button>
      </div>
    </div>
  )
} 