'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, TrendingDown, Minus, Flame, Zap, BarChart3, Hash, ArrowUpRight, ArrowDownRight, Activity, Download, Calendar } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { BrandKeywordExplorer } from '@/components/BrandKeywordExplorer';
import { SearchTrends } from '@/components/SearchTrends';
import { useSettings } from '@/lib/SettingsContext';

interface TrendingItem {
  term: string;
  mentions: number;
  sentiment: number;
  change: number;
  velocity: 'rising' | 'steady' | 'cooling';
  category: string;
  source: string;
  relatedTerms: string[];
  sparkline: number[];
}

// Enhanced mock trending data by brand
const BRAND_TRENDING: { [key: string]: { [days: number]: TrendingItem[] } } = {
  'Revlon': {
    7: [
      { term: 'one step hair dryer', mentions: 520, sentiment: 0.75, change: 32, velocity: 'rising', category: 'Hair Tools', source: 'YouTube', relatedTerms: ['blow dry', 'volume', 'salon quality'], sparkline: [40, 45, 52, 58, 65, 72, 85] },
      { term: 'colorstay foundation', mentions: 450, sentiment: 0.52, change: 15, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['full coverage', 'oily skin', 'drugstore'], sparkline: [38, 40, 42, 44, 45, 46, 48] },
      { term: 'super lustrous lipstick', mentions: 380, sentiment: 0.68, change: 8, velocity: 'steady', category: 'Lips', source: 'YouTube', relatedTerms: ['classic', 'creamy', 'shade range'], sparkline: [35, 36, 37, 38, 38, 39, 40] },
      { term: 'revlon review', mentions: 290, sentiment: 0.42, change: -5, velocity: 'cooling', category: 'General', source: 'News', relatedTerms: ['drugstore', 'affordable', 'comparison'], sparkline: [32, 31, 30, 29, 29, 28, 27] },
      { term: 'drugstore vs high end', mentions: 180, sentiment: 0.55, change: 12, velocity: 'rising', category: 'Comparison', source: 'YouTube', relatedTerms: ['dupe', 'save money', 'worth it'], sparkline: [14, 15, 16, 17, 18, 19, 21] },
      { term: 'revlon lip liner', mentions: 145, sentiment: 0.62, change: 28, velocity: 'rising', category: 'Lips', source: 'Reddit', relatedTerms: ['nude', 'long lasting', 'underrated'], sparkline: [8, 10, 11, 12, 13, 15, 18] },
    ],
    14: [
      { term: 'one step hair dryer', mentions: 1050, sentiment: 0.78, change: 38, velocity: 'rising', category: 'Hair Tools', source: 'YouTube', relatedTerms: ['blow dry', 'volume', 'salon quality'], sparkline: [60, 65, 70, 75, 78, 82, 88, 92, 95, 100, 105, 110, 115, 120] },
      { term: 'colorstay foundation', mentions: 920, sentiment: 0.55, change: 18, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['full coverage', 'oily skin', 'drugstore'], sparkline: [58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84] },
      { term: 'super lustrous lipstick', mentions: 780, sentiment: 0.72, change: 12, velocity: 'steady', category: 'Lips', source: 'YouTube', relatedTerms: ['classic', 'creamy', 'shade range'], sparkline: [50, 52, 54, 55, 56, 58, 59, 60, 61, 62, 63, 64, 65, 66] },
      { term: 'revlon review', mentions: 580, sentiment: 0.45, change: -2, velocity: 'cooling', category: 'General', source: 'News', relatedTerms: ['drugstore', 'affordable', 'comparison'], sparkline: [42, 42, 41, 41, 40, 40, 40, 39, 39, 39, 38, 38, 38, 38] },
      { term: 'drugstore vs high end', mentions: 380, sentiment: 0.58, change: 15, velocity: 'steady', category: 'Comparison', source: 'YouTube', relatedTerms: ['dupe', 'save money', 'worth it'], sparkline: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35] },
    ],
    30: [
      { term: 'one step hair dryer', mentions: 2150, sentiment: 0.82, change: 45, velocity: 'rising', category: 'Hair Tools', source: 'YouTube', relatedTerms: ['blow dry', 'volume', 'salon quality'], sparkline: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95] },
      { term: 'colorstay foundation', mentions: 1850, sentiment: 0.58, change: 22, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['full coverage', 'oily skin', 'drugstore'], sparkline: [45, 48, 52, 55, 58, 60, 62, 64, 66, 68] },
      { term: 'super lustrous lipstick', mentions: 1580, sentiment: 0.75, change: 15, velocity: 'steady', category: 'Lips', source: 'YouTube', relatedTerms: ['classic', 'creamy', 'shade range'], sparkline: [42, 44, 46, 48, 50, 52, 54, 55, 56, 58] },
      { term: 'revlon review', mentions: 1180, sentiment: 0.48, change: 5, velocity: 'cooling', category: 'General', source: 'News', relatedTerms: ['drugstore', 'affordable', 'comparison'], sparkline: [38, 38, 39, 39, 40, 40, 40, 41, 41, 42] },
    ],
    90: [
      { term: 'one step hair dryer', mentions: 6850, sentiment: 0.85, change: 55, velocity: 'rising', category: 'Hair Tools', source: 'YouTube', relatedTerms: ['blow dry', 'volume', 'salon quality'], sparkline: [40, 50, 60, 70, 80, 90, 100, 110, 120, 130] },
      { term: 'colorstay foundation', mentions: 5600, sentiment: 0.62, change: 28, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['full coverage', 'oily skin', 'drugstore'], sparkline: [35, 40, 45, 50, 55, 60, 62, 65, 68, 70] },
    ],
  },
  'e.l.f.': {
    7: [
      { term: 'power grip primer', mentions: 680, sentiment: 0.85, change: 28, velocity: 'rising', category: 'Face', source: 'YouTube', relatedTerms: ['sticky', 'hydrating', 'milk dupe'], sparkline: [45, 50, 55, 60, 65, 72, 80] },
      { term: 'halo glow', mentions: 450, sentiment: 0.82, change: 42, velocity: 'rising', category: 'Face', source: 'YouTube', relatedTerms: ['ct dupe', 'glowy', 'filter'], sparkline: [25, 30, 35, 40, 48, 55, 65] },
      { term: 'camo concealer', mentions: 520, sentiment: 0.78, change: 15, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['full coverage', 'crease proof', 'drugstore'], sparkline: [42, 44, 46, 48, 50, 52, 54] },
      { term: 'elf dupe', mentions: 380, sentiment: 0.65, change: 35, velocity: 'rising', category: 'General', source: 'YouTube', relatedTerms: ['high end', 'save money', 'tiktok'], sparkline: [22, 26, 30, 34, 38, 42, 48] },
      { term: 'bronzing drops', mentions: 320, sentiment: 0.72, change: 55, velocity: 'rising', category: 'Face', source: 'News', relatedTerms: ['tan', 'glow', 'summer'], sparkline: [12, 16, 20, 26, 32, 40, 52] },
      { term: 'lip oil', mentions: 290, sentiment: 0.80, change: 48, velocity: 'rising', category: 'Lips', source: 'TikTok', relatedTerms: ['glossy', 'hydrating', 'subtle tint'], sparkline: [10, 14, 18, 24, 30, 38, 48] },
    ],
    14: [
      { term: 'power grip primer', mentions: 1380, sentiment: 0.88, change: 32, velocity: 'rising', category: 'Face', source: 'YouTube', relatedTerms: ['sticky', 'hydrating', 'milk dupe'], sparkline: [80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145] },
      { term: 'halo glow', mentions: 920, sentiment: 0.85, change: 48, velocity: 'rising', category: 'Face', source: 'YouTube', relatedTerms: ['ct dupe', 'glowy', 'filter'], sparkline: [50, 55, 60, 65, 70, 75, 82, 88, 95, 102, 110, 118, 126, 135] },
      { term: 'camo concealer', mentions: 1050, sentiment: 0.82, change: 18, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['full coverage', 'crease proof', 'drugstore'], sparkline: [68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94] },
    ],
    30: [
      { term: 'power grip primer', mentions: 2850, sentiment: 0.90, change: 38, velocity: 'rising', category: 'Face', source: 'YouTube', relatedTerms: ['sticky', 'hydrating', 'milk dupe'], sparkline: [60, 70, 80, 90, 100, 110, 120, 130, 140, 150] },
      { term: 'halo glow', mentions: 1920, sentiment: 0.88, change: 52, velocity: 'rising', category: 'Face', source: 'YouTube', relatedTerms: ['ct dupe', 'glowy', 'filter'], sparkline: [40, 52, 65, 78, 92, 108, 125, 142, 160, 180] },
    ],
    90: [
      { term: 'power grip primer', mentions: 8600, sentiment: 0.92, change: 45, velocity: 'rising', category: 'Face', source: 'YouTube', relatedTerms: ['sticky', 'hydrating', 'milk dupe'], sparkline: [40, 55, 70, 85, 100, 120, 145, 170, 200, 240] },
    ],
  },
  'Maybelline': {
    7: [
      { term: 'sky high mascara', mentions: 580, sentiment: 0.72, change: 18, velocity: 'steady', category: 'Eyes', source: 'YouTube', relatedTerms: ['lengthening', 'viral', 'drugstore'], sparkline: [48, 50, 52, 54, 56, 58, 60] },
      { term: 'fit me foundation', mentions: 420, sentiment: 0.62, change: 8, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['natural finish', 'shade range', 'affordable'], sparkline: [38, 39, 40, 41, 42, 42, 43] },
      { term: 'vinyl ink', mentions: 280, sentiment: 0.75, change: 25, velocity: 'rising', category: 'Lips', source: 'YouTube', relatedTerms: ['long wear', 'comfortable', 'transfer proof'], sparkline: [18, 20, 22, 24, 27, 30, 34] },
      { term: 'superstay lipstick', mentions: 350, sentiment: 0.58, change: 12, velocity: 'steady', category: 'Lips', source: 'YouTube', relatedTerms: ['matte', '24 hour', 'drying'], sparkline: [28, 29, 30, 31, 32, 34, 36] },
      { term: 'lash sensational', mentions: 220, sentiment: 0.65, change: 5, velocity: 'cooling', category: 'Eyes', source: 'News', relatedTerms: ['fan effect', 'buildable', 'classic'], sparkline: [22, 22, 22, 22, 23, 23, 23] },
      { term: 'instant age rewind', mentions: 190, sentiment: 0.70, change: 15, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['concealer', 'under eye', 'brightening'], sparkline: [14, 15, 16, 17, 18, 19, 20] },
    ],
    14: [
      { term: 'sky high mascara', mentions: 1180, sentiment: 0.75, change: 22, velocity: 'steady', category: 'Eyes', source: 'YouTube', relatedTerms: ['lengthening', 'viral', 'drugstore'], sparkline: [75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 111, 114] },
      { term: 'fit me foundation', mentions: 850, sentiment: 0.65, change: 12, velocity: 'steady', category: 'Face', source: 'YouTube', relatedTerms: ['natural finish', 'shade range', 'affordable'], sparkline: [55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81] },
      { term: 'vinyl ink', mentions: 580, sentiment: 0.78, change: 28, velocity: 'rising', category: 'Lips', source: 'YouTube', relatedTerms: ['long wear', 'comfortable', 'transfer proof'], sparkline: [32, 35, 38, 41, 44, 47, 50, 54, 58, 62, 66, 70, 75, 80] },
    ],
    30: [
      { term: 'sky high mascara', mentions: 2450, sentiment: 0.78, change: 28, velocity: 'steady', category: 'Eyes', source: 'YouTube', relatedTerms: ['lengthening', 'viral', 'drugstore'], sparkline: [50, 58, 66, 74, 82, 90, 100, 110, 120, 130] },
    ],
    90: [
      { term: 'sky high mascara', mentions: 7500, sentiment: 0.82, change: 35, velocity: 'steady', category: 'Eyes', source: 'YouTube', relatedTerms: ['lengthening', 'viral', 'drugstore'], sparkline: [40, 55, 70, 88, 108, 130, 155, 185, 220, 260] },
    ],
  },
};

