import { NextRequest, NextResponse } from 'next/server';
import { redditScraper } from '@/lib/scrapers/reddit';
import { instagramScraper, xScraper, metaScraper, tiktokScraper, youtubeScraper } from '@/lib/scrapers/social';
import { getCacheKey, getCache, getStaleCache, setCache } from '@/lib/cache';

// Cache TTL: 2 hours
const CACHE_TTL = 2 * 60 * 60 * 1000;

interface PurchaseIntentSignal {
  id: string;
  text: string;
  source: string;
  sourceIcon: string;
  intentType: 'purchase' | 'consideration' | 'research';
  product: string;
  timestamp: string;
  url: string;
}

// Keywords that indicate purchase intent
const PURCHASE_KEYWORDS = [
  'just bought', 'just ordered', 'picked up', 'purchased', 'got the',
  'buying', 'ordered', 'added to cart', 'in my cart', 'checking out',
  'haul', 'unboxing', 'finally got'
];

const CONSIDERATION_KEYWORDS = [
  'thinking of', 'should i get', 'should i buy', 'considering',
  'worth it', 'debating', 'torn between', 'vs', 'or should i',
  'help me decide', 'recommendations', 'which one'
];

const RESEARCH_KEYWORDS = [
  'where can i buy', 'where to buy', 'best price', 'on sale',
  'restock', 'in stock', 'coupon', 'discount', 'deal',
  'reviews', 'thoughts on', 'anyone tried', 'experience with'
];

function detectIntentType(text: string): 'purchase' | 'consideration' | 'research' | null {
  const lowerText = text.toLowerCase();

  for (const keyword of PURCHASE_KEYWORDS) {
    if (lowerText.includes(keyword)) return 'purchase';
  }
  for (const keyword of CONSIDERATION_KEYWORDS) {
    if (lowerText.includes(keyword)) return 'consideration';
  }
  for (const keyword of RESEARCH_KEYWORDS) {
    if (lowerText.includes(keyword)) return 'research';
  }

  return null;
}

