'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PRIMARY_BRAND, COMPETITOR_BRAND } from '@/lib/brands';

interface BrandMetrics {
  brand: string;
  color: string;
  mentions: number;
  sentiment: number;
  engagement: number;
  videoCount: number;
  newsCount: number;
}

export function CompetitorComparison() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BrandMetrics[]>([]);

  useEffect(() => {
    fetchCompetitorData();
  }, []);

  const fetchCompetitorData = async () => {
    setLoading(true);

    // Fetch data for both brands
    // For now using mock data - in production this would fetch from APIs
    const mockMetrics: BrandMetrics[] = [
      {
        brand: PRIMARY_BRAND.displayName,
        color: PRIMARY_BRAND.color,
        mentions: 1247,
        sentiment: 0.42,
        engagement: 89000,
        videoCount: 15,
        newsCount: 8,
      },
      {
        brand: COMPETITOR_BRAND.displayName,
        color: COMPETITOR_BRAND.color,
        mentions: 2150,
        sentiment: 0.68,
        engagement: 156000,
        videoCount: 28,
        newsCount: 12,
      },
    ];

    setMetrics(mockMetrics);
    setLoading(false);
  };

  const getComparisonIndicator = (primary: number, competitor: number) => {
    const diff = ((primary - competitor) / competitor) * 100;
    if (diff > 5) {
      return { icon: TrendingUp, color: 'text-[#22C55E]', text: `+${diff.toFixed(0)}%` };
    } else if (diff < -5) {
      return { icon: TrendingDown, color: 'text-[#EF4444]', text: `${diff.toFixed(0)}%` };
    }
    return { icon: Minus, color: 'text-[#64748B]', text: 'Similar' };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatSentiment = (score: number) => {
    if (score > 0) return `+${score.toFixed(2)}`;
    return score.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-medium text-[#1E293B] mb-4">Competitor Comparison</h2>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
        </div>
      </div>
    );
  }

  const primary = metrics[0];
  const competitor = metrics[1];

  const comparisonMetrics = [
    {
      label: 'Total Mentions',
      primary: primary.mentions,
      competitor: competitor.mentions,
      format: formatNumber,
    },
    {
      label: 'Avg. Sentiment',
      primary: primary.sentiment,
      competitor: competitor.sentiment,
      format: formatSentiment,
    },
    {
      label: 'Engagement',
      primary: primary.engagement,
      competitor: competitor.engagement,
      format: formatNumber,
    },
    {
      label: 'YouTube Videos',
      primary: primary.videoCount,
      competitor: competitor.videoCount,
      format: (n: number) => n.toString(),
    },
    {
      label: 'News Articles',
      primary: primary.newsCount,
      competitor: competitor.newsCount,
      format: (n: number) => n.toString(),
    },
  ];

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#1E293B]">Competitor Comparison</h2>
        <span className="text-[11px] text-[#64748B]">Last 7 days</span>
      </div>

      {/* Brand headers */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-3 border-b border-[#E2E8F0]">
        <div className="text-[11px] text-[#64748B] uppercase font-medium">Metric</div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: primary.color }}
            />
            <span className="text-[12px] font-medium text-[#1E293B]">{primary.brand}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: competitor.color }}
            />
            <span className="text-[12px] font-medium text-[#1E293B]">{competitor.brand}</span>
          </div>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-3">
        {comparisonMetrics.map((metric) => {
          const comparison = getComparisonIndicator(metric.primary, metric.competitor);
          const Icon = comparison.icon;

          return (
            <div key={metric.label} className="grid grid-cols-3 gap-4 items-center">
              <div className="text-[12px] text-[#64748B]">{metric.label}</div>
              <div className="text-center">
                <span className="text-[15px] font-semibold text-[#1E293B]">
                  {metric.format(metric.primary)}
                </span>
                <div className={`flex items-center justify-center gap-1 mt-0.5 text-[10px] ${comparison.color}`}>
                  <Icon className="w-3 h-3" />
                  <span>{comparison.text}</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-[15px] font-semibold text-[#1E293B]">
                  {metric.format(metric.competitor)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual bar comparison */}
      <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
        <div className="text-[11px] text-[#64748B] mb-3">Share of Voice</div>
        <div className="flex h-6 rounded-full overflow-hidden">
          <div
            className="flex items-center justify-center text-[11px] font-medium text-white"
            style={{
              backgroundColor: primary.color,
              width: `${(primary.mentions / (primary.mentions + competitor.mentions)) * 100}%`,
            }}
          >
            {((primary.mentions / (primary.mentions + competitor.mentions)) * 100).toFixed(0)}%
          </div>
          <div
            className="flex items-center justify-center text-[11px] font-medium text-white"
            style={{
              backgroundColor: competitor.color,
              width: `${(competitor.mentions / (primary.mentions + competitor.mentions)) * 100}%`,
            }}
          >
            {((competitor.mentions / (primary.mentions + competitor.mentions)) * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
