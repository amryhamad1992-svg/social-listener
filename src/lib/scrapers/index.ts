// Unified Scraper Service
// Orchestrates all scrapers and handles de-duplication + sentiment analysis
// v4: Now uses SerpAPI for Instagram, X, Meta, TikTok, and YouTube

import { redditScraper } from './reddit';
import { instagramScraper, xScraper, metaScraper, tiktokScraper, youtubeScraper } from './social';
import {
  BaseScraper,
  ScraperResult,
  ScraperOptions,
  ScrapedMention,
  generateContentHash,
} from './types';
import { analyzeSentiment } from '../sentiment';

// Re-export types
export * from './types';

// All available scrapers - Updated sources
// Sources: Reddit, Instagram, X (Twitter), Meta (Facebook), TikTok, YouTube
const ALL_SCRAPERS: BaseScraper[] = [
  redditScraper,
  instagramScraper,
  xScraper,
  metaScraper,
  tiktokScraper,
  youtubeScraper,
];

// Default keywords for beauty brand monitoring
const DEFAULT_KEYWORDS = [
  'lipstick',
  'foundation',
  'mascara',
  'concealer',
  'drugstore makeup',
  'makeup review',
  'beauty haul',
];

// Default brands to track
const DEFAULT_BRANDS = ['Revlon', 'e.l.f.', 'Maybelline', 'NYX'];

interface UnifiedScraperOptions {
  keywords?: string[];
  brands?: string[];
  sources?: string[];        // Filter to specific sources
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
}

