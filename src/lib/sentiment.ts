// Sentiment Analysis using OpenAI GPT-4o-mini
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

interface BatchSentimentResult {
  text: string;
  sentiment: SentimentResult;
}

export async function analyzeSentiment(text: string, brand: string): Promise<SentimentResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the sentiment of the given text specifically regarding the brand "${brand}".

Return a JSON object with:
- score: number between -1 (very negative) and 1 (very positive)
- label: "positive", "neutral", or "negative"
- confidence: number between 0 and 1 indicating your confidence

Consider:
- Direct mentions of the brand
- Implied sentiment about products
- Comparison with competitors
- Recommendations or complaints

Only return the JSON object, no additional text.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    return {
      score: Math.max(-1, Math.min(1, result.score)),
      label: result.label,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    // Return neutral on error
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
    };
  }
}

export async function analyzeSentimentBatch(
  texts: string[],
  brand: string
): Promise<BatchSentimentResult[]> {
  // Process in parallel with rate limiting
  const results: BatchSentimentResult[] = [];
  const batchSize = 5;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (text) => ({
        text,
        sentiment: await analyzeSentiment(text, brand),
      }))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

export function getSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

export function getSentimentColor(label: string): string {
  switch (label) {
    case 'positive':
      return '#22c55e';
    case 'negative':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}
