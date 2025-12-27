import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { subDays, startOfDay, format } from 'date-fns';
import { generateMockDashboardData } from '@/lib/mockData';

// Check if we should use mock data (no database or demo mode)
const USE_MOCK_DATA = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

export async function GET(request: NextRequest) {
  try {
    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Use mock data if database not configured
    if (USE_MOCK_DATA) {
      const mockData = generateMockDashboardData(days);
      return NextResponse.json({ success: true, data: mockData });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's selected brand
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { selectedBrand: true },
    });

    if (!user?.selectedBrand) {
      return NextResponse.json(
        { success: false, error: 'No brand selected' },
        { status: 400 }
      );
    }

    const brandId = user.selectedBrand.id;

    const now = new Date();
    const startDate = startOfDay(subDays(now, days));
    const previousStartDate = startOfDay(subDays(now, days * 2));

    // Get mentions for current period
    const currentMentions = await prisma.brandMention.findMany({
      where: {
        brandId,
        createdAt: { gte: startDate },
      },
      include: { post: true },
    });

    // Get mentions for previous period (for comparison)
    const previousMentions = await prisma.brandMention.count({
      where: {
        brandId,
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    // Calculate KPIs
    const totalMentions = currentMentions.length;
    const mentionsChange = previousMentions > 0
      ? ((totalMentions - previousMentions) / previousMentions) * 100
      : 0;

    // Sentiment analysis
    const sentimentScores = currentMentions
      .filter((m) => m.sentimentScore !== null)
      .map((m) => m.sentimentScore as number);

    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;

    // Sentiment distribution
    const positiveCount = currentMentions.filter(
      (m) => m.sentimentLabel === 'positive'
    ).length;
    const negativeCount = currentMentions.filter(
      (m) => m.sentimentLabel === 'negative'
    ).length;
    const neutralCount = currentMentions.filter(
      (m) => m.sentimentLabel === 'neutral' || m.sentimentLabel === null
    ).length;

    // Top subreddit
    const subredditCounts = currentMentions.reduce((acc, m) => {
      const subreddit = m.post?.subreddit || 'Unknown';
      acc[subreddit] = (acc[subreddit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSubreddit = Object.entries(subredditCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || 'N/A';

    // Trending topics count
    const trendingTopicsCount = await prisma.trendingTerm.count({
      where: {
        brandId,
        date: { gte: startDate },
      },
    });

    // Get sentiment trend data (daily)
    const sentimentTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(subDays(date, -1));

      const dayMentions = currentMentions.filter((m) => {
        const createdAt = new Date(m.createdAt);
        return createdAt >= dayStart && createdAt < dayEnd;
      });

      const dayScores = dayMentions
        .filter((m) => m.sentimentScore !== null)
        .map((m) => m.sentimentScore as number);

      const daySentiment = dayScores.length > 0
        ? dayScores.reduce((a, b) => a + b, 0) / dayScores.length
        : 0;

      sentimentTrend.push({
        date: format(date, 'yyyy-MM-dd'),
        sentiment: daySentiment,
        mentions: dayMentions.length,
      });
    }

    // Recent mentions
    const recentMentions = currentMentions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        title: m.post?.title || '',
        subreddit: m.post?.subreddit || '',
        sentiment: m.sentimentLabel,
        score: m.post?.score || 0,
        createdAt: m.createdAt,
        permalink: m.post?.permalink,
      }));

    return NextResponse.json({
      success: true,
      data: {
        brand: user.selectedBrand,
        kpis: {
          totalMentions,
          mentionsChange,
          avgSentiment,
          sentimentChange: 0, // TODO: Calculate from previous period
          trendingTopicsCount,
          topSubreddit,
          positiveCount,
          neutralCount,
          negativeCount,
        },
        sentimentTrend,
        recentMentions,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
