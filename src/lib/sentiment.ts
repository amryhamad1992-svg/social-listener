// Sentiment Analysis using OpenAI GPT-4o-mini
// with comprehensive keyword lists for classification
//
// Using Stackline colors:
// - Positive: #71c184 (Success Green)
// - Neutral: #4E596A (Slate)
// - Negative: #ff534a (Danger Red)

import OpenAI from 'openai';

// ============================================================================
// SENTIMENT KEYWORD LISTS (Brand-Agnostic)
// ============================================================================

// POSITIVE KEYWORDS - Words/phrases indicating satisfaction, approval, recommendation
export const POSITIVE_KEYWORDS = [
  // Enthusiasm & Love
  'love', 'loving', 'loved', 'adore', 'obsessed', 'obsession', 'addicted',
  'amazing', 'incredible', 'fantastic', 'wonderful', 'excellent', 'outstanding',
  'brilliant', 'fabulous', 'magnificent', 'marvelous', 'phenomenal', 'superb',

  // Quality & Performance
  'perfect', 'flawless', 'impeccable', 'exceptional', 'superior', 'premium',
  'high-quality', 'top-notch', 'first-class', 'world-class', 'best-in-class',
  'reliable', 'dependable', 'consistent', 'durable', 'long-lasting', 'sturdy',

  // Satisfaction
  'satisfied', 'happy', 'pleased', 'delighted', 'thrilled', 'ecstatic',
  'impressed', 'blown away', 'exceeded expectations', 'surpassed expectations',
  'pleasantly surprised', 'better than expected', 'worth every penny',

  // Recommendation
  'recommend', 'recommended', 'highly recommend', 'must-have', 'must have',
  'game changer', 'game-changer', 'life changer', 'life-changer', 'holy grail',
  'go-to', 'staple', 'essential', 'favorite', 'favourite', 'best', 'top',

  // Value
  'worth it', 'good value', 'great value', 'excellent value', 'bargain',
  'affordable', 'reasonably priced', 'fair price', 'steal', 'deal',

  // Effectiveness
  'works', 'worked', 'working', 'effective', 'efficient', 'powerful',
  'delivers', 'delivered', 'performs', 'performed', 'does the job',
  'gets the job done', 'lives up to the hype', 'as advertised',

  // Positive Actions
  'repurchase', 'repurchased', 'rebuy', 'reorder', 'reordered', 'buying again',
  'stocking up', 'backup', 'backups', 'will buy again', 'coming back',

  // Appearance & Aesthetics
  'beautiful', 'gorgeous', 'stunning', 'lovely', 'pretty', 'elegant',
  'sleek', 'stylish', 'attractive', 'appealing', 'eye-catching',

  // Ease & Convenience
  'easy', 'simple', 'straightforward', 'user-friendly', 'intuitive',
  'convenient', 'effortless', 'smooth', 'seamless', 'hassle-free',

  // Positive Emotions
  'enjoy', 'enjoyed', 'enjoying', 'like', 'liked', 'appreciate', 'appreciated',
  'grateful', 'thankful', 'glad', 'exciting', 'excited', 'fun',

  // Superlatives
  'best ever', 'all-time favorite', 'number one', '#1', 'top pick',
  'hands down', 'without a doubt', 'absolutely', 'definitely', 'totally',
  'completely', 'utterly', '10/10', '5 stars', 'five stars', 'A+',
];

