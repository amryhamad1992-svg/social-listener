import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Analyze brand sentiment from mentions
export async function analyzeBrandSentiment(
  brand: string,
  mentions: { title: string; body: string; sentiment: string }[]
): Promise<{
  overallScore: number;
  summary: string;
  positiveThemes: string[];
  negativeThemes: string[];
  neutralThemes: string[];
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  // Prepare mentions text for analysis (limit to avoid token limits)
  const mentionsText = mentions
    .slice(0, 30)
    .map((m, i) => `${i + 1}. "${m.title}" - ${m.body.substring(0, 150)}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a brand sentiment analyst for beauty and cosmetics brands. Analyze social media mentions and provide insights. Be concise and actionable.`,
      },
      {
        role: 'user',
        content: `Analyze these ${mentions.length} social media mentions for the brand "${brand}":

${mentionsText}

Provide a JSON response with:
1. overallScore: sentiment score from 0-100 (0=very negative, 50=neutral, 100=very positive)
2. summary: 1-2 sentence summary of brand perception (be specific about what's driving sentiment)
3. positiveThemes: array of 2-4 themes driving positive sentiment
4. negativeThemes: array of 2-4 themes driving negative sentiment
5. neutralThemes: array of 1-2 neutral discussion topics

Respond ONLY with valid JSON, no markdown.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || '';

  try {
    // Parse JSON response
    const parsed = JSON.parse(content);
    return {
      overallScore: Math.min(100, Math.max(0, parsed.overallScore || 50)),
      summary: parsed.summary || 'Unable to generate summary.',
      positiveThemes: parsed.positiveThemes || [],
      negativeThemes: parsed.negativeThemes || [],
      neutralThemes: parsed.neutralThemes || [],
    };
  } catch {
    // Fallback if JSON parsing fails
    return {
      overallScore: 50,
      summary: 'Unable to analyze sentiment at this time.',
      positiveThemes: [],
      negativeThemes: [],
      neutralThemes: [],
    };
  }
}

// Generate AI-powered keyword suggestions
export async function generateKeywordSuggestions(
  keywords: string[],
  category: string,
  subCategory: string
): Promise<{
  longTail: string[];
  questions: string[];
  related: string[];
  negative: string[];
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  const keywordList = keywords.slice(0, 20).join(', ');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a paid media keyword strategist specializing in beauty and cosmetics. Generate keyword suggestions for Google Ads and paid social campaigns. Focus on high-intent, specific keywords.`,
      },
      {
        role: 'user',
        content: `Based on these harvested keywords from social listening in the "${category} > ${subCategory}" category:

Keywords: ${keywordList}

Generate additional keyword suggestions for paid media campaigns. Provide a JSON response with:

1. longTail: 6-8 long-tail keyword variations (3-5 words, specific, high purchase intent)
2. questions: 4-6 question-based keywords (how to, what is, best, etc. - great for content targeting)
3. related: 4-6 related/semantic keywords (topics people also search for)
4. negative: 3-4 negative keywords to exclude (irrelevant or low-intent terms)

Make keywords specific to beauty/cosmetics industry. Respond ONLY with valid JSON, no markdown.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  const content = response.choices[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(content);
    return {
      longTail: parsed.longTail || [],
      questions: parsed.questions || [],
      related: parsed.related || [],
      negative: parsed.negative || [],
    };
  } catch {
    return {
      longTail: [],
      questions: [],
      related: [],
      negative: [],
    };
  }
}

export default openai;
