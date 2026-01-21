import { NextRequest, NextResponse } from 'next/server';
import { braveSocialMentions, isBraveConfigured } from '@/lib/brave';
import { searchBrandVideos } from '@/lib/youtube';
import { searchBrandNews } from '@/lib/newsApi';
import { generateMockPosts } from '@/lib/mockData';
import { getCacheKey, getCache, getStaleCache, setCache } from '@/lib/cache';

interface Mention {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceType: 'youtube' | 'news' | 'reddit' | 'tiktok' | 'twitter' | 'brave' | 'mock';
  sourceIcon: string;
  author: string;
  score: number;
  numComments: number;
  sentiment: string;
  sentimentScore: number;
  matchedKeyword: string;
  createdAt: string;
  url: string;
  thumbnailUrl?: string;
}

// Brand + Category keywords for searching
const BRAND_CATEGORY_KEYWORDS: Record<string, Record<string, string[]>> = {
  'Babyliss': {
    'all': ['Babyliss', 'Babyliss Pro', 'Babyliss hair tools'],
    'hairdryers': ['Babyliss hair dryer', 'Babyliss blow dryer', 'Babyliss Pro dryer'],
    'straighteners': ['Babyliss straightener', 'Babyliss flat iron', 'Babyliss steam straight'],
    'curlingirons': ['Babyliss curling iron', 'Babyliss curler', 'Babyliss wand'],
    'hotairbrushes': ['Babyliss hot air brush', 'Babyliss air styler', 'Babyliss Big Hair'],
  },
  'Revlon': {
    'all': ['Revlon makeup', 'Revlon cosmetics', 'Revlon beauty'],
    'lipstick': ['Revlon lipstick', 'Revlon Super Lustrous', 'Revlon lip color'],
    'foundation': ['Revlon foundation', 'Revlon ColorStay', 'Revlon face makeup'],
    'eyemakeup': ['Revlon mascara', 'Revlon eyeshadow', 'Revlon eyeliner'],
    'nailpolish': ['Revlon nail polish', 'Revlon nail color', 'Revlon nails'],
  },
  'Weleda': {
    'all': ['Weleda skincare', 'Weleda natural', 'Weleda organic'],
    'facecare': ['Weleda Skin Food', 'Weleda face cream', 'Weleda facial oil'],
    'bodycare': ['Weleda body oil', 'Weleda body lotion', 'Weleda citrus body oil'],
    'babycare': ['Weleda baby', 'Weleda calendula baby', 'Weleda diaper cream'],
    'haircare': ['Weleda rosemary', 'Weleda hair oil', 'Weleda hair tonic'],
  },
};

// Helper to get keywords for brand + category
function getBrandKeywords(brand: string, category: string = 'all'): string[] {
  const brandKeywords = BRAND_CATEGORY_KEYWORDS[brand] || BRAND_CATEGORY_KEYWORDS['Revlon'];
  return brandKeywords[category] || brandKeywords['all'];
}

// Cache TTL: 2 hours for fresh data
const CACHE_TTL = 2 * 60 * 60 * 1000;

