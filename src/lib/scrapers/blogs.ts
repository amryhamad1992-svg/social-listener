// Beauty Blog Scrapers
// Temptalia, Into The Gloss, and other beauty blogs

import * as cheerio from 'cheerio';
import {
  BaseScraper,
  ScraperConfig,
  ScraperResult,
  ScraperOptions,
  ScrapedMention,
  generateMentionId,
  generateContentHash,
  extractSnippet,
  isHighEngagement,
} from './types';

// Temptalia - Detailed makeup reviews and swatches
export class TemptaliaScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'Temptalia',
    baseUrl: 'https://www.temptalia.com',
    sourceType: 'blog',
    rateLimit: 15,
    requiresJs: false,
    enabled: false, // Disabled - needs HTML parsing updates
  };

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 20 } = options;
    const searchTerms = [...brands, ...keywords.slice(0, 3)];

    try {
      for (const term of searchTerms) {
        if (mentions.length >= maxResults) break;

        try {
          const results = await this.search(term);
          mentions.push(...results);
          await this.delay(3000);
        } catch (err) {
          errors.push(`Temptalia error for "${term}": ${err}`);
        }
      }

      return {
        source: this.config.name,
        success: true,
        mentions: this.deduplicate(mentions).slice(0, maxResults),
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

  private async search(keyword: string): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];
    const searchUrl = `${this.config.baseUrl}/?s=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!response.ok) return mentions;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Parse search results
      $('article, .post, .search-result').each((_, element) => {
        const $el = $(element);

        const titleEl = $el.find('h2 a, h3 a, .entry-title a').first();
        const title = titleEl.text().trim();
        const url = titleEl.attr('href') || '';

        if (!title || !url) return;

        const excerpt = $el.find('.entry-summary, .excerpt, p').first().text().trim();
        const dateText = $el.find('time, .date, .published').first().attr('datetime') ||
                         $el.find('time, .date, .published').first().text().trim();
        const commentCountText = $el.find('.comments-link, .comment-count').text().trim();
        const commentCount = parseInt(commentCountText.replace(/\D/g, '')) || 0;

        const fullText = `${title} ${excerpt}`.trim();
        const engagement = { comments: commentCount };

        const mention: ScrapedMention = {
          id: generateMentionId(url, keyword),
          source: 'Temptalia',
          sourceType: 'blog',
          url,
          title,
          snippet: extractSnippet(fullText, keyword),
          matchedKeyword: keyword,
          publishedAt: this.parseDate(dateText),
          scrapedAt: new Date().toISOString(),
          engagement,
          category: 'Beauty Review',
          isHighEngagement: isHighEngagement('blog', engagement),
          contentHash: generateContentHash(fullText),
        };

        mentions.push(mention);
      });
    } catch (err) {
      console.error('Temptalia search error:', err);
    }

    return mentions;
  }

  private parseDate(dateText: string): string {
    if (!dateText) return new Date().toISOString();
    const date = new Date(dateText);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  private deduplicate(mentions: ScrapedMention[]): ScrapedMention[] {
    const seen = new Map<string, ScrapedMention>();
    for (const m of mentions) {
      if (!seen.has(m.contentHash)) seen.set(m.contentHash, m);
    }
    return Array.from(seen.values());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

// Into The Gloss - Glossier's beauty blog
export class IntoTheGlossScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'Into The Gloss',
    baseUrl: 'https://intothegloss.com',
    sourceType: 'blog',
    rateLimit: 15,
    requiresJs: false,
    enabled: false, // Disabled - needs HTML parsing updates
  };

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 15 } = options;
    const searchTerms = [...brands, ...keywords.slice(0, 3)];

    try {
      for (const term of searchTerms) {
        if (mentions.length >= maxResults) break;

        try {
          const results = await this.search(term);
          mentions.push(...results);
          await this.delay(3000);
        } catch (err) {
          errors.push(`Into The Gloss error for "${term}": ${err}`);
        }
      }

      return {
        source: this.config.name,
        success: true,
        mentions: this.deduplicate(mentions).slice(0, maxResults),
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

  private async search(keyword: string): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];
    const searchUrl = `${this.config.baseUrl}/?s=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!response.ok) return mentions;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Parse articles
      $('article, .post-card, .article-item').each((_, element) => {
        const $el = $(element);

        const titleEl = $el.find('h2 a, h3 a, .title a').first();
        const title = titleEl.text().trim();
        const url = titleEl.attr('href') || '';

        if (!title || !url) return;

        const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
        const excerpt = $el.find('.excerpt, .summary, p').first().text().trim();
        const author = $el.find('.author, .byline').text().trim();
        const dateText = $el.find('time, .date').first().attr('datetime') ||
                         $el.find('time, .date').first().text().trim();

        const fullText = `${title} ${excerpt}`.trim();

        const mention: ScrapedMention = {
          id: generateMentionId(fullUrl, keyword),
          source: 'Into The Gloss',
          sourceType: 'blog',
          url: fullUrl,
          title,
          snippet: extractSnippet(fullText, keyword),
          matchedKeyword: keyword,
          publishedAt: this.parseDate(dateText),
          scrapedAt: new Date().toISOString(),
          engagement: {},
          author: author || undefined,
          category: 'Beauty Editorial',
          isHighEngagement: false,
          contentHash: generateContentHash(fullText),
        };

        mentions.push(mention);
      });
    } catch (err) {
      console.error('Into The Gloss search error:', err);
    }

    return mentions;
  }

  private parseDate(dateText: string): string {
    if (!dateText) return new Date().toISOString();
    const date = new Date(dateText);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  private deduplicate(mentions: ScrapedMention[]): ScrapedMention[] {
    const seen = new Map<string, ScrapedMention>();
    for (const m of mentions) {
      if (!seen.has(m.contentHash)) seen.set(m.contentHash, m);
    }
    return Array.from(seen.values());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

// Allure - Major beauty magazine
export class AllureScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'Allure',
    baseUrl: 'https://www.allure.com',
    sourceType: 'blog',
    rateLimit: 15,
    requiresJs: false,
    enabled: false, // Disabled - needs HTML parsing updates
  };

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 15 } = options;
    const searchTerms = [...brands, ...keywords.slice(0, 3)];

    try {
      for (const term of searchTerms) {
        if (mentions.length >= maxResults) break;

        try {
          const results = await this.search(term);
          mentions.push(...results);
          await this.delay(3000);
        } catch (err) {
          errors.push(`Allure error for "${term}": ${err}`);
        }
      }

      return {
        source: this.config.name,
        success: true,
        mentions: this.deduplicate(mentions).slice(0, maxResults),
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

  private async search(keyword: string): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];
    const searchUrl = `${this.config.baseUrl}/search?q=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!response.ok) return mentions;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Parse search results
      $('[class*="summary-item"], article, .search-result').each((_, element) => {
        const $el = $(element);

        const titleEl = $el.find('h2 a, h3 a, [class*="hed"] a').first();
        const title = titleEl.text().trim();
        const url = titleEl.attr('href') || '';

        if (!title || !url) return;

        const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
        const excerpt = $el.find('[class*="dek"], .summary, p').first().text().trim();

        const fullText = `${title} ${excerpt}`.trim();

        const mention: ScrapedMention = {
          id: generateMentionId(fullUrl, keyword),
          source: 'Allure',
          sourceType: 'blog',
          url: fullUrl,
          title,
          snippet: extractSnippet(fullText, keyword),
          matchedKeyword: keyword,
          publishedAt: new Date().toISOString(),
          scrapedAt: new Date().toISOString(),
          engagement: {},
          category: 'Beauty Magazine',
          isHighEngagement: false,
          contentHash: generateContentHash(fullText),
        };

        mentions.push(mention);
      });
    } catch (err) {
      console.error('Allure search error:', err);
    }

    return mentions;
  }

  private deduplicate(mentions: ScrapedMention[]): ScrapedMention[] {
    const seen = new Map<string, ScrapedMention>();
    for (const m of mentions) {
      if (!seen.has(m.contentHash)) seen.set(m.contentHash, m);
    }
    return Array.from(seen.values());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

// Export instances
export const temptaliaScraper = new TemptaliaScraper();
export const intoTheGlossScraper = new IntoTheGlossScraper();
export const allureScraper = new AllureScraper();
