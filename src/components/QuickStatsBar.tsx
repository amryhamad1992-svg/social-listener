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

// Quick stats by brand - using Stackline colors
function getQuickStats(brand: string): QuickStat[] {
  const statsByBrand: Record<string, QuickStat[]> = {
    'Revlon': [
      { label: 'Today', value: '127', change: 23, icon: <MessageSquare className="w-4 h-4" />, color: COLORS.carbonIndigo, bgColor: COLORS.productHeader },
      { label: 'Positive', value: '72%', change: 5, icon: <Smile className="w-4 h-4" />, color: COLORS.teal, bgColor: 'rgba(22, 148, 155, 0.1)' },
      { label: 'vs Yesterday', value: '+23%', icon: <TrendingUp className="w-4 h-4" />, color: COLORS.success, bgColor: 'rgba(113, 193, 132, 0.1)' },
      { label: 'Trending', value: '2', icon: <Flame className="w-4 h-4" />, color: COLORS.warning, bgColor: 'rgba(255, 189, 50, 0.1)' },
      { label: 'Share of Voice', value: '38%', change: 2, icon: <BarChart3 className="w-4 h-4" />, color: COLORS.blue, bgColor: 'rgba(70, 168, 246, 0.1)' },
    ],
    'e.l.f.': [
      { label: 'Today', value: '312', change: 45, icon: <MessageSquare className="w-4 h-4" />, color: COLORS.carbonIndigo, bgColor: COLORS.productHeader },
      { label: 'Positive', value: '78%', change: 8, icon: <Smile className="w-4 h-4" />, color: COLORS.teal, bgColor: 'rgba(22, 148, 155, 0.1)' },
      { label: 'vs Yesterday', value: '+45%', icon: <TrendingUp className="w-4 h-4" />, color: COLORS.success, bgColor: 'rgba(113, 193, 132, 0.1)' },
      { label: 'Trending', value: '5', icon: <Flame className="w-4 h-4" />, color: COLORS.warning, bgColor: 'rgba(255, 189, 50, 0.1)' },
      { label: 'Share of Voice', value: '42%', change: 8, icon: <BarChart3 className="w-4 h-4" />, color: COLORS.blue, bgColor: 'rgba(70, 168, 246, 0.1)' },
    ],
    'Maybelline': [
      { label: 'Today', value: '89', change: -12, icon: <MessageSquare className="w-4 h-4" />, color: COLORS.carbonIndigo, bgColor: COLORS.productHeader },
      { label: 'Positive', value: '65%', change: -2, icon: <Smile className="w-4 h-4" />, color: COLORS.teal, bgColor: 'rgba(22, 148, 155, 0.1)' },
      { label: 'vs Yesterday', value: '-12%', icon: <TrendingDown className="w-4 h-4" />, color: COLORS.slate, bgColor: COLORS.productHeader },
      { label: 'Trending', value: '1', icon: <Flame className="w-4 h-4" />, color: COLORS.warning, bgColor: 'rgba(255, 189, 50, 0.1)' },
      { label: 'Share of Voice', value: '20%', change: -6, icon: <BarChart3 className="w-4 h-4" />, color: COLORS.blue, bgColor: 'rgba(70, 168, 246, 0.1)' },
    ],
  };

  return statsByBrand[brand] || statsByBrand['Revlon'];
}

export function QuickStatsBar() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const stats = useMemo(() => getQuickStats(brandName), [brandName]);

  return (
    <div className="bg-white rounded-lg px-5 py-4 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between gap-6">
        {/* Brand Label with Live Indicator */}
        <div className="flex items-center gap-3 flex-shrink-0 pr-4" style={{ borderRight: `1px solid ${COLORS.moonbeam}` }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: COLORS.carbonIndigo }} />
            <span className="text-[13px] font-semibold" style={{ color: COLORS.carbonIndigo }}>{brandName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(113, 193, 132, 0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.success }} />
            <span className="text-[10px] font-medium" style={{ color: COLORS.success }}>Live</span>
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
