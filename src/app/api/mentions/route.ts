import { NextRequest, NextResponse } from 'next/server';
import { searchBrandVideos } from '@/lib/youtube';
import { searchBrandNews } from '@/lib/newsApi';
import { redditScraper } from '@/lib/scrapers/reddit';
import { tiktokScraper } from '@/lib/scrapers/tiktok';
import { temptaliaScraper, makeupAlleyScraper } from '@/lib/scrapers/blogs';
import { generateMockPosts } from '@/lib/mockData';
import { getCacheKey, getCache, getStaleCache, setCache } from '@/lib/cache';

interface Mention {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceType: 'youtube' | 'news' | 'reddit' | 'tiktok' | 'temptalia' | 'makeupalley' | 'mock';
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

// Brand keywords for searching
const BRAND_KEYWORDS: Record<string, string[]> = {
  'Revlon': ['Revlon makeup', 'Revlon lipstick', 'Revlon ColorStay', 'Revlon foundation'],
  'e.l.f.': ['elf cosmetics', 'elf makeup', 'elf halo glow', 'elf primer'],
  'Maybelline': ['Maybelline mascara', 'Maybelline foundation', 'Maybelline sky high'],
};

// Cache TTL: 2 hours for fresh data
const CACHE_TTL = 2 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const sentiment = searchParams.get('sentiment');
    const source = searchParams.get('source'); // youtube, news, reddit, all
    const brand = searchParams.get('brand') || 'Revlon';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const useMock = searchParams.get('mock') === 'true';

    const mentions: Mention[] = [];
    const sources: string[] = [];
    const cachedSources: string[] = [];
    const keywords = BRAND_KEYWORDS[brand] || BRAND_KEYWORDS['Revlon'];

