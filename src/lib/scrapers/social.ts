// Social Media Scrapers via SerpAPI
// Uses SerpAPI to search Instagram, X (Twitter), and Meta/Facebook

import {
  BaseScraper,
  ScraperConfig,
  ScraperResult,
  ScraperOptions,
  ScrapedMention,
  generateMentionId,
  generateContentHash,
  isHighEngagement,
} from './types';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// SerpAPI response interfaces
interface SerpAPIOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  displayed_link?: string;
  date?: string;
  source?: string;
}

interface SerpAPIResponse {
  organic_results?: SerpAPIOrganicResult[];
  error?: string;
  search_metadata?: {
    status: string;
    total_time_taken?: number;
  };
}

// Base class for SerpAPI-based scrapers
abstract class SerpAPIScraper implements BaseScraper {
  abstract config: ScraperConfig;
  abstract siteFilter: string;
  abstract sourceIcon: string;
  abstract platform: string;

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 10, daysBack = 30 } = options;
    const searchTerms = [...brands, ...keywords.slice(0, 2)];

    if (!SERPAPI_KEY) {
      return {
        source: this.config.name,
        success: false,
        mentions: [],
        error: 'SerpAPI key not configured',
        scrapedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    try {
      // Search for first 2 terms to conserve quota
      for (const term of searchTerms.slice(0, 2)) {
        try {
          const results = await this.searchSerpAPI(term, Math.min(10, maxResults), daysBack);

          for (const result of results) {
            const mention = this.parseResult(result, term);
            if (mention) {
              mentions.push(mention);
            }
          }

          // Delay between requests
          await this.delay(300);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          errors.push(`Search "${term}": ${errorMsg}`);
        }
      }

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

  private async searchSerpAPI(query: string, numResults: number, daysBack: number): Promise<SerpAPIOrganicResult[]> {
    // Use Google Search with site filter for the platform
    const fullQuery = `${query} site:${this.siteFilter}`;

    // Calculate date range for last N days
    const tbs = this.getDateFilter(daysBack);

    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('api_key', SERPAPI_KEY!);
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', fullQuery);
    url.searchParams.set('num', Math.min(10, numResults).toString());
    url.searchParams.set('gl', 'us');
    url.searchParams.set('hl', 'en');

    // Add date filter if within 30 days
    if (tbs) {
      url.searchParams.set('tbs', tbs);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data: SerpAPIResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.organic_results || [];
  }

  private getDateFilter(daysBack: number): string | null {
    // Google's tbs parameter for date filtering
    if (daysBack <= 1) return 'qdr:d'; // Last day
    if (daysBack <= 7) return 'qdr:w'; // Last week
    if (daysBack <= 30) return 'qdr:m'; // Last month
    return null; // No filter for 30+ days
  }

  private parseResult(result: SerpAPIOrganicResult, keyword: string): ScrapedMention | null {
    const { title, link, snippet, date } = result;

    if (!title || !link) return null;

    // Clean up title
    const cleanTitle = title
      .replace(/\s*[-–|]\s*(Instagram|X|Twitter|Facebook|Meta).*$/i, '')
      .replace(/\s*on\s+(Instagram|X|Twitter|Facebook)$/i, '')
      .trim();

    const fullText = `${cleanTitle} ${snippet || ''}`;

    // Estimate engagement based on platform patterns
    const engagement = this.estimateEngagement(snippet || '');

    // Parse date from result or use current date
    const publishedAt = this.parseDate(date);

    const mention: ScrapedMention = {
      id: generateMentionId(link, keyword),
      source: this.config.name,
      sourceType: 'social',
      url: link,
      title: cleanTitle,
      snippet: snippet || '',
      fullText: fullText.slice(0, 2000),
      matchedKeyword: keyword,
      publishedAt,
      scrapedAt: new Date().toISOString(),
      engagement,
      category: this.platform,
      isHighEngagement: isHighEngagement('social', engagement),
      contentHash: generateContentHash(fullText),
    };

    return mention;
  }

  private estimateEngagement(snippet: string): ScrapedMention['engagement'] {
    // Try to extract engagement numbers from snippet
    const likesMatch = snippet.match(/(\d+(?:\.\d+)?[KkMm]?)\s*(?:likes?|hearts?)/i);
    const commentsMatch = snippet.match(/(\d+(?:\.\d+)?[KkMm]?)\s*comments?/i);
    const viewsMatch = snippet.match(/(\d+(?:\.\d+)?[KkMm]?)\s*views?/i);

    const parseNumber = (str: string | undefined): number | undefined => {
      if (!str) return undefined;
      const num = parseFloat(str);
      if (str.toLowerCase().includes('k')) return num * 1000;
      if (str.toLowerCase().includes('m')) return num * 1000000;
      return num;
    };

    return {
      upvotes: parseNumber(likesMatch?.[1]),
      comments: parseNumber(commentsMatch?.[1]),
      views: parseNumber(viewsMatch?.[1]),
    };
  }

  private parseDate(dateStr: string | undefined): string {
    if (!dateStr) return new Date().toISOString();

    try {
      // Handle relative dates like "2 days ago", "1 week ago"
      const now = new Date();
      const lowerDate = dateStr.toLowerCase();

      if (lowerDate.includes('hour') || lowerDate.includes('minute')) {
        return now.toISOString();
      }
      if (lowerDate.includes('day')) {
        const days = parseInt(dateStr) || 1;
        return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
      }
      if (lowerDate.includes('week')) {
        const weeks = parseInt(dateStr) || 1;
        return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (lowerDate.includes('month')) {
        const months = parseInt(dateStr) || 1;
        return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Try to parse as date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      // Ignore parsing errors
    }

    return new Date().toISOString();
  }

  private deduplicateMentions(mentions: ScrapedMention[]): ScrapedMention[] {
    const seen = new Map<string, ScrapedMention>();
    for (const mention of mentions) {
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

// Instagram Scraper via SerpAPI
export class InstagramScraper extends SerpAPIScraper {
  config: ScraperConfig = {
    name: 'Instagram',
    baseUrl: 'https://www.instagram.com',
    sourceType: 'social',
    rateLimit: 30,
    requiresJs: false,
    enabled: true,
  };

  siteFilter = 'instagram.com';
  sourceIcon = '📸';
  platform = 'Instagram';
}

// X (Twitter) Scraper via SerpAPI
export class XScraper extends SerpAPIScraper {
  config: ScraperConfig = {
    name: 'X',
    baseUrl: 'https://x.com',
    sourceType: 'social',
    rateLimit: 30,
    requiresJs: false,
    enabled: true,
  };

  siteFilter = 'x.com OR site:twitter.com';
  sourceIcon = '𝕏';
  platform = 'X (Twitter)';
}

// Meta/Facebook Scraper via SerpAPI
export class MetaScraper extends SerpAPIScraper {
  config: ScraperConfig = {
    name: 'Meta',
    baseUrl: 'https://www.facebook.com',
    sourceType: 'social',
    rateLimit: 30,
    requiresJs: false,
    enabled: true,
  };

  siteFilter = 'facebook.com';
  sourceIcon = '👤';
  platform = 'Facebook';
}

// Export instances
export const instagramScraper = new InstagramScraper();
export const xScraper = new XScraper();
export const metaScraper = new MetaScraper();
