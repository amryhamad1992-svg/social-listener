// YouTube Data API v3 Integration
// Docs: https://developers.google.com/youtube/v3

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  url: string;
}

export interface YouTubeComment {
  id: string;
  videoId: string;
  authorName: string;
  authorProfileImage: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      thumbnails: {
        medium: { url: string };
        high: { url: string };
      };
    };
  }>;
  pageInfo: {
    totalResults: number;
  };
}

interface YouTubeVideoStatsResponse {
  items: Array<{
    id: string;
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
  }>;
}

interface YouTubeCommentsResponse {
  items: Array<{
    id: string;
    snippet: {
      videoId: string;
      topLevelComment: {
        snippet: {
          authorDisplayName: string;
          authorProfileImageUrl: string;
          textDisplay: string;
          likeCount: number;
          publishedAt: string;
        };
      };
    };
  }>;
}

// Search for videos mentioning brand keywords
export async function searchVideos(
  query: string,
  options: {
    maxResults?: number;
    publishedAfter?: string;
    order?: 'date' | 'rating' | 'relevance' | 'viewCount';
  } = {}
): Promise<YouTubeVideo[]> {
  const { maxResults = 10, publishedAfter, order = 'date' } = options;

  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: maxResults.toString(),
    order,
    key: YOUTUBE_API_KEY,
  });

  if (publishedAfter) {
    params.append('publishedAfter', publishedAfter);
  }

  // Search for videos
  const searchResponse = await fetch(`${BASE_URL}/search?${params}`);

  if (!searchResponse.ok) {
    const error = await searchResponse.json();
    throw new Error(error.error?.message || 'Failed to search YouTube');
  }

  const searchData: YouTubeSearchResponse = await searchResponse.json();

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  // Get video statistics
  const videoIds = searchData.items.map((item) => item.id.videoId).join(',');
  const statsParams = new URLSearchParams({
    part: 'statistics',
    id: videoIds,
    key: YOUTUBE_API_KEY,
  });

  const statsResponse = await fetch(`${BASE_URL}/videos?${statsParams}`);
  const statsData: YouTubeVideoStatsResponse = await statsResponse.json();

  // Combine search results with statistics
  const statsMap = new Map(
    statsData.items?.map((item) => [item.id, item.statistics]) || []
  );

  return searchData.items.map((item) => {
    const stats = statsMap.get(item.id.videoId);
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.high?.url,
      viewCount: parseInt(stats?.viewCount || '0', 10),
      likeCount: parseInt(stats?.likeCount || '0', 10),
      commentCount: parseInt(stats?.commentCount || '0', 10),
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    };
  });
}

// Get comments from a video
export async function getVideoComments(
  videoId: string,
  maxResults: number = 20
): Promise<YouTubeComment[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const params = new URLSearchParams({
    part: 'snippet',
    videoId,
    maxResults: maxResults.toString(),
    order: 'relevance',
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(`${BASE_URL}/commentThreads?${params}`);

  if (!response.ok) {
    // Comments might be disabled
    return [];
  }

  const data: YouTubeCommentsResponse = await response.json();

  return (data.items || []).map((item) => ({
    id: item.id,
    videoId: item.snippet.videoId,
    authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
    authorProfileImage: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    likeCount: item.snippet.topLevelComment.snippet.likeCount,
    publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
  }));
}

// Search for brand-related videos and get their comments
export async function searchBrandVideos(
  brandKeywords: string[],
  days: number = 7
): Promise<YouTubeVideo[]> {
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - days);

  // Build search query
  const query = brandKeywords.join(' | ');

  try {
    const videos = await searchVideos(query, {
      maxResults: 15,
      publishedAfter: publishedAfter.toISOString(),
      order: 'relevance',
    });

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

// Get aggregated stats for brand videos
export async function getBrandVideoStats(videos: YouTubeVideo[]) {
  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0);
  const totalComments = videos.reduce((sum, v) => sum + v.commentCount, 0);
  const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;

  return {
    totalVideos: videos.length,
    totalViews,
    totalLikes,
    totalComments,
    avgViews,
  };
}
