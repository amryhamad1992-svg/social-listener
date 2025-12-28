// MakeupAlley Scraper
// Reviews and forum discussions from makeupalley.com

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

export class MakeupAlleyScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'MakeupAlley',
    baseUrl: 'https://www.makeupalley.com',
    sourceType: 'review',
    rateLimit: 20,
    requiresJs: false,
    enabled: true,
  };

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 30 } = options;
    const searchTerms = [...brands, ...keywords.slice(0, 5)]; // Focus on brands

    try {
      for (const term of searchTerms) {
        if (mentions.length >= maxResults) break;

        try {
          // Search product reviews
          const reviewResults = await this.searchReviews(term);
          mentions.push(...reviewResults);

          await this.delay(2500);

          // Search forum/board discussions
          const forumResults = await this.searchForum(term);
          mentions.push(...forumResults);

          await this.delay(2500);
        } catch (err) {
          errors.push(`Error searching MakeupAlley for "${term}": ${err}`);
        }
      }

      const uniqueMentions = this.deduplicateMentions(mentions);

      return {
        source: this.config.name,
        success: true,
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

  private async searchReviews(keyword: string): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];
    const searchUrl = `${this.config.baseUrl}/product/searching?q=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) return mentions;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Parse product search results
      $('.product-card, .search-result-item').each((_, element) => {
        const $el = $(element);

        const title = $el.find('.product-name, .title, h3, h4').first().text().trim();
        const url = $el.find('a').first().attr('href') || '';
        const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;

        const ratingText = $el.find('.rating, .stars').text().trim();
        const rating = parseFloat(ratingText) || 0;
        const reviewCountText = $el.find('.review-count, .reviews').text().trim();
        const reviewCount = parseInt(reviewCountText.replace(/\D/g, '')) || 0;

        const snippet = $el.find('.description, .snippet, p').first().text().trim();
        const fullText = `${title} ${snippet}`.trim();

        if (!title || !url) return;

        const engagement = {
          upvotes: Math.round(rating * 20), // Convert 5-star to percentage
          comments: reviewCount,
        };

        const mention: ScrapedMention = {
          id: generateMentionId(fullUrl, keyword),
          source: 'MakeupAlley',
          sourceType: 'review',
          url: fullUrl,
          title: title || `${keyword} review`,
          snippet: extractSnippet(fullText || title, keyword),
          matchedKeyword: keyword,
          publishedAt: new Date().toISOString(), // MakeupAlley doesn't always show dates
          scrapedAt: new Date().toISOString(),
          engagement,
          category: 'Product Review',
          isHighEngagement: isHighEngagement('review', engagement),
          contentHash: generateContentHash(fullText || title),
        };

        mentions.push(mention);
      });
    } catch (err) {
      console.error('MakeupAlley review search error:', err);
    }

    return mentions;
  }

  private async searchForum(keyword: string): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];
    const searchUrl = `${this.config.baseUrl}/board/search?q=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) return mentions;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Parse forum search results
      $('.thread-item, .discussion-item, .board-post').each((_, element) => {
        const $el = $(element);

        const title = $el.find('.thread-title, .title, a').first().text().trim();
        const url = $el.find('a').first().attr('href') || '';
        const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;

        const author = $el.find('.author, .username').text().trim();
        const dateText = $el.find('.date, .time, time').text().trim();
        const replyCountText = $el.find('.replies, .reply-count').text().trim();
        const replyCount = parseInt(replyCountText.replace(/\D/g, '')) || 0;

        const snippet = $el.find('.preview, .snippet, p').first().text().trim();
        const fullText = `${title} ${snippet}`.trim();

        if (!title || !url) return;

        const engagement = { comments: replyCount };

        const mention: ScrapedMention = {
          id: generateMentionId(fullUrl, keyword),
          source: 'MakeupAlley',
          sourceType: 'forum',
          url: fullUrl,
          title,
          snippet: extractSnippet(fullText || title, keyword),
          matchedKeyword: keyword,
          publishedAt: this.parseDate(dateText),
          scrapedAt: new Date().toISOString(),
          engagement,
          author: author || undefined,
          category: 'Forum Discussion',
          isHighEngagement: isHighEngagement('forum', engagement),
          contentHash: generateContentHash(fullText || title),
        };

        mentions.push(mention);
      });
    } catch (err) {
      console.error('MakeupAlley forum search error:', err);
    }

    return mentions;
  }

  private parseDate(dateText: string): string {
    if (!dateText) return new Date().toISOString();

    // Try to parse common date formats
    const date = new Date(dateText);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Handle relative dates like "2 days ago"
    const relativeMatch = dateText.match(/(\d+)\s*(day|hour|minute|week|month)s?\s*ago/i);
    if (relativeMatch) {
      const num = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].toLowerCase();
      const now = new Date();

      switch (unit) {
        case 'minute': now.setMinutes(now.getMinutes() - num); break;
        case 'hour': now.setHours(now.getHours() - num); break;
        case 'day': now.setDate(now.getDate() - num); break;
        case 'week': now.setDate(now.getDate() - (num * 7)); break;
        case 'month': now.setMonth(now.getMonth() - num); break;
      }
      return now.toISOString();
    }

    return new Date().toISOString();
  }

  private deduplicateMentions(mentions: ScrapedMention[]): ScrapedMention[] {
    const seen = new Map<string, ScrapedMention>();
    for (const mention of mentions) {
      if (!seen.has(mention.contentHash)) {
        seen.set(mention.contentHash, mention);
      }
    }
    return Array.from(seen.values());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const makeupAlleyScraper = new MakeupAlleyScraper();