const CATEGORY_COLORS: { [key: string]: { bg: string; text: string } } = {
  'Hair Tools': { bg: '#FEF3C7', text: '#92400E' },
  'Face': { bg: '#DBEAFE', text: '#1E40AF' },
  'Lips': { bg: '#FCE7F3', text: '#9D174D' },
  'Eyes': { bg: '#E0E7FF', text: '#3730A3' },
  'General': { bg: '#F3F4F6', text: '#374151' },
  'Comparison': { bg: '#ECFDF5', text: '#065F46' },
};

const VELOCITY_CONFIG = {
  rising: { icon: Zap, color: '#10B981', bg: '#ECFDF5', label: 'Rising Fast' },
  steady: { icon: Activity, color: '#64748B', bg: '#F1F5F9', label: 'Steady' },
  cooling: { icon: TrendingDown, color: '#EF4444', bg: '#FEF2F2', label: 'Cooling' },
};

// Simple sparkline component
function Sparkline({ data, color = '#0EA5E9' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Word Cloud Component
function WordCloud({ items }: { items: TrendingItem[] }) {
  const maxMentions = Math.max(...items.map(i => i.mentions));

  return (
    <div className="flex flex-wrap gap-3 justify-center items-center p-6">
      {items.map((item, index) => {
        const size = 0.7 + (item.mentions / maxMentions) * 0.8;
        const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['General'];

        return (
          <button
            key={item.term}
            className="px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-110 hover:shadow-md cursor-pointer"
            style={{
              fontSize: `${size}rem`,
              backgroundColor: categoryColor.bg,
              color: categoryColor.text,
            }}
          >
            {item.term}
          </button>
        );
      })}
    </div>
  );
}

export default function TrendingPage() {
  const router = useRouter();
  const { settings, isLoaded, getBrandName } = useSettings();
  const [data, setData] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [selectedBrand, setSelectedBrand] = useState('Revlon');
  const [viewMode, setViewMode] = useState<'table' | 'cloud'>('table');
  const [settingsApplied, setSettingsApplied] = useState(false);

  // Apply settings
  useEffect(() => {
    if (isLoaded && !settingsApplied) {
      setDays(settings.defaultDays);
      const brandMap: Record<string, string> = {
        'revlon': 'Revlon',
        'elf': 'e.l.f.',
        'maybelline': 'Maybelline',
      };
      setSelectedBrand(brandMap[settings.selectedBrand] || 'Revlon');
      setSettingsApplied(true);
    }
  }, [isLoaded, settings, settingsApplied]);

  useEffect(() => {
    if (settingsApplied) {
      fetchTrending();
    }
  }, [days, selectedBrand, settingsApplied]);

  const fetchTrending = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const brandData = BRAND_TRENDING[selectedBrand]?.[days] || [];
    setData(brandData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Summary stats
  const totalMentions = data.reduce((sum, item) => sum + item.mentions, 0);
  const avgSentiment = data.length > 0 ? data.reduce((sum, item) => sum + item.sentiment, 0) / data.length : 0;
  const risingCount = data.filter(item => item.velocity === 'rising').length;
  const topCategory = data.length > 0
    ? Object.entries(data.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.mentions;
        return acc;
      }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0]
    : 'N/A';

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-[#1E293B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Trending Topics
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Most discussed terms and topics for {getBrandName()}
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
                onClick={() => alert('Export feature coming soon')}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Summary Stats Bar */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A]">{totalMentions.toLocaleString()}</p>
                  <p className="text-[11px] text-[#64748B]">Total Mentions</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A]">{data.length}</p>
                  <p className="text-[11px] text-[#64748B]">Trending Topics</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[22px] font-bold text-[#10B981]">{risingCount}</p>
                    <Zap className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <p className="text-[11px] text-[#64748B]">Rising Fast</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A]">{Math.round(avgSentiment * 100)}%</p>
                  <p className="text-[11px] text-[#64748B]">Avg Sentiment</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A]">{topCategory}</p>
                  <p className="text-[11px] text-[#64748B]">Top Category</p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                    viewMode === 'table' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cloud')}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                    viewMode === 'cloud' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Google Search Trends */}
          <SearchTrends />

          {/* Brand Keyword Explorer */}
          <BrandKeywordExplorer days={days} />

          {/* Word Cloud View */}
          {viewMode === 'cloud' && !loading && data.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-[#0F172A]">Topic Cloud</h2>
                  <p className="text-[10px] text-[#64748B]">Click a topic to explore mentions</p>
                </div>
                <div className="flex items-center gap-3">
                  {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, colors]) => (
                    <div key={cat} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.text }} />
                      <span className="text-[9px] text-[#64748B]">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <WordCloud items={data} />
            </div>
          )}

          {/* Trending Topics Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-medium text-[#0F172A]">
                {selectedBrand} Trending Topics
              </h2>
              <span className="text-[11px] text-[#64748B]">
                {data.length} topics tracked
              </span>
            </div>

            {(loading || !isLoaded) ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9]" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12 text-[#64748B]">
                No trending topics found for {selectedBrand}.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {data.map((item, index) => {
                  const velocityConfig = VELOCITY_CONFIG[item.velocity];
                  const VelocityIcon = velocityConfig.icon;
                  const categoryColors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['General'];

                  return (
                    <div key={item.term} className="p-4 hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                          <span className="text-[12px] font-bold text-[#64748B]">{index + 1}</span>
                        </div>

                        {/* Term & Category */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[14px] font-semibold text-[#0F172A]">{item.term}</h3>
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-medium"
                              style={{ backgroundColor: categoryColors.bg, color: categoryColors.text }}
                            >
                              {item.category}
                            </span>
                            <span
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium"
                              style={{ backgroundColor: velocityConfig.bg, color: velocityConfig.color }}
                            >
                              <VelocityIcon className="w-3 h-3" />
                              {velocityConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.relatedTerms.map((term, i) => (
                              <span key={i} className="text-[10px] text-[#94A3B8]">
                                #{term}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Sparkline */}
                        <div className="flex-shrink-0">
                          <Sparkline
                            data={item.sparkline}
                            color={item.change >= 0 ? '#10B981' : '#EF4444'}
                          />
                        </div>

                        {/* Mentions */}
                        <div className="w-24 text-right flex-shrink-0">
                          <p className="text-[14px] font-bold text-[#0F172A]">{item.mentions.toLocaleString()}</p>
                          <p className="text-[10px] text-[#64748B]">mentions</p>
                        </div>

                        {/* Sentiment */}
                        <div className="w-20 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${item.sentiment * 100}%`,
                                  backgroundColor: item.sentiment > 0.6 ? '#10B981' : item.sentiment > 0.4 ? '#F59E0B' : '#EF4444'
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-[#64748B]">{Math.round(item.sentiment * 100)}%</span>
                          </div>
                        </div>

                        {/* Change */}
                        <div className="w-20 text-right flex-shrink-0">
                          <div className={`flex items-center justify-end gap-1 ${item.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {item.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            <span className="text-[14px] font-bold">{Math.abs(item.change)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
