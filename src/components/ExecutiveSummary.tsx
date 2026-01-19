'use client';

import { useEffect, useState, useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Zap, MoreHorizontal } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

// Stackline Official Colors
const COLORS = {
  carbonIndigo: '#031425',
  navyDark: '#2D3C4A',
  productCharts: '#adbdcc',
  slate: '#4E596A',
  moonbeam: '#E0E2E4',
  teal: '#16949b',
  tealLight: '#9ee0d0',
  success: '#71c184',
  danger: '#ff534a',
  warning: '#ffbd32',
};

interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'alert';
  icon: React.ReactNode;
  text: string;
}

interface ExecutiveSummaryData {
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
    totalEngagement?: number;
    highEngagementCount?: number;
  };
  sentimentTrend: Array<{
    date: string;
    sentiment: number;
    mentions: number;
  }>;
  bySource?: Record<string, number>;
  recentMentions?: Array<{
    title: string;
    source: string;
    sentiment: string | null;
    score: number;
  }>;
}

// Generate insights from real data
function generateInsightsFromData(data: ExecutiveSummaryData | undefined, brand: string, days: number): Insight[] {
  if (!data) {
    return getDefaultInsights(brand, days);
  }

  const { kpis, sentimentTrend, bySource, recentMentions } = data;
  const insights: Insight[] = [];

  // Calculate week-over-week or period change
  const mentionChange = kpis.mentionsChange;
  const sentimentChange = kpis.sentimentChange;

  // 1. Mentions trend insight
  if (mentionChange > 10) {
    insights.push({
      type: 'positive',
      icon: <TrendingUp className="w-4 h-4" />,
      text: `Mentions up ${mentionChange}% over the last ${days} days, with ${kpis.totalMentions} total mentions tracked`
    });
  } else if (mentionChange < -10) {
    insights.push({
      type: 'negative',
      icon: <TrendingDown className="w-4 h-4" />,
      text: `Mentions down ${Math.abs(mentionChange)}% over the last ${days} days (${kpis.totalMentions} total)`
    });
  } else {
    insights.push({
      type: 'neutral',
      icon: <Sparkles className="w-4 h-4" />,
      text: `Stable mention volume with ${kpis.totalMentions} mentions tracked over ${days} days`
    });
  }

  // 2. Sentiment insight
  const positivePercent = kpis.totalMentions > 0
    ? Math.round((kpis.positiveCount / kpis.totalMentions) * 100)
    : 0;
  const negativePercent = kpis.totalMentions > 0
    ? Math.round((kpis.negativeCount / kpis.totalMentions) * 100)
    : 0;

  if (kpis.avgSentiment > 0.5) {
    insights.push({
      type: 'positive',
      icon: <Zap className="w-4 h-4" />,
      text: `Strong positive sentiment (${kpis.avgSentiment.toFixed(2)}) with ${positivePercent}% positive mentions`
    });
  } else if (kpis.avgSentiment < 0) {
    insights.push({
      type: 'negative',
      icon: <TrendingDown className="w-4 h-4" />,
      text: `Sentiment trending negative (${kpis.avgSentiment.toFixed(2)}) with ${negativePercent}% negative mentions - requires attention`
    });
  } else {
    insights.push({
      type: 'neutral',
      icon: <Sparkles className="w-4 h-4" />,
      text: `Sentiment is neutral (${kpis.avgSentiment.toFixed(2)}) with balanced positive (${positivePercent}%) and negative (${negativePercent}%) mentions`
    });
  }

  // 3. Top source insight
  if (kpis.topSource && kpis.topSource !== 'N/A') {
    const sourceCount = bySource?.[kpis.topSource] || 0;
    const sourcePercent = kpis.totalMentions > 0
      ? Math.round((sourceCount / kpis.totalMentions) * 100)
      : 0;
    insights.push({
      type: 'neutral',
      icon: <Sparkles className="w-4 h-4" />,
      text: `${kpis.topSource} is the top source with ${sourcePercent > 0 ? `${sourcePercent}% of mentions` : 'the most activity'}`
    });
  }

  // 4. High engagement or trending insight
  if (kpis.highEngagementCount && kpis.highEngagementCount > 0) {
    insights.push({
      type: 'positive',
      icon: <TrendingUp className="w-4 h-4" />,
      text: `${kpis.highEngagementCount} high-engagement mentions detected - potential viral content`
    });
  } else if (kpis.trendingTopicsCount > 0) {
    insights.push({
      type: 'neutral',
      icon: <Zap className="w-4 h-4" />,
      text: `${kpis.trendingTopicsCount} trending topic${kpis.trendingTopicsCount > 1 ? 's' : ''} identified for ${brand}`
    });
  }

  // 5. Alert if sentiment is declining
  if (sentimentChange < -0.1) {
    insights.push({
      type: 'alert',
      icon: <AlertTriangle className="w-4 h-4" />,
      text: `Monitor: Sentiment has declined ${Math.abs(Math.round(sentimentChange * 100))}% - review recent negative mentions`
    });
  } else if (negativePercent > 30) {
    insights.push({
      type: 'alert',
      icon: <AlertTriangle className="w-4 h-4" />,
      text: `Alert: ${negativePercent}% negative sentiment detected - consider response strategy`
    });
  }

  return insights.slice(0, 4); // Return max 4 insights
}

