import { NextRequest, NextResponse } from 'next/server';
import { searchBrandNews, NewsArticle } from '@/lib/newsApi';
import { analyzeSentiment } from '@/lib/sentiment';

// Brand keywords for Revlon
const BRAND_KEYWORDS = [
  'Revlon',
  'Revlon cosmetics',
  'Revlon makeup',
  'Revlon lipstick',
  'Revlon ColorStay',
  'Revlon Super Lustrous',
];

interface NewsWithSentiment extends NewsArticle {
  sentiment: {
    label: string;
    score: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Check if API key is configured
    if (!process.env.NEWS_API_KEY) {
      // Return mock data if no API key
      return NextResponse.json({
        success: true,
        data: getMockNewsData(),
        source: 'mock',
      });
    }

    // Fetch news articles
    const articles = await searchBrandNews(BRAND_KEYWORDS, days);

    // Analyze sentiment for each article
    const articlesWithSentiment: NewsWithSentiment[] = await Promise.all(
      articles.slice(0, 20).map(async (article) => {
        const text = `${article.title} ${article.description || ''}`;
        let sentiment = { label: 'neutral', score: 0 };

        try {
          if (process.env.OPENAI_API_KEY) {
            sentiment = await analyzeSentiment(text, 'Revlon');
          }
        } catch {
          // Default to neutral on error
        }

        return {
          ...article,
          sentiment,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: articlesWithSentiment,
      source: 'newsapi',
      totalResults: articles.length,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news',
        data: getMockNewsData(),
      },
      { status: 500 }
    );
  }
}

function getMockNewsData(): NewsWithSentiment[] {
  return [
    {
      source: { id: null, name: 'Beauty Magazine' },
      author: 'Sarah Johnson',
      title: 'Revlon Launches New Sustainable Packaging Initiative',
      description: 'Revlon announces commitment to 100% recyclable packaging by 2025, leading the beauty industry in sustainability efforts.',
      url: 'https://example.com/revlon-sustainability',
      urlToImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      content: null,
      sentiment: { label: 'positive', score: 0.8 },
    },
    {
      source: { id: null, name: 'Fashion Weekly' },
      author: 'Emma Davis',
      title: 'ColorStay Foundation Voted Best Drugstore Product 2024',
      description: 'Readers choice awards crown Revlon ColorStay as the top affordable foundation for the third consecutive year.',
      url: 'https://example.com/colorstay-award',
      urlToImage: 'https://images.unsplash.com/photo-1631214524020-3c8274c1db21?w=400',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      content: null,
      sentiment: { label: 'positive', score: 0.9 },
    },
    {
      source: { id: null, name: 'Market Watch' },
      author: 'Michael Chen',
      title: 'Revlon Stock Rises After Strong Q4 Earnings Report',
      description: 'Beauty giant reports 15% increase in revenue driven by lipstick and foundation sales.',
      url: 'https://example.com/revlon-earnings',
      urlToImage: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      content: null,
      sentiment: { label: 'positive', score: 0.7 },
    },
    {
      source: { id: null, name: 'Consumer Reports' },
      author: 'Lisa Park',
      title: 'Review: New Revlon Super Lustrous Lipstick Formula',
      description: 'We tested the reformulated Super Lustrous line. Here\'s what we found about longevity and color payoff.',
      url: 'https://example.com/super-lustrous-review',
      urlToImage: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      content: null,
      sentiment: { label: 'neutral', score: 0.1 },
    },
    {
      source: { id: null, name: 'Beauty Insider' },
      author: 'Rachel Kim',
      title: 'TikTok Trend: Revlon One-Step Hair Dryer Goes Viral Again',
      description: 'The cult-favorite styling tool sees renewed interest as beauty influencers share holiday glam tutorials.',
      url: 'https://example.com/revlon-tiktok',
      urlToImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      content: null,
      sentiment: { label: 'positive', score: 0.85 },
    },
  ];
}
