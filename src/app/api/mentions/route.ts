import { NextRequest, NextResponse } from 'next/server';
import { searchBrandVideos } from '@/lib/youtube';
import { searchBrandNews } from '@/lib/newsApi';
import { generateMockPosts } from '@/lib/mockData';

interface Mention {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceType: 'youtube' | 'news' | 'reddit' | 'mock';
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
    const keywords = BRAND_KEYWORDS[brand] || BRAND_KEYWORDS['Revlon'];

    // If explicitly requesting mock data, return mock
    if (useMock) {
      return getMockResponse(days, sentiment, limit, offset);
    }

    // Fetch from YouTube if API key is configured
    if (process.env.YOUTUBE_API_KEY && (!source || source === 'all' || source === 'youtube')) {
      try {
        const videos = await searchBrandVideos(keywords[0], days);
        sources.push('youtube');

        videos.forEach((video: any) => {
          mentions.push({
            id: `yt_${video.id}`,
            title: video.title,
            body: video.description?.substring(0, 200) || '',
            source: video.channelTitle || 'YouTube',
            sourceType: 'youtube',
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
          });
        });
      } catch (err) {
        console.error('YouTube fetch error:', err);
      }
    }

    // Fetch from News API if API key is configured
    if (process.env.NEWS_API_KEY && (!source || source === 'all' || source === 'news')) {
      try {
        const articles = await searchBrandNews(brand, days);
        sources.push('news');

        articles.forEach((article: any) => {
          mentions.push({
            id: `news_${Buffer.from(article.url).toString('base64').substring(0, 20)}`,
            title: article.title,
            body: article.description || '',
            source: article.source?.name || 'News',
            sourceType: 'news',
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
          });
        });
      } catch (err) {
        console.error('News fetch error:', err);
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
    isLiveData: false,
  });
}
