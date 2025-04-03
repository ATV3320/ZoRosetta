import { NextResponse } from 'next/server';
import { analyzeMarketData } from '@/lib/ai';
import { fetchZoraData } from '@/lib/zora';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '24h';

  try {
    // Fetch data from multiple Zora endpoints for comprehensive analysis
    const [topGainers, topVolume, newCoins] = await Promise.all([
      fetchZoraData('topGainers', { count: 5 }),
      fetchZoraData('topVolume', { count: 5 }),
      fetchZoraData('new', { count: 5 }),
    ]);

    // Combine data for analysis
    const analysisData = {
      topGainers: topGainers.tokens,
      topVolume: topVolume.tokens,
      newCoins: newCoins.tokens,
    };

    // Get AI analysis (now returns placeholder data)
    const analysis = await analyzeMarketData(
      [
        ...(topGainers.tokens || []),
        ...(topVolume.tokens || []),
        ...(newCoins.tokens || [])
      ],
      timeframe
    );

    return NextResponse.json({
      data: analysisData,
      analysis,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
} 