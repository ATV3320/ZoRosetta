'use client'

import { useEffect, useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface Token {
  name: string;
  symbol: string;
  marketCapDelta24h: string;
  marketCap: string;
  volume24h: string;
}

export default function TrendingProjects() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        const response = await fetch('/api/zora?type=topGainers&count=3');
        if (!response.ok) {
          throw new Error('Failed to fetch trending tokens');
        }
        const data = await response.json();
        
        if (!data.tokens) {
          throw new Error('Invalid data format');
        }
        
        setTokens(data.tokens);
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trending tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-background-light rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Trending Projects</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-background rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Trending Projects</h2>
        <div className="text-red-400 p-4 rounded-lg bg-background">
          <p>{error}</p>
          <p className="text-sm mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="bg-background-light rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Trending Projects</h2>
        <div className="text-gray-400 p-4 rounded-lg bg-background">
          No trending projects available at the moment.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Trending Projects</h2>
      <div className="space-y-4">
        {tokens.map((token, index) => {
          const change = parseFloat(token.marketCapDelta24h || '0');
          const trend = change >= 0 ? 'up' : 'down';
          
          return (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-blue-600' :
                  index === 1 ? 'bg-green-600' :
                  'bg-purple-600'
                }`}>
                  {token.symbol.charAt(0)}
                </div>
                <div>
                  <span className="font-medium block">{token.name}</span>
                  <span className="text-sm text-gray-400">{token.symbol}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`${
                  trend === 'up' ? 'text-green-400' : 'text-red-400'
                } flex items-center`}>
                  {trend === 'up' ? (
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 mr-1" />
                  )}
                  {formatPercentage(token.marketCapDelta24h)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 