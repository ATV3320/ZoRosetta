"use client";

import { useEffect, useState } from "react";
import { getCoinsMostValuable, getCoinsTopGainers } from "@zoralabs/coins-sdk";
import { AppLayout } from "@/app/components/AppLayout";
import Image from "next/image";

interface MediaContent {
  mimeType?: string;
  originalUri: string;
  previewImage?: {
    small: string;
    medium: string;
    blurhash?: string;
  };
}

interface Coin {
  id?: string;
  name?: string;
  symbol?: string;
  marketCapDelta24h?: string;
  mediaContent?: MediaContent;
}

// Add new interface for form data
interface MetadataFormData {
  tokenName: string;
  tokenDescription: string;
  tokenPrompt: string;
}

function AvatarWithSpinner({ imageUrl, alt, fallback }: { imageUrl?: string; alt: string; fallback: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-md bg-blue-700 text-white overflow-hidden border border-blue-700 bg-[#232b3e] relative">
      {imageUrl ? (
        <>
          {!imageLoaded && (
            <span className="absolute inset-0 flex items-center justify-center z-0">
              <svg
                className="animate-spin h-4 w-4 text-blue-300"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </span>
          )}
          <Image
            src={imageUrl}
            alt={alt}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover z-10"
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </>
      ) : (
        fallback
      )}
    </span>
  );
}

// Add Modal component
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#181f2e] rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [mostValuable, setMostValuable] = useState<Coin[]>([]);
  const [topGainers, setTopGainers] = useState<Coin[]>([]);
  const [loadingValuable, setLoadingValuable] = useState(true);
  const [loadingGainers, setLoadingGainers] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<MetadataFormData>({
    tokenName: '',
    tokenDescription: '',
    tokenPrompt: '',
  });

  useEffect(() => {
    async function fetchMostValuable() {
      setLoadingValuable(true);
      try {
        const response = await getCoinsMostValuable({ count: 10 });
        setMostValuable(response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || []);
      } catch {
        setMostValuable([]);
      }
      setLoadingValuable(false);
    }
    async function fetchTopGainers() {
      setLoadingGainers(true);
      try {
        const response = await getCoinsTopGainers({ count: 10 });
        setTopGainers(response.data?.exploreList?.edges?.map((edge: { node: Coin }) => edge.node) || []);
      } catch {
        setTopGainers([]);
      }
      setLoadingGainers(false);
    }
    fetchMostValuable();
    fetchTopGainers();
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form data:', formData);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      tokenName: '',
      tokenDescription: '',
      tokenPrompt: '',
    });
  };

  return (
    <AppLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white mb-6">AI-Powered Insight & Trading Platform for Zora</h1>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Trending Projects (Most Valuable) */}
          <div className="flex-1 bg-[#181f2e] rounded-xl p-6 shadow-lg min-w-[280px] h-[335px] flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Trending Projects</h2>
            {loadingValuable ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-y-auto scrollbar-custom flex-1">
                <ul className="space-y-3">
                  {mostValuable.map((coin, idx) => {
                    const imageUrl = coin.mediaContent?.previewImage?.small || coin.mediaContent?.previewImage?.medium;
                    return (
                      <li key={coin.id || idx} className="flex items-center justify-between bg-[#232b3e] rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <AvatarWithSpinner
                            imageUrl={imageUrl}
                            alt={coin.symbol || coin.name || "coin"}
                            fallback={coin.symbol?.[0]?.toUpperCase() || '?'}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white leading-tight break-words">{coin.name}</div>
                            <div className="text-xs text-gray-400 leading-tight">{coin.symbol}</div>
                          </div>
                        </div>
                        <span className={`font-semibold whitespace-nowrap ml-2 ${Number(coin.marketCapDelta24h) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {coin.marketCapDelta24h ? `${Number(coin.marketCapDelta24h).toFixed(2)}%` : '--'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          {/* Top Gainers */}
          <div className="flex-1 bg-[#181f2e] rounded-xl p-6 shadow-lg min-w-[280px] h-[335px] flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Top Gainers</h2>
            {loadingGainers ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-y-auto scrollbar-custom flex-1">
                <ul className="space-y-3">
                  {topGainers.map((coin, idx) => {
                    const imageUrl = coin.mediaContent?.previewImage?.small || coin.mediaContent?.previewImage?.medium;
                    return (
                      <li key={coin.id || idx} className="flex items-center justify-between bg-[#232b3e] rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <AvatarWithSpinner
                            imageUrl={imageUrl}
                            alt={coin.symbol || coin.name || "coin"}
                            fallback={coin.symbol?.[0]?.toUpperCase() || '?'}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white leading-tight break-words">{coin.name}</div>
                            <div className="text-xs text-gray-400 leading-tight">{coin.symbol}</div>
                          </div>
                        </div>
                        <span className={`font-semibold whitespace-nowrap ml-2 ${Number(coin.marketCapDelta24h) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {coin.marketCapDelta24h ? `${Number(coin.marketCapDelta24h).toFixed(2)}%` : '--'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* Bottom three boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#181f2e] rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-white mb-2">Test Your Ideas</h3>
            <p className="text-gray-400 mb-4">Test your ideas against our algorithm, zora insights and AI to see how good your future token could perform in the market</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">Get Insights</button>
          </div>
          <div className="bg-[#181f2e] rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-white mb-2">Create New Token</h3>
            <p className="text-gray-400 mb-4">Build and Deploy Your Own Token</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">Generate Token</button>
          </div>
          <div className="bg-[#181f2e] rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-white mb-2">Metadata Generation</h3>
            <p className="text-gray-400 mb-4">Generate suitable metadata for the token fusing user prompt with Web3 and Zora trends</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Generate Metadata
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Generation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-semibold text-white mb-4">Generate Token Metadata</h2>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="tokenName" className="block text-sm font-medium text-gray-400 mb-1">
              Token Name
            </label>
            <input
              type="text"
              id="tokenName"
              value={formData.tokenName}
              onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="tokenDescription" className="block text-sm font-medium text-gray-400 mb-1">
              Token Description
            </label>
            <textarea
              id="tokenDescription"
              value={formData.tokenDescription}
              onChange={(e) => setFormData({ ...formData, tokenDescription: e.target.value })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
              required
            />
          </div>
          <div>
            <label htmlFor="tokenPrompt" className="block text-sm font-medium text-gray-400 mb-1 font-bold italic">
              Prompt for your token
            </label>
            <textarea
              id="tokenPrompt"
              value={formData.tokenPrompt}
              onChange={(e) => setFormData({ ...formData, tokenPrompt: e.target.value })}
              className="w-full bg-[#232b3e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Generate
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
