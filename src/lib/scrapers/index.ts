// Unified Scraper Service - Now using Brave Search API
// 2,000 free searches/month, fast and reliable

import { braveSocialMentions, braveWebSearch, isBraveConfigured as _isBraveConfigured } from '../brave';

// Re-export for other modules
export const isBraveConfigured = _isBraveConfigured;
import { analyzeSentiment } from '../sentiment';

// Types
export interface ScrapedMention {
  id: string;
  source: string;
  sourceType: string;
  url: string;
  title: string;
  snippet: string;
  fullText?: string;
  matchedKeyword: string;
  publishedAt: string;
  scrapedAt: string;
  engagement: {
    upvotes?: number;
    comments?: number;
    views?: number;
  };
  author?: string;
  subreddit?: string;
  category?: string;
  isHighEngagement: boolean;
  contentHash: string;
  sentiment?: {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
  };
}

export interface ScraperResult {
  source: string;
  success: boolean;
  mentions: ScrapedMention[];
  error?: string;
  scrapedAt: string;
  duration: number;
}

export interface ScraperOptions {
  keywords: string[];
  brands: string[];
  maxResults?: number;
  daysBack?: number;
}

// Generate content hash for deduplication
export function generateContentHash(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Generate unique mention ID
export function generateMentionId(url: string, keyword: string): string {
  return `${generateContentHash(url)}-${generateContentHash(keyword)}`;
}

interface UnifiedScraperOptions {
  keywords?: string[];
  brands?: string[];
  sources?: string[];
  maxResultsPerSource?: number;
  daysBack?: number;
  includeSentiment?: boolean;
}

interface UnifiedScraperResult {
  success: boolean;
  totalMentions: number;
  mentions: ScrapedMention[];
  bySource: { [source: string]: number };
  bySentiment: { positive: number; neutral: number; negative: number };
  errors: string[];
  duration: number;
  scrapedAt: string;
  source: string;
}

// Main scraper function - uses Brave Search API
export async function scrapeAllSources(
  options: UnifiedScraperOptions = {}
): Promise<UnifiedScraperResult> {
  const startTime = Date.now();
  const {
    keywords = ['makeup', 'skincare', 'beauty'],
    brands = ['Revlon', 'e.l.f.', 'Maybelline'],
    daysBack = 7,
    includeSentiment = true,
  } = options;

  const mentions: ScrapedMention[] = [];
  const errors: string[] = [];
  const bySource: { [source: string]: number } = {
    Reddit: 0,
    TikTok: 0,
    YouTube: 0,
    Twitter: 0,
    Instagram: 0,
  };

  // Check if Brave is configured
  if (!isBraveConfigured()) {
    console.log('[Scraper] Brave API not configured, returning mock data');
    return {
      success: true,
      totalMentions: 0,
      mentions: getMockScrapedMentions().slice(0, 10),
      bySource,
      bySentiment: { positive: 5, neutral: 3, negative: 2 },
      errors: ['Brave API key not configured'],
      duration: Date.now() - startTime,
      scrapedAt: new Date().toISOString(),
      source: 'mock',
    };
  }

  try {
    // Search for brand mentions across platforms
    const primaryBrand = brands[0] || 'beauty';
    const searchKeywords = keywords.slice(0, 2);

    const freshness = daysBack <= 1 ? 'pd' : daysBack <= 7 ? 'pw' : 'pm';

    const result = await braveSocialMentions(primaryBrand, searchKeywords, { freshness });

    // Convert to ScrapedMention format
    result.mentions.forEach((m, index) => {
      const platform = m.platform;
      bySource[platform] = (bySource[platform] || 0) + 1;

      mentions.push({
        id: generateMentionId(m.url, primaryBrand),
        source: platform,
        sourceType: 'social',
        url: m.url,
        title: m.title,
        snippet: m.snippet,
        matchedKeyword: primaryBrand,
        publishedAt: parseRelativeDate(m.date),
        scrapedAt: new Date().toISOString(),
        engagement: estimateEngagement(platform, index),
        author: extractAuthor(m.url, platform),
        category: platform,
        isHighEngagement: index < 3,
        contentHash: generateContentHash(m.title + m.snippet),
      });
    });

    // Add sentiment analysis if enabled
    if (includeSentiment && mentions.length > 0) {
      for (const mention of mentions.slice(0, 10)) {
        try {
          const text = `${mention.title} ${mention.snippet}`.slice(0, 300);
          mention.sentiment = await analyzeSentiment(text, primaryBrand);
        } catch {
          mention.sentiment = { label: 'neutral', score: 0 };
        }
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(errorMsg);
    console.error('[Scraper] Error:', errorMsg);
  }

  // Calculate sentiment distribution
  const bySentiment = {
    positive: mentions.filter(m => m.sentiment?.label === 'positive').length,
    neutral: mentions.filter(m => !m.sentiment || m.sentiment.label === 'neutral').length,
    negative: mentions.filter(m => m.sentiment?.label === 'negative').length,
  };

  return {
    success: mentions.length > 0,
    totalMentions: mentions.length,
    mentions: mentions.slice(0, 20),
    bySource,
    bySentiment,
    errors,
    duration: Date.now() - startTime,
    scrapedAt: new Date().toISOString(),
    source: 'brave',
  };
}

// Helper: Parse relative date strings
function parseRelativeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();

  const now = new Date();
  const lower = dateStr.toLowerCase();

  if (lower.includes('hour') || lower.includes('minute')) {
    return now.toISOString();
  }
  if (lower.includes('day')) {
    const days = parseInt(dateStr) || 1;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }
  if (lower.includes('week')) {
    const weeks = parseInt(dateStr) || 1;
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (lower.includes('month')) {
    const months = parseInt(dateStr) || 1;
    return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  return now.toISOString();
}

// Helper: Estimate engagement based on platform and ranking
function estimateEngagement(platform: string, rank: number): ScrapedMention['engagement'] {
  const baseEngagement = Math.max(1000, 10000 - rank * 1000);

  switch (platform.toLowerCase()) {
    case 'tiktok':
      return {
        upvotes: baseEngagement * 5,
        comments: Math.floor(baseEngagement * 0.1),
        views: baseEngagement * 50,
      };
    case 'youtube':
      return {
        upvotes: baseEngagement,
        comments: Math.floor(baseEngagement * 0.05),
        views: baseEngagement * 20,
      };
    case 'reddit':
      return {
        upvotes: Math.floor(baseEngagement * 0.5),
        comments: Math.floor(baseEngagement * 0.1),
      };
    case 'twitter':
      return {
        upvotes: Math.floor(baseEngagement * 0.3),
        comments: Math.floor(baseEngagement * 0.05),
      };
    default:
      return {
        upvotes: Math.floor(baseEngagement * 0.2),
        comments: Math.floor(baseEngagement * 0.02),
      };
  }
}

// Helper: Extract author from URL
function extractAuthor(url: string, platform: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    switch (platform.toLowerCase()) {
      case 'reddit':
        const subredditMatch = path.match(/\/r\/([^/]+)/);
        return subredditMatch ? `r/${subredditMatch[1]}` : 'Reddit User';
      case 'youtube':
        return 'YouTube Creator';
      case 'tiktok':
        const tiktokMatch = path.match(/@([^/]+)/);
        return tiktokMatch ? `@${tiktokMatch[1]}` : '@TikTok User';
      case 'twitter':
        const twitterMatch = path.match(/\/([^/]+)/);
        return twitterMatch ? `@${twitterMatch[1]}` : '@User';
      default:
        return 'User';
    }
  } catch {
    return 'User';
  }
}

// Get available sources
export function getAvailableSources(): { name: string; enabled: boolean; sourceType: string }[] {
  const isConfigured = isBraveConfigured();
  return [
    { name: 'Reddit', enabled: isConfigured, sourceType: 'social' },
    { name: 'TikTok', enabled: isConfigured, sourceType: 'social' },
    { name: 'YouTube', enabled: isConfigured, sourceType: 'social' },
    { name: 'Twitter', enabled: isConfigured, sourceType: 'social' },
    { name: 'Instagram', enabled: isConfigured, sourceType: 'social' },
  ];
}

// Mock data fallback
export function getMockScrapedMentions(): ScrapedMention[] {
  const now = new Date();

  return [
    {
      id: 'mock-reddit-1',
      source: 'Reddit',
      sourceType: 'social',
      url: 'https://reddit.com/r/MakeupAddiction/comments/example1',
      title: 'Just tried the new Revlon ColorStay foundation and WOW',
      snippet: 'I\'ve been searching for a good drugstore foundation and finally tried Revlon ColorStay. The coverage is amazing and it lasted all day...',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 234, comments: 45 },
      author: 'r/MakeupAddiction',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon colorstay foundation'),
      sentiment: { label: 'positive', score: 0.78 },
    },
    {
      id: 'mock-tiktok-1',
      source: 'TikTok',
      sourceType: 'social',
      url: 'https://tiktok.com/@beautycreator/video/example1',
      title: 'GRWM using only Revlon products',
      snippet: 'Get ready with me using only drugstore Revlon makeup! The ColorStay foundation + Super Lustrous lip combo is amazing',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 45000, comments: 892, views: 520000 },
      author: '@beautyontiktok',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon grwm tiktok'),
      sentiment: { label: 'positive', score: 0.88 },
    },
    {
      id: 'mock-youtube-1',
      source: 'YouTube',
      sourceType: 'social',
      url: 'https://youtube.com/watch?v=example1',
      title: 'HONEST Revlon ColorStay Foundation Review | 12 Hour Wear Test',
      snippet: 'Testing the viral Revlon ColorStay foundation for a full 12 hours! Is it really worth the hype?',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 8900, comments: 456, views: 245000 },
      author: 'Beauty By Sarah',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon colorstay youtube review'),
      sentiment: { label: 'positive', score: 0.75 },
    },
  ];
}

// Re-export types
export * from './types';
