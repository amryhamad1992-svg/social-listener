// TypeScript type definitions for Social Listener

export interface User {
  id: number;
  email: string;
  name: string | null;
  selectedBrandId: number | null;
}

export interface Brand {
  id: number;
  name: string;
  keywords: string[];
  subreddits: string[];
  isActive: boolean;
}

export interface RedditPostData {
  id: number;
  redditId: string;
  subreddit: string;
  title: string;
  body: string | null;
  author: string | null;
  score: number;
  numComments: number;
  url: string | null;
  permalink: string | null;
  createdUtc: Date;
}

export interface BrandMention {
  id: number;
  brandId: number;
  postId: number;
  mentionType: string;
  matchedKeyword: string;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  snippet: string | null;
  createdAt: Date;
  post?: RedditPostData;
}

export interface TrendingTerm {
  id: number;
  brandId: number;
  term: string;
  mentionCount: number;
  avgSentiment: number | null;
  date: Date;
}

export interface DashboardKPIs {
  totalMentions: number;
  mentionsChange: number;
  avgSentiment: number;
  sentimentChange: number;
  trendingTopicsCount: number;
  topSubreddit: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
}

export interface SentimentTrend {
  date: string;
  avgSentiment: number;
  mentions: number;
}

export interface TrendingItem {
  id: number;
  term: string;
  mentions: number;
  sentiment: number;
  change: number;
  subreddit: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}
