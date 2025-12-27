import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { subDays, startOfDay } from 'date-fns';
import { generateMockTrendingTerms } from '@/lib/mockData';

const USE_MOCK_DATA = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Use mock data if database not configured
    if (USE_MOCK_DATA) {
      const trending = generateMockTrendingTerms(days);
      return NextResponse.json({
        success: true,
        data: {
          trending,
          period: { days, startDate: new Date().toISOString() },
        },
      });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user?.selectedBrandId) {
      return NextResponse.json(
        { success: false, error: 'No brand selected' },
        { status: 400 }
      );
    }

    const brandId = user.selectedBrandId;

    const startDate = startOfDay(subDays(new Date(), days));
    const previousStartDate = startOfDay(subDays(new Date(), days * 2));

    // Get trending terms for current period
    const trendingTerms = await prisma.trendingTerm.findMany({
      where: {
        brandId,
        date: { gte: startDate },
      },
      orderBy: { mentionCount: 'desc' },
      take: 50,
    });

    // Get previous period data for comparison
    const previousTerms = await prisma.trendingTerm.findMany({
      where: {
        brandId,
        date: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    // Create lookup for previous counts
    const previousCountsMap = previousTerms.reduce((acc, term) => {
      acc[term.term] = (acc[term.term] || 0) + term.mentionCount;
      return acc;
    }, {} as Record<string, number>);

    // Aggregate current terms
    const aggregatedTerms = trendingTerms.reduce((acc, term) => {
      if (!acc[term.term]) {
        acc[term.term] = {
          term: term.term,
          mentionCount: 0,
          avgSentiment: 0,
          sentimentSum: 0,
          sentimentCount: 0,
        };
      }
      acc[term.term].mentionCount += term.mentionCount;
      if (term.avgSentiment !== null) {
        acc[term.term].sentimentSum += term.avgSentiment * term.mentionCount;
        acc[term.term].sentimentCount += term.mentionCount;
      }
      return acc;
    }, {} as Record<string, {
      term: string;
      mentionCount: number;
      avgSentiment: number;
      sentimentSum: number;
      sentimentCount: number;
    }>);

    // Calculate final values
    const trending = Object.values(aggregatedTerms)
      .map((item) => {
        const previousCount = previousCountsMap[item.term] || 0;
        const change = previousCount > 0
          ? ((item.mentionCount - previousCount) / previousCount) * 100
          : item.mentionCount > 0 ? 100 : 0;

        return {
          term: item.term,
          mentions: item.mentionCount,
          sentiment: item.sentimentCount > 0
            ? item.sentimentSum / item.sentimentCount
            : 0,
          change,
        };
      })
      .sort((a, b) => b.mentions - a.mentions);

    return NextResponse.json({
      success: true,
      data: {
        trending,
        period: { days, startDate: startDate.toISOString() },
      },
    });
  } catch (error) {
    console.error('Trending error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
