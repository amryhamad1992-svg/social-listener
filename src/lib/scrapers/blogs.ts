// Beauty Blog Scrapers via Google Custom Search
// Uses Google Custom Search to find content from Temptalia, MakeupAlley, etc.

import {
  BaseScraper,
  ScraperConfig,
  ScraperResult,
  ScraperOptions,
  ScrapedMention,
  generateMentionId,
  generateContentHash,
} from './types';

const GOOGLE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  error?: { message: string };
}

// Base class for Google Custom Search scrapers
abstract class GoogleSearchScraper implements BaseScraper {
  abstract config: ScraperConfig;
  abstract siteFilter: string;
  abstract sourceIcon: string;
  abstract category: string;

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 15 } = options;
    const searchTerms = [...brands, ...keywords.slice(0, 2)];

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      return {
        source: this.config.name,
        success: false,
        mentions: [],
        error: 'Google Custom Search not configured',
        scrapedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    try {
      // Search for first 2 terms to conserve quota
      for (const term of searchTerms.slice(0, 2)) {
        try {
          const results = await this.searchGoogle(term, Math.min(10, maxResults));

          for (const result of results) {
            const mention = this.parseResult(result, term);
            if (mention) {
              mentions.push(mention);
            }
          }

          await this.delay(200);
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

  private async searchGoogle(query: string, numResults: number): Promise<GoogleSearchResult[]> {
    // Add site filter to query
    const fullQuery = `${query} site:${this.siteFilter}`;

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', GOOGLE_API_KEY!);
    url.searchParams.set('cx', SEARCH_ENGINE_ID!);
    url.searchParams.set('q', fullQuery);
    url.searchParams.set('num', Math.min(10, numResults).toString());

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

    // Clean up title (remove site name suffix)
    const cleanTitle = title
      .replace(/\s*[-–|]\s*(Temptalia|MakeupAlley|Into The Gloss|Allure).*$/i, '')
      .trim();

    const fullText = `${cleanTitle} ${snippet}`;

    return {
      id: generateMentionId(link, keyword),
      source: this.config.name,
      sourceType: 'blog',
      url: link,
      title: cleanTitle || title,
      snippet: snippet,
      fullText: fullText.slice(0, 2000),
      matchedKeyword: keyword,
      publishedAt: new Date().toISOString(),
      scrapedAt: new Date().toISOString(),
      engagement: {
        comments: 0,
      },
      category: this.category,
      isHighEngagement: false,
      contentHash: generateContentHash(fullText),
    };
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

// Temptalia - Detailed makeup reviews and swatches
export class TemptaliaScraper extends GoogleSearchScraper {
  config: ScraperConfig = {
    name: 'Temptalia',
    baseUrl: 'https://www.temptalia.com',
    sourceType: 'blog',
    rateLimit: 100,
    requiresJs: false,
    enabled: true,
  };

  siteFilter = 'temptalia.com';
  sourceIcon = '💋';
  category = 'Beauty Review';
}

// MakeupAlley - Reviews and forum discussions
export class MakeupAlleyScraper extends GoogleSearchScraper {
  config: ScraperConfig = {
    name: 'MakeupAlley',
    baseUrl: 'https://www.makeupalley.com',
    sourceType: 'review',
    rateLimit: 100,
    requiresJs: false,
    enabled: true,
  };

  siteFilter = 'makeupalley.com';
  sourceIcon = '💄';
  category = 'Product Review';
}

// Into The Gloss - Glossier's beauty blog
export class IntoTheGlossScraper extends GoogleSearchScraper {
  config: ScraperConfig = {
    name: 'Into The Gloss',
    baseUrl: 'https://intothegloss.com',
    sourceType: 'blog',
    rateLimit: 100,
    requiresJs: false,
    enabled: true,
  };

  siteFilter = 'intothegloss.com';
  sourceIcon = '✨';
  category = 'Beauty Editorial';
}

// Allure - Major beauty magazine
export class AllureScraper extends GoogleSearchScraper {
  config: ScraperConfig = {
    name: 'Allure',
    baseUrl: 'https://www.allure.com',
    sourceType: 'blog',
    rateLimit: 100,
    requiresJs: false,
    enabled: true,
  };

  siteFilter = 'allure.com';
  sourceIcon = '📰';
  category = 'Beauty Magazine';
}

// Export instances
export const temptaliaScraper = new TemptaliaScraper();
export const makeupAlleyScraper = new MakeupAlleyScraper();
export const intoTheGlossScraper = new IntoTheGlossScraper();
export const allureScraper = new AllureScraper();