    // If explicitly requesting mock data, return mock
    if (useMock) {
      return getMockResponse(days, sentiment, limit, offset);
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
          // Try stale cache on error
          ytMentions = getStaleCache<Mention[]>(cacheKey);
          if (ytMentions) cachedSources.push('youtube');
        }
      } else {
        cachedSources.push('youtube');
      }

      if (ytMentions && ytMentions.length > 0) {
        sources.push('youtube');
        mentions.push(...ytMentions);
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

    // Fetch from Reddit via Google Custom Search
    if (!source || source === 'all' || source === 'reddit') {
      const cacheKey = getCacheKey('reddit', brand);
      let redditMentions = getCache<Mention[]>(cacheKey);

      if (!redditMentions) {
        try {
          const redditResult = await redditScraper.scrape({
            keywords: [brand],
            brands: [],
            maxResults: 20,
            daysBack: days,
          });

          if (redditResult.success && redditResult.mentions.length > 0) {
            redditMentions = redditResult.mentions.map((post) => ({
              id: `reddit_${post.id}`,
              title: post.title,
              body: post.snippet || post.fullText?.substring(0, 200) || '',
              source: `r/${post.subreddit}`,
              sourceType: 'reddit' as const,
              sourceIcon: '🔴',
              author: post.author || 'Unknown',
              score: post.engagement.upvotes || 0,
              numComments: post.engagement.comments || 0,
              sentiment: 'neutral',
              sentimentScore: 0,
              matchedKeyword: post.matchedKeyword,
              createdAt: post.publishedAt,
              url: post.url,
              thumbnailUrl: undefined,
            }));
            setCache(cacheKey, redditMentions, CACHE_TTL);
          } else if (redditResult.error) {
            console.warn('Reddit fetch warning:', redditResult.error);
            // Try stale cache on error
            redditMentions = getStaleCache<Mention[]>(cacheKey);
            if (redditMentions) cachedSources.push('reddit');
          }
        } catch (err) {
          console.error('Reddit fetch error:', err);
          redditMentions = getStaleCache<Mention[]>(cacheKey);
          if (redditMentions) cachedSources.push('reddit');
        }
      } else {
        cachedSources.push('reddit');
      }

      if (redditMentions && redditMentions.length > 0) {
        sources.push('reddit');
        mentions.push(...redditMentions);
      }
    }

    // Fetch from TikTok via Google Custom Search
    if (!source || source === 'all' || source === 'tiktok') {
      const cacheKey = getCacheKey('tiktok', brand);
      let tiktokMentions = getCache<Mention[]>(cacheKey);

      if (!tiktokMentions) {
        try {
          const tiktokResult = await tiktokScraper.scrape({
            keywords: [brand],
            brands: [],
            maxResults: 20,
            daysBack: days,
          });

          if (tiktokResult.success && tiktokResult.mentions.length > 0) {
            tiktokMentions = tiktokResult.mentions.map((post) => ({
              id: `tiktok_${post.id}`,
              title: post.title,
              body: post.snippet || post.fullText?.substring(0, 200) || '',
              source: 'TikTok',
              sourceType: 'tiktok' as const,
              sourceIcon: '🎵',
              author: post.author || 'Unknown',
              score: post.engagement.upvotes || 0,
              numComments: post.engagement.comments || 0,
              sentiment: 'neutral',
              sentimentScore: 0,
              matchedKeyword: post.matchedKeyword,
              createdAt: post.publishedAt,
              url: post.url,
              thumbnailUrl: undefined,
            }));
            setCache(cacheKey, tiktokMentions, CACHE_TTL);
          } else if (tiktokResult.error) {
            console.warn('TikTok fetch warning:', tiktokResult.error);
            // Try stale cache on error
            tiktokMentions = getStaleCache<Mention[]>(cacheKey);
            if (tiktokMentions) cachedSources.push('tiktok');
          }
        } catch (err) {
          console.error('TikTok fetch error:', err);
          tiktokMentions = getStaleCache<Mention[]>(cacheKey);
          if (tiktokMentions) cachedSources.push('tiktok');
        }
      } else {
        cachedSources.push('tiktok');
      }

      if (tiktokMentions && tiktokMentions.length > 0) {
        sources.push('tiktok');
        mentions.push(...tiktokMentions);
      }
    }

    // Fetch from Temptalia (beauty blog)
    if (!source || source === 'all' || source === 'temptalia') {
      const cacheKey = getCacheKey('temptalia', brand);
      let temptaliaMentions = getCache<Mention[]>(cacheKey);

      if (!temptaliaMentions) {
        try {
          const temptaliaResult = await temptaliaScraper.scrape({
            keywords: [brand],
            brands: [],
            maxResults: 15,
            daysBack: days,
          });

          if (temptaliaResult.success && temptaliaResult.mentions.length > 0) {
            temptaliaMentions = temptaliaResult.mentions.map((post) => ({
              id: `temptalia_${post.id}`,
              title: post.title,
              body: post.snippet || post.fullText?.substring(0, 200) || '',
              source: 'Temptalia',
              sourceType: 'temptalia' as const,
              sourceIcon: '💋',
              author: 'Temptalia',
              score: 0,
              numComments: post.engagement.comments || 0,
              sentiment: 'neutral',
              sentimentScore: 0,
              matchedKeyword: post.matchedKeyword,
              createdAt: post.publishedAt,
              url: post.url,
              thumbnailUrl: undefined,
            }));
            setCache(cacheKey, temptaliaMentions, CACHE_TTL);
          } else if (temptaliaResult.error) {
            console.warn('Temptalia fetch warning:', temptaliaResult.error);
            temptaliaMentions = getStaleCache<Mention[]>(cacheKey);
            if (temptaliaMentions) cachedSources.push('temptalia');
          }
        } catch (err) {
          console.error('Temptalia fetch error:', err);
          temptaliaMentions = getStaleCache<Mention[]>(cacheKey);
          if (temptaliaMentions) cachedSources.push('temptalia');
        }
      } else {
        cachedSources.push('temptalia');
      }

      if (temptaliaMentions && temptaliaMentions.length > 0) {
        sources.push('temptalia');
        mentions.push(...temptaliaMentions);
      }
    }

    // Fetch from MakeupAlley (reviews)
    if (!source || source === 'all' || source === 'makeupalley') {
      const cacheKey = getCacheKey('makeupalley', brand);
      let makeupAlleyMentions = getCache<Mention[]>(cacheKey);

      if (!makeupAlleyMentions) {
        try {
          const makeupAlleyResult = await makeupAlleyScraper.scrape({
            keywords: [brand],
            brands: [],
            maxResults: 15,
            daysBack: days,
          });

          if (makeupAlleyResult.success && makeupAlleyResult.mentions.length > 0) {
            makeupAlleyMentions = makeupAlleyResult.mentions.map((post) => ({
              id: `makeupalley_${post.id}`,
              title: post.title,
              body: post.snippet || post.fullText?.substring(0, 200) || '',
              source: 'MakeupAlley',
              sourceType: 'makeupalley' as const,
              sourceIcon: '💄',
              author: post.author || 'MakeupAlley User',
              score: post.engagement.upvotes || 0,
              numComments: post.engagement.comments || 0,
              sentiment: 'neutral',
              sentimentScore: 0,
              matchedKeyword: post.matchedKeyword,
              createdAt: post.publishedAt,
              url: post.url,
              thumbnailUrl: undefined,
            }));
            setCache(cacheKey, makeupAlleyMentions, CACHE_TTL);
          } else if (makeupAlleyResult.error) {
            console.warn('MakeupAlley fetch warning:', makeupAlleyResult.error);
            makeupAlleyMentions = getStaleCache<Mention[]>(cacheKey);
            if (makeupAlleyMentions) cachedSources.push('makeupalley');
          }
        } catch (err) {
          console.error('MakeupAlley fetch error:', err);
          makeupAlleyMentions = getStaleCache<Mention[]>(cacheKey);
          if (makeupAlleyMentions) cachedSources.push('makeupalley');
        }
      } else {
        cachedSources.push('makeupalley');
      }

      if (makeupAlleyMentions && makeupAlleyMentions.length > 0) {
        sources.push('makeupalley');
        mentions.push(...makeupAlleyMentions);
      }
    }

    // If no real data was fetched, fall back to mock
    if (mentions.length === 0) {
      return getMockResponse(days, sentiment, limit, offset);
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
      sources,
      cachedSources, // Show which sources came from cache
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

function getMockResponse(days: number, sentiment: string | null, limit: number, offset: number) {
  let mockPosts = generateMockPosts(100, days);

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
