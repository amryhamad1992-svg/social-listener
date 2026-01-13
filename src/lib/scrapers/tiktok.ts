// TikTok via Google Custom Search
// Uses Google Custom Search API to find TikTok videos (bypasses TikTok's API restrictions)

import {
  BaseScraper,
  ScraperConfig,
  ScraperResult,
  ScraperOptions,
  ScrapedMention,
  generateMentionId,
  generateContentHash,
} from './types';

const GOOGLE_API_KEY = process.env.YOUTUBE_API_KEY; // Same key works for Custom Search
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    metatags?: Array<{
      'og:title'?: string;
      'og:description'?: string;
    }>;
    videoobject?: Array<{
      name?: string;
      description?: string;
      interactioncount?: string;
    }>;
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
  };
  error?: {
    message: string;
  };
}

export class TikTokScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'TikTok',
    baseUrl: 'https://www.googleapis.com/customsearch/v1',
    sourceType: 'social',
    rateLimit: 100, // Google allows 100 queries/day on free tier
    requiresJs: false,
    enabled: true,
  };

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 20 } = options;
    const searchTerms = [...keywords, ...brands].filter(Boolean);

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      return {
        source: this.config.name,
        success: false,
        mentions: [],
        error: 'Google Custom Search not configured (missing API key or Search Engine ID)',
        scrapedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    try {
      // Search for each term (limit to 2 searches to conserve quota)
      for (const term of searchTerms.slice(0, 2)) {
        try {
          const results = await this.searchGoogle(term, Math.min(10, maxResults));

          for (const result of results) {
            const mention = this.parseResult(result, term);
            if (mention) {
              mentions.push(mention);
            }
          }

          // Small delay between searches
          await this.delay(200);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          errors.push(`Search "${term}": ${errorMsg}`);
        }
      }

      // De-duplicate by URL
      const uniqueMentions = this.deduplicateMentions(mentions);

      return {
        source: this.config.name,
        success: uniqueMentions.length > 0,
        mentions: uniqueMentions.slice(0, maxResults),
        scrapedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: errors.length > 0 ? errors.join('; ') : undefined,
      };
    } catch (error) {
      return {
        source: this.config.name,
        success: false,
        mentions: [],
        error: String(error),
        scrapedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  private async searchGoogle(query: string, numResults: number): Promise<GoogleSearchResult[]> {
    // Add site:tiktok.com filter to search only TikTok
    const fullQuery = `${query} site:tiktok.com`;

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', GOOGLE_API_KEY!);
    url.searchParams.set('cx', SEARCH_ENGINE_ID!);
    url.searchParams.set('q', fullQuery);
    url.searchParams.set('num', Math.min(10, numResults).toString()); // Max 10 per request
    url.searchParams.set('sort', 'date'); // Sort by date for recent posts

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data: GoogleSearchResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.items || [];
  }

  private parseResult(result: GoogleSearchResult, keyword: string): ScrapedMention | null {
    const { title, link, snippet } = result;

    // Only include TikTok video links
    if (!link.includes('tiktok.com')) {
      return null;
    }

    // Extract username from URL patterns like:
    // https://www.tiktok.com/@username/video/123456
    // https://www.tiktok.com/@username
    const usernameMatch = link.match(/tiktok\.com\/@([^/?]+)/);
    const username = usernameMatch ? usernameMatch[1] : undefined;

    // Clean up title (remove " | TikTok" suffix and similar)
    const cleanTitle = title
      .replace(/\s*\|\s*TikTok\s*$/i, '')
      .replace(/\s*-\s*TikTok\s*$/i, '')
      .replace(/TikTok\s*-\s*/i, '')
      .trim();

    // Check if it's a video link
    const isVideo = link.includes('/video/');

    const fullText = `${cleanTitle} ${snippet}`;

    return {
      id: generateMentionId(link, keyword),
      source: 'TikTok',
      sourceType: 'social',
      url: link,
      title: cleanTitle || `TikTok by @${username || 'unknown'}`,
      snippet: snippet,
      fullText: fullText.slice(0, 2000),
      matchedKeyword: keyword,
      publishedAt: new Date().toISOString(), // Google doesn't provide exact date
      scrapedAt: new Date().toISOString(),
      engagement: {
        upvotes: 0, // Not available from Google
        comments: 0,
      },
      author: username ? `@${username}` : undefined,
      platform: 'tiktok',
      isVideo,
      isHighEngagement: false, // Can't determine from search results
      contentHash: generateContentHash(fullText),
    };
  }

  private deduplicateMentions(mentions: ScrapedMention[]): ScrapedMention[] {
    const seen = new Map<string, ScrapedMention>();

    for (const mention of mentions) {
      // Dedupe by URL
      if (!seen.has(mention.url)) {
        seen.set(mention.url, mention);
      }
    }

    return Array.from(seen.values());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const tiktokScraper = new TikTokScraper();
