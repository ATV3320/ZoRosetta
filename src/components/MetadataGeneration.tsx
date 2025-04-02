'use client'

export default function MetadataGeneration() {
  const handleGenerateMetadata = () => {
    // Add metadata generation logic here
    console.log('Generating metadata...')
  }

  return (
    <div className="bg-background-light rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Metadata Generation</h2>
      <div className="space-y-4">
        <p className="text-gray-400">
          Generate suitable metadata for the token fusing user prompt with Web3 and Zora trends
        </p>
        <button
          onClick={handleGenerateMetadata}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Generate Metadata
        </button>
      </div>
    </div>
  )
} 