function extractProduct(text: string, brand: string): string {
  // Try to extract product name from text
  const lowerText = text.toLowerCase();
  const lowerBrand = brand.toLowerCase();

  // Common product patterns
  const productPatterns = [
    /(?:the|a|my)\s+([A-Z][a-zA-Z\s-]+(?:foundation|mascara|lipstick|primer|concealer|blush|bronzer|highlighter|palette|gloss|powder|serum|cream|brush|dryer|tool))/i,
    /([A-Z][a-zA-Z\s-]+(?:One-Step|ColorStay|Super Lustrous|Sky High|Fit Me|Power Grip|Halo Glow|Vinyl Ink|Camo))/i,
  ];

  for (const pattern of productPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: use brand + "product"
  return `${brand} product`;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

// Brand keywords for searching
const BRAND_KEYWORDS: Record<string, string[]> = {
  'Revlon': ['Revlon lipstick', 'Revlon foundation', 'Revlon ColorStay', 'Revlon One-Step'],
  'e.l.f.': ['elf cosmetics', 'elf primer', 'elf halo glow', 'elf makeup'],
  'Maybelline': ['Maybelline mascara', 'Maybelline foundation', 'Maybelline sky high'],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand') || 'Revlon';
    const days = parseInt(searchParams.get('days') || '7', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Check cache first
    const cacheKey = getCacheKey('purchase-intent', brand);
    const cachedData = getCache<{ signals: PurchaseIntentSignal[]; intentCounts: any }>(cacheKey);

    if (cachedData) {
      const limitedSignals = cachedData.signals.slice(0, limit);
      return NextResponse.json({
        success: true,
        signals: limitedSignals,
        intentCounts: {
          purchase: limitedSignals.filter(s => s.intentType === 'purchase').length,
          consideration: limitedSignals.filter(s => s.intentType === 'consideration').length,
          research: limitedSignals.filter(s => s.intentType === 'research').length,
        },
        total: cachedData.signals.length,
        cached: true,
      });
    }

    const signals: PurchaseIntentSignal[] = [];
    const keywords = BRAND_KEYWORDS[brand] || BRAND_KEYWORDS['Revlon'];

    // Scraper options
    const scraperOptions = {
      keywords: [brand],
      brands: [],
      maxResults: 10,
      daysBack: days,
    };

    // Fetch from all 6 sources in parallel via SerpAPI
    const [redditResults, instagramResults, xResults, metaResults, tiktokResults, youtubeResults] = await Promise.allSettled([
      // Reddit
      redditScraper.scrape(scraperOptions).catch(() => ({ mentions: [] })),
      // Instagram via SerpAPI
      instagramScraper.scrape(scraperOptions).catch(() => ({ mentions: [] })),
      // X (Twitter) via SerpAPI
      xScraper.scrape(scraperOptions).catch(() => ({ mentions: [] })),
      // Meta (Facebook) via SerpAPI
      metaScraper.scrape(scraperOptions).catch(() => ({ mentions: [] })),
      // TikTok via SerpAPI
      tiktokScraper.scrape(scraperOptions).catch(() => ({ mentions: [] })),
      // YouTube via SerpAPI
      youtubeScraper.scrape(scraperOptions).catch(() => ({ mentions: [] })),
    ]);

    // Helper function to process scraper results
    const processScraperResults = (
      results: PromiseSettledResult<any>,
      sourceName: string,
      sourceIcon: string,
      idPrefix: string
    ) => {
      if (results.status === 'fulfilled') {
        const result = results.value as { mentions?: any[] };
        const mentions = result.mentions || [];

        for (const post of mentions) {
          const text = `${post.title || ''} ${post.snippet || post.fullText || ''}`;
          const intentType = detectIntentType(text);

          if (intentType) {
            signals.push({
              id: `${idPrefix}_${post.id}`,
              text: (post.title || post.snippet)?.slice(0, 150) || '',
              source: sourceName,
              sourceIcon,
              intentType,
              product: extractProduct(text, brand),
              timestamp: formatTimestamp(post.publishedAt),
              url: post.url,
            });
          }
        }
      }
    };

    // Process all 6 sources
    processScraperResults(redditResults, 'Reddit', '💬', 'reddit');
    processScraperResults(instagramResults, 'Instagram', '📸', 'instagram');
    processScraperResults(xResults, 'X', '𝕏', 'x');
    processScraperResults(metaResults, 'Meta', '👤', 'meta');
    processScraperResults(tiktokResults, 'TikTok', '🎵', 'tiktok');
    processScraperResults(youtubeResults, 'YouTube', '▶️', 'youtube');

    // Sort by intent type priority (purchase > consideration > research)
    const intentPriority = { purchase: 0, consideration: 1, research: 2 };
    signals.sort((a, b) => intentPriority[a.intentType] - intentPriority[b.intentType]);

    // Cache the results if we got any
    if (signals.length > 0) {
      setCache(cacheKey, { signals, intentCounts: {} }, CACHE_TTL);
    }

    // Limit results
    const limitedSignals = signals.slice(0, limit);

    // Count by intent type
    const intentCounts = {
      purchase: limitedSignals.filter(s => s.intentType === 'purchase').length,
      consideration: limitedSignals.filter(s => s.intentType === 'consideration').length,
      research: limitedSignals.filter(s => s.intentType === 'research').length,
    };

    return NextResponse.json({
      success: true,
      signals: limitedSignals,
      intentCounts,
      total: signals.length,
      cached: false,
    });
  } catch (error) {
    console.error('Purchase intent error:', error);

    // Try stale cache on error
    const cacheKey = getCacheKey('purchase-intent', request.nextUrl.searchParams.get('brand') || 'Revlon');
    const staleData = getStaleCache<{ signals: PurchaseIntentSignal[]; intentCounts: any }>(cacheKey);

    if (staleData) {
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);
      const limitedSignals = staleData.signals.slice(0, limit);
      return NextResponse.json({
        success: true,
        signals: limitedSignals,
        intentCounts: {
          purchase: limitedSignals.filter(s => s.intentType === 'purchase').length,
          consideration: limitedSignals.filter(s => s.intentType === 'consideration').length,
          research: limitedSignals.filter(s => s.intentType === 'research').length,
        },
        total: staleData.signals.length,
        cached: true,
        stale: true,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase intent signals', signals: [] },
      { status: 500 }
    );
  }
}
