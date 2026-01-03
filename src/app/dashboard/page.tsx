'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { SentimentChart, SentimentDistribution } from '@/components/SentimentChart';
import { SourceStatusBar } from '@/components/SourceStatusBar';
import { BrandKeywordExplorer } from '@/components/BrandKeywordExplorer';
import { MediaMentions } from '@/components/MediaMentions';
import { CompetitorComparison } from '@/components/CompetitorComparison';
import { SearchTrends } from '@/components/SearchTrends';
import { WebMentions } from '@/components/WebMentions';
import { useSettings } from '@/lib/useSettings';

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
  const { settings, isLoaded, getBrandName } = useSettings();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);
  const [settingsApplied, setSettingsApplied] = useState(false);

  // Apply default days from settings once loaded
  useEffect(() => {
    if (isLoaded && !settingsApplied) {
      setDays(settings.defaultDays);
      setSettingsApplied(true);
    }
  }, [isLoaded, settings.defaultDays, settingsApplied]);

  useEffect(() => {
    if (settingsApplied) {
      fetchDashboard();
    }
  }, [days, settingsApplied, settings.selectedBrand]);

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

  if (loading || !isLoaded) {
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
          <h1 className="text-xl font-medium text-[#1E293B]">{getBrandName()} Dashboard</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Brand monitoring and competitive intelligence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SourceStatusBar />
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-[12px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
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

      {/* Brand Keyword Explorer */}
      <BrandKeywordExplorer />

      {/* Google Search Trends */}
      <SearchTrends />

      {/* Media Mentions & Competitor Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MediaMentions />
        <CompetitorComparison />
      </div>

      {/* Web Mentions (Scraped Sources) */}
      <WebMentions />
    </div>
  );
}
