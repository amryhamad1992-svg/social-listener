'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BrandMetrics {
  brand: string;
  mentions: number;
  sentiment: number;
  engagement: number;
  videoCount: number;
  newsCount: number;
}

// Mock data by brand and days
const BRAND_DATA: { [brand: string]: { [days: number]: BrandMetrics } } = {
  'Revlon': {
    7: { brand: 'Revlon', mentions: 1247, sentiment: 0.42, engagement: 89000, videoCount: 15, newsCount: 8 },
    14: { brand: 'Revlon', mentions: 2580, sentiment: 0.45, engagement: 178000, videoCount: 28, newsCount: 15 },
    30: { brand: 'Revlon', mentions: 5420, sentiment: 0.48, engagement: 385000, videoCount: 52, newsCount: 32 },
  },
  'e.l.f.': {
    7: { brand: 'e.l.f.', mentions: 2150, sentiment: 0.68, engagement: 156000, videoCount: 28, newsCount: 12 },
    14: { brand: 'e.l.f.', mentions: 4320, sentiment: 0.71, engagement: 312000, videoCount: 54, newsCount: 24 },
    30: { brand: 'e.l.f.', mentions: 8950, sentiment: 0.72, engagement: 645000, videoCount: 108, newsCount: 48 },
  },
  'Maybelline': {
    7: { brand: 'Maybelline', mentions: 1890, sentiment: 0.55, engagement: 124000, videoCount: 22, newsCount: 10 },
    14: { brand: 'Maybelline', mentions: 3780, sentiment: 0.52, engagement: 248000, videoCount: 42, newsCount: 19 },
    30: { brand: 'Maybelline', mentions: 7650, sentiment: 0.54, engagement: 502000, videoCount: 85, newsCount: 38 },
  },
  'NYX': {
    7: { brand: 'NYX', mentions: 980, sentiment: 0.61, engagement: 67000, videoCount: 12, newsCount: 5 },
    14: { brand: 'NYX', mentions: 1960, sentiment: 0.58, engagement: 134000, videoCount: 24, newsCount: 10 },
    30: { brand: 'NYX', mentions: 4120, sentiment: 0.60, engagement: 285000, videoCount: 48, newsCount: 21 },
  },
};

const COMPETITORS = ['e.l.f.', 'Maybelline', 'NYX'];

export function CompetitorComparison() {
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState('e.l.f.');
  const [days, setDays] = useState(7);
  const [primary, setPrimary] = useState<BrandMetrics | null>(null);
  const [competitor, setCompetitor] = useState<BrandMetrics | null>(null);

  useEffect(() => {
    fetchCompetitorData();
  }, [selectedCompetitor, days]);

  const fetchCompetitorData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    setPrimary(BRAND_DATA['Revlon'][days]);
    setCompetitor(BRAND_DATA[selectedCompetitor][days]);
    setLoading(false);
  };

  const getComparisonIndicator = (primaryVal: number, competitorVal: number) => {
    const diff = ((primaryVal - competitorVal) / competitorVal) * 100;
    if (diff > 5) {
      return { icon: TrendingUp, color: 'text-[#0F172A]', text: `+${diff.toFixed(0)}%` };
    } else if (diff < -5) {
      return { icon: TrendingDown, color: 'text-[#64748B]', text: `${diff.toFixed(0)}%` };
    }
    return { icon: Minus, color: 'text-[#94A3B8]', text: '~' };
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

  if (loading || !primary || !competitor) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-medium text-[#1E293B] mb-4">Competitor Comparison</h2>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
        </div>
      </div>
    );
  }

  const comparisonMetrics = [
    { label: 'Total Mentions', primary: primary.mentions, competitor: competitor.mentions, format: formatNumber },
    { label: 'Avg. Sentiment', primary: primary.sentiment, competitor: competitor.sentiment, format: formatSentiment },
    { label: 'Engagement', primary: primary.engagement, competitor: competitor.engagement, format: formatNumber },
    { label: 'YouTube Videos', primary: primary.videoCount, competitor: competitor.videoCount, format: (n: number) => n.toString() },
    { label: 'News Articles', primary: primary.newsCount, competitor: competitor.newsCount, format: (n: number) => n.toString() },
  ];

  const totalMentions = primary.mentions + competitor.mentions;
  const primaryShare = (primary.mentions / totalMentions) * 100;
  const competitorShare = (competitor.mentions / totalMentions) * 100;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header with dropdowns */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#1E293B]">Competitor Comparison</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
          >
            {COMPETITORS.map((comp) => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* Brand headers */}
      <div className="grid grid-cols-3 gap-4 mb-3 pb-2 border-b border-[#E2E8F0]">
        <div className="text-[10px] text-[#64748B] uppercase font-medium tracking-wide">Metric</div>
        <div className="text-center">
          <span className="text-[11px] font-medium text-[#0F172A]">Revlon</span>
        </div>
        <div className="text-center">
          <span className="text-[11px] font-medium text-[#0F172A]">{competitor.brand}</span>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-2.5">
        {comparisonMetrics.map((metric) => {
          const comparison = getComparisonIndicator(metric.primary, metric.competitor);
          const Icon = comparison.icon;

          return (
            <div key={metric.label} className="grid grid-cols-3 gap-4 items-center">
              <div className="text-[11px] text-[#64748B]">{metric.label}</div>
              <div className="text-center">
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  {metric.format(metric.primary)}
                </span>
                <div className={`flex items-center justify-center gap-0.5 mt-0.5 text-[9px] ${comparison.color}`}>
                  <Icon className="w-2.5 h-2.5" />
                  <span>{comparison.text}</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  {metric.format(metric.competitor)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share of Voice bar */}
      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
        <div className="text-[10px] text-[#64748B] uppercase tracking-wide mb-2">Share of Voice</div>
        <div className="flex h-5 rounded overflow-hidden">
          <div
            className="flex items-center justify-center text-[10px] font-medium text-white bg-[#0F172A]"
            style={{ width: `${primaryShare}%` }}
          >
            {primaryShare.toFixed(0)}%
          </div>
          <div
            className="flex items-center justify-center text-[10px] font-medium text-[#0F172A] bg-[#E2E8F0]"
            style={{ width: `${competitorShare}%` }}
          >
            {competitorShare.toFixed(0)}%
          </div>
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-[#64748B]">
          <span>Revlon</span>
          <span>{competitor.brand}</span>
        </div>
      </div>
    </div>
  );
}
