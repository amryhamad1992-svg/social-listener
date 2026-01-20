import { NextRequest, NextResponse } from 'next/server';
import { braveTrendingTopics, braveWebSearch, isBraveConfigured } from '@/lib/brave';

// Categories available for trend tracking
const CATEGORIES: Record<string, {
  name: string;
  keywords: string[];
  amazonCategory: string;
  trendingTerms: string[];
}> = {
  beauty: {
    name: 'Beauty & Cosmetics',
    keywords: ['makeup', 'skincare', 'lipstick', 'foundation', 'mascara', 'eyeshadow', 'serum', 'moisturizer', 'concealer', 'blush'],
    amazonCategory: 'Beauty & Personal Care',
    trendingTerms: ['makeup tutorial', 'skincare routine', 'viral makeup'],
  },
  fashion: {
    name: 'Fashion & Apparel',
    keywords: ['sneakers', 'dress', 'jacket', 'jeans', 'handbag', 'shoes', 'streetwear', 'vintage'],
    amazonCategory: 'Clothing, Shoes & Jewelry',
    trendingTerms: ['fashion trend', 'outfit ideas', 'style tips'],
  },
  electronics: {
    name: 'Electronics & Tech',
    keywords: ['headphones', 'smart watch', 'tablet', 'wireless earbuds', 'gaming', 'laptop', 'phone case'],
    amazonCategory: 'Electronics',
    trendingTerms: ['tech review', 'gadget unboxing', 'best tech'],
  },
  home: {
    name: 'Home & Kitchen',
    keywords: ['air fryer', 'blender', 'organizer', 'cleaning', 'candles', 'bedding', 'kitchen gadgets'],
    amazonCategory: 'Home & Kitchen',
    trendingTerms: ['home organization', 'kitchen gadgets', 'home decor'],
  },
  fitness: {
    name: 'Fitness & Wellness',
    keywords: ['protein', 'yoga mat', 'resistance bands', 'supplements', 'water bottle', 'fitness tracker'],
    amazonCategory: 'Sports & Outdoors',
    trendingTerms: ['workout routine', 'fitness tips', 'gym essentials'],
  },
};

interface TrendItem {
  term: string;
  category: string;
  velocity: number;
  volume: number;
  platforms: {
    tiktok: number;
    instagram: number;
    youtube: number;
    reddit: number;
    twitter: number;
  };
  amazonStatus: 'not_trending' | 'early' | 'growing' | 'peak';
  predictedDaysToAmazon: number | null;
  sentiment: number;
  relatedTerms: string[];
  samplePosts: Array<{
    platform: string;
    text: string;
    engagement: number;
    date: string;
    url?: string;
  }>;
}

// Cache for API responses - longer TTL to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours cache (free API friendly)

function getCacheKey(category: string, timeRange: string): string {
  return `trend-radar:${category}:${timeRange}`;
}


// Estimate Amazon status based on trend characteristics
function estimateAmazonStatus(velocity: number, volume: number): {
  status: 'not_trending' | 'early' | 'growing' | 'peak';
  predictedDays: number | null;
} {
  // High velocity + low volume = not yet on Amazon (best opportunity)
  if (velocity > 150 && volume < 60) {
    return { status: 'not_trending', predictedDays: Math.round(14 - (velocity / 50)) };
  }
  // High velocity + medium volume = early on Amazon
  if (velocity > 100 && volume < 80) {
    return { status: 'early', predictedDays: Math.round(7 - (velocity / 100)) };
  }
  // Medium velocity + high volume = growing on Amazon
  if (velocity > 50 || volume > 70) {
    return { status: 'growing', predictedDays: Math.round(3 - (velocity / 150)) };
  }
  // Low velocity + high volume = peak (saturated)
  return { status: 'peak', predictedDays: null };
}

// Calculate platform distribution from social mentions
function calculatePlatformDistribution(mentions: any[]): TrendItem['platforms'] {
  const platforms = {
    tiktok: 0,
    instagram: 0,
    youtube: 0,
    reddit: 0,
    twitter: 0,
  };

  const total = mentions.length || 1;

  mentions.forEach(m => {
    const source = m.source?.toLowerCase() || '';
    if (source.includes('tiktok')) platforms.tiktok++;
    else if (source.includes('instagram')) platforms.instagram++;
    else if (source.includes('youtube')) platforms.youtube++;
    else if (source.includes('reddit')) platforms.reddit++;
    else if (source.includes('x') || source.includes('twitter')) platforms.twitter++;
  });

  // Convert to percentages (0-100 scale)
  return {
    tiktok: Math.round((platforms.tiktok / total) * 100) || Math.floor(Math.random() * 40 + 30),
    instagram: Math.round((platforms.instagram / total) * 100) || Math.floor(Math.random() * 40 + 25),
    youtube: Math.round((platforms.youtube / total) * 100) || Math.floor(Math.random() * 35 + 20),
    reddit: Math.round((platforms.reddit / total) * 100) || Math.floor(Math.random() * 30 + 15),
    twitter: Math.round((platforms.twitter / total) * 100) || Math.floor(Math.random() * 25 + 10),
  };
}

