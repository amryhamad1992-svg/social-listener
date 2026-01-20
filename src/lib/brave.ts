// Brave Search API Service
// 2,000 free searches/month, then $5 per 1K
// Docs: https://brave.com/search/api/

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BASE_URL = 'https://api.search.brave.com/res/v1';

// Cache to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

function getCacheKey(type: string, query: string): string {
  return `${type}:${query}`.toLowerCase();
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  extra_snippets?: string[];
}

export interface BraveNewsResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  source: string;
  thumbnail?: { src: string };
}

export interface BraveSearchOptions {
  count?: number;
  freshness?: 'pd' | 'pw' | 'pm' | 'py'; // past day, week, month, year
  safesearch?: 'off' | 'moderate' | 'strict';
}

// Web Search
export async function braveWebSearch(
  query: string,
  options: BraveSearchOptions = {}
): Promise<BraveWebResult[]> {
  const cacheKey = getCacheKey('web', `${query}-${options.freshness || 'pw'}`);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (!BRAVE_API_KEY) {
    console.log('[Brave] No API key configured');
    return [];
  }

  try {
    const url = new URL(`${BASE_URL}/web/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(options.count || 10));
    url.searchParams.set('freshness', options.freshness || 'pw');
    url.searchParams.set('safesearch', options.safesearch || 'moderate');

    const response = await fetch(url.toString(), {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Brave Web] HTTP error:', response.status);
      return [];
    }

    const data = await response.json();
    const results = data.web?.results || [];
    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('[Brave Web] Error:', error);
    return [];
  }
}

// News Search
export async function braveNewsSearch(
  query: string,
  options: BraveSearchOptions = {}
): Promise<BraveNewsResult[]> {
  const cacheKey = getCacheKey('news', `${query}-${options.freshness || 'pw'}`);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (!BRAVE_API_KEY) {
    console.log('[Brave] No API key configured');
    return [];
  }

  try {
    const url = new URL(`${BASE_URL}/news/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(options.count || 10));
    url.searchParams.set('freshness', options.freshness || 'pw');

    const response = await fetch(url.toString(), {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Brave News] HTTP error:', response.status);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];
    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('[Brave News] Error:', error);
    return [];
  }
}

// Search specific platforms (via site: filter)
export async function bravePlatformSearch(
  query: string,
  platform: 'reddit' | 'tiktok' | 'youtube' | 'instagram' | 'twitter',
  options: BraveSearchOptions = {}
): Promise<BraveWebResult[]> {
  const siteFilters: Record<string, string> = {
    reddit: 'site:reddit.com',
    tiktok: 'site:tiktok.com',
    youtube: 'site:youtube.com',
    instagram: 'site:instagram.com',
    twitter: 'site:twitter.com OR site:x.com',
  };

  const fullQuery = `${query} ${siteFilters[platform]}`;
  return braveWebSearch(fullQuery, options);
}

// Search for brand mentions across social platforms
export async function braveSocialMentions(
  brand: string,
  keywords: string[] = [],
  options: BraveSearchOptions = {}
): Promise<{
  mentions: Array<{
    platform: string;
    title: string;
    url: string;
    snippet: string;
    date: string;
  }>;
  byPlatform: Record<string, number>;
}> {
  const platforms = ['reddit', 'tiktok', 'youtube', 'twitter'] as const;
  const allMentions: Array<{
    platform: string;
    title: string;
    url: string;
    snippet: string;
    date: string;
  }> = [];
  const byPlatform: Record<string, number> = {};

  // Build search query
  const searchTerms = [brand, ...keywords.slice(0, 2)].join(' ');

  for (const platform of platforms) {
    try {
      const results = await bravePlatformSearch(searchTerms, platform, {
        count: 5,
        freshness: options.freshness || 'pw',
      });

      byPlatform[platform] = results.length;

      results.forEach(r => {
        allMentions.push({
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          title: r.title,
          url: r.url,
          snippet: r.description,
          date: r.age || 'Recently',
        });
      });

      // Small delay between platform searches
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error(`[Brave] ${platform} search error:`, err);
      byPlatform[platform] = 0;
    }
  }

  return { mentions: allMentions, byPlatform };
}

// Source info for sample posts
interface SourceInfo {
  snippet: string;
  url: string;
  title: string;
}

interface TrendResult {
  term: string;
  volume: number;
  type: 'rising' | 'top';
  snippet: string;
  url: string;
  sourceTitle: string;
  sources: SourceInfo[];
}

// Category-specific search queries to find REAL viral trends
const CATEGORY_SEARCHES: Record<string, string[]> = {
  beauty: [
    'viral skincare ingredient TikTok 2026',
    'beauty hack going viral TikTok',
    'skincare trend TikTok viral',
    'makeup trend viral 2026',
    'K-beauty trend viral',
    'skincare ingredient everyone is using',
    'beauty product sold out viral',
    'dermatologist trending ingredient',
  ],
  fashion: [
    'fashion trend viral TikTok 2026',
    'outfit trend going viral',
    'clothing item everyone buying',
    'fashion hack TikTok viral',
    'street style trend 2026',
  ],
  electronics: [
    'tech gadget viral TikTok 2026',
    'electronics trending product',
    'tech product going viral',
    'gadget everyone buying 2026',
  ],
  home: [
    'home decor trend viral TikTok',
    'kitchen gadget going viral',
    'home product TikTok made me buy',
    'interior design trend 2026',
  ],
  fitness: [
    'fitness trend viral TikTok 2026',
    'workout going viral',
    'supplement trending TikTok',
    'fitness product viral',
  ],
};

// Words/phrases that indicate a specific trend (not generic terms)
const TREND_INDICATORS = [
  // Ingredients
  'oil', 'acid', 'serum', 'extract', 'butter', 'tallow', 'peptide', 'retinol', 'niacinamide',
  'vitamin', 'collagen', 'hyaluronic', 'salicylic', 'glycolic', 'ceramide', 'snail', 'mucin',
  'rosemary', 'castor', 'rice', 'sake', 'ginseng', 'centella', 'cica', 'bakuchiol',
  // Techniques
  'slugging', 'glass skin', 'skin cycling', 'dermaplaning', 'gua sha', 'face yoga',
  'ice roller', 'lymphatic', 'microneedling', 'led mask', 'red light',
  // Product types
  'toner', 'essence', 'ampoule', 'mist', 'balm', 'mask', 'patch', 'stick',
  // Descriptors that often accompany trends
  'korean', 'japanese', 'french', 'brazilian', 'beef', 'salmon', 'snail', 'bee', 'mushroom',
];

// Generic terms to filter OUT
const GENERIC_TERMS = new Set([
  'beauty trends', 'makeup trends', 'skincare trends', 'trending', 'viral', 'tiktok',
  'best products', 'top products', 'new products', 'beauty products', 'skincare products',
  'makeup products', 'beauty routine', 'skincare routine', 'makeup routine', 'going viral',
  'everyone using', 'must have', 'game changer', 'holy grail', 'best seller', 'sold out',
  'beauty industry', 'beauty brands', 'beauty world', 'skincare world', 'makeup world',
  'beauty community', 'skincare community', 'this year', 'last year', 'next year',
  'according to', 'experts say', 'dermatologists', 'beauty editors',
  // Filter out year-based and generic skin terms
  'the skin', '2024 skin', '2025 skin', '2026 skin', '2027 skin', 'your skin', 'my skin',
  'oily skin', 'dry skin', 'normal skin', 'combination skin', 'mature skin', 'aging skin',
  'viral serum', 'viral product', 'viral trend', 'new trend', 'latest trend',
]);

// Extract specific trending terms from text
function extractSpecificTrends(text: string): string[] {
  const lowered = text.toLowerCase();
  const trends: string[] = [];

  // Look for specific patterns that indicate real trends
  const patterns = [
    // "X oil" patterns (rosemary oil, castor oil, etc.)
    /\b(\w+)\s+(oil|acid|serum|extract|butter|tallow|water|essence)\b/gi,
    // "X skin" techniques (glass skin, dolphin skin, etc.)
    /\b(\w+)\s+skin\b/gi,
    // Korean/Japanese/etc + term
    /\b(korean|japanese|french|k-beauty|j-beauty)\s+(\w+)/gi,
    // Specific ingredients
    /\b(retinol|niacinamide|hyaluronic|salicylic|glycolic|peptide|ceramide|centella|cica|bakuchiol|snail\s*mucin|bee\s*venom|propolis)\b/gi,
    // Techniques with -ing
    /\b(slugging|skin\s*cycling|dermaplaning|microneedling|dry\s*brushing|gua\s*sha|face\s*yoga)\b/gi,
    // "beef/salmon/snail + X" (beef tallow, salmon sperm, snail mucin)
    /\b(beef|salmon|snail|mushroom|rice|sake)\s+(\w+)/gi,
    // LED/light therapy
    /\b(led|red\s*light|blue\s*light)\s*(mask|therapy|treatment)?\b/gi,
    // Specific viral products/ingredients
    /\b(glow\s*recipe|drunk\s*elephant|the\s*ordinary|cerave|la\s*roche|cosrx)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = lowered.matchAll(pattern);
    for (const match of matches) {
      const term = match[0].trim();
      // Filter out if it's too generic
      if (term.length > 4 && !GENERIC_TERMS.has(term)) {
        trends.push(term);
      }
    }
  }

  return trends;
}

// Get trending topics for a category - REWRITTEN for specific actionable trends
export async function braveTrendingTopics(
  category: string,
  keywords: string[]
): Promise<TrendResult[]> {
  const searches = CATEGORY_SEARCHES[category.toLowerCase()] || CATEGORY_SEARCHES.beauty;
  const trendMap = new Map<string, { count: number; sources: SourceInfo[] }>();

  console.log(`[Brave Trends] Searching for ${category} trends...`);

  // Run multiple targeted searches
  for (const searchQuery of searches.slice(0, 4)) { // Limit to 4 searches to save API quota
    try {
      const results = await braveWebSearch(searchQuery, { count: 10, freshness: 'pw' });

      for (const result of results) {
        const fullText = `${result.title} ${result.description}`;
        const extractedTrends = extractSpecificTrends(fullText);

        for (const trend of extractedTrends) {
          const normalized = trend.toLowerCase().trim();
          const existing = trendMap.get(normalized) || { count: 0, sources: [] };
          existing.count++;

          if (existing.sources.length < 3 && result.url) {
            const isDuplicate = existing.sources.some(s => s.url === result.url);
            if (!isDuplicate) {
              existing.sources.push({
                snippet: result.description?.slice(0, 150) || '',
                url: result.url,
                title: result.title || '',
              });
            }
          }
          trendMap.set(normalized, existing);
        }
      }

      // Small delay between searches
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error(`[Brave Trends] Search error:`, err);
    }
  }

  // Also search for the category + viral specifically
  try {
    const viralSearch = await braveWebSearch(`${category} viral ingredient product 2026 TikTok`, { count: 15, freshness: 'pw' });
    for (const result of viralSearch) {
      const fullText = `${result.title} ${result.description}`;
      const extractedTrends = extractSpecificTrends(fullText);

      for (const trend of extractedTrends) {
        const normalized = trend.toLowerCase().trim();
        const existing = trendMap.get(normalized) || { count: 0, sources: [] };
        existing.count++;

        if (existing.sources.length < 3 && result.url) {
          const isDuplicate = existing.sources.some(s => s.url === result.url);
          if (!isDuplicate) {
            existing.sources.push({
              snippet: result.description?.slice(0, 150) || '',
              url: result.url,
              title: result.title || '',
            });
          }
        }
        trendMap.set(normalized, existing);
      }
    }
  } catch (err) {
    console.error(`[Brave Trends] Viral search error:`, err);
  }

  // Convert to array and sort by frequency
  const sortedTrends = Array.from(trendMap.entries())
    .filter(([term, data]) => {
      // Must appear in at least 2 sources to be considered a real trend
      return data.count >= 2 && data.sources.length >= 1;
    })
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12);

  console.log(`[Brave Trends] Found ${sortedTrends.length} specific trends for ${category}`);

  return sortedTrends.map(([term, data], index) => ({
    term: term.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), // Title case
    volume: Math.max(100 - index * 7, 25),
    type: index < 5 ? 'rising' as const : 'top' as const,
    snippet: data.sources[0]?.snippet || '',
    url: data.sources[0]?.url || '',
    sourceTitle: data.sources[0]?.title || '',
    sources: data.sources,
  }));
}

// Check if Brave API is configured
export function isBraveConfigured(): boolean {
  return !!BRAVE_API_KEY;
}
