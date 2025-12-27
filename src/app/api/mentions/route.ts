import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { subDays, startOfDay } from 'date-fns';
import { generateMockPosts } from '@/lib/mockData';

const USE_MOCK_DATA = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const sentiment = searchParams.get('sentiment');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Use mock data if database not configured
    if (USE_MOCK_DATA) {
      let mockPosts = generateMockPosts(100, days);

      // Filter by sentiment if specified
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
        sourceIcon: p.sourceIcon,
        author: p.author,
        score: p.score,
        numComments: p.numComments,
        sentiment: p.sentiment,
        sentimentScore: p.sentimentScore,
        matchedKeyword: p.matchedKeyword,
        createdAt: p.createdUtc.toISOString(),
        url: p.url,
      }));

      return NextResponse.json({
        success: true,
        data: {
          mentions,
          pagination: { total, limit, offset, hasMore: offset + limit < total },
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

    // Build where clause
    const whereClause: {
      brandId: number;
      createdAt: { gte: Date };
      sentimentLabel?: string;
    } = {
      brandId,
      createdAt: { gte: startDate },
    };

    if (sentiment) {
      whereClause.sentimentLabel = sentiment;
    }

    // Get mentions
    const [mentions, total] = await Promise.all([
      prisma.brandMention.findMany({
        where: whereClause,
        include: {
          post: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.brandMention.count({ where: whereClause }),
    ]);

    // Format mentions for response
    const formattedMentions = mentions.map((m) => ({
      id: m.id,
      title: m.post?.title || '',
      body: m.snippet || m.post?.body?.substring(0, 200) || '',
      subreddit: m.post?.subreddit || '',
      author: m.post?.author || '',
      score: m.post?.score || 0,
      numComments: m.post?.numComments || 0,
      sentiment: m.sentimentLabel,
      sentimentScore: m.sentimentScore,
      matchedKeyword: m.matchedKeyword,
      createdAt: m.createdAt,
      permalink: m.post?.permalink
        ? `https://reddit.com${m.post.permalink}`
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        mentions: formattedMentions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Mentions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
