'use client'

import { useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

export interface MarketToken {
  name: string;
  symbol: string;
  marketCapDelta24h?: string;
  marketCap?: string;
  volume24h?: string;
  uniqueHolders?: number;
  createdAt?: string;
}

interface MarketTableProps {
  tokens: MarketToken[];
  loading: boolean;
  error: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function MarketTable({
  tokens,
  loading,
  error,
  onLoadMore,
  hasMore = false,
}: MarketTableProps) {
  const formatNumber = (value: string | undefined) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (value: string | undefined) => {
    if (!value) return '0.00';
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (error) {
    return (
      <div className="bg-background-light rounded-xl p-6">
        <div className="text-red-400 p-4 rounded-lg bg-background">
          <p>{error}</p>
          <p className="text-sm mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-background">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Token
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Price Change
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Market Cap
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Volume (24h)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Holders
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {tokens.map((token, index) => {
              const change = parseFloat(token.marketCapDelta24h || '0');
              const trend = change >= 0 ? 'up' : 'down';
              
              return (
                <tr key={`${token.symbol}-${index}`} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary`}>
                        {token.symbol.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">{token.name}</div>
                        <div className="text-sm text-gray-400">{token.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center ${
                      trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trend === 'up' ? (
                        <ArrowUpIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 mr-1" />
                      )}
                      {formatPercentage(token.marketCapDelta24h)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {formatNumber(token.marketCap)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {formatNumber(token.volume24h)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {token.uniqueHolders?.toLocaleString() || 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-background rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {hasMore && !loading && (
        <div className="p-4 flex justify-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
} 