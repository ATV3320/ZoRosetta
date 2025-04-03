import OpenAI from 'openai';
import { ZoraToken } from './zora';

// Commenting out OpenAI initialization to prevent API key requirement
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

export interface AIAnalysis {
  sentiment: number;
  insights: string[];
  recommendations: string[];
}

export async function analyzeMarketData(
  tokens: ZoraToken[],
  timeframe: string = '24h'
): Promise<AIAnalysis> {
  // Returning placeholder data instead of making OpenAI API call
  return {
    sentiment: 50,
    insights: ["AI analysis temporarily disabled"],
    recommendations: ["Please check back later for AI-powered recommendations"]
  };

  // Commenting out OpenAI API call
  /*
  try {
    const prompt = `
      Analyze the following Zora network token data for the past ${timeframe}:
      ${JSON.stringify(tokens, null, 2)}

      Please provide:
      1. A market sentiment score (0-100)
      2. Key market insights
      3. Trading recommendations

      Format your response as follows:
      SENTIMENT: [score]
      INSIGHTS:
      - [insight 1]
      - [insight 2]
      RECOMMENDATIONS:
      - [recommendation 1]
      - [recommendation 2]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a crypto market analyst specializing in Zora network tokens. Provide concise, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const analysis = response.choices[0].message.content || '';
    
    // Parse the response
    const sentimentMatch = analysis.match(/SENTIMENT: (\d+)/);
    const insightsMatch = analysis.match(/INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:)/);
    const recommendationsMatch = analysis.match(/RECOMMENDATIONS:([\s\S]*$)/);

    const sentiment = sentimentMatch ? parseInt(sentimentMatch[1]) : 50;
    const insights = insightsMatch 
      ? insightsMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.slice(1).trim())
      : [];
    const recommendations = recommendationsMatch
      ? recommendationsMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.slice(1).trim())
      : [];

    return {
      sentiment,
      insights,
      recommendations,
    };
  } catch (error) {
    console.error('Error analyzing market data:', error);
    throw error;
  }
  */
} 