'use client'

import { useRouter } from 'next/navigation'
import WelcomePage from '@/components/WelcomePage'

export default function Welcome() {
  const router = useRouter()

  const handleComplete = () => {
    localStorage.setItem('hasVisited', 'true')
    router.push('/')
  }

  return <WelcomePage onComplete={handleComplete} />
} 