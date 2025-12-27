'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { SentimentChart, SentimentDistribution, TopicBubbleChart } from '@/components/SentimentChart';
import { SentimentBadge } from '@/components/DataTable';
import { SourceSelector } from '@/components/SourceSelector';
import { NewsSection } from '@/components/NewsSection';
import { YouTubeSection } from '@/components/YouTubeSection';

interface DashboardData {
  brand: { name: string };
  kpis: {
    totalMentions: number;
    mentionsChange: number;
    avgSentiment: number;
    sentimentChange: number;
    trendingTopicsCount: number;
    topSource: string;
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
    source: string;
    sourceIcon: string;
    sentiment: string | null;
    score: number;
    createdAt: string;
    url: string | null;
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
        <Loader2 className="w-6 h-6 animate-spin text-[#64748B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">Dashboard</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Monitoring {data.brand.name} mentions across social media
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SourceSelector />
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-[13px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Mentions"
          value={data.kpis.totalMentions}
          change={data.kpis.mentionsChange}
        />
        <KPICard
          title="Avg. Sentiment"
          value={data.kpis.avgSentiment}
          change={data.kpis.sentimentChange}
          format="sentiment"
        />
        <KPICard
          title="Trending Topics"
          value={data.kpis.trendingTopicsCount}
        />
        <KPICard
          title="Top Source"
          value={data.kpis.topSource}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sentiment Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-medium text-[#1E293B] mb-4">
            Sentiment & Mentions Trend
          </h2>
          <SentimentChart data={data.sentimentTrend} showMentions />
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-medium text-[#1E293B] mb-4">
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
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-medium text-[#1E293B] mb-1">
          Topic Analysis
        </h2>
        <p className="text-[11px] text-[#64748B] mb-4">
          Bubble size = engagement, X-axis = sentiment, Y-axis = mention count
        </p>
        <TopicBubbleChart data={data.topicBubbleData} />
      </div>

      {/* YouTube & News Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* YouTube Mentions */}
        <YouTubeSection />

        {/* News Coverage */}
        <NewsSection />
      </div>

      {/* Recent Mentions */}
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#1E293B]">
            Recent Mentions
          </h2>
          <button
            onClick={() => router.push('/mentions')}
            className="text-[12px] text-[#0EA5E9] hover:underline"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {data.recentMentions.length === 0 ? (
            <p className="text-[#64748B] text-center py-8 text-sm">
              No mentions found. Connect a data source to start monitoring.
            </p>
          ) : (
            data.recentMentions.map((mention) => (
              <div
                key={mention.id}
                className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded hover:bg-[#F1F5F9] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{mention.sourceIcon}</span>
                    <span className="text-[11px] font-medium text-[#0EA5E9]">
                      {mention.source}
                    </span>
                    <SentimentBadge label={mention.sentiment} />
                  </div>
                  <p className="text-[13px] font-medium text-[#1E293B] truncate">
                    {mention.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#64748B]">
                    <span>{mention.score.toLocaleString()} views</span>
                    <span>
                      {new Date(mention.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {mention.url && (
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#94A3B8] hover:text-[#0EA5E9]"
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
