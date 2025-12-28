import { NextRequest, NextResponse } from 'next/server';
import {
  scrapeAllSources,
  getAvailableSources,
  getMockScrapedMentions,
  ScrapedMention,
} from '@/lib/scrapers';

// GET - Fetch scraped mentions (uses mock data in demo mode)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const useLive = searchParams.get('live') === 'true';
    const sources = searchParams.get('sources')?.split(',');
    const brands = searchParams.get('brands')?.split(',') || ['Revlon', 'e.l.f.', 'Maybelline'];
    const keywords = searchParams.get('keywords')?.split(',');
    const daysBack = parseInt(searchParams.get('days') || '7', 10);
    const maxResults = parseInt(searchParams.get('max') || '50', 10);

    // For demo/development, use mock data unless explicitly requesting live scraping
    if (!useLive) {
      const mockMentions = getMockScrapedMentions();

      // Filter by source if specified
      let filteredMentions = sources
        ? mockMentions.filter(m => sources.includes(m.source))
        : mockMentions;

      // Filter by brand if specified
      if (brands.length > 0) {
        filteredMentions = filteredMentions.filter(m =>
          brands.some(b =>
            m.matchedKeyword.toLowerCase().includes(b.toLowerCase()) ||
            m.title.toLowerCase().includes(b.toLowerCase()) ||
            m.snippet.toLowerCase().includes(b.toLowerCase())
          )
        );
      }

      return NextResponse.json({
        success: true,
        source: 'mock',
        data: {
          mentions: filteredMentions,
          totalMentions: filteredMentions.length,
          bySource: countBySource(filteredMentions),
          bySentiment: countBySentiment(filteredMentions),
          availableSources: getAvailableSources(),
        },
      });
    }

    // Live scraping (slower, makes real HTTP requests)
    const result = await scrapeAllSources({
      brands,
      keywords: keywords || undefined,
      sources,
      maxResultsPerSource: Math.ceil(maxResults / 5),
      daysBack,
      includeSentiment: true,
    });

    return NextResponse.json({
      success: result.success,
      source: 'live',
      data: {
        mentions: result.mentions.slice(0, maxResults),
        totalMentions: result.totalMentions,
        bySource: result.bySource,
        bySentiment: result.bySentiment,
        availableSources: getAvailableSources(),
        duration: result.duration,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scraped mentions',
        data: {
          mentions: getMockScrapedMentions(),
          totalMentions: 7,
          bySource: { Reddit: 3, Temptalia: 1, MakeupAlley: 1, Allure: 1, 'Into The Gloss': 1 },
          bySentiment: { positive: 5, neutral: 2, negative: 0 },
          availableSources: getAvailableSources(),
        },
      },
      { status: 500 }
    );
  }
}

// POST - Trigger a new scrape (for manual refresh)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brands, keywords, sources, daysBack = 7 } = body;

    const result = await scrapeAllSources({
      brands: brands || ['Revlon', 'e.l.f.', 'Maybelline'],
      keywords,
      sources,
      daysBack,
      includeSentiment: true,
    });

    return NextResponse.json({
      success: result.success,
      data: {
        mentions: result.mentions,
        totalMentions: result.totalMentions,
        bySource: result.bySource,
        bySentiment: result.bySentiment,
        duration: result.duration,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Scrape POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Scrape failed' },
      { status: 500 }
    );
  }
}

// Helper functions
function countBySource(mentions: ScrapedMention[]): { [key: string]: number } {
  const counts: { [key: string]: number } = {};
  for (const m of mentions) {
    counts[m.source] = (counts[m.source] || 0) + 1;
  }
  return counts;
}

function countBySentiment(mentions: ScrapedMention[]): { positive: number; neutral: number; negative: number } {
  return {
    positive: mentions.filter(m => m.sentiment?.label === 'positive').length,
    neutral: mentions.filter(m => !m.sentiment || m.sentiment.label === 'neutral').length,
    negative: mentions.filter(m => m.sentiment?.label === 'negative').length,
  };
}
