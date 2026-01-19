'use client';

import { useMemo } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Smile, Flame, BarChart3, Activity } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

// Stackline Official Colors
const COLORS = {
  carbonIndigo: '#031425',
  navyDark: '#2D3C4A',
  productCharts: '#adbdcc',
  slate: '#4E596A',
  moonbeam: '#E0E2E4',
  productHeader: '#F6F7F8',
  teal: '#16949b',
  tealLight: '#9ee0d0',
  success: '#71c184',
  danger: '#ff534a',
  warning: '#ffbd32',
  blue: '#46a8f6',
};

interface QuickStat {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface QuickStatsBarProps {
  data?: {
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
  };
  isLiveData?: boolean;
}

// Generate stats from real data
function generateStatsFromData(data: QuickStatsBarProps['data'], brandName: string): QuickStat[] {
  if (!data) {
    return getDefaultStats(brandName);
  }

  const { kpis, sentimentTrend } = data;

  // Today's mentions (last day in trend data)
  const todayMentions = sentimentTrend.length > 0
    ? sentimentTrend[sentimentTrend.length - 1].mentions
    : kpis.totalMentions;

  // Yesterday's mentions (second to last day)
  const yesterdayMentions = sentimentTrend.length > 1
    ? sentimentTrend[sentimentTrend.length - 2].mentions
    : todayMentions;

  // Calculate change vs yesterday
  const vsYesterdayChange = yesterdayMentions > 0
    ? Math.round(((todayMentions - yesterdayMentions) / yesterdayMentions) * 100)
    : 0;

  // Positive percentage
  const positivePercent = kpis.totalMentions > 0
    ? Math.round((kpis.positiveCount / kpis.totalMentions) * 100)
    : 0;

  // Calculate sentiment change as percentage
  const sentimentChangePercent = Math.round(kpis.sentimentChange * 100);

  return [
    {
      label: 'Today',
      value: todayMentions.toString(),
      change: vsYesterdayChange > 0 ? vsYesterdayChange : undefined,
      icon: <MessageSquare className="w-4 h-4" />,
      color: COLORS.carbonIndigo,
      bgColor: COLORS.productHeader
    },
    {
      label: 'Positive',
      value: `${positivePercent}%`,
      change: sentimentChangePercent !== 0 ? sentimentChangePercent : undefined,
      icon: <Smile className="w-4 h-4" />,
      color: COLORS.teal,
      bgColor: 'rgba(22, 148, 155, 0.1)'
    },
    {
      label: 'vs Yesterday',
      value: `${vsYesterdayChange >= 0 ? '+' : ''}${vsYesterdayChange}%`,
      icon: vsYesterdayChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
      color: vsYesterdayChange >= 0 ? COLORS.success : COLORS.slate,
      bgColor: vsYesterdayChange >= 0 ? 'rgba(113, 193, 132, 0.1)' : COLORS.productHeader
    },
    {
      label: 'Trending',
      value: kpis.trendingTopicsCount.toString(),
      icon: <Flame className="w-4 h-4" />,
      color: COLORS.warning,
      bgColor: 'rgba(255, 189, 50, 0.1)'
    },
    {
      label: 'Top Source',
      value: kpis.topSource,
      icon: <BarChart3 className="w-4 h-4" />,
      color: COLORS.blue,
      bgColor: 'rgba(70, 168, 246, 0.1)'
    },
  ];
}

// Default stats when no data is available
function getDefaultStats(brand: string): QuickStat[] {
  return [
    { label: 'Today', value: '--', icon: <MessageSquare className="w-4 h-4" />, color: COLORS.carbonIndigo, bgColor: COLORS.productHeader },
    { label: 'Positive', value: '--%', icon: <Smile className="w-4 h-4" />, color: COLORS.teal, bgColor: 'rgba(22, 148, 155, 0.1)' },
    { label: 'vs Yesterday', value: '--%', icon: <TrendingUp className="w-4 h-4" />, color: COLORS.success, bgColor: 'rgba(113, 193, 132, 0.1)' },
    { label: 'Trending', value: '--', icon: <Flame className="w-4 h-4" />, color: COLORS.warning, bgColor: 'rgba(255, 189, 50, 0.1)' },
    { label: 'Top Source', value: 'N/A', icon: <BarChart3 className="w-4 h-4" />, color: COLORS.blue, bgColor: 'rgba(70, 168, 246, 0.1)' },
  ];
}

export function QuickStatsBar({ data, isLiveData = false }: QuickStatsBarProps) {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const stats = useMemo(() => generateStatsFromData(data, brandName), [data, brandName]);

  return (
    <div className="bg-white rounded-lg px-5 py-4 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between gap-6">
        {/* Brand Label with Live Indicator */}
        <div className="flex items-center gap-3 flex-shrink-0 pr-4" style={{ borderRight: `1px solid ${COLORS.moonbeam}` }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: COLORS.carbonIndigo }} />
            <span className="text-[13px] font-semibold" style={{ color: COLORS.carbonIndigo }}>{brandName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: isLiveData ? 'rgba(113, 193, 132, 0.15)' : 'rgba(78, 89, 106, 0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: isLiveData ? COLORS.success : COLORS.slate }} />
            <span className="text-[10px] font-medium" style={{ color: isLiveData ? COLORS.success : COLORS.slate }}>{isLiveData ? 'Live' : 'Demo'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-1 justify-between">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.bgColor, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-semibold" style={{ color: COLORS.carbonIndigo }}>{stat.value}</span>
                  {stat.change !== undefined && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: stat.change >= 0 ? 'rgba(113, 193, 132, 0.15)' : 'rgba(255, 83, 74, 0.15)',
                        color: stat.change >= 0 ? COLORS.success : COLORS.danger,
                      }}
                    >
                      {stat.change >= 0 ? '↑' : '↓'}{Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
                <span className="text-[11px]" style={{ color: COLORS.slate }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 pl-4 flex-shrink-0" style={{ borderLeft: `1px solid ${COLORS.moonbeam}` }}>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: COLORS.productCharts }}>Last updated</p>
            <p className="text-[11px] font-medium" style={{ color: COLORS.slate }}>2 min ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
