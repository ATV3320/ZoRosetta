import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { AvatarWithSpinner } from './AvatarWithSpinner';

interface Coin {
  id?: string;
  name?: string;
  description?: string;
  address?: string;
  symbol?: string;
  totalSupply?: string;
  totalVolume?: string;
  volume24h?: string;
  createdAt?: string;
  creatorAddress?: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  chainId?: number;
  uniqueHolders?: number;
  mediaContent?: {
    mimeType?: string;
    originalUri: string;
    previewImage?: {
      small: string;
      medium: string;
      blurhash?: string;
    };
  };
}

interface CoinDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coin: Coin | null;
}

export function CoinDetailsModal({ isOpen, onClose, coin }: CoinDetailsModalProps) {
  if (!coin) return null;

  const imageUrl = coin.mediaContent?.previewImage?.small || coin.mediaContent?.previewImage?.medium;
  const baseExplorerUrl = "https://basescan.org/address/";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 backdrop-blur-md bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#181f2e]/90 backdrop-blur-md p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <AvatarWithSpinner
                      imageUrl={imageUrl}
                      alt={coin.symbol || coin.name || "coin"}
                      fallback={coin.symbol?.[0]?.toUpperCase() || '?'}
                      size="lg"
                    />
                    <div>
                      <Dialog.Title as="h3" className="text-2xl font-bold text-white">
                        {coin.name}
                      </Dialog.Title>
                      <p className="text-gray-400">{coin.symbol}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-[#232b3e]/80 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm">Market Cap</p>
                    <p className="text-white font-semibold">${coin.marketCap || '-'}</p>
                  </div>
                  <div className="bg-[#232b3e]/80 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm">24h Volume</p>
                    <p className="text-white font-semibold">${coin.volume24h || '-'}</p>
                  </div>
                  <div className="bg-[#232b3e]/80 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm">Total Supply</p>
                    <p className="text-white font-semibold">{coin.totalSupply || '-'}</p>
                  </div>
                  <div className="bg-[#232b3e]/80 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm">Unique Holders</p>
                    <p className="text-white font-semibold">{coin.uniqueHolders || '-'}</p>
                  </div>
                </div>

                {coin.description && (
                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-2">Description</h4>
                    <p className="text-gray-400">{coin.description}</p>
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="text-white font-semibold mb-2">Contract Address</h4>
                  {coin.address ? (
                    <a
                      href={`${baseExplorerUrl}${coin.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all transition-colors"
                    >
                      {coin.address}
                    </a>
                  ) : (
                    <p className="text-gray-400">-</p>
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="text-white font-semibold mb-2">Creator Address</h4>
                  {coin.creatorAddress ? (
                    <a
                      href={`${baseExplorerUrl}${coin.creatorAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all transition-colors"
                    >
                      {coin.creatorAddress}
                    </a>
                  ) : (
                    <p className="text-gray-400">-</p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 