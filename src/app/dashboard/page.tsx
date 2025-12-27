'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  TrendingUp,
  Hash,
  ThumbsUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { SentimentChart, SentimentDistribution, TopicBubbleChart } from '@/components/SentimentChart';
import { SentimentBadge } from '@/components/DataTable';

interface DashboardData {
  brand: { name: string };
  kpis: {
    totalMentions: number;
    mentionsChange: number;
    avgSentiment: number;
    sentimentChange: number;
    trendingTopicsCount: number;
    topSubreddit: string;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
  sentimentTrend: Array<{
    date: string;
    sentiment: number;
    mentions: number;
  }>;
  topicBubbleData: Array<{
    name: string;
    sentiment: number;
    mentions: number;
    engagement: number;
  }>;
  recentMentions: Array<{
    id: number;
    title: string;
    subreddit: string;
    sentiment: string | null;
    score: number;
    createdAt: string;
    permalink: string | null;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchDashboard();
  }, [days]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/dashboard?days=${days}`);
      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        setError(result.error);
        return;
      }

      setData(result.data);
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger/10 text-danger p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted mt-1">
            Monitoring {data.brand.name} mentions across Reddit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="px-4 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Mentions"
          value={data.kpis.totalMentions}
          change={data.kpis.mentionsChange}
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <KPICard
          title="Avg. Sentiment"
          value={data.kpis.avgSentiment}
          change={data.kpis.sentimentChange}
          format="sentiment"
          icon={<ThumbsUp className="w-5 h-5" />}
        />
        <KPICard
          title="Trending Topics"
          value={data.kpis.trendingTopicsCount}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="Top Subreddit"
          value={`r/${data.kpis.topSubreddit}`}
          icon={<Hash className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Sentiment & Mentions Trend
          </h2>
          <SentimentChart data={data.sentimentTrend} showMentions />
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Sentiment Distribution
          </h2>
          <SentimentDistribution
            positive={data.kpis.positiveCount}
            neutral={data.kpis.neutralCount}
            negative={data.kpis.negativeCount}
          />
        </div>
      </div>

      {/* Topic Bubble Chart */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Topic Analysis
        </h2>
        <p className="text-sm text-muted mb-4">
          Bubble size = engagement, X-axis = sentiment, Y-axis = mention count
        </p>
        <TopicBubbleChart data={data.topicBubbleData} />
      </div>

      {/* Recent Mentions */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Mentions
          </h2>
          <button
            onClick={() => router.push('/mentions')}
            className="text-sm text-accent hover:underline"
          >
            View all
          </button>
        </div>

        <div className="space-y-4">
          {data.recentMentions.length === 0 ? (
            <p className="text-muted text-center py-8">
              No mentions found. Run the data fetcher to populate data.
            </p>
          ) : (
            data.recentMentions.map((mention) => (
              <div
                key={mention.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-accent">
                      r/{mention.subreddit}
                    </span>
                    <SentimentBadge label={mention.sentiment} />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {mention.title}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                    <span>{mention.score} upvotes</span>
                    <span>
                      {new Date(mention.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {mention.permalink && (
                  <a
                    href={`https://reddit.com${mention.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-accent"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
