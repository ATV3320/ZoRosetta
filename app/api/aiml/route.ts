import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

const analyzeWithAI = async (request: AIMLRequest): Promise<AIMLResponse> => {
  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) {
    console.error('AIML API key is missing');
    throw new Error('AI analysis service is not configured. Please contact support.');
  }

  const prompt = `Analyze this token idea and provide insights based on current market trends:

Token Description: ${request.tokenDescription}

Market Context:
- Most Valuable Tokens: ${JSON.stringify(request.marketData.mostValuable.slice(0, 3).map(coin => ({
    name: coin.name,
    symbol: coin.symbol,
    marketCapDelta: coin.marketCapDelta24h
  })))}
- Top Gainers: ${JSON.stringify(request.marketData.topGainers.slice(0, 3).map(coin => ({
    name: coin.name,
    symbol: coin.symbol,
    marketCapDelta: coin.marketCapDelta24h
  })))}

Please provide:
1. A short-term success score (0-100)
2. An idea authenticity score (0-100)
3. A reliability score (0-100)
4. A brief analysis comment
5. Three specific suggestions for improvement

Format the response as JSON with these exact keys:
{
  "shortTermSuccess": number,
  "ideaAuthenticity": number,
  "reliability": number,
  "analysis": string,
  "improvements": string[]
}`;

  try {
    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
          {
            role: "system",
            content: "You are an expert in analyzing token ideas and market trends. Provide accurate, data-driven insights and specific improvement suggestions. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AIML API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`AI analysis service error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content) as AIMLResponse;
    } catch (parseError) {
      console.error('Failed to parse AI response:', content, parseError);
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: AIMLRequest = await request.json();
    
    // If in local mode, return mock data
    if (body.isLocalMode) {
      return NextResponse.json(getMockAnalysis());
    }

    // Use AI for analysis
    const analysis = await analyzeWithAI(body);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AIML analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze token idea',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 