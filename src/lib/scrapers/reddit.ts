// Reddit Web Scraper
// Uses old.reddit.com which is more scraper-friendly (static HTML)

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

// Target beauty subreddits
const BEAUTY_SUBREDDITS = [
  'SkincareAddiction',
  'MakeupAddiction',
  'BeautyGuruChatter',
  'drugstoreMUA',
  'AsianBeauty',
  'Sephora',
  'PanPorn',
  'makeupflatlays',
];

export class RedditScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'Reddit',
    baseUrl: 'https://old.reddit.com',
    sourceType: 'social',
    rateLimit: 30, // requests per minute
    requiresJs: false,
    enabled: true,
  };

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 50, daysBack = 7 } = options;
    const searchTerms = [...keywords, ...brands];

    try {
      // Search each subreddit for each keyword
      for (const subreddit of BEAUTY_SUBREDDITS) {
        for (const term of searchTerms) {
          if (mentions.length >= maxResults) break;

          try {
            const results = await this.searchSubreddit(subreddit, term, daysBack);
            mentions.push(...results);

            // Rate limiting - wait between requests
            await this.delay(2000);
          } catch (err) {
            errors.push(`Error scraping r/${subreddit} for "${term}": ${err}`);
          }
        }
        if (mentions.length >= maxResults) break;
      }

      // De-duplicate by content hash
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

  private async searchSubreddit(
    subreddit: string,
    keyword: string,
    daysBack: number
  ): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];

    // Search URL for the subreddit
    const searchUrl = `${this.config.baseUrl}/r/${subreddit}/search?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=new&t=week`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse search results
    $('div.thing.link').each((_, element) => {
      const $el = $(element);

      const title = $el.find('a.title').text().trim();
      const url = $el.find('a.title').attr('href') || '';
      const fullUrl = url.startsWith('http') ? url : `https://reddit.com${url}`;

      const author = $el.attr('data-author') || 'unknown';
      const timestamp = $el.find('time').attr('datetime') || '';
      const upvotesText = $el.find('.score.unvoted').text().trim();
      const upvotes = this.parseScore(upvotesText);
      const commentsText = $el.find('a.comments').text().trim();
      const comments = parseInt(commentsText) || 0;

      // Skip if too old
      if (timestamp) {
        const postDate = new Date(timestamp);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysBack);
        if (postDate < cutoff) return;
      }

      // Get selftext if available
      const selftext = $el.find('.expando .md').text().trim();
      const fullText = `${title} ${selftext}`.trim();

      const engagement = { upvotes, comments };

      const mention: ScrapedMention = {
        id: generateMentionId(fullUrl, keyword),
        source: 'Reddit',
        sourceType: 'social',
        url: fullUrl,
        title,
        snippet: extractSnippet(fullText, keyword),
        fullText: fullText.slice(0, 2000),
        matchedKeyword: keyword,
        publishedAt: timestamp || new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
        engagement,
        author,
        subreddit,
        isHighEngagement: isHighEngagement('social', engagement),
        contentHash: generateContentHash(fullText),
      };

      mentions.push(mention);
    });

    return mentions;
  }

  private parseScore(scoreText: string): number {
    if (!scoreText || scoreText === '•') return 0;
    const clean = scoreText.toLowerCase().replace(/[^0-9km.]/g, '');
    if (clean.includes('k')) {
      return Math.round(parseFloat(clean.replace('k', '')) * 1000);
    }
    return parseInt(clean) || 0;
  }

  private deduplicateMentions(mentions: ScrapedMention[]): ScrapedMention[] {
    const seen = new Map<string, ScrapedMention>();

    for (const mention of mentions) {
      const existing = seen.get(mention.contentHash);
      if (!existing || (mention.engagement.upvotes || 0) > (existing.engagement.upvotes || 0)) {
        seen.set(mention.contentHash, mention);
      }
    }

    return Array.from(seen.values());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const redditScraper = new RedditScraper();
