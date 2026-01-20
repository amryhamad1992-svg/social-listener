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

// Get trending topics for a category
export async function braveTrendingTopics(
  category: string,
  keywords: string[]
): Promise<Array<{
  term: string;
  volume: number;
  type: 'rising' | 'top';
  snippet: string;
  url: string;
  sourceTitle: string;
  sources: SourceInfo[];
}>> {
  const searchQuery = `${category} trending ${keywords[0] || ''} 2026`;
  const results = await braveWebSearch(searchQuery, { count: 20, freshness: 'pw' });

  // Extract trending terms from results - store multiple sources per term
  const terms = new Map<string, { count: number; sources: SourceInfo[] }>();
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'this', 'that', 'with', 'you', 'your', 'best', 'top', 'new', 'how', 'what', 'why', '2024', '2025', '2026']);

  results.forEach(result => {
    const text = `${result.title} ${result.description}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 6) {
        const existing = terms.get(phrase) || { count: 0, sources: [] };
        existing.count++;

        // Store up to 3 unique sources per term
        if (existing.sources.length < 3 && result.url && !existing.sources.some(s => s.url === result.url)) {
          existing.sources.push({
            snippet: result.description?.slice(0, 100) || '',
            url: result.url,
            title: result.title || '',
          });
        }
        terms.set(phrase, existing);
      }
    }
  });

  return Array.from(terms.entries())
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([term, data], index) => ({
      term,
      volume: Math.max(100 - index * 8, 30),
      type: index < 4 ? 'rising' as const : 'top' as const,
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
