// Mock data for development and demos
// This simulates social media data until all APIs are connected

const YOUTUBE_CHANNELS = ['Beauty Guru', 'Makeup Tutorial', 'Skincare Expert', 'Drugstore Beauty', 'Glam Reviews'];

// Brand and category-specific content
const BRAND_CATEGORY_CONTENT: Record<string, Record<string, { keywords: string[]; titles: string[] }>> = {
  'Babyliss': {
    'all': {
      keywords: ['babyliss', 'babyliss pro', 'babyliss hair'],
      titles: [
        "Babyliss tools transformed my hair routine!",
        "Is Babyliss Pro worth the investment? Full review",
        "My complete Babyliss collection - tools I can't live without",
        "Babyliss vs Dyson - which brand is better for styling?",
      ],
    },
    'hairdryers': {
      keywords: ['babyliss hair dryer', 'babyliss blow dryer', 'babyliss pro dryer'],
      titles: [
        "Babyliss Pro hair dryer review - salon quality at home!",
        "Best Babyliss hair dryer for thick hair - comparison",
        "Babyliss blow dryer cut my drying time in half",
        "Is the Babyliss Pro Rapido worth $200? Honest review",
      ],
    },
    'straighteners': {
      keywords: ['babyliss straightener', 'babyliss flat iron', 'babyliss steam'],
      titles: [
        "Babyliss straightener gave me glass hair!",
        "Babyliss steam straightener vs regular flat iron",
        "Best Babyliss flat iron for damaged hair",
        "Babyliss Pro Nano Titanium - 6 month review",
      ],
    },
    'curlingirons': {
      keywords: ['babyliss curling iron', 'babyliss curler', 'babyliss wand'],
      titles: [
        "Babyliss curling wand tutorial - perfect curls every time",
        "Babyliss Pro curling iron review - worth the hype?",
        "Best Babyliss curler for long lasting curls",
        "Babyliss vs GHD curling iron comparison",
      ],
    },
    'hotairbrushes': {
      keywords: ['babyliss hot air brush', 'babyliss big hair', 'babyliss air styler'],
      titles: [
        "Babyliss Big Hair is a game changer for blowouts!",
        "Babyliss hot air brush vs Revlon one step dryer",
        "Getting salon blowout with Babyliss Air Styler",
        "Babyliss rotating hot air brush review",
      ],
    },
  },
  'Revlon': {
    'all': {
      keywords: ['revlon', 'revlon makeup', 'revlon cosmetics'],
      titles: [
        "My holy grail drugstore makeup routine featuring Revlon",
        "Revlon is still one of the best drugstore brands - here's why",
        "Full face using only Revlon products",
        "Best Revlon products in 2026 - complete guide",
      ],
    },
    'lipstick': {
      keywords: ['revlon lipstick', 'super lustrous', 'revlon lip'],
      titles: [
        "Revlon Super Lustrous is the best drugstore lipstick!",
        "All my Revlon lipstick swatches - 15 shades compared",
        "Revlon lip products ranked from worst to best",
        "Best Revlon lipstick shades for every skin tone",
      ],
    },
    'foundation': {
      keywords: ['revlon foundation', 'colorstay', 'revlon face'],
      titles: [
        "Revlon ColorStay foundation - 12 hour wear test",
        "Is Revlon ColorStay good for oily skin? Full review",
        "Revlon foundation oxidizing on me - here's how I fixed it",
        "Best drugstore foundation: Revlon ColorStay vs Maybelline Fit Me",
      ],
    },
    'eyemakeup': {
      keywords: ['revlon mascara', 'revlon eyeshadow', 'revlon eyeliner'],
      titles: [
        "Revlon volumizing mascara is underrated!",
        "Revlon eyeshadow palette review - worth buying?",
        "Best Revlon eye makeup products ranked",
        "Revlon ColorStay eyeliner stays put all day",
      ],
    },
    'nailpolish': {
      keywords: ['revlon nail polish', 'revlon nails', 'revlon nail color'],
      titles: [
        "Revlon nail polish lasts 7 days without chipping!",
        "Best Revlon nail colors for fall/winter",
        "Revlon gel nail polish review - salon results at home?",
        "My Revlon nail polish collection - favorite shades",
      ],
    },
  },
  'Weleda': {
    'all': {
      keywords: ['weleda', 'weleda skincare', 'weleda natural'],
      titles: [
        "Why I switched to Weleda for all my skincare",
        "Weleda natural skincare - worth the price?",
        "My complete Weleda routine for glowing skin",
        "Weleda products ranked from best to worst",
      ],
    },
    'facecare': {
      keywords: ['weleda skin food', 'weleda face', 'weleda facial'],
      titles: [
        "Weleda Skin Food saved my dry winter skin - holy grail!",
        "Why everyone is obsessed with Weleda Skin Food",
        "Weleda Skin Food Light vs Original - which is better?",
        "Best Weleda face products for dry skin",
      ],
    },
    'bodycare': {
      keywords: ['weleda body oil', 'weleda body', 'weleda citrus'],
      titles: [
        "Weleda body oils comparison - which one is best?",
        "Weleda Citrus body oil review - fresh and hydrating",
        "My body care routine with Weleda products",
        "Weleda body lotion vs body oil - which should you get?",
      ],
    },
    'babycare': {
      keywords: ['weleda baby', 'weleda calendula', 'weleda diaper'],
      titles: [
        "Weleda Calendula baby products are so gentle!",
        "Best natural baby products - Weleda baby review",
        "Weleda diaper cream saved us from rashes",
        "Why I only use Weleda for my baby's skincare",
      ],
    },
    'haircare': {
      keywords: ['weleda rosemary', 'weleda hair oil', 'weleda hair'],
      titles: [
        "Weleda Rosemary Hair Oil transformed my hair growth!",
        "Best Weleda hair products for thinning hair",
        "Weleda hair tonic review - does it work for hair loss?",
        "My hair growth journey with Weleda rosemary oil",
      ],
    },
  },
};

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

export function generateMockPosts(count: number = 50, daysBack: number = 30, brand: string = 'Revlon', category: string = 'all'): MockPost[] {
  const posts: MockPost[] = [];
  const now = new Date();

  // Get brand and category-specific content or fall back to Revlon
  const brandContent = BRAND_CATEGORY_CONTENT[brand] || BRAND_CATEGORY_CONTENT['Revlon'];
  const categoryContent = brandContent[category] || brandContent['all'];
  const titles = categoryContent.titles;
  const keywords = categoryContent.keywords;

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
      title: randomElement(titles),
      body,
      author: randomElement(AUTHORS),
      score: randomInt(100, 50000),
      numComments: randomInt(10, 500),
      url: `https://youtube.com/watch?v=${videoId}`,
      createdUtc,
      sentiment,
      sentimentScore,
      matchedKeyword: randomElement(keywords),
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
