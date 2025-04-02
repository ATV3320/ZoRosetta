import { NextResponse } from 'next/server';
import { getCoinsTopGainers } from "@zoralabs/coins-sdk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = searchParams.get('count') ? parseInt(searchParams.get('count')!) : 10;
  const after = searchParams.get('after') || undefined;

  try {
    const response = await getCoinsTopGainers({
      count,
      after,
    });

    if (!response.data?.exploreList?.edges) {
      throw new Error('Invalid response from Zora SDK');
    }

    const tokens = response.data.exploreList.edges.map(edge => ({
      name: edge.node.name,
      symbol: edge.node.symbol,
      marketCapDelta24h: edge.node.marketCapDelta24h,
      marketCap: edge.node.marketCap,
      volume24h: edge.node.volume24h,
    }));

    return NextResponse.json({
      tokens,
      pageInfo: response.data.exploreList.pageInfo,
    });
  } catch (error) {
    console.error('Error fetching from Zora:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Zora' },
      { status: 500 }
    );
  }
} 