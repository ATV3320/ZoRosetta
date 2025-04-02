'use client'

import { useState } from 'react'
import TokenGenerationModal from './modals/TokenGenerationModal'

interface TokenFormData {
  name: string
  website: string
  description: string
}

export default function TokenCreation() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateToken = (data: TokenFormData) => {
    // Add token creation logic here using the Zora SDK
    console.log('Creating new token with data:', data)
  }

  return (
    <div className="bg-background-light rounded-xl p-6 h-full">
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4">Create New Token</h2>
        <div className="flex-1 flex flex-col justify-between">
          <p className="text-gray-400 text-center">
            Build and Deploy Your Own Token
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors mt-4"
          >
            Generate Token
          </button>
        </div>
      </div>

      <TokenGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateToken}
      />
    </div>
  )
} 