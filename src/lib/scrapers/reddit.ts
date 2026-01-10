// Reddit JSON API Scraper
// Uses Reddit's public JSON API (no auth required) - more reliable than HTML scraping

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
  'MakeupAddiction',
  'drugstoreMUA',
  'BeautyGuruChatter',
  'SkincareAddiction',
  'Sephora',
  'PanPorn',
  'AsianBeauty',
  'MakeupRehab',
];

// Reddit JSON API response types
interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    ups: number;
    num_comments: number;
    created_utc: number;
    permalink: string;
    url: string;
    subreddit: string;
    link_flair_text?: string;
    over_18: boolean;
  };
}

interface RedditApiResponse {
  data: {
    children: RedditPost[];
    after?: string;
  };
}

export class RedditScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    sourceType: 'social',
    rateLimit: 30,
    requiresJs: false,
    enabled: true,
  };

  // Reddit requires a descriptive User-Agent
  private userAgent = 'SocialListener/1.0 (Beauty Brand Monitoring Tool)';

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 50, daysBack = 7 } = options;
    const searchTerms = [...keywords, ...brands];

    try {
      // Search each subreddit for each keyword
      for (const subreddit of BEAUTY_SUBREDDITS) {
        if (mentions.length >= maxResults) break;

        for (const term of searchTerms) {
          if (mentions.length >= maxResults) break;

          try {
            const results = await this.searchSubredditJson(subreddit, term, daysBack);
            mentions.push(...results);

            // Rate limiting - Reddit JSON API allows ~60 requests/minute for unauthenticated
            // Be conservative with 1.5s delay between requests
            await this.delay(1500);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            errors.push(`r/${subreddit} "${term}": ${errorMsg}`);

            // If rate limited, wait longer before next request
            if (errorMsg.includes('429')) {
              await this.delay(5000);
            }
          }
        }
      }

      // De-duplicate by content hash
      const uniqueMentions = this.deduplicateMentions(mentions);

      return {
        source: this.config.name,
        success: uniqueMentions.length > 0 || errors.length === 0,
        mentions: uniqueMentions.slice(0, maxResults),
        scrapedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined,
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

  private async searchSubredditJson(
    subreddit: string,
    keyword: string,
    daysBack: number
  ): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];

    // Use Reddit's JSON API - append .json to any Reddit URL
    const timeFilter = daysBack <= 1 ? 'day' : daysBack <= 7 ? 'week' : 'month';
    const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=new&t=${timeFilter}&limit=25`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited (429) - will retry with delay');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data: RedditApiResponse = await response.json();

    if (!data.data?.children) {
      return mentions;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    for (const post of data.data.children) {
      const postData = post.data;

      // Skip NSFW content
      if (postData.over_18) continue;

      // Check if post is within date range
      const postDate = new Date(postData.created_utc * 1000);
      if (postDate < cutoffDate) continue;

      const fullText = `${postData.title} ${postData.selftext}`.trim();
      const fullUrl = `https://www.reddit.com${postData.permalink}`;

      const engagement = {
        upvotes: postData.ups,
        comments: postData.num_comments,
      };

      const mention: ScrapedMention = {
        id: generateMentionId(fullUrl, keyword),
        source: 'Reddit',
        sourceType: 'social',
        url: fullUrl,
        title: postData.title,
        snippet: extractSnippet(fullText, keyword),
        fullText: fullText.slice(0, 2000),
        matchedKeyword: keyword,
        publishedAt: postDate.toISOString(),
        scrapedAt: new Date().toISOString(),
        engagement,
        author: postData.author,
        subreddit: postData.subreddit,
        isHighEngagement: isHighEngagement('social', engagement),
        contentHash: generateContentHash(fullText),
      };

      mentions.push(mention);
    }

    return mentions;
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