// Default insights when no data is available
function getDefaultInsights(brand: string, days: number): Insight[] {
  return [
    { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: `Loading ${brand} insights for the last ${days} days...` },
    { type: 'neutral', icon: <Zap className="w-4 h-4" />, text: 'Analyzing sentiment patterns and trends...' },
    { type: 'neutral', icon: <TrendingUp className="w-4 h-4" />, text: 'Processing social media mentions...' },
    { type: 'neutral', icon: <AlertTriangle className="w-4 h-4" />, text: 'Monitoring for alerts and anomalies...' },
  ];
}

interface ExecutiveSummaryProps {
  days?: number;
  data?: ExecutiveSummaryData;
}

export function ExecutiveSummary({ days = 7, data }: ExecutiveSummaryProps) {
  const { settings, getBrandName } = useSettings();

  const insights = useMemo(() => {
    return generateInsightsFromData(data, getBrandName(), days);
  }, [data, settings.selectedBrand, days, getBrandName]);

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return { bg: 'rgba(22, 148, 155, 0.08)', border: 'rgba(22, 148, 155, 0.2)', text: COLORS.teal };
      case 'negative':
        return { bg: 'rgba(78, 89, 106, 0.08)', border: 'rgba(78, 89, 106, 0.2)', text: COLORS.slate };
      case 'alert':
        return { bg: 'rgba(255, 189, 50, 0.08)', border: 'rgba(255, 189, 50, 0.2)', text: COLORS.warning };
      default:
        return { bg: 'rgba(3, 20, 37, 0.05)', border: 'rgba(3, 20, 37, 0.15)', text: COLORS.carbonIndigo };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Card Header - Stackline style with three-dot menu */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div>
          <h3 className="text-base font-medium" style={{ color: COLORS.carbonIndigo }}>Executive Summary</h3>
          <p className="text-[13px] mt-1" style={{ color: COLORS.slate }}>
            AI-powered insights for {getBrandName()} • {days}-day analysis
          </p>
        </div>
        <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100 transition-colors">
          <MoreHorizontal className="w-4 h-4" style={{ color: COLORS.slate }} />
        </button>
      </div>

      {/* Insights Grid */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  backgroundColor: styles.bg,
                  border: `1px solid ${styles.border}`,
                }}
              >
                <div className="flex-shrink-0 mt-0.5" style={{ color: styles.text }}>
                  {insight.icon}
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: COLORS.navyDark }}>
                  {insight.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end mt-4 pt-3" style={{ borderTop: `1px solid ${COLORS.moonbeam}` }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.teal }} />
            <span className="text-[11px]" style={{ color: COLORS.slate }}>Updated just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
