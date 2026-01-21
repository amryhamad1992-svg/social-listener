import { NextRequest, NextResponse } from 'next/server';
import { braveTrendingTopics, isBraveConfigured } from '@/lib/brave';

// Main categories with their sub-categories
export const MAIN_CATEGORIES: Record<string, {
  name: string;
  subCategories: string[];
}> = {
  skin: {
    name: 'Skin',
    subCategories: ['all_skin', 'skincare', 'suncare', 'kbeauty', 'cleanbeauty'],
  },
  makeup: {
    name: 'Makeup',
    subCategories: ['all_makeup', 'colorcosmetics', 'nails'],
  },
  hair: {
    name: 'Hair',
    subCategories: ['all_hair', 'haircare', 'hairdryers', 'straighteners', 'curlingirons', 'hotairbrushes'],
  },
  body: {
    name: 'Body',
    subCategories: ['all_body', 'bodycare', 'fragrance'],
  },
  beautytech: {
    name: 'Beauty Tech',
    subCategories: ['beautytech'],
  },
};

// Sub-categories with their details
const SUB_CATEGORIES: Record<string, {
  name: string;
  keywords: string[];
  amazonCategory: string;
  trendingTerms: string[];
  parentCategory: string;
}> = {
  // Skin sub-categories
  all_skin: {
    name: 'All Skin',
    keywords: ['skincare', 'sunscreen', 'korean skincare', 'clean beauty', 'serum', 'moisturizer', 'spf', 'glass skin'],
    amazonCategory: 'Skin Care',
    trendingTerms: ['skincare routine', 'glass skin', 'skin cycling', 'barrier repair'],
    parentCategory: 'skin',
  },
  skincare: {
    name: 'Skincare',
    keywords: ['serum', 'moisturizer', 'cleanser', 'toner', 'essence', 'mask', 'retinol', 'hyaluronic acid', 'vitamin c', 'niacinamide', 'exfoliant'],
    amazonCategory: 'Skin Care',
    trendingTerms: ['skincare routine', 'glass skin', 'skin cycling', 'barrier repair'],
    parentCategory: 'skin',
  },
  suncare: {
    name: 'Sun Care & SPF',
    keywords: ['sunscreen', 'spf', 'tinted sunscreen', 'mineral sunscreen', 'chemical sunscreen', 'sun protection', 'after sun', 'sunscreen stick', 'spf moisturizer'],
    amazonCategory: 'Sun Care',
    trendingTerms: ['spf every day', 'sunscreen reapply', 'no white cast', 'korean sunscreen'],
    parentCategory: 'skin',
  },
  kbeauty: {
    name: 'K-Beauty & J-Beauty',
    keywords: ['korean skincare', 'japanese skincare', 'snail mucin', 'essence', 'sheet mask', 'cushion compact', 'bb cream', 'centella', 'rice toner', 'mugwort'],
    amazonCategory: 'K-Beauty',
    trendingTerms: ['glass skin', 'korean skincare routine', 'j-beauty', 'slugging'],
    parentCategory: 'skin',
  },
  cleanbeauty: {
    name: 'Clean & Natural',
    keywords: ['clean beauty', 'organic skincare', 'natural makeup', 'vegan beauty', 'cruelty free', 'sustainable beauty', 'non-toxic', 'reef safe', 'plant based'],
    amazonCategory: 'Natural & Organic Beauty',
    trendingTerms: ['clean girl aesthetic', 'minimalist skincare', 'skin minimalism', 'less is more'],
    parentCategory: 'skin',
  },

  // Makeup sub-categories
  all_makeup: {
    name: 'All Makeup',
    keywords: ['makeup', 'lipstick', 'foundation', 'nail polish', 'eyeshadow', 'mascara', 'blush', 'nail art'],
    amazonCategory: 'Makeup',
    trendingTerms: ['makeup tutorial', 'viral makeup', 'clean girl makeup', 'nail trends'],
    parentCategory: 'makeup',
  },
  colorcosmetics: {
    name: 'Color Cosmetics',
    keywords: ['foundation', 'concealer', 'lipstick', 'lip gloss', 'eyeshadow', 'mascara', 'blush', 'bronzer', 'highlighter', 'primer', 'setting spray', 'eyeliner'],
    amazonCategory: 'Makeup',
    trendingTerms: ['makeup tutorial', 'viral makeup', 'clean girl makeup', 'latte makeup'],
    parentCategory: 'makeup',
  },
  nails: {
    name: 'Nails & Nail Art',
    keywords: ['nail polish', 'gel nails', 'press-on nails', 'nail art', 'cuticle oil', 'nail strengthener', 'dip powder', 'nail stickers', 'chrome nails', 'builder gel'],
    amazonCategory: 'Nail Art & Polish',
    trendingTerms: ['nail trends', 'chrome nails', 'jelly nails', 'glazed donut nails'],
    parentCategory: 'makeup',
  },

  // Hair sub-categories
  all_hair: {
    name: 'All Hair',
    keywords: ['hair', 'hair dryer', 'straightener', 'curling iron', 'shampoo', 'hair oil', 'blowout', 'hair styling'],
    amazonCategory: 'Hair Care',
    trendingTerms: ['hair growth', 'salon blowout', 'beach waves', 'hair routine'],
    parentCategory: 'hair',
  },
  haircare: {
    name: 'Hair Products',
    keywords: ['shampoo', 'conditioner', 'hair oil', 'hair mask', 'scalp treatment', 'hair serum', 'leave-in', 'heat protectant', 'styling cream', 'dry shampoo'],
    amazonCategory: 'Hair Care',
    trendingTerms: ['hair growth', 'rosemary oil hair', 'scalp care', 'hair oiling'],
    parentCategory: 'hair',
  },
  hairdryers: {
    name: 'Hair Dryers',
    keywords: ['hair dryer', 'blow dryer', 'ionic dryer', 'professional dryer', 'travel dryer', 'diffuser', 'concentrator nozzle', 'ceramic dryer', 'tourmaline dryer', 'lightweight dryer'],
    amazonCategory: 'Hair Dryers',
    trendingTerms: ['best hair dryer', 'salon blowout', 'fast drying', 'frizz free blowout'],
    parentCategory: 'hair',
  },
  straighteners: {
    name: 'Straighteners',
    keywords: ['flat iron', 'hair straightener', 'titanium plates', 'ceramic straightener', 'steam straightener', 'wide plate', 'mini straightener', 'digital straightener', 'floating plates'],
    amazonCategory: 'Flat Irons',
    trendingTerms: ['glass hair', 'silk press', 'straightening tips', 'heat damage free'],
    parentCategory: 'hair',
  },
  curlingirons: {
    name: 'Curling Irons',
    keywords: ['curling iron', 'curling wand', 'marcel iron', 'clampless curler', 'interchangeable barrels', 'automatic curler', 'beach waves', 'spiral curls', 'loose waves'],
    amazonCategory: 'Curling Irons',
    trendingTerms: ['heatless curls', 'beach waves', 'bouncy blowout', 'curl tutorial'],
    parentCategory: 'hair',
  },
  hotairbrushes: {
    name: 'Hot Air Brushes',
    keywords: ['hot air brush', 'blow dry brush', 'one step dryer', 'volumizer brush', 'rotating brush', 'air styler', 'round brush dryer', 'styling brush', 'blowout brush'],
    amazonCategory: 'Hot Air Brushes',
    trendingTerms: ['salon blowout at home', 'volume brush', 'bouncy hair', 'one step styling'],
    parentCategory: 'hair',
  },

  // Body sub-categories
  all_body: {
    name: 'All Body',
    keywords: ['body care', 'fragrance', 'perfume', 'body lotion', 'body oil', 'self tanner', 'deodorant'],
    amazonCategory: 'Body Care',
    trendingTerms: ['everything shower', 'body care routine', 'signature scent', 'soft skin'],
    parentCategory: 'body',
  },
  bodycare: {
    name: 'Body Care',
    keywords: ['body lotion', 'body butter', 'body scrub', 'body wash', 'deodorant', 'body oil', 'self tanner', 'body mist', 'hand cream', 'foot care'],
    amazonCategory: 'Body Care',
    trendingTerms: ['everything shower', 'body care routine', 'soft skin', 'brazilian bum bum'],
    parentCategory: 'body',
  },
  fragrance: {
    name: 'Fragrance & Perfume',
    keywords: ['perfume', 'eau de parfum', 'body mist', 'fragrance oil', 'cologne', 'scent', 'vanilla perfume', 'oud', 'musk', 'niche fragrance'],
    amazonCategory: 'Fragrance',
    trendingTerms: ['perfume dupes', 'viral fragrance', 'signature scent', 'layering perfume'],
    parentCategory: 'body',
  },

  // Beauty Tech (standalone category)
  beautytech: {
    name: 'Beauty Tech',
    keywords: ['led mask', 'gua sha', 'jade roller', 'ice roller', 'dermaplaning', 'microcurrent', 'facial steamer', 'makeup brushes', 'beauty blender', 'eyelash curler', 'beauty tools', 'facial tools', 'skincare device'],
    amazonCategory: 'Beauty Tools',
    trendingTerms: ['red light therapy', 'facial massage', 'lymphatic drainage', 'at home facial'],
    parentCategory: 'beautytech',
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
    web: number;
  };
  totalSources: number;
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



// Calculate platform distribution from social mentions
function calculatePlatformDistribution(mentions: any[]): TrendItem['platforms'] {
  const platforms = {
    tiktok: 0,
    instagram: 0,
    youtube: 0,
    reddit: 0,
    twitter: 0,
    web: 0,
  };

  const total = mentions.length || 1;

  mentions.forEach(m => {
    const source = m.source?.toLowerCase() || '';
    if (source.includes('tiktok')) platforms.tiktok++;
    else if (source.includes('instagram')) platforms.instagram++;
    else if (source.includes('youtube')) platforms.youtube++;
    else if (source.includes('reddit')) platforms.reddit++;
    else if (source.includes('x') || source.includes('twitter')) platforms.twitter++;
    else platforms.web++;
  });

  // Return actual counts
  return {
    tiktok: platforms.tiktok,
    instagram: platforms.instagram,
    youtube: platforms.youtube,
    reddit: platforms.reddit,
    twitter: platforms.twitter,
    web: platforms.web,
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
    web: Math.round((platforms.web / max) * 100),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'skincare';
  const timeRange = searchParams.get('timeRange') || '7d';
  const platformFilter = searchParams.get('platform') || 'all';

  // Check cache first
  const cacheKey = getCacheKey(category, `${timeRange}-${platformFilter}`);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      data: cached.data,
      source: 'cache',
    });
  }

  try {
    const categoryInfo = SUB_CATEGORIES[category] || SUB_CATEGORIES.skincare;
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
      sources?: Array<{ snippet: string; url: string; title: string; platform?: string }>;
      platformCounts?: Record<string, number>;
    }> = [];

    if (isBraveConfigured()) {
      try {
        const braveResults = await braveTrendingTopics(category, categoryInfo.keywords, platformFilter);
        // Map brave results to expected format
        uniqueQueries = braveResults.map(r => ({
          query: r.term,
          value: r.volume,
          type: r.type,
          snippet: r.snippet,
          url: r.url,
          sourceTitle: r.sourceTitle,
          sources: r.sources,
          platformCounts: r.platformCounts,
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

    // Step 3: Build trend items - focus on social media presence
    for (const query of uniqueQueries) {
      const isRising = query.type === 'rising';
      const baseVelocity = isRising ? 150 + Math.random() * 200 : 50 + Math.random() * 100;
      const velocity = Math.round(baseVelocity);
      const volume = Math.min(100, query.value || 50);

      // Use REAL platform counts from search results
      const realPlatformCounts = query.platformCounts || {};
      const platforms = {
        tiktok: realPlatformCounts['tiktok'] || 0,
        instagram: realPlatformCounts['instagram'] || 0,
        youtube: realPlatformCounts['youtube'] || 0,
        reddit: realPlatformCounts['reddit'] || 0,
        twitter: realPlatformCounts['twitter'] || 0,
        web: realPlatformCounts['web'] || 0,
      };

      // Calculate total sources across all platforms
      const totalSources = Object.values(platforms).reduce((a, b) => a + b, 0);

      trends.push({
        term: query.query,
        category,
        velocity,
        volume,
        platforms,
        totalSources,
        sentiment: 0.65 + Math.random() * 0.3,
        relatedTerms: uniqueQueries
          .filter((q: any) => q.query !== query.query)
          .slice(0, 4)
          .map((q: any) => q.query),
        samplePosts: (query.sources && query.sources.length > 0
          ? query.sources.map((src) => ({
              platform: src.platform ? src.platform.charAt(0).toUpperCase() + src.platform.slice(1) :
                        src.url?.includes('youtube') ? 'YouTube' :
                        src.url?.includes('tiktok') ? 'TikTok' :
                        src.url?.includes('reddit') ? 'Reddit' :
                        src.url?.includes('instagram') ? 'Instagram' :
                        src.url?.includes('twitter') || src.url?.includes('x.com') ? 'Twitter' :
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

    // Sort by social media presence: TikTok first, then total sources, then velocity
    trends.sort((a, b) => {
      // Primary: TikTok source count (TikTok is the leading indicator)
      const tiktokDiff = b.platforms.tiktok - a.platforms.tiktok;
      if (tiktokDiff !== 0) return tiktokDiff;

      // Secondary: Total sources across all platforms
      const sourcesDiff = b.totalSources - a.totalSources;
      if (sourcesDiff !== 0) return sourcesDiff;

      // Tertiary: Overall velocity
      return b.velocity - a.velocity;
    });

    // Calculate summary focused on social media
    const summary = {
      totalTrends: trends.length,
      tiktokTrends: trends.filter(t => t.platforms.tiktok > 0).length,
      multiPlatform: trends.filter(t => Object.values(t.platforms).filter(v => v > 0).length > 1).length,
      avgVelocity: Math.round(trends.reduce((sum, t) => sum + t.velocity, 0) / (trends.length || 1)),
      topPlatform: getTopPlatform(trends),
      totalSources: trends.reduce((sum, t) => sum + t.totalSources, 0),
    };

    const responseData = {
      category: categoryInfo.name,
      amazonCategory: categoryInfo.amazonCategory,
      parentCategory: categoryInfo.parentCategory,
      timeRange,
      summary,
      trends,
      // Return hierarchical category structure
      mainCategories: Object.entries(MAIN_CATEGORIES).map(([id, cat]) => ({
        id,
        name: cat.name,
        subCategories: cat.subCategories,
      })),
      subCategories: Object.entries(SUB_CATEGORIES).map(([id, cat]) => ({
        id,
        name: cat.name,
        amazonCategory: cat.amazonCategory,
        parentCategory: cat.parentCategory,
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
  const platformTotals = { tiktok: 0, instagram: 0, youtube: 0, reddit: 0, twitter: 0, web: 0 };

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
  const cat = SUB_CATEGORIES[category] || SUB_CATEGORIES.skincare;

  const demoTerms: Record<string, string[]> = {
    // Skin
    all_skin: ['glass skin', 'skin cycling', 'snail mucin', 'korean sunscreen', 'clean beauty', 'barrier repair'],
    skincare: ['glazed donut skin', 'skin cycling', 'snail mucin', 'retinol sandwich', 'barrier repair', 'glass skin'],
    suncare: ['korean sunscreen', 'tinted spf', 'sunscreen stick', 'no white cast', 'spf reapply', 'beauty of joseon'],
    kbeauty: ['glass skin', 'snail mucin', 'rice toner', 'centella', 'mugwort', '7 skin method'],
    cleanbeauty: ['clean girl aesthetic', 'skin minimalism', 'less is more', 'barrier repair', 'gentle actives', 'mushroom skincare'],
    // Makeup
    all_makeup: ['latte makeup', 'chrome nails', 'clean girl look', 'glazed donut nails', 'viral lipstick', 'mob wife aesthetic'],
    colorcosmetics: ['latte makeup', 'cold girl makeup', 'lip combo', 'mob wife aesthetic', 'clean girl look', 'strawberry girl'],
    nails: ['chrome nails', 'glazed donut nails', 'jelly nails', 'aura nails', 'lip gloss nails', 'milk bath nails'],
    // Hair
    all_hair: ['rosemary oil', 'salon blowout', 'beach waves', 'babyliss pro', 'hair oiling', 'volumizing brush'],
    haircare: ['rosemary oil', 'hair oiling', 'rice water rinse', 'scalp care', 'castor oil growth', 'protein treatment'],
    hairdryers: ['ionic technology', 'salon blowout', 'babyliss pro', 'diffuser attachment', 'quick dry', 'frizz control'],
    straighteners: ['glass hair', 'silk press', 'steam straightener', 'titanium plates', 'no damage styling', 'babyliss flat iron'],
    curlingirons: ['beach waves', 'bouncy curls', 'curling wand', 'heatless vs heat', 'long lasting curls', 'barrel size guide'],
    hotairbrushes: ['one step blowout', 'volumizing brush', 'babyliss big hair', 'blow dry brush', 'salon at home', 'round brush styling'],
    // Body
    all_body: ['everything shower', 'vanilla perfume', 'soft skin routine', 'perfume layering', 'body slugging', 'signature scent'],
    bodycare: ['everything shower', 'soft skin routine', 'body slugging', 'dry brushing', 'glow oil', 'self tan routine'],
    fragrance: ['vanilla perfume', 'perfume layering', 'clean girl scent', 'cozy fragrance', 'dupe finds', 'niche discovery'],
    // Beauty Tech
    beautytech: ['gua sha routine', 'led mask', 'ice roller', 'microcurrent', 'facial steamer', 'dermaplaning'],
  };

  const terms = demoTerms[category] || demoTerms.skincare;

  return terms.map((term, index) => {
    const velocity = Math.round(300 - index * 40 + Math.random() * 50);
    const volume = Math.round(90 - index * 8 + Math.random() * 10);

    // Demo platform sources - TikTok dominant for beauty trends
    const platforms = {
      tiktok: Math.max(0, 5 - index + Math.floor(Math.random() * 3)),
      instagram: Math.max(0, 3 - Math.floor(index / 2) + Math.floor(Math.random() * 2)),
      youtube: Math.max(0, 2 - Math.floor(index / 3) + Math.floor(Math.random() * 2)),
      reddit: Math.floor(Math.random() * 2),
      twitter: Math.floor(Math.random() * 2),
      web: Math.max(0, 3 - Math.floor(index / 2) + Math.floor(Math.random() * 2)),
    };

    const totalSources = Object.values(platforms).reduce((a, b) => a + b, 0);

    return {
      term,
      category,
      velocity,
      volume,
      platforms,
      totalSources,
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
