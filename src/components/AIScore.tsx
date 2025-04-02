'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface AIInsight {
  score: number;
  insights: string[];
}

interface IdeaFormData {
  name: string
  details: string
  idea: string
  website: string
  socialLinks: string
}

interface IdeaTestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: IdeaFormData) => void
}

function IdeaTestModal({ isOpen, onClose, onSubmit }: IdeaTestModalProps) {
  const [formData, setFormData] = useState<IdeaFormData>({
    name: '',
    details: '',
    idea: '',
    website: '',
    socialLinks: ''
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
      <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose} />
      <div className="relative bg-[#0F172A] rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-8 text-white">Test Your Idea</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-gray-200 mb-2">
              Name of your token
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#1E293B] text-white rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-200 mb-2">
              Additional Details in mind (Like total supply, owner, etc)
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="w-full px-4 py-3 bg-[#1E293B] text-white rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-200 mb-2">
              Idea behind the token
            </label>
            <textarea
              value={formData.idea}
              onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
              className="w-full px-4 py-3 bg-[#1E293B] text-white rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-200 mb-2">
              Website for the project/idea
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 bg-[#1E293B] text-white rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500"
              placeholder="https://"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-200 mb-2">
              Social Links
            </label>
            <textarea
              value={formData.socialLinks}
              onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
              className="w-full px-4 py-3 bg-[#1E293B] text-white rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none placeholder-gray-500"
              placeholder="Twitter: https://twitter.com/...&#10;Discord: https://discord.gg/..."
            />
          </div>

          <div className="bg-[#1E293B] p-6 rounded-lg">
            <p className="text-gray-200 text-base leading-relaxed">
              We will calculate against the market your idea, its probability of succeeding and some insights as to what the top performers in short as well as long terms have common with you, and what you can do better.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            Submit for Analysis
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AIScore() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSubmitIdea = async (data: IdeaFormData) => {
    try {
      // Here you would integrate with your AI analysis endpoint
      console.log('Analyzing idea:', data)
      // Add API call to analyze the idea
    } catch (error) {
      console.error('Error analyzing idea:', error)
    }
  }

  return (
    <div className="bg-background-light rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Test Your Ideas</h2>
      <div className="space-y-4">
        <p className="text-gray-400">
          Test your ideas against our algorithm, zora insights and AI to see how good your future token could perform in the market
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Get Insights
        </button>
      </div>

      <IdeaTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitIdea}
      />
    </div>
  )
} 