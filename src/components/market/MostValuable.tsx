'use client'

import { useState, useEffect } from 'react'
import { getCoinsMostValuable } from "@zoralabs/coins-sdk"
import MarketTable, { MarketToken } from './MarketTable'

export default function MostValuable() {
  const [tokens, setTokens] = useState<MarketToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)

  const fetchData = async (afterCursor?: string) => {
    try {
      setLoading(true)
      const response = await getCoinsMostValuable({
        count: 10,
        after: afterCursor,
      })

      if (!response.data?.exploreList?.edges) {
        throw new Error('Invalid response format')
      }

      const newTokens = response.data.exploreList.edges
        .filter(edge => edge.node)
        .map(edge => ({
          name: edge.node!.name || '',
          symbol: edge.node!.symbol || '',
          marketCapDelta24h: edge.node!.marketCapDelta24h || '',
          marketCap: edge.node!.marketCap || '',
          volume24h: edge.node!.volume24h || '',
          uniqueHolders: edge.node!.uniqueHolders || 0,
          createdAt: edge.node!.createdAt || '',
        })) as MarketToken[]

      if (afterCursor) {
        setTokens(prev => [...prev, ...newTokens])
      } else {
        setTokens(newTokens)
      }

      // Update pagination state
      const nextCursor = response.data.exploreList.pageInfo?.endCursor
      setCursor(nextCursor)
      setHasMore(!!nextCursor && response.data.exploreList.edges.length > 0)
      setError(null)
    } catch (err) {
      console.error('Error fetching most valuable coins:', err)
      setError('Failed to fetch most valuable coins. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLoadMore = () => {
    if (cursor) {
      fetchData(cursor)
    }
  }

  return (
    <MarketTable
      tokens={tokens}
      loading={loading}
      error={error}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
    />
  )
} 