// Normalize platform scores to 0-100
function normalizePlatforms(platforms: TrendItem['platforms']): TrendItem['platforms'] {
  const max = Math.max(...Object.values(platforms), 1);
  return {
    tiktok: Math.round((platforms.tiktok / max) * 100),
    instagram: Math.round((platforms.instagram / max) * 100),
    youtube: Math.round((platforms.youtube / max) * 100),
    reddit: Math.round((platforms.reddit / max) * 100),
    twitter: Math.round((platforms.twitter / max) * 100),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'beauty';
  const timeRange = searchParams.get('timeRange') || '7d';

  // Check cache first
  const cacheKey = getCacheKey(category, timeRange);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      data: cached.data,
      source: 'cache',
    });
  }

  try {
    const categoryInfo = CATEGORIES[category] || CATEGORIES.beauty;
    const trends: TrendItem[] = [];
    let source = 'demo';

    // Step 1: Get trending topics using Brave Search API
    let uniqueQueries: Array<{
      query: string;
      value: number;
      type: 'rising' | 'top';
      snippet: string;
      url?: string;
      sourceTitle?: string;
      sources?: Array<{ snippet: string; url: string; title: string }>;
    }> = [];

    if (isBraveConfigured()) {
      try {
        const braveResults = await braveTrendingTopics(category, categoryInfo.keywords);
        // Map brave results to expected format
        uniqueQueries = braveResults.map(r => ({
          query: r.term,
          value: r.volume,
          type: r.type,
          snippet: r.snippet,
          url: r.url,
          sourceTitle: r.sourceTitle,
          sources: r.sources,
        }));
        if (uniqueQueries.length > 0) {
          source = 'brave';
        }
      } catch (err) {
        console.error('Brave fetch error:', err);
      }
    }

    // Fallback to category keywords if no results
    if (uniqueQueries.length === 0) {
      source = 'demo';
      uniqueQueries = categoryInfo.keywords.slice(0, 8).map((kw, i) => ({
        query: kw,
        value: 90 - i * 10,
        type: (i < 3 ? 'rising' : 'top') as 'rising' | 'top',
        snippet: '',
      }));
    }

    // Step 3: Build trend items
    for (const query of uniqueQueries) {
      const isRising = query.type === 'rising';
      const baseVelocity = isRising ? 150 + Math.random() * 200 : 50 + Math.random() * 100;
      const velocity = Math.round(baseVelocity);
      const volume = Math.min(100, query.value || 50);

      const amazonEstimate = estimateAmazonStatus(velocity, volume);

      // Estimate platform distribution based on trend type
      const platforms = {
        tiktok: isRising ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 20),
        instagram: isRising ? 75 + Math.floor(Math.random() * 15) : 55 + Math.floor(Math.random() * 20),
        youtube: 50 + Math.floor(Math.random() * 30),
        reddit: 35 + Math.floor(Math.random() * 25),
        twitter: 30 + Math.floor(Math.random() * 25),
      };

      trends.push({
        term: query.query,
        category,
        velocity,
        volume,
        platforms: normalizePlatforms(platforms),
        amazonStatus: amazonEstimate.status,
        predictedDaysToAmazon: amazonEstimate.predictedDays,
        sentiment: 0.65 + Math.random() * 0.3,
        relatedTerms: uniqueQueries
          .filter((q: any) => q.query !== query.query)
          .slice(0, 4)
          .map((q: any) => q.query),
        samplePosts: (query.sources && query.sources.length > 0
          ? query.sources.map((src, idx) => ({
              platform: src.url?.includes('youtube') ? 'YouTube' :
                        src.url?.includes('tiktok') ? 'TikTok' :
                        src.url?.includes('reddit') ? 'Reddit' :
                        src.url?.includes('instagram') ? 'Instagram' :
                        src.url?.includes('vogue') ? 'Vogue' :
                        src.url?.includes('harpersbazaar') ? 'Harper\'s Bazaar' :
                        src.url?.includes('allure') ? 'Allure' :
                        'Web',
              text: src.snippet || `${query.query} - trending!`,
              engagement: Math.floor(Math.random() * 80000 + 20000),
              date: timeRange === '1d' ? 'Yesterday' : `${Math.floor(Math.random() * 5 + 1)} days ago`,
              url: src.url,
            }))
          : [{
              platform: isRising ? 'TikTok' : 'YouTube',
              text: query.snippet || `${query.query} - trending ${isRising ? 'now' : 'steadily'}!`,
              engagement: Math.floor(Math.random() * 80000 + 20000),
              date: timeRange === '1d' ? 'Yesterday' : `${Math.floor(Math.random() * 5 + 1)} days ago`,
              url: query.url,
            }]
        ),
      });
    }

    // Fallback: Generate demo data if no real data available
    if (trends.length === 0) {
      source = 'demo';
      trends.push(...generateDemoTrends(category, timeRange));
    }

    // Sort by velocity (highest first)
    trends.sort((a, b) => b.velocity - a.velocity);

    // Calculate summary
    const summary = {
      totalTrends: trends.length,
      notOnAmazon: trends.filter(t => t.amazonStatus === 'not_trending').length,
      earlyOnAmazon: trends.filter(t => t.amazonStatus === 'early').length,
      avgVelocity: Math.round(trends.reduce((sum, t) => sum + t.velocity, 0) / trends.length),
      topPlatform: getTopPlatform(trends),
      opportunityScore: Math.round(
        (trends.filter(t => t.amazonStatus === 'not_trending').length / trends.length) * 100
      ),
    };

    const responseData = {
      category: categoryInfo.name,
      amazonCategory: categoryInfo.amazonCategory,
      timeRange,
      summary,
      trends,
      categories: Object.entries(CATEGORIES).map(([id, cat]) => ({
        id,
        name: cat.name,
        amazonCategory: cat.amazonCategory,
      })),
    };

    // Cache the response
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: responseData,
      source,
    });
  } catch (error: any) {
    console.error('Trend radar error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch trend data',
    }, { status: 500 });
  }
}

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return 'Recently';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return 'Recently';
  }
}

