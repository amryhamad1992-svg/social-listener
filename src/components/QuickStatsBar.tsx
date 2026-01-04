'use client';

import { useMemo } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Smile, Flame, BarChart3 } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface QuickStat {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

// Quick stats by brand
function getQuickStats(brand: string): QuickStat[] {
  const statsByBrand: Record<string, QuickStat[]> = {
    'Revlon': [
      { label: 'Today', value: '127', change: 23, icon: <MessageSquare className="w-3.5 h-3.5" />, color: '#0F172A' },
      { label: 'Positive', value: '72%', change: 5, icon: <Smile className="w-3.5 h-3.5" />, color: '#0EA5E9' },
      { label: 'vs Yesterday', value: '+23%', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#10B981' },
      { label: 'Trending', value: '2', icon: <Flame className="w-3.5 h-3.5" />, color: '#F59E0B' },
      { label: 'Share of Voice', value: '38%', change: 2, icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#8B5CF6' },
    ],
    'e.l.f.': [
      { label: 'Today', value: '312', change: 45, icon: <MessageSquare className="w-3.5 h-3.5" />, color: '#0F172A' },
      { label: 'Positive', value: '78%', change: 8, icon: <Smile className="w-3.5 h-3.5" />, color: '#0EA5E9' },
      { label: 'vs Yesterday', value: '+45%', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#10B981' },
      { label: 'Trending', value: '5', icon: <Flame className="w-3.5 h-3.5" />, color: '#F59E0B' },
      { label: 'Share of Voice', value: '42%', change: 8, icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#8B5CF6' },
    ],
    'Maybelline': [
      { label: 'Today', value: '89', change: -12, icon: <MessageSquare className="w-3.5 h-3.5" />, color: '#0F172A' },
      { label: 'Positive', value: '65%', change: -2, icon: <Smile className="w-3.5 h-3.5" />, color: '#0EA5E9' },
      { label: 'vs Yesterday', value: '-12%', icon: <TrendingDown className="w-3.5 h-3.5" />, color: '#64748B' },
      { label: 'Trending', value: '1', icon: <Flame className="w-3.5 h-3.5" />, color: '#F59E0B' },
      { label: 'Share of Voice', value: '20%', change: -6, icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#8B5CF6' },
    ],
  };

  return statsByBrand[brand] || statsByBrand['Revlon'];
}

export function QuickStatsBar() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const stats = useMemo(() => getQuickStats(brandName), [brandName]);

  return (
    <div className="bg-[#0F172A] rounded-lg px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4 overflow-x-auto">
        {/* Brand Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
          <span className="text-[11px] font-medium text-white/80">{brandName}</span>
          <span className="text-[10px] text-white/40">Live</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 flex-shrink-0" />

        {/* Stats */}
        <div className="flex items-center gap-6 flex-1">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2 flex-shrink-0">
              <div className="text-white/60" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-white">{stat.value}</span>
                <span className="text-[10px] text-white/50">{stat.label}</span>
                {stat.change !== undefined && (
                  <span className={`text-[9px] ${stat.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {stat.change >= 0 ? '↑' : '↓'}{Math.abs(stat.change)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[9px] text-white/40">Updated 2m ago</span>
        </div>
      </div>
    </div>
  );
}
