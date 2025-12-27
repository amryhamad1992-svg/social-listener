// Reddit API Client
// Uses OAuth2 for authentication to get 100 QPM rate limit

interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after: string | null;
  };
}

class RedditClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Reddit API credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialListener/1.0',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get Reddit access token: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Token expires in 1 hour, refresh at 55 minutes
    this.tokenExpiry = Date.now() + (55 * 60 * 1000);

    return this.accessToken;
  }

  async fetchSubredditPosts(
    subreddit: string,
    sort: 'hot' | 'new' | 'top' = 'new',
    limit: number = 100,
    after?: string
  ): Promise<{ posts: RedditPost[]; after: string | null }> {
    const token = await this.getAccessToken();

    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(after && { after }),
    });

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/${sort}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialListener/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from r/${subreddit}: ${response.status}`);
    }

    const data: RedditResponse = await response.json();

    return {
      posts: data.data.children.map((child) => child.data),
      after: data.data.after,
    };
  }

  async searchSubreddit(
    subreddit: string,
    query: string,
    limit: number = 100
  ): Promise<RedditPost[]> {
    const token = await this.getAccessToken();

    const params = new URLSearchParams({
      q: query,
      restrict_sr: 'true',
      sort: 'new',
      limit: limit.toString(),
    });

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/search?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialListener/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search r/${subreddit}: ${response.status}`);
    }

    const data: RedditResponse = await response.json();
    return data.data.children.map((child) => child.data);
  }
}

export const redditClient = new RedditClient();
export type { RedditPost };
