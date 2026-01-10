// Reddit RSS Feed Scraper
// Uses Reddit's RSS feeds which are more permissive than JSON API from cloud servers

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
  'Sephora',
];

export class RedditScraper implements BaseScraper {
  config: ScraperConfig = {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    sourceType: 'social',
    rateLimit: 30,
    requiresJs: false,
    enabled: true,
  };

  private userAgent = 'SocialListener/1.0 (Beauty Brand Monitoring)';

  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    const errors: string[] = [];

    const { keywords, brands, maxResults = 50, daysBack = 7 } = options;
    const searchTerms = [...keywords, ...brands].filter(Boolean);

    if (searchTerms.length === 0) {
      searchTerms.push('makeup'); // Default fallback
    }

    try {
      // Search each subreddit for each keyword using RSS
      for (const subreddit of BEAUTY_SUBREDDITS) {
        if (mentions.length >= maxResults) break;

        for (const term of searchTerms.slice(0, 2)) { // Limit terms for speed
          if (mentions.length >= maxResults) break;

          try {
            const results = await this.searchSubredditRss(subreddit, term, daysBack);
            mentions.push(...results);

            // Small delay between requests
            await this.delay(500);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            errors.push(`r/${subreddit} "${term}": ${errorMsg}`);
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
        error: errors.length > 0 ? errors.slice(0, 3).join('; ') : undefined,
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

  private async searchSubredditRss(
    subreddit: string,
    keyword: string,
    daysBack: number
  ): Promise<ScrapedMention[]> {
    const mentions: ScrapedMention[] = [];

    // Use Reddit's RSS feed for search
    const timeFilter = daysBack <= 1 ? 'day' : daysBack <= 7 ? 'week' : 'month';
    const rssUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=new&t=${timeFilter}&limit=25`;

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();

    // Parse RSS/Atom feed
    const entries = this.parseAtomFeed(xml);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    for (const entry of entries) {
      // Check if post is within date range
      const postDate = new Date(entry.updated);
      if (postDate < cutoffDate) continue;

      const engagement = {
        upvotes: 0, // RSS doesn't include vote counts
        comments: 0,
      };

      const mention: ScrapedMention = {
        id: generateMentionId(entry.link, keyword),
        source: 'Reddit',
        sourceType: 'social',
        url: entry.link,
        title: entry.title,
        snippet: extractSnippet(entry.content, keyword),
        fullText: entry.content.slice(0, 2000),
        matchedKeyword: keyword,
        publishedAt: entry.updated,
        scrapedAt: new Date().toISOString(),
        engagement,
        author: entry.author,
        subreddit,
        isHighEngagement: false, // Can't determine from RSS
        contentHash: generateContentHash(entry.title + entry.content),
      };

      mentions.push(mention);
    }

    return mentions;
  }

  private parseAtomFeed(xml: string): Array<{
    title: string;
    link: string;
    content: string;
    author: string;
    updated: string;
  }> {
    const entries: Array<{
      title: string;
      link: string;
      content: string;
      author: string;
      updated: string;
    }> = [];

    // Simple regex-based XML parsing for Atom feed
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];

      const title = this.extractXmlTag(entryXml, 'title');
      const link = this.extractXmlAttr(entryXml, 'link', 'href') || '';
      const content = this.extractXmlTag(entryXml, 'content') || this.extractXmlTag(entryXml, 'summary') || '';
      const author = this.extractXmlTag(entryXml, 'name') || 'unknown';
      const updated = this.extractXmlTag(entryXml, 'updated') || this.extractXmlTag(entryXml, 'published') || new Date().toISOString();

      // Only include if it's a Reddit post link (contains /comments/)
      if (link.includes('/comments/')) {
        entries.push({
          title: this.decodeHtmlEntities(title),
          link,
          content: this.stripHtml(this.decodeHtmlEntities(content)),
          author,
          updated,
        });
      }
    }

    return entries;
  }

  private extractXmlTag(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractXmlAttr(xml: string, tagName: string, attrName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*${attrName}="([^"]*)"`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

// Export singleton instance
export const redditScraper = new RedditScraper();
