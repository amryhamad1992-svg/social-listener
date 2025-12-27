import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { redditClient, type RedditPost } from '@/lib/reddit';
import { analyzeSentiment } from '@/lib/sentiment';

// Secret key to protect cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      fetched: 0,
      processed: 0,
      errors: [] as string[],
    };

    // Get all active brands
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
    });

    for (const brand of brands) {
      // Fetch from each subreddit
      for (const subreddit of brand.subreddits) {
        try {
          const { posts } = await redditClient.fetchSubredditPosts(
            subreddit,
            'new',
            100
          );

          for (const post of posts) {
            // Check if post already exists
            const existingPost = await prisma.redditPost.findUnique({
              where: { redditId: post.id },
            });

            let postId: number;

            if (!existingPost) {
              // Create new post
              const newPost = await prisma.redditPost.create({
                data: {
                  redditId: post.id,
                  subreddit: post.subreddit,
                  title: post.title,
                  body: post.selftext || null,
                  author: post.author,
                  score: post.score,
                  numComments: post.num_comments,
                  url: post.url,
                  permalink: post.permalink,
                  createdUtc: new Date(post.created_utc * 1000),
                },
              });
              postId = newPost.id;
              results.fetched++;
            } else {
              // Update existing post stats
              await prisma.redditPost.update({
                where: { id: existingPost.id },
                data: {
                  score: post.score,
                  numComments: post.num_comments,
                },
              });
              postId = existingPost.id;
            }

            // Check for brand mentions in title and body
            const textToCheck = `${post.title} ${post.selftext || ''}`.toLowerCase();

            for (const keyword of brand.keywords) {
              if (textToCheck.includes(keyword.toLowerCase())) {
                // Check if mention already exists
                const existingMention = await prisma.brandMention.findFirst({
                  where: {
                    brandId: brand.id,
                    postId,
                    matchedKeyword: keyword,
                  },
                });

                if (!existingMention) {
                  // Analyze sentiment
                  const mentionText = post.title + (post.selftext ? ` ${post.selftext}` : '');
                  const sentiment = await analyzeSentiment(mentionText, brand.name);

                  // Create mention
                  await prisma.brandMention.create({
                    data: {
                      brandId: brand.id,
                      postId,
                      mentionType: textToCheck.indexOf(keyword.toLowerCase()) < post.title.length
                        ? 'title'
                        : 'body',
                      matchedKeyword: keyword,
                      sentimentScore: sentiment.score,
                      sentimentLabel: sentiment.label,
                      snippet: mentionText.substring(0, 500),
                      analyzedAt: new Date(),
                    },
                  });
                  results.processed++;
                }
                break; // Only create one mention per post per brand
              }
            }
          }

          // Log successful fetch
          await prisma.fetchLog.create({
            data: {
              subreddit,
              postsFetched: posts.length,
              success: true,
            },
          });
        } catch (error) {
          const errorMsg = `Error fetching r/${subreddit}: ${error}`;
          results.errors.push(errorMsg);

          await prisma.fetchLog.create({
            data: {
              subreddit,
              postsFetched: 0,
              success: false,
              errorMessage: errorMsg,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for manual trigger (development)
export async function GET(request: NextRequest) {
  // In development, allow GET requests
  if (process.env.NODE_ENV === 'development') {
    return POST(request);
  }

  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