export async function scrapeAllSources(
  options: UnifiedScraperOptions = {}
): Promise<UnifiedScraperResult> {
  const startTime = Date.now();
  const {
    keywords = DEFAULT_KEYWORDS,
    brands = DEFAULT_BRANDS,
    sources,
    maxResultsPerSource = 20, // Updated: max 20 per source
    daysBack = 30, // Updated: default to 30 days
    includeSentiment = true,
  } = options;

  // Filter to requested sources or use all
  const activeScrapers = sources
    ? ALL_SCRAPERS.filter(s => s.config.enabled && sources.includes(s.config.name))
    : ALL_SCRAPERS.filter(s => s.config.enabled);

  const allMentions: ScrapedMention[] = [];
  const errors: string[] = [];
  const bySource: { [source: string]: number } = {};

  // Run scrapers in parallel (with some grouping to avoid overwhelming)
  const scraperOptions: ScraperOptions = {
    keywords,
    brands,
    maxResults: maxResultsPerSource,
    daysBack,
  };

  // Run in batches of 2 to be respectful of rate limits
  for (let i = 0; i < activeScrapers.length; i += 2) {
    const batch = activeScrapers.slice(i, i + 2);
    const results = await Promise.all(
      batch.map(scraper => scraper.scrape(scraperOptions).catch(err => ({
        source: scraper.config.name,
        success: false,
        mentions: [],
        error: String(err),
        scrapedAt: new Date().toISOString(),
        duration: 0,
      } as ScraperResult)))
    );

    for (const result of results) {
      bySource[result.source] = result.mentions.length;
      allMentions.push(...result.mentions);
      if (result.error) {
        errors.push(`${result.source}: ${result.error}`);
      }
    }

    // Small delay between batches
    if (i + 2 < activeScrapers.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Global de-duplication across all sources
  const uniqueMentions = deduplicateGlobal(allMentions);

  // Add sentiment analysis if enabled
  let mentionsWithSentiment = uniqueMentions;
  if (includeSentiment && process.env.OPENAI_API_KEY) {
    mentionsWithSentiment = await addSentimentAnalysis(uniqueMentions, brands[0] || 'Revlon');
  }

  // Calculate sentiment distribution
  const bySentiment = {
    positive: mentionsWithSentiment.filter(m => m.sentiment?.label === 'positive').length,
    neutral: mentionsWithSentiment.filter(m => !m.sentiment || m.sentiment.label === 'neutral').length,
    negative: mentionsWithSentiment.filter(m => m.sentiment?.label === 'negative').length,
  };

  // Sort by engagement and recency
  mentionsWithSentiment.sort((a, b) => {
    // High engagement first
    if (a.isHighEngagement && !b.isHighEngagement) return -1;
    if (!a.isHighEngagement && b.isHighEngagement) return 1;
    // Then by date
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Limit to max 20 total mentions
  const limitedMentions = mentionsWithSentiment.slice(0, 20);

  return {
    success: errors.length < activeScrapers.length,
    totalMentions: limitedMentions.length,
    mentions: limitedMentions,
    bySource,
    bySentiment,
    errors,
    duration: Date.now() - startTime,
    scrapedAt: new Date().toISOString(),
  };
}

// De-duplicate mentions across all sources
function deduplicateGlobal(mentions: ScrapedMention[]): ScrapedMention[] {
  const seen = new Map<string, ScrapedMention>();

  for (const mention of mentions) {
    const existing = seen.get(mention.contentHash);

    // Keep the one with better engagement or more recent
    if (!existing) {
      seen.set(mention.contentHash, mention);
    } else {
      const existingScore = (existing.engagement.upvotes || 0) + (existing.engagement.comments || 0);
      const newScore = (mention.engagement.upvotes || 0) + (mention.engagement.comments || 0);

      if (newScore > existingScore) {
        seen.set(mention.contentHash, mention);
      }
    }
  }

  return Array.from(seen.values());
}

// Add sentiment analysis to mentions
async function addSentimentAnalysis(
  mentions: ScrapedMention[],
  brand: string
): Promise<ScrapedMention[]> {
  // Process in batches to avoid rate limits
  const batchSize = 10;
  const results: ScrapedMention[] = [];

  for (let i = 0; i < mentions.length; i += batchSize) {
    const batch = mentions.slice(i, i + batchSize);

    const analyzed = await Promise.all(
      batch.map(async (mention) => {
        try {
          const text = `${mention.title} ${mention.snippet}`.slice(0, 500);
          const sentiment = await analyzeSentiment(text, brand);
          return { ...mention, sentiment };
        } catch {
          return { ...mention, sentiment: { label: 'neutral' as const, score: 0 } };
        }
      })
    );

    results.push(...analyzed);

    // Small delay between batches
    if (i + batchSize < mentions.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

// Get list of available sources
export function getAvailableSources(): { name: string; enabled: boolean; sourceType: string }[] {
  return ALL_SCRAPERS.map(s => ({
    name: s.config.name,
    enabled: s.config.enabled,
    sourceType: s.config.sourceType,
  }));
}

// Quick scrape for a single source
export async function scrapeSingleSource(
  sourceName: string,
  options: Omit<UnifiedScraperOptions, 'sources'>
): Promise<ScraperResult | null> {
  const scraper = ALL_SCRAPERS.find(s => s.config.name === sourceName);
  if (!scraper) return null;

  return scraper.scrape({
    keywords: options.keywords || DEFAULT_KEYWORDS,
    brands: options.brands || DEFAULT_BRANDS,
    maxResults: options.maxResultsPerSource || 20,
    daysBack: options.daysBack || 30,
  });
}

// Generate mock data for demo purposes - Updated with new sources
export function getMockScrapedMentions(): ScrapedMention[] {
  const now = new Date();

  return [
    // Reddit mentions
    {
      id: 'mock-reddit-1',
      source: 'Reddit',
      sourceType: 'social',
      url: 'https://reddit.com/r/MakeupAddiction/comments/example1',
      title: 'Just tried the new Revlon ColorStay foundation and WOW',
      snippet: 'I\'ve been searching for a good drugstore foundation and finally tried Revlon ColorStay. The coverage is amazing and it lasted all day without oxidizing...',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 234, comments: 45 },
      author: 'makeup_lover92',
      subreddit: 'MakeupAddiction',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon colorstay foundation'),
      sentiment: { label: 'positive', score: 0.78 },
    },
    {
      id: 'mock-reddit-2',
      source: 'Reddit',
      sourceType: 'social',
      url: 'https://reddit.com/r/drugstoreMUA/comments/example2',
      title: 'e.l.f. Power Grip Primer vs Milk Hydrogrip - my honest comparison',
      snippet: 'After testing both for a month, here\'s my take on the e.l.f. Power Grip primer. It\'s genuinely as good as the Milk version at a fraction of the price...',
      matchedKeyword: 'e.l.f.',
      publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 512, comments: 89 },
      author: 'budget_beauty',
      subreddit: 'drugstoreMUA',
      isHighEngagement: true,
      contentHash: generateContentHash('elf power grip primer'),
      sentiment: { label: 'positive', score: 0.85 },
    },
    // Instagram mentions
    {
      id: 'mock-instagram-1',
      source: 'Instagram',
      sourceType: 'social',
      url: 'https://instagram.com/p/example1',
      title: 'Revlon One-Step Hair Dryer Tutorial',
      snippet: 'Obsessed with my new Revlon One-Step Hair Dryer! Perfect salon blowout at home in 15 minutes. Game changer for busy mornings... #revlon #hairstyle',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 1520, comments: 87 },
      author: '@beautyinfluencer',
      category: 'Instagram',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon one step hair dryer instagram'),
      sentiment: { label: 'positive', score: 0.92 },
    },
    {
      id: 'mock-instagram-2',
      source: 'Instagram',
      sourceType: 'social',
      url: 'https://instagram.com/p/example2',
      title: 'e.l.f. Halo Glow Review',
      snippet: 'The viral e.l.f. Halo Glow lives up to the hype! Dewy finish without looking greasy. Perfect for the clean girl aesthetic... #elfcosmetics #haloglow',
      matchedKeyword: 'e.l.f.',
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 3400, comments: 156 },
      author: '@skincarebabe',
      category: 'Instagram',
      isHighEngagement: true,
      contentHash: generateContentHash('elf halo glow instagram'),
      sentiment: { label: 'positive', score: 0.88 },
    },
    // X (Twitter) mentions
    {
      id: 'mock-x-1',
      source: 'X',
      sourceType: 'social',
      url: 'https://x.com/user/status/example1',
      title: 'Maybelline Sky High Mascara thoughts',
      snippet: 'Finally tried the Maybelline Sky High mascara everyone\'s been talking about. It\'s good but not life changing? Maybe I hyped it up too much. Still prefer my Essence...',
      matchedKeyword: 'Maybelline',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 89, comments: 23 },
      author: '@beautytweeter',
      category: 'X (Twitter)',
      isHighEngagement: false,
      contentHash: generateContentHash('maybelline sky high x'),
      sentiment: { label: 'neutral', score: 0.05 },
    },
    {
      id: 'mock-x-2',
      source: 'X',
      sourceType: 'social',
      url: 'https://x.com/user/status/example2',
      title: 'NYX Butter Gloss appreciation post',
      snippet: 'NYX Butter Gloss is the GOAT of lip glosses and I will die on this hill. $5 for the perfect non-sticky formula?? Unmatched.',
      matchedKeyword: 'NYX',
      publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 456, comments: 67 },
      author: '@makeupqueen',
      category: 'X (Twitter)',
      isHighEngagement: true,
      contentHash: generateContentHash('nyx butter gloss x'),
      sentiment: { label: 'positive', score: 0.95 },
    },
    // Meta (Facebook) mentions
    {
      id: 'mock-meta-1',
      source: 'Meta',
      sourceType: 'social',
      url: 'https://facebook.com/groups/example/posts/123',
      title: 'Revlon Super Lustrous Lipstick Swatches',
      snippet: 'Sharing swatches of my Revlon Super Lustrous collection! These are such underrated lipsticks. The formula is creamy and the shades are beautiful...',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 234, comments: 45 },
      author: 'Makeup Lovers Group',
      category: 'Facebook',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon super lustrous facebook'),
      sentiment: { label: 'positive', score: 0.72 },
    },
    {
      id: 'mock-meta-2',
      source: 'Meta',
      sourceType: 'social',
      url: 'https://facebook.com/groups/example/posts/456',
      title: 'Disappointed with e.l.f. purchase',
      snippet: 'Bought the e.l.f. Camo Concealer based on recommendations but it oxidized so badly on my skin. Has anyone else had this issue? Looking for alternatives...',
      matchedKeyword: 'e.l.f.',
      publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 56, comments: 89 },
      author: 'Budget Beauty Tips',
      category: 'Facebook',
      isHighEngagement: false,
      contentHash: generateContentHash('elf camo concealer facebook'),
      sentiment: { label: 'negative', score: -0.45 },
    },
    // TikTok mentions
    {
      id: 'mock-tiktok-1',
      source: 'TikTok',
      sourceType: 'social',
      url: 'https://tiktok.com/@beautycreator/video/example1',
      title: 'GRWM using only Revlon products',
      snippet: 'Get ready with me using only drugstore Revlon makeup! The ColorStay foundation + Super Lustrous lip combo is *chefs kiss* 💋 #revlon #drugstoremakeup #grwm',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 45000, comments: 892, views: 520000 },
      author: '@beautyontiktok',
      category: 'TikTok',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon grwm tiktok'),
      sentiment: { label: 'positive', score: 0.88 },
    },
    {
      id: 'mock-tiktok-2',
      source: 'TikTok',
      sourceType: 'social',
      url: 'https://tiktok.com/@makeuphacks/video/example2',
      title: 'e.l.f. dupes that are BETTER than the originals',
      snippet: 'POV: You discover e.l.f. makes better versions of high-end products for $6. The Poreless Putty Primer is identical to Tatcha!! #elfcosmetics #makeupdupes',
      matchedKeyword: 'e.l.f.',
      publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 128000, comments: 2340, views: 1800000 },
      author: '@makeuphacks',
      category: 'TikTok',
      isHighEngagement: true,
      contentHash: generateContentHash('elf dupes tiktok'),
      sentiment: { label: 'positive', score: 0.92 },
    },
    // YouTube mentions
    {
      id: 'mock-youtube-1',
      source: 'YouTube',
      sourceType: 'social',
      url: 'https://youtube.com/watch?v=example1',
      title: 'HONEST Revlon ColorStay Foundation Review | 12 Hour Wear Test',
      snippet: 'Testing the viral Revlon ColorStay foundation for a full 12 hours! Is it really worth the hype? Spoiler: I was SHOCKED by the results...',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 8900, comments: 456, views: 245000 },
      author: 'Beauty By Sarah',
      category: 'YouTube',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon colorstay youtube review'),
      sentiment: { label: 'positive', score: 0.75 },
    },
    {
      id: 'mock-youtube-2',
      source: 'YouTube',
      sourceType: 'social',
      url: 'https://youtube.com/watch?v=example2',
      title: 'Full Face of Maybelline | Drugstore Makeup Tutorial',
      snippet: 'Can you get a full glam look using ONLY Maybelline products? Today I\'m putting their entire line to the test including the new SuperStay foundations...',
      matchedKeyword: 'Maybelline',
      publishedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 12400, comments: 678, views: 389000 },
      author: 'Makeup Maven',
      category: 'YouTube',
      isHighEngagement: true,
      contentHash: generateContentHash('maybelline full face youtube'),
      sentiment: { label: 'positive', score: 0.68 },
    },
  ];
}