// Source icons
const SOURCE_ICONS: Record<string, string> = {
  'Reddit': '🔴',
  'TikTok': '🎵',
  'YouTube': '▶️',
  'Twitter': '𝕏',
  'Instagram': '📸',
  'News': '📰',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const sentiment = searchParams.get('sentiment');
    const source = searchParams.get('source'); // youtube, news, reddit, tiktok, twitter, all
    const brand = searchParams.get('brand') || 'Revlon';
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const useMock = searchParams.get('mock') === 'true';

    const mentions: Mention[] = [];
    const sources: string[] = [];
    const cachedSources: string[] = [];
    const keywords = getBrandKeywords(brand, category);

    // If explicitly requesting mock data, return mock
    if (useMock) {
      return getMockResponse(days, sentiment, limit, offset, brand, category);
    }

    // Determine freshness based on days
    const freshness = days <= 1 ? 'pd' : days <= 7 ? 'pw' : 'pm';

    // Fetch from Brave Search API (covers Reddit, TikTok, YouTube, Twitter)
    if (isBraveConfigured() && (!source || source === 'all' || ['reddit', 'tiktok', 'youtube', 'twitter'].includes(source))) {
      const cacheKey = getCacheKey('brave-social', `${brand}-${days}`);
      let braveMentions = getCache<Mention[]>(cacheKey);

      if (!braveMentions) {
        try {
          const result = await braveSocialMentions(brand, keywords.slice(0, 2), { freshness });

          if (result.mentions.length > 0) {
            braveMentions = result.mentions.map((m, index) => ({
              id: `brave_${m.platform.toLowerCase()}_${index}`,
              title: m.title,
              body: m.snippet || '',
              source: m.platform,
              sourceType: 'brave' as const,
              sourceIcon: SOURCE_ICONS[m.platform] || '🌐',
              author: extractAuthor(m.url, m.platform),
              score: estimateEngagement(m.platform, index),
              numComments: Math.floor(estimateEngagement(m.platform, index) * 0.1),
              sentiment: 'neutral',
              sentimentScore: 0,
              matchedKeyword: brand,
              createdAt: parseRelativeDate(m.date),
              url: m.url,
              thumbnailUrl: undefined,
            }));

            setCache(cacheKey, braveMentions, CACHE_TTL);

            // Track which platforms we found
            const foundPlatforms = [...new Set(result.mentions.map(m => m.platform.toLowerCase()))];
            sources.push(...foundPlatforms);
          }
        } catch (err) {
          console.error('Brave fetch error:', err);
          braveMentions = getStaleCache<Mention[]>(cacheKey);
          if (braveMentions) cachedSources.push('brave');
        }
      } else {
        cachedSources.push('brave');
      }

      if (braveMentions && braveMentions.length > 0) {
        // Filter by specific source if requested
        if (source && source !== 'all') {
          const filtered = braveMentions.filter(m =>
            m.source.toLowerCase() === source.toLowerCase()
          );
          mentions.push(...filtered);
        } else {
          mentions.push(...braveMentions);
        }
      }
    }

    // Fetch from YouTube if API key is configured
    if (process.env.YOUTUBE_API_KEY && (!source || source === 'all' || source === 'youtube')) {
      const cacheKey = getCacheKey('youtube', brand);
      let ytMentions = getCache<Mention[]>(cacheKey);

      if (!ytMentions) {
        try {
          const videos = await searchBrandVideos(keywords, days);

          if (videos && videos.length > 0) {
            ytMentions = videos.map((video: any) => ({
              id: `yt_${video.id}`,
              title: video.title,
              body: video.description?.substring(0, 200) || '',
              source: video.channelTitle || 'YouTube',
              sourceType: 'youtube' as const,
              sourceIcon: '▶️',
              author: video.channelTitle || 'Unknown',
              score: video.viewCount || 0,
              numComments: video.commentCount || 0,
              sentiment: video.sentiment?.label || 'neutral',
              sentimentScore: video.sentiment?.score || 0,
              matchedKeyword: keywords[0],
              createdAt: video.publishedAt,
              url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
              thumbnailUrl: video.thumbnailUrl,
            }));
            setCache(cacheKey, ytMentions, CACHE_TTL);
          }
        } catch (err) {
          console.error('YouTube fetch error:', err);
          ytMentions = getStaleCache<Mention[]>(cacheKey);
          if (ytMentions) cachedSources.push('youtube');
        }
      } else {
        cachedSources.push('youtube');
      }

      if (ytMentions && ytMentions.length > 0) {
        // Avoid duplicates if already fetched from Brave
        const existingYtUrls = new Set(mentions.filter(m => m.sourceType === 'youtube' || m.source === 'YouTube').map(m => m.url));
        const newYtMentions = ytMentions.filter(m => !existingYtUrls.has(m.url));
        if (newYtMentions.length > 0) {
          sources.push('youtube');
          mentions.push(...newYtMentions);
        }
      }
    }

    // Fetch from News API if API key is configured
    if (process.env.NEWS_API_KEY && (!source || source === 'all' || source === 'news')) {
      const cacheKey = getCacheKey('news', brand);
      let newsMentions = getCache<Mention[]>(cacheKey);

      if (!newsMentions) {
        try {
          const articles = await searchBrandNews(keywords, days);

          if (articles && articles.length > 0) {
            newsMentions = articles.map((article: any) => ({
              id: `news_${Buffer.from(article.url).toString('base64').substring(0, 20)}`,
              title: article.title,
              body: article.description || '',
              source: article.source?.name || 'News',
              sourceType: 'news' as const,
              sourceIcon: '📰',
              author: article.author || article.source?.name || 'Unknown',
              score: 0,
              numComments: 0,
              sentiment: article.sentiment?.label || 'neutral',
              sentimentScore: article.sentiment?.score || 0,
              matchedKeyword: brand,
              createdAt: article.publishedAt,
              url: article.url,
              thumbnailUrl: article.urlToImage,
            }));
            setCache(cacheKey, newsMentions, CACHE_TTL);
          }
        } catch (err) {
          console.error('News fetch error:', err);
          newsMentions = getStaleCache<Mention[]>(cacheKey);
          if (newsMentions) cachedSources.push('news');
        }
      } else {
        cachedSources.push('news');
      }

      if (newsMentions && newsMentions.length > 0) {
        sources.push('news');
        mentions.push(...newsMentions);
      }
    }

    // If no real data was fetched, fall back to mock
    if (mentions.length === 0) {
      return getMockResponse(days, sentiment, limit, offset, brand, category);
    }

    // Sort by date (newest first)
    mentions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter by sentiment if specified
    let filteredMentions = mentions;
    if (sentiment) {
      filteredMentions = mentions.filter(m => m.sentiment === sentiment);
    }

    const total = filteredMentions.length;
    const paginatedMentions = filteredMentions.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        mentions: paginatedMentions,
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      },
      sources: [...new Set(sources)],
      cachedSources,
      isLiveData: true,
    });
  } catch (error) {
    console.error('Mentions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
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

// Helper: Estimate engagement based on platform and ranking
function estimateEngagement(platform: string, rank: number): number {
  const baseEngagement = Math.max(1000, 10000 - rank * 1000);

  switch (platform.toLowerCase()) {
    case 'tiktok':
      return baseEngagement * 5;
    case 'youtube':
      return baseEngagement;
    case 'reddit':
      return Math.floor(baseEngagement * 0.5);
    case 'twitter':
      return Math.floor(baseEngagement * 0.3);
    default:
      return Math.floor(baseEngagement * 0.2);
  }
}

function getMockResponse(days: number, sentiment: string | null, limit: number, offset: number, brand: string = 'Revlon', category: string = 'all') {
  let mockPosts = generateMockPosts(100, days, brand, category);

  if (sentiment) {
    mockPosts = mockPosts.filter(p => p.sentiment === sentiment);
  }

  const total = mockPosts.length;
  const paginatedPosts = mockPosts.slice(offset, offset + limit);

  const mentions = paginatedPosts.map(p => ({
    id: p.id,
    title: p.title,
    body: p.body,
    source: p.source,
    sourceType: 'mock' as const,
    sourceIcon: p.sourceIcon,
    author: p.author,
    score: p.score,
    numComments: p.numComments,
    sentiment: p.sentiment,
    sentimentScore: p.sentimentScore,
    matchedKeyword: p.matchedKeyword,
    createdAt: p.createdUtc.toISOString(),
    url: '#mock-data',
    thumbnailUrl: undefined,
  }));

  return NextResponse.json({
    success: true,
    data: {
      mentions,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    },
    sources: ['mock'],
    cachedSources: [],
    isLiveData: false,
  });
}