// NEGATIVE KEYWORDS - Words/phrases indicating dissatisfaction, complaints, criticism
export const NEGATIVE_KEYWORDS = [
  // Dislike & Hate
  'hate', 'hated', 'hating', 'despise', 'loathe', 'detest', 'can\'t stand',
  'dislike', 'disliked', 'not a fan', 'not for me', 'pass', 'hard pass',

  // Poor Quality
  'terrible', 'horrible', 'awful', 'dreadful', 'atrocious', 'abysmal',
  'poor', 'bad', 'worst', 'inferior', 'subpar', 'substandard', 'low-quality',
  'cheap', 'flimsy', 'fragile', 'broke', 'broken', 'defective', 'faulty',

  // Disappointment
  'disappointed', 'disappointing', 'disappointment', 'let down', 'letdown',
  'underwhelmed', 'underwhelming', 'unimpressed', 'not impressed',
  'expected more', 'expected better', 'fell short', 'missed the mark',

  // Waste & Regret
  'waste', 'wasted', 'waste of money', 'waste of time', 'not worth it',
  'overpriced', 'too expensive', 'rip-off', 'ripoff', 'scam', 'fraud',
  'regret', 'regretted', 'regretting', 'buyer\'s remorse', 'shouldn\'t have',

  // Problems & Issues
  'problem', 'problems', 'issue', 'issues', 'trouble', 'troubles',
  'fail', 'failed', 'failing', 'failure', 'malfunction', 'malfunctioned',
  'doesn\'t work', 'didn\'t work', 'not working', 'stopped working',

  // Warnings & Advice Against
  'don\'t buy', 'do not buy', 'don\'t get', 'do not get', 'avoid',
  'stay away', 'steer clear', 'skip', 'wouldn\'t recommend', 'not recommended',
  'beware', 'warning', 'be careful', 'think twice', 'save your money',

  // Returns & Complaints
  'return', 'returned', 'returning', 'refund', 'refunded', 'exchange',
  'complaint', 'complained', 'complaining', 'never again', 'last time',

  // Negative Experience
  'frustrating', 'frustrated', 'frustration', 'annoying', 'annoyed', 'irritating',
  'irritated', 'aggravating', 'infuriating', 'maddening', 'unacceptable',

  // False Advertising
  'misleading', 'false', 'fake', 'lies', 'lied', 'false advertising',
  'not as described', 'not as shown', 'different from pictures', 'bait and switch',
  'overhyped', 'overrated', 'doesn\'t live up', 'didn\'t live up',

  // Negative Descriptors
  'ugly', 'hideous', 'gross', 'disgusting', 'nasty', 'unpleasant',
  'uncomfortable', 'painful', 'difficult', 'complicated', 'confusing',
  'slow', 'sluggish', 'clunky', 'outdated', 'old-fashioned',

  // Severity
  'disaster', 'nightmare', 'catastrophe', 'fiasco', 'mess', 'trash',
  'garbage', 'junk', 'rubbish', 'crap', 'sucks', 'sucked', 'blows',

  // Ratings
  '0/10', '1/10', '2/10', '0 stars', '1 star', 'one star', 'F', 'thumbs down',
];

// NEUTRAL KEYWORDS - Words/phrases indicating factual, informational, or questioning content
export const NEUTRAL_KEYWORDS = [
  // Questions & Inquiries
  'anyone tried', 'has anyone', 'have you', 'what do you think',
  'thoughts on', 'opinions on', 'feedback on', 'reviews of',
  'how is', 'how are', 'how does', 'is it', 'are they', 'does it',
  'wondering', 'curious', 'interested in', 'looking for', 'searching for',

  // Comparisons (without preference)
  'vs', 'versus', 'compared to', 'comparison', 'difference between',
  'similar to', 'alternative to', 'alternatives', 'options', 'choices',

  // Information Seeking
  'where to buy', 'where can I', 'how much', 'price', 'cost', 'costs',
  'available', 'availability', 'in stock', 'out of stock', 'restock',
  'when does', 'when will', 'release date', 'launch date',

  // Factual Statements
  'contains', 'includes', 'features', 'specifications', 'specs',
  'made of', 'made from', 'ingredients', 'materials', 'components',
  'size', 'sizes', 'dimensions', 'weight', 'color', 'colors', 'colour', 'colours',

  // Actions (neutral)
  'trying', 'testing', 'using', 'reviewing', 'checking out', 'looking at',
  'considering', 'thinking about', 'might get', 'might try', 'debating',

  // Descriptive (no opinion)
  'new', 'latest', 'recent', 'updated', 'version', 'edition', 'model',
  'launched', 'released', 'announced', 'introduced', 'unveiled',

  // Requests
  'recommendations', 'suggestions', 'advice', 'tips', 'help',
  'which one', 'which should', 'what should', 'best option',

  // Mixed/Balanced
  'pros and cons', 'advantages and disadvantages', 'good and bad',
  'mixed feelings', 'on the fence', 'undecided', 'not sure', 'uncertain',
  'it\'s okay', 'it\'s ok', 'it\'s alright', 'it\'s fine', 'decent', 'average',
  'mediocre', 'so-so', 'meh', 'nothing special', 'standard', 'typical', 'normal',
];

