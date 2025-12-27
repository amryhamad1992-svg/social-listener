// Mock data for development and demos
// This simulates social media data until all APIs are connected

const YOUTUBE_CHANNELS = ['Beauty Guru', 'Makeup Tutorial', 'Skincare Expert', 'Drugstore Beauty', 'Glam Reviews'];

const REVLON_KEYWORDS = ['revlon', 'super lustrous', 'colorstay', 'revlon lipstick'];

const VIDEO_TITLES = [
  "Finally found my perfect everyday lipstick - Revlon Super Lustrous in Rose Velvet!",
  "Drugstore foundation comparison: Revlon ColorStay vs L'Oreal vs Maybelline",
  "Has anyone tried the new Revlon lip products? Full review!",
  "My holy grail drugstore makeup routine featuring Revlon",
  "Revlon ColorStay foundation oxidizing on me - help!",
  "Best drugstore lipsticks for dry lips? Testing Revlon Super Lustrous",
  "Unpopular opinion: Revlon is still one of the best drugstore brands",
  "Revlon vs high-end: are expensive foundations worth it?",
  "Looking for a Revlon Super Lustrous dupe - swatches comparison",
  "My mom's been using Revlon for 30 years and her skin looks amazing",
  "PSA: Revlon ColorStay is 40% off this week!",
  "Swatches of all my Revlon lipsticks - 15 shades compared",
  "Is Revlon cruelty-free? Everything you need to know",
  "Revlon foundation broke me out - honest review",
  "The staying power of Revlon ColorStay is unmatched for the price",
];

const POSITIVE_BODIES = [
  "I've been using this for months and absolutely love it. The formula is so creamy and the color payoff is incredible. Highly recommend!",
  "Best drugstore purchase I've ever made. Lasts all day and doesn't dry out my lips at all.",
  "This is a hidden gem! The quality rivals high-end brands at a fraction of the price.",
  "My go-to for years. Never disappoints and the shade range is fantastic.",
  "Just repurchased for the 5th time. If you haven't tried this yet, you're missing out!",
];

const NEGATIVE_BODIES = [
  "Really disappointed with this purchase. The formula is patchy and the color looks nothing like the swatch.",
  "Broke me out terribly. Had to stop using it after just a few days. Not worth the money.",
  "The staying power is terrible - completely gone within 2 hours. Save your money.",
  "Packaging feels cheap and the product dried out within a month. Won't repurchase.",
  "Not impressed at all. Expected better quality for this price point.",
];

const NEUTRAL_BODIES = [
  "It's okay, nothing special. Does the job but I've used better products.",
  "Mixed feelings about this one. Some shades are great, others not so much.",
  "Decent for the price but probably won't repurchase. Looking for something better.",
  "Average product. Works fine for everyday use but wouldn't recommend for special occasions.",
  "It's fine I guess. Not amazing but not terrible either. 3/5 stars.",
];

