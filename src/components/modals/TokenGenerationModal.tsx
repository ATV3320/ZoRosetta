'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface TokenGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TokenFormData) => void
}

interface TokenFormData {
  name: string
  website: string
  description: string
}

export default function TokenGenerationModal({ isOpen, onClose, onSubmit }: TokenGenerationModalProps) {
  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    website: '',
    description: ''
  })

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-background-light rounded-xl p-6 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Generate Token</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              What do you want to name your token?
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-background rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Does your idea have a website or blog?
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 bg-background rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="https://"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              What do you want your idea to revolve around?
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-background rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Generate Token
          </button>
        </form>
      </div>
    </div>
  )
} 