// ============================================================================
// SENTIMENT ANALYSIS FUNCTIONS
// ============================================================================

// Lazy-load OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

interface BatchSentimentResult {
  text: string;
  sentiment: SentimentResult;
}

// Quick keyword-based sentiment check (fallback when no API key)
export function analyzeKeywordSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  // Count keyword matches
  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      positiveCount++;
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      negativeCount++;
    }
  }

  for (const keyword of NEUTRAL_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      neutralCount++;
    }
  }

  const total = positiveCount + negativeCount + neutralCount;

  if (total === 0) {
    return { score: 0, label: 'neutral', confidence: 0.3 };
  }

  // Calculate weighted score
  const score = (positiveCount - negativeCount) / Math.max(total, 1);
  const normalizedScore = Math.max(-1, Math.min(1, score));

  // Determine label
  let label: 'positive' | 'neutral' | 'negative';
  if (normalizedScore > 0.2) {
    label = 'positive';
  } else if (normalizedScore < -0.2) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  // Calculate confidence based on keyword density
  const confidence = Math.min(0.9, 0.3 + (total / 10) * 0.6);

  return { score: normalizedScore, label, confidence };
}

// AI-powered sentiment analysis with keyword context
export async function analyzeSentiment(text: string, brand: string): Promise<SentimentResult> {
  // If no API key, fall back to keyword analysis
  if (!process.env.OPENAI_API_KEY) {
    return analyzeKeywordSentiment(text);
  }

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the sentiment of the given text.

SENTIMENT CATEGORIES:

**POSITIVE** (score 0.2 to 1.0):
Indicators: ${POSITIVE_KEYWORDS.slice(0, 30).join(', ')}...
- Expresses satisfaction, approval, or enthusiasm
- Recommends or endorses the product/brand
- Describes positive experiences or outcomes
- Uses superlatives or praise

**NEUTRAL** (score -0.2 to 0.2):
Indicators: ${NEUTRAL_KEYWORDS.slice(0, 30).join(', ')}...
- Asks questions or seeks information
- Makes factual statements without opinion
- Compares options without clear preference
- Describes features without judgment

**NEGATIVE** (score -1.0 to -0.2):
Indicators: ${NEGATIVE_KEYWORDS.slice(0, 30).join(', ')}...
- Expresses dissatisfaction or disappointment
- Warns others or advises against purchase
- Describes problems, issues, or failures
- Uses critical or harsh language

Return ONLY a JSON object:
{"score": <number -1 to 1>, "label": "<positive|neutral|negative>", "confidence": <number 0 to 1>}`,
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
    // Fall back to keyword analysis on error
    return analyzeKeywordSentiment(text);
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

// Returns Stackline-branded colors for sentiment labels
export function getSentimentColor(label: string): string {
  switch (label) {
    case 'positive':
      return '#71c184'; // Stackline Success Green
    case 'negative':
      return '#ff534a'; // Stackline Danger Red
    default:
      return '#4E596A'; // Stackline Slate (neutral)
  }
}

// Returns background colors with transparency for sentiment badges
export function getSentimentBgColor(label: string): string {
  switch (label) {
    case 'positive':
      return 'rgba(113, 193, 132, 0.15)';
    case 'negative':
      return 'rgba(255, 83, 74, 0.15)';
    default:
      return 'rgba(78, 89, 106, 0.15)';
  }
}

// Export keyword counts for reference
export const SENTIMENT_STATS = {
  positiveKeywords: POSITIVE_KEYWORDS.length,
  negativeKeywords: NEGATIVE_KEYWORDS.length,
  neutralKeywords: NEUTRAL_KEYWORDS.length,
  total: POSITIVE_KEYWORDS.length + NEGATIVE_KEYWORDS.length + NEUTRAL_KEYWORDS.length,
};
