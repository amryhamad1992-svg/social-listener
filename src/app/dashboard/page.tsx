'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Download, Calendar } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { SentimentChart, SentimentDistribution } from '@/components/SentimentChart';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { CompetitorBattlecard } from '@/components/CompetitorBattlecard';
import { SpikeAlerts } from '@/components/SpikeAlerts';
import { QuickStatsBar } from '@/components/QuickStatsBar';
import { useSettings } from '@/lib/SettingsContext';

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
          <h1 className="text-xl font-medium text-[#1E293B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
            {getBrandName()} Dashboard
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Executive overview • Brand monitoring and competitive intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global Date Range */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg">
            <Calendar className="w-4 h-4 text-[#64748B]" />
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="text-[13px] text-[#1E293B] bg-transparent border-none focus:outline-none cursor-pointer font-medium"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-white rounded-lg text-[13px] font-medium hover:bg-[#334155] transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
            onClick={() => alert('Export feature coming soon - PDF & PowerPoint reports')}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats Bar - Live Metrics */}
      <QuickStatsBar />

      {/* Executive Summary - AI Insights */}
      <ExecutiveSummary days={days} />

      {/* Spike Alerts - Full Width for Priority */}
      <SpikeAlerts days={days} />

      {/* KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Mentions"
          value={data.kpis.totalMentions}
          change={data.kpis.mentionsChange}
          sparklineData={data.sentimentTrend.map(d => d.mentions)}
          priorSparklineData={data.sentimentTrend.map(d => Math.round(d.mentions * 0.85))}
        />
        <KPICard
          title="Avg. Sentiment"
          value={data.kpis.avgSentiment}
          change={data.kpis.sentimentChange}
          format="sentiment"
          sparklineData={data.sentimentTrend.map(d => d.sentiment)}
          priorSparklineData={data.sentimentTrend.map(d => d.sentiment - 0.08)}
        />
        <KPICard
          title="Share of Voice"
          value={38}
          change={2.4}
          format="percent"
          sparklineData={[32, 34, 33, 35, 36, 37, 38]}
          priorSparklineData={[28, 29, 30, 31, 30, 32, 33]}
        />
        <KPICard
          title="Engagement Rate"
          value={4.2}
          change={0.8}
          format="percent"
          sparklineData={[3.2, 3.5, 3.4, 3.8, 4.0, 3.9, 4.2]}
          priorSparklineData={[2.8, 2.9, 3.1, 3.0, 3.2, 3.3, 3.4]}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mentions by Day */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#1E293B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Mentions by Day
            </h2>
            <span className="text-[10px] text-[#64748B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Color indicates sentiment
            </span>
          </div>
          <SentimentChart data={data.sentimentTrend} />
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]">
          <h2 className="text-sm font-medium text-[#1E293B] mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Sentiment Distribution
          </h2>
          <SentimentDistribution
            positive={data.kpis.positiveCount}
            neutral={data.kpis.neutralCount}
            negative={data.kpis.negativeCount}
          />
        </div>
      </div>

      {/* Competitor Battlecard - Key Competitive View */}
      <CompetitorBattlecard days={days} />

      {/* Footer - Navigation Hints */}
      <div className="flex items-center justify-center gap-6 py-4 border-t border-[#E2E8F0]">
        <p className="text-[12px] text-[#64748B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
          <span className="font-medium text-[#1E293B]">Trending</span> for keyword analysis
        </p>
        <span className="text-[#E2E8F0]">•</span>
        <p className="text-[12px] text-[#64748B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
          <span className="font-medium text-[#1E293B]">Mentions</span> for detailed posts & purchase signals
        </p>
      </div>
    </div>
  );
}
