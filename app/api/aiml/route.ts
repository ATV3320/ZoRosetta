import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface AIMLRequest {
  tokenDescription: string;
  marketData: {
    mostValuable: any[];
    topGainers: any[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AIMLRequest = await request.json();
    
    if (!process.env.AIML_API_KEY) {
      throw new Error('AIML API key not configured');
    }

    // Prepare the prompt for AIML API
    const prompt = `Analyze this token idea and provide insights based on current market trends:

Token Description: ${body.tokenDescription}

Market Context:
- Most Valuable Tokens: ${JSON.stringify(body.marketData.mostValuable.slice(0, 3))}
- Top Gainers: ${JSON.stringify(body.marketData.topGainers.slice(0, 3))}

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

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert in analyzing token ideas and market trends. Provide accurate, data-driven insights and specific improvement suggestions."
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
      throw new Error(`AIML API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response from AIML API
    const parsedResponse = JSON.parse(content);
    
    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('AIML API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze token idea',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 