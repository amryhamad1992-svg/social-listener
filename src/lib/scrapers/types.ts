// Unified types for all web scrapers

export interface ScrapedMention {
  id: string;                    // Unique ID (hash of url + keyword)
  source: string;                // Source name (e.g., "Reddit", "MakeupAlley", "Temptalia")
  sourceType: 'forum' | 'blog' | 'review' | 'social';
  url: string;                   // Full URL to the mention
  title: string;                 // Post/article title
  snippet: string;               // Text containing the keyword match (max 500 chars)
  fullText?: string;             // Full post text if available
  matchedKeyword: string;        // Which keyword triggered this match
  publishedAt: string;           // ISO date string
  scrapedAt: string;             // When we scraped it

  // Engagement metrics (where available)
  engagement: {
    upvotes?: number;
    downvotes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };

  // Sentiment (added by AI analysis)
  sentiment?: {
    label: 'positive' | 'neutral' | 'negative';
    score: number;               // -1 to 1
  };

  // Metadata
  author?: string;
  subreddit?: string;            // For Reddit
  category?: string;             // For blogs/forums
  isHighEngagement: boolean;     // Flagged if above threshold

  // For de-duplication
  contentHash: string;           // Hash of snippet for de-dupe
}

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  sourceType: ScrapedMention['sourceType'];
  rateLimit: number;             // Requests per minute
  requiresJs: boolean;           // Needs Playwright vs Cheerio
  enabled: boolean;
}

export interface ScraperResult {
  source: string;
  success: boolean;
  mentions: ScrapedMention[];
  error?: string;
  scrapedAt: string;
  duration: number;              // ms
}

export interface ScraperOptions {
  keywords: string[];
  brands: string[];
  maxResults?: number;
  daysBack?: number;
  includeComments?: boolean;
}

// Base interface that all scrapers must implement
export interface BaseScraper {
  config: ScraperConfig;
  scrape(options: ScraperOptions): Promise<ScraperResult>;
}

// Helper to generate unique mention ID
export function generateMentionId(url: string, keyword: string): string {
  const str = `${url}:${keyword}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Helper to generate content hash for de-duplication
export function generateContentHash(text: string): string {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Helper to extract snippet around keyword
export function extractSnippet(text: string, keyword: string, maxLength: number = 500): string {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) {
    return text.slice(0, maxLength);
  }

  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + keyword.length + 300);

  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

// Engagement thresholds for "high engagement" flag
export const ENGAGEMENT_THRESHOLDS: {
  [key: string]: { upvotes?: number; comments?: number };
} = {
  reddit: { upvotes: 100, comments: 25 },
  social: { upvotes: 100, comments: 25 },
  forum: { comments: 15 },
  blog: { comments: 10 },
  review: { upvotes: 50, comments: 10 },
};

export function isHighEngagement(
  sourceType: ScrapedMention['sourceType'],
  engagement: ScrapedMention['engagement']
): boolean {
  const thresholds = ENGAGEMENT_THRESHOLDS[sourceType] || ENGAGEMENT_THRESHOLDS['forum'];

  if (engagement.upvotes && thresholds.upvotes && engagement.upvotes >= thresholds.upvotes) {
    return true;
  }
  if (engagement.comments && thresholds.comments && engagement.comments >= thresholds.comments) {
    return true;
  }

  return false;
}
