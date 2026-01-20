import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources, getMockScrapedMentions, isBraveConfigured } from '@/lib/scrapers';
import { analyzeKeywordSentiment } from '@/lib/sentiment';
import { subDays, format, startOfDay } from 'date-fns';

// Brand keywords for searching
const BRAND_KEYWORDS: Record<string, string[]> = {
  'Revlon': ['Revlon', 'ColorStay', 'Super Lustrous', 'Revlon lipstick', 'Revlon foundation'],
  'e.l.f.': ['e.l.f.', 'elf cosmetics', 'elf makeup', 'Power Grip', 'Halo Glow'],
  'Maybelline': ['Maybelline', 'Sky High', 'Fit Me', 'SuperStay', 'Maybelline mascara'],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const brand = searchParams.get('brand') || 'Revlon';

    const keywords = BRAND_KEYWORDS[brand] || BRAND_KEYWORDS['Revlon'];
    let mentions: any[] = [];
    let isLiveData = false;
    let sources: string[] = [];

    // Try to get real data from Brave Search API
    try {
      if (isBraveConfigured()) {
        const result = await scrapeAllSources({
          keywords: keywords.slice(0, 3),
          brands: [brand],
          maxResultsPerSource: 10,
          daysBack: days,
          includeSentiment: false, // We'll do sentiment ourselves
        });

        if (result.mentions.length > 0) {
          mentions = result.mentions;
          isLiveData = result.source === 'brave';
          sources = Object.keys(result.bySource);
        }
      }
    } catch (error) {
      console.error('Scraper error, falling back to mock data:', error);
    }

    // Fall back to mock data if no real data
    if (mentions.length === 0) {
      mentions = getMockScrapedMentions();
      isLiveData = false;
      sources = ['Reddit', 'Instagram', 'X', 'Meta', 'TikTok', 'YouTube'];
    }

    // Filter mentions by date range
    const cutoffDate = subDays(new Date(), days);
    const filteredMentions = mentions.filter(m => {
      const publishedAt = new Date(m.publishedAt);
      return publishedAt >= cutoffDate;
    });

    // Analyze sentiment for each mention if not already present
    const mentionsWithSentiment = filteredMentions.map(m => {
      if (!m.sentiment) {
        const text = `${m.title || ''} ${m.snippet || ''}`;
        const sentiment = analyzeKeywordSentiment(text);
        return { ...m, sentiment };
      }
      return m;
    });

    // Calculate KPIs
    const totalMentions = mentionsWithSentiment.length;

    // Sentiment counts
    const positiveCount = mentionsWithSentiment.filter(m =>
      m.sentiment?.label === 'positive'
    ).length;
    const negativeCount = mentionsWithSentiment.filter(m =>
      m.sentiment?.label === 'negative'
    ).length;
    const neutralCount = mentionsWithSentiment.filter(m =>
      !m.sentiment || m.sentiment?.label === 'neutral'
    ).length;

    // Average sentiment score
    const sentimentScores = mentionsWithSentiment
      .filter(m => m.sentiment?.score !== undefined)
      .map(m => m.sentiment.score);
    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;

    // Calculate previous period for comparison (mock the change for now)
    const mentionsChange = isLiveData ? 0 : Math.round((Math.random() - 0.3) * 30);
    const sentimentChange = isLiveData ? 0 : parseFloat(((Math.random() - 0.3) * 0.2).toFixed(2));

    // Top source by mention count
    const sourceCounts = mentionsWithSentiment.reduce((acc, m) => {
      const source = m.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSource = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

    // Generate sentiment trend (daily data)
    const sentimentTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(subDays(date, -1));

      const dayMentions = mentionsWithSentiment.filter(m => {
        const publishedAt = new Date(m.publishedAt);
        return publishedAt >= dayStart && publishedAt < dayEnd;
      });

      const dayScores = dayMentions
        .filter(m => m.sentiment?.score !== undefined)
        .map(m => m.sentiment.score);

      const daySentiment = dayScores.length > 0
        ? dayScores.reduce((a, b) => a + b, 0) / dayScores.length
        : avgSentiment + (Math.random() - 0.5) * 0.1; // Small variation around average

      sentimentTrend.push({
        date: format(date, 'yyyy-MM-dd'),
        sentiment: parseFloat(daySentiment.toFixed(2)),
        mentions: dayMentions.length || Math.floor(Math.random() * 5) + 1, // At least 1 for visualization
      });
    }

    // Format recent mentions for the dashboard
    const recentMentions = mentionsWithSentiment
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10)
      .map((m, index) => ({
        id: index + 1,
        title: m.title || '',
        source: m.source || 'Unknown',
        sourceIcon: getSourceIcon(m.source),
        sentiment: m.sentiment?.label || 'neutral',
        score: m.engagement?.upvotes || 0,
        createdAt: m.publishedAt,
        url: m.url || null,
      }));

    // Source distribution
    const bySource = mentionsWithSentiment.reduce((acc, m) => {
      const source = m.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total engagement
    const totalEngagement = mentionsWithSentiment.reduce((sum, m) => {
      return sum + (m.engagement?.upvotes || 0) + (m.engagement?.comments || 0);
    }, 0);

    // High engagement mentions count
    const highEngagementCount = mentionsWithSentiment.filter(m => m.isHighEngagement).length;

    return NextResponse.json({
      success: true,
      isLiveData,
      sources,
      data: {
        brand: { name: brand },
        kpis: {
          totalMentions,
          mentionsChange,
          avgSentiment: parseFloat(avgSentiment.toFixed(2)),
          sentimentChange,
          trendingTopicsCount: Math.min(5, Math.ceil(totalMentions / 3)),
          topSource,
          positiveCount,
          neutralCount,
          negativeCount,
          totalEngagement,
          highEngagementCount,
        },
        sentimentTrend,
        recentMentions,
        bySource,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    'Reddit': '💬',
    'Instagram': '📸',
    'X': '𝕏',
    'Meta': '👤',
    'TikTok': '🎵',
    'YouTube': '▶️',
  };
  return icons[source] || '📱';
}
