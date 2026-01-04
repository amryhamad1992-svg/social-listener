'use client';

import { useMemo } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Smile, Flame, BarChart3, Activity } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface QuickStat {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// Quick stats by brand
function getQuickStats(brand: string): QuickStat[] {
  const statsByBrand: Record<string, QuickStat[]> = {
    'Revlon': [
      { label: 'Today', value: '127', change: 23, icon: <MessageSquare className="w-4 h-4" />, color: '#0F172A', bgColor: '#F1F5F9' },
      { label: 'Positive', value: '72%', change: 5, icon: <Smile className="w-4 h-4" />, color: '#0EA5E9', bgColor: '#E0F2FE' },
      { label: 'vs Yesterday', value: '+23%', icon: <TrendingUp className="w-4 h-4" />, color: '#10B981', bgColor: '#D1FAE5' },
      { label: 'Trending', value: '2', icon: <Flame className="w-4 h-4" />, color: '#F59E0B', bgColor: '#FEF3C7' },
      { label: 'Share of Voice', value: '38%', change: 2, icon: <BarChart3 className="w-4 h-4" />, color: '#8B5CF6', bgColor: '#EDE9FE' },
    ],
    'e.l.f.': [
      { label: 'Today', value: '312', change: 45, icon: <MessageSquare className="w-4 h-4" />, color: '#0F172A', bgColor: '#F1F5F9' },
      { label: 'Positive', value: '78%', change: 8, icon: <Smile className="w-4 h-4" />, color: '#0EA5E9', bgColor: '#E0F2FE' },
      { label: 'vs Yesterday', value: '+45%', icon: <TrendingUp className="w-4 h-4" />, color: '#10B981', bgColor: '#D1FAE5' },
      { label: 'Trending', value: '5', icon: <Flame className="w-4 h-4" />, color: '#F59E0B', bgColor: '#FEF3C7' },
      { label: 'Share of Voice', value: '42%', change: 8, icon: <BarChart3 className="w-4 h-4" />, color: '#8B5CF6', bgColor: '#EDE9FE' },
    ],
    'Maybelline': [
      { label: 'Today', value: '89', change: -12, icon: <MessageSquare className="w-4 h-4" />, color: '#0F172A', bgColor: '#F1F5F9' },
      { label: 'Positive', value: '65%', change: -2, icon: <Smile className="w-4 h-4" />, color: '#0EA5E9', bgColor: '#E0F2FE' },
      { label: 'vs Yesterday', value: '-12%', icon: <TrendingDown className="w-4 h-4" />, color: '#64748B', bgColor: '#F1F5F9' },
      { label: 'Trending', value: '1', icon: <Flame className="w-4 h-4" />, color: '#F59E0B', bgColor: '#FEF3C7' },
      { label: 'Share of Voice', value: '20%', change: -6, icon: <BarChart3 className="w-4 h-4" />, color: '#8B5CF6', bgColor: '#EDE9FE' },
    ],
  };

  return statsByBrand[brand] || statsByBrand['Revlon'];
}

export function QuickStatsBar() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const stats = useMemo(() => getQuickStats(brandName), [brandName]);

  return (
    <div className="bg-white rounded-lg px-5 py-4 shadow-sm border border-[#E2E8F0]">
      <div className="flex items-center justify-between gap-6">
        {/* Brand Label with Live Indicator */}
        <div className="flex items-center gap-3 flex-shrink-0 pr-4 border-r border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0EA5E9]" />
            <span className="text-[13px] font-semibold text-[#0F172A]">{brandName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#ECFDF5] rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] font-medium text-[#059669]">Live</span>
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
                  <span className="text-[15px] font-bold text-[#0F172A]">{stat.value}</span>
                  {stat.change !== undefined && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      stat.change >= 0
                        ? 'bg-[#ECFDF5] text-[#059669]'
                        : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}>
                      {stat.change >= 0 ? '↑' : '↓'}{Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#64748B]">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 pl-4 border-l border-[#E2E8F0] flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-[#94A3B8]">Last updated</p>
            <p className="text-[11px] font-medium text-[#64748B]">2 min ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
