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

    if (!response) {
      throw new Error('No response received from Zora SDK');
    }

    if (!response.data) {
      throw new Error('No data in Zora SDK response');
    }

    if (!response.data.exploreList) {
      throw new Error('No exploreList in Zora SDK response');
    }

    if (!Array.isArray(response.data.exploreList.edges)) {
      throw new Error('Invalid edges data in Zora SDK response');
    }

    const tokens = response.data.exploreList.edges
      .filter((edge): edge is typeof edge & { node: NonNullable<typeof edge.node> } => 
        edge?.node != null
      )
      .map(edge => ({
        name: edge.node.name || 'Unknown',
        symbol: edge.node.symbol || 'UNKNOWN',
        marketCapDelta24h: edge.node.marketCapDelta24h || 0,
        marketCap: edge.node.marketCap || 0,
        volume24h: edge.node.volume24h || 0,
      }));

    return NextResponse.json({
      tokens,
      pageInfo: response.data.exploreList.pageInfo || {},
    });
  } catch (error) {
    console.error('Error fetching from Zora:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from Zora',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 