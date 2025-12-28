// Unified Scraper Service
// Orchestrates all scrapers and handles de-duplication + sentiment analysis

import { redditScraper } from './reddit';
import { makeupAlleyScraper } from './makeupalley';
import { temptaliaScraper, intoTheGlossScraper, allureScraper } from './blogs';
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

// All available scrapers
const ALL_SCRAPERS: BaseScraper[] = [
  redditScraper,
  makeupAlleyScraper,
  temptaliaScraper,
  intoTheGlossScraper,
  allureScraper,
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
    maxResultsPerSource = 30,
    daysBack = 7,
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

  return {
    success: errors.length < activeScrapers.length,
    totalMentions: mentionsWithSentiment.length,
    mentions: mentionsWithSentiment,
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
    maxResults: options.maxResultsPerSource || 30,
    daysBack: options.daysBack || 7,
  });
}

// Generate mock data for demo purposes
export function getMockScrapedMentions(): ScrapedMention[] {
  const now = new Date();

  return [
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
    {
      id: 'mock-temptalia-1',
      source: 'Temptalia',
      sourceType: 'blog',
      url: 'https://www.temptalia.com/revlon-colorstay-review',
      title: 'Revlon ColorStay Foundation Review & Swatches',
      snippet: 'Revlon\'s ColorStay Foundation has been a drugstore staple for years. In this review, I\'ll break down the formula, coverage, and how it performs throughout the day...',
      matchedKeyword: 'Revlon',
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { comments: 28 },
      category: 'Beauty Review',
      isHighEngagement: true,
      contentHash: generateContentHash('revlon colorstay review temptalia'),
      sentiment: { label: 'neutral', score: 0.15 },
    },
    {
      id: 'mock-makeupalley-1',
      source: 'MakeupAlley',
      sourceType: 'review',
      url: 'https://www.makeupalley.com/product/showreview.asp/example',
      title: 'Maybelline Sky High Mascara - Mixed Feelings',
      snippet: 'I wanted to love this mascara so much based on all the hype. While it does give length, I found it clumps after a few coats and smudges by mid-day...',
      matchedKeyword: 'Maybelline',
      publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 75, comments: 12 },
      category: 'Product Review',
      isHighEngagement: true,
      contentHash: generateContentHash('maybelline sky high mascara'),
      sentiment: { label: 'neutral', score: -0.1 },
    },
    {
      id: 'mock-reddit-3',
      source: 'Reddit',
      sourceType: 'social',
      url: 'https://reddit.com/r/BeautyGuruChatter/comments/example3',
      title: 'NYX Butter Gloss vs Fenty Gloss Bomb - drugstore dupe?',
      snippet: 'I picked up the NYX Butter Gloss after someone said it was a dupe for Fenty. It\'s definitely not the same formula but for the price it\'s a solid option...',
      matchedKeyword: 'NYX',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: { upvotes: 156, comments: 34 },
      author: 'glossy_girl',
      subreddit: 'BeautyGuruChatter',
      isHighEngagement: true,
      contentHash: generateContentHash('nyx butter gloss fenty'),
      sentiment: { label: 'positive', score: 0.52 },
    },
    {
      id: 'mock-allure-1',
      source: 'Allure',
      sourceType: 'blog',
      url: 'https://www.allure.com/story/best-drugstore-foundations',
      title: 'The 15 Best Drugstore Foundations According to Makeup Artists',
      snippet: 'Makeup artists share their favorite affordable foundations, including picks from Revlon, Maybelline, and e.l.f. that rival high-end formulas...',
      matchedKeyword: 'drugstore makeup',
      publishedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: {},
      category: 'Beauty Magazine',
      isHighEngagement: false,
      contentHash: generateContentHash('best drugstore foundations allure'),
      sentiment: { label: 'positive', score: 0.65 },
    },
    {
      id: 'mock-itg-1',
      source: 'Into The Gloss',
      sourceType: 'blog',
      url: 'https://intothegloss.com/drugstore-beauty-finds',
      title: 'The Drugstore Beauty Products We Actually Use',
      snippet: 'From the e.l.f. Camo Concealer to the Revlon One-Step Hair Dryer, these are the affordable products that have earned permanent spots in our routines...',
      matchedKeyword: 'e.l.f.',
      publishedAt: new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString(),
      scrapedAt: now.toISOString(),
      engagement: {},
      author: 'ITG Editors',
      category: 'Beauty Editorial',
      isHighEngagement: false,
      contentHash: generateContentHash('drugstore beauty into the gloss'),
      sentiment: { label: 'positive', score: 0.72 },
    },
  ];
}