const AUTHORS = [
  'BeautyByMia', 'GlamourGuru', 'MakeupMaven', 'SkincareSally',
  'LipstickLover', 'FoundationFixer', 'BudgetBeauty', 'GlamGal99',
  'CosmeticsQueen', 'EverydayGlam', 'NaturalLookFan', 'BoldLipsOnly',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateVideoId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface MockPost {
  id: string;
  videoId: string;
  source: string;
  sourceIcon: string;
  title: string;
  body: string;
  author: string;
  score: number;
  numComments: number;
  url: string;
  createdUtc: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  matchedKeyword: string;
}

export function generateMockPosts(count: number = 50, daysBack: number = 30): MockPost[] {
  const posts: MockPost[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Randomly determine sentiment (weighted: 45% positive, 35% neutral, 20% negative)
    const sentimentRoll = Math.random();
    let sentiment: 'positive' | 'neutral' | 'negative';
    let body: string;
    let sentimentScore: number;

    if (sentimentRoll < 0.45) {
      sentiment = 'positive';
      body = randomElement(POSITIVE_BODIES);
      sentimentScore = 0.3 + Math.random() * 0.7; // 0.3 to 1.0
    } else if (sentimentRoll < 0.80) {
      sentiment = 'neutral';
      body = randomElement(NEUTRAL_BODIES);
      sentimentScore = -0.2 + Math.random() * 0.4; // -0.2 to 0.2
    } else {
      sentiment = 'negative';
      body = randomElement(NEGATIVE_BODIES);
      sentimentScore = -1.0 + Math.random() * 0.7; // -1.0 to -0.3
    }

    const videoId = generateVideoId();
    const channel = randomElement(YOUTUBE_CHANNELS);
    const daysAgo = Math.random() * daysBack;
    const createdUtc = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    posts.push({
      id: `mock_${i}`,
      videoId,
      source: channel,
      sourceIcon: '▶️',
      title: randomElement(VIDEO_TITLES),
      body,
      author: randomElement(AUTHORS),
      score: randomInt(100, 50000),
      numComments: randomInt(10, 500),
      url: `https://youtube.com/watch?v=${videoId}`,
      createdUtc,
      sentiment,
      sentimentScore,
      matchedKeyword: randomElement(REVLON_KEYWORDS),
    });
  }

  // Sort by date descending
  return posts.sort((a, b) => b.createdUtc.getTime() - a.createdUtc.getTime());
}

export function generateMockTrendingTerms(): Array<{
  term: string;
  mentions: number;
  sentiment: number;
  change: number;
}> {
  const terms = [
    'super lustrous',
    'colorstay foundation',
    'drugstore lipstick',
    'long lasting',
    'dry lips',
    'oxidizing',
    'shade range',
    'cruelty free',
    'affordable makeup',
    'everyday look',
    'full coverage',
    'matte finish',
    'hydrating formula',
    'color payoff',
    'value for money',
  ];

  return terms.map((term) => ({
    term,
    mentions: randomInt(5, 100),
    sentiment: -0.5 + Math.random() * 1.5, // -0.5 to 1.0
    change: -30 + Math.random() * 80, // -30% to +50%
  })).sort((a, b) => b.mentions - a.mentions);
}

export function generateMockDashboardData(days: number = 7) {
  const posts = generateMockPosts(100, days);

  // Calculate KPIs
  const totalMentions = posts.length;
  const positiveCount = posts.filter(p => p.sentiment === 'positive').length;
  const neutralCount = posts.filter(p => p.sentiment === 'neutral').length;
  const negativeCount = posts.filter(p => p.sentiment === 'negative').length;

  const avgSentiment = posts.reduce((sum, p) => sum + p.sentimentScore, 0) / posts.length;

  // Source distribution
  const sourceCounts: Record<string, number> = {};
  posts.forEach(p => {
    sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
  });
  const topSource = Object.entries(sourceCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'YouTube';

  // Generate daily trend data
  const sentimentTrend = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Filter posts for this day
    const dayPosts = posts.filter(p => {
      const postDate = p.createdUtc.toISOString().split('T')[0];
      return postDate === dateStr;
    });

    const daySentiment = dayPosts.length > 0
      ? dayPosts.reduce((sum, p) => sum + p.sentimentScore, 0) / dayPosts.length
      : avgSentiment + (Math.random() - 0.5) * 0.2;

    sentimentTrend.push({
      date: dateStr,
      sentiment: daySentiment,
      mentions: dayPosts.length || randomInt(5, 20),
    });
  }

  // Generate bubble chart data for topics
  const topicBubbleData = [
    { name: 'Super Lustrous Lipstick', sentiment: 0.72, mentions: 45, engagement: 320 },
    { name: 'ColorStay Foundation', sentiment: 0.35, mentions: 38, engagement: 250 },
    { name: 'Oxidizing Issues', sentiment: -0.65, mentions: 22, engagement: 180 },
    { name: 'Drugstore Value', sentiment: 0.58, mentions: 31, engagement: 200 },
    { name: 'Shade Range', sentiment: 0.15, mentions: 28, engagement: 150 },
    { name: 'Dry Lips Concern', sentiment: -0.42, mentions: 18, engagement: 120 },
    { name: 'Long Lasting', sentiment: 0.81, mentions: 35, engagement: 280 },
    { name: 'Cruelty Free', sentiment: -0.25, mentions: 15, engagement: 90 },
    { name: 'Packaging Quality', sentiment: -0.38, mentions: 12, engagement: 75 },
    { name: 'Color Payoff', sentiment: 0.68, mentions: 42, engagement: 310 },
  ];

  return {
    brand: { id: 1, name: 'Revlon' },
    kpis: {
      totalMentions,
      mentionsChange: randomInt(-10, 25),
      avgSentiment,
      sentimentChange: randomInt(-5, 15),
      trendingTopicsCount: randomInt(10, 25),
      topSource,
      positiveCount,
      neutralCount,
      negativeCount,
    },
    sentimentTrend,
    topicBubbleData,
    recentMentions: posts.slice(0, 10).map(p => ({
      id: p.id,
      title: p.title,
      source: p.source,
      sourceIcon: p.sourceIcon,
      sentiment: p.sentiment,
      score: p.score,
      createdAt: p.createdUtc.toISOString(),
      url: p.url,
    })),
  };
}