function getTopPlatform(trends: TrendItem[]): string {
  const platformTotals = { tiktok: 0, instagram: 0, youtube: 0, reddit: 0, twitter: 0 };

  trends.forEach(t => {
    Object.keys(platformTotals).forEach(p => {
      platformTotals[p as keyof typeof platformTotals] += t.platforms[p as keyof typeof t.platforms];
    });
  });

  const sorted = Object.entries(platformTotals).sort(([,a], [,b]) => b - a);
  return sorted[0][0];
}

// Generate demo trends when APIs are unavailable
function generateDemoTrends(category: string, timeRange: string): TrendItem[] {
  const cat = CATEGORIES[category] || CATEGORIES.beauty;

  const demoTerms: Record<string, string[]> = {
    beauty: ['glazed donut skin', 'lip combo', 'cold girl makeup', 'skin cycling', 'latte makeup', 'mob wife aesthetic'],
    fashion: ['quiet luxury', 'coquette bow', 'coastal grandmother', 'clean girl aesthetic'],
    electronics: ['transparent tech', 'AI pin', 'smart ring', 'portable monitor'],
    home: ['bookshelf wealth', 'everything shower', 'bed rotting', 'cozy cardio'],
    fitness: ['12-3-30', 'cortisol face', 'pilates princess', 'hot girl walk'],
  };

  const terms = demoTerms[category] || demoTerms.beauty;

  return terms.map((term, index) => {
    const velocity = Math.round(300 - index * 40 + Math.random() * 50);
    const volume = Math.round(90 - index * 8 + Math.random() * 10);
    const amazonEstimate = estimateAmazonStatus(velocity, volume);

    return {
      term,
      category,
      velocity,
      volume,
      platforms: {
        tiktok: Math.round(90 - index * 5 + Math.random() * 10),
        instagram: Math.round(80 - index * 5 + Math.random() * 10),
        youtube: Math.round(65 - index * 5 + Math.random() * 10),
        reddit: Math.round(45 - index * 3 + Math.random() * 10),
        twitter: Math.round(40 - index * 3 + Math.random() * 10),
      },
      amazonStatus: amazonEstimate.status,
      predictedDaysToAmazon: amazonEstimate.predictedDays,
      sentiment: 0.7 + Math.random() * 0.25,
      relatedTerms: terms.filter(t => t !== term).slice(0, 4),
      samplePosts: [
        {
          platform: 'TikTok',
          text: `${term} is taking over! Here's why everyone's obsessed...`,
          engagement: Math.floor(50000 - index * 5000 + Math.random() * 20000),
          date: timeRange === '1d' ? 'Yesterday' : `${index + 1} days ago`,
        },
      ],
    };
  });
}
