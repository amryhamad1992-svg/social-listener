import { NextRequest, NextResponse } from 'next/server';
import { searchBrandVideos, getVideoComments, getBrandVideoStats, YouTubeVideo } from '@/lib/youtube';
import { analyzeSentiment } from '@/lib/sentiment';

// Brand keywords for Revlon
const BRAND_KEYWORDS = [
  'Revlon makeup tutorial',
  'Revlon review',
  'Revlon lipstick',
  'Revlon ColorStay',
  'Revlon Super Lustrous',
  'Revlon foundation review',
];

interface VideoWithSentiment extends YouTubeVideo {
  sentiment: {
    label: string;
    score: number;
  };
  topComments?: Array<{
    text: string;
    author: string;
    likes: number;
    sentiment: { label: string; score: number };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const includeComments = searchParams.get('comments') === 'true';

    // Check if API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({
        success: true,
        data: {
          videos: getMockVideos(),
          stats: {
            totalVideos: 5,
            totalViews: 125000,
            totalLikes: 8500,
            totalComments: 1200,
            avgViews: 25000,
          },
        },
        source: 'mock',
      });
    }

    // Fetch YouTube videos
    const videos = await searchBrandVideos(BRAND_KEYWORDS, days);
    const stats = await getBrandVideoStats(videos);

    // Analyze sentiment for each video
    const videosWithSentiment: VideoWithSentiment[] = await Promise.all(
      videos.slice(0, 10).map(async (video) => {
        const text = `${video.title} ${video.description}`;
        let sentiment = { label: 'neutral', score: 0 };

        try {
          if (process.env.OPENAI_API_KEY) {
            sentiment = await analyzeSentiment(text);
          }
        } catch {
          // Default to neutral on error
        }

        // Optionally fetch top comments
        let topComments: VideoWithSentiment['topComments'] = undefined;
        if (includeComments) {
          try {
            const comments = await getVideoComments(video.id, 5);
            topComments = await Promise.all(
              comments.map(async (comment) => {
                let commentSentiment = { label: 'neutral', score: 0 };
                try {
                  if (process.env.OPENAI_API_KEY) {
                    commentSentiment = await analyzeSentiment(comment.text);
                  }
                } catch {
                  // Default to neutral
                }
                return {
                  text: comment.text,
                  author: comment.authorName,
                  likes: comment.likeCount,
                  sentiment: commentSentiment,
                };
              })
            );
          } catch {
            // Comments might be disabled
          }
        }

        return {
          ...video,
          sentiment,
          topComments,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        videos: videosWithSentiment,
        stats,
      },
      source: 'youtube',
    });
  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch YouTube data',
        data: {
          videos: getMockVideos(),
          stats: {
            totalVideos: 5,
            totalViews: 125000,
            totalLikes: 8500,
            totalComments: 1200,
            avgViews: 25000,
          },
        },
      },
      { status: 500 }
    );
  }
}

function getMockVideos(): VideoWithSentiment[] {
  return [
    {
      id: 'mock1',
      title: 'Revlon ColorStay Foundation Review - 12 Hour Wear Test!',
      description: 'Testing the new Revlon ColorStay foundation for a full 12 hours. Does it really last?',
      channelTitle: 'Beauty By Sarah',
      channelId: 'UC123',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=320',
      viewCount: 45000,
      likeCount: 3200,
      commentCount: 450,
      url: 'https://youtube.com/watch?v=mock1',
      sentiment: { label: 'positive', score: 0.75 },
    },
    {
      id: 'mock2',
      title: 'Full Face Using Only Revlon Products | Drugstore Makeup',
      description: 'Can you create a flawless look using only drugstore Revlon products? Let\'s find out!',
      channelTitle: 'Makeup Maven',
      channelId: 'UC456',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=320',
      viewCount: 32000,
      likeCount: 2100,
      commentCount: 320,
      url: 'https://youtube.com/watch?v=mock2',
      sentiment: { label: 'positive', score: 0.82 },
    },
    {
      id: 'mock3',
      title: 'Revlon Super Lustrous Lipstick Swatches - All 30 Shades!',
      description: 'Swatching every single shade of the iconic Revlon Super Lustrous lipstick collection.',
      channelTitle: 'Lipstick Lover',
      channelId: 'UC789',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=320',
      viewCount: 28000,
      likeCount: 1900,
      commentCount: 280,
      url: 'https://youtube.com/watch?v=mock3',
      sentiment: { label: 'positive', score: 0.68 },
    },
    {
      id: 'mock4',
      title: 'Honest Review: Revlon One-Step Hair Dryer - Worth the Hype?',
      description: 'Everyone is talking about this hair tool. Here\'s my honest opinion after 3 months of use.',
      channelTitle: 'Hair Care Daily',
      channelId: 'UC101',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=320',
      viewCount: 15000,
      likeCount: 980,
      commentCount: 120,
      url: 'https://youtube.com/watch?v=mock4',
      sentiment: { label: 'neutral', score: 0.15 },
    },
    {
      id: 'mock5',
      title: 'Drugstore vs High End: Revlon vs Charlotte Tilbury Foundation',
      description: 'Comparing the $14 Revlon ColorStay to the $46 Charlotte Tilbury. Can you tell the difference?',
      channelTitle: 'Beauty on a Budget',
      channelId: 'UC202',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1631214524020-3c8274c1db21?w=320',
      viewCount: 5000,
      likeCount: 320,
      commentCount: 30,
      url: 'https://youtube.com/watch?v=mock5',
      sentiment: { label: 'positive', score: 0.55 },
    },
  ];
}
