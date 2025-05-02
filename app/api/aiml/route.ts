import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface Coin {
  id?: string;
  name?: string;
  symbol?: string;
  marketCapDelta24h?: string;
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

interface AIMLRequest {
  tokenDescription: string;
  marketData: {
    mostValuable: Coin[];
    topGainers: Coin[];
  };
  isLocalMode?: boolean;
}

interface AIMLResponse {
  shortTermSuccess: number;
  ideaAuthenticity: number;
  reliability: number;
  analysis: string;
  improvements: string[];
}

const getMockAnalysis = (): AIMLResponse => {
  const mockResponses: AIMLResponse[] = [
    {
      shortTermSuccess: 75,
      ideaAuthenticity: 80,
      reliability: 70,
      analysis: "This token idea shows strong potential in the current market. The concept aligns well with existing successful projects while offering unique value propositions. The integration with Zora's ecosystem could provide significant advantages for early adopters.",
      improvements: [
        "Consider implementing additional governance features to increase community engagement",
        "Explore partnerships with existing Zora projects to expand reach",
        "Develop a detailed roadmap with clear milestones and deliverables"
      ]
    },
    {
      shortTermSuccess: 85,
      ideaAuthenticity: 75,
      reliability: 80,
      analysis: "The proposed token demonstrates innovative thinking and market awareness. The focus on community-driven features and integration with Zora's infrastructure positions it well for sustainable growth. The tokenomics model appears well-thought-out.",
      improvements: [
        "Strengthen the token utility by adding more use cases",
        "Create a comprehensive marketing strategy for launch",
        "Consider implementing a vesting schedule for early supporters"
      ]
    },
    {
      shortTermSuccess: 70,
      ideaAuthenticity: 85,
      reliability: 75,
      analysis: "This token concept shows promise with its unique approach to solving common challenges in the space. The integration with Zora's ecosystem provides a solid foundation for growth, while the proposed features address clear market needs.",
      improvements: [
        "Enhance liquidity mechanisms to ensure stable trading",
        "Develop a strong community engagement program",
        "Consider implementing cross-chain compatibility for wider reach"
      ]
    }
  ];
  
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
};

export async function POST(request: NextRequest) {
  try {
    const body: AIMLRequest = await request.json();
    
    // If in local mode, return mock data
    if (body.isLocalMode) {
      return NextResponse.json(getMockAnalysis());
    }

    // TODO: Implement actual AI analysis
    return NextResponse.json(getMockAnalysis());
  } catch (error) {
    console.error('AIML analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze token idea' },
      { status: 500 }
    );
  }
} 