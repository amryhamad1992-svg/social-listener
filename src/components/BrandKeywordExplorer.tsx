'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface KeywordData {
  keyword: string;
  mentions: number;
  sentiment: number;
  engagement: number;
}

interface BrandKeywords {
  [key: string]: KeywordData[];
}

// Generic beauty terms for cross-brand comparison
// These are terms people search alongside any brand
const BRAND_KEYWORDS: BrandKeywords = {
  Revlon: [
    { keyword: 'affordable', mentions: 420, sentiment: 0.62, engagement: 12000 },
    { keyword: 'drugstore', mentions: 380, sentiment: 0.58, engagement: 9500 },
    { keyword: 'long-lasting', mentions: 290, sentiment: 0.45, engagement: 7200 },
    { keyword: 'full coverage', mentions: 260, sentiment: 0.52, engagement: 6800 },
    { keyword: 'lipstick', mentions: 520, sentiment: 0.68, engagement: 15000 },
    { keyword: 'foundation', mentions: 340, sentiment: 0.42, engagement: 8900 },
    { keyword: 'mascara', mentions: 180, sentiment: 0.55, engagement: 4500 },
    { keyword: 'dupe', mentions: 120, sentiment: 0.48, engagement: 3200 },
    { keyword: 'viral', mentions: 85, sentiment: 0.38, engagement: 2100 },
    { keyword: 'TikTok', mentions: 95, sentiment: 0.42, engagement: 2800 },
  ],
  'e.l.f.': [
    { keyword: 'affordable', mentions: 890, sentiment: 0.82, engagement: 28000 },
    { keyword: 'drugstore', mentions: 420, sentiment: 0.75, engagement: 12500 },
    { keyword: 'long-lasting', mentions: 340, sentiment: 0.68, engagement: 9800 },
    { keyword: 'full coverage', mentions: 380, sentiment: 0.72, engagement: 11200 },
    { keyword: 'lipstick', mentions: 290, sentiment: 0.65, engagement: 8500 },
    { keyword: 'foundation', mentions: 420, sentiment: 0.78, engagement: 13500 },
    { keyword: 'mascara', mentions: 220, sentiment: 0.62, engagement: 6200 },
    { keyword: 'dupe', mentions: 680, sentiment: 0.85, engagement: 32000 },
    { keyword: 'viral', mentions: 520, sentiment: 0.78, engagement: 24000 },
    { keyword: 'TikTok', mentions: 750, sentiment: 0.82, engagement: 38000 },
  ],
  Maybelline: [
    { keyword: 'affordable', mentions: 520, sentiment: 0.65, engagement: 14500 },
    { keyword: 'drugstore', mentions: 480, sentiment: 0.62, engagement: 12800 },
    { keyword: 'long-lasting', mentions: 410, sentiment: 0.58, engagement: 10500 },
    { keyword: 'full coverage', mentions: 320, sentiment: 0.55, engagement: 8200 },
    { keyword: 'lipstick', mentions: 380, sentiment: 0.68, engagement: 11000 },
    { keyword: 'foundation', mentions: 450, sentiment: 0.62, engagement: 13200 },
    { keyword: 'mascara', mentions: 680, sentiment: 0.78, engagement: 22000 },
    { keyword: 'dupe', mentions: 280, sentiment: 0.52, engagement: 7500 },
    { keyword: 'viral', mentions: 320, sentiment: 0.65, engagement: 9800 },
    { keyword: 'TikTok', mentions: 420, sentiment: 0.68, engagement: 14500 },
  ],
};

const BRANDS = ['Revlon', 'e.l.f.', 'Maybelline'];

// Simple, clear colors - Primary brand is dark, comparison is light
const BRAND_COLORS = {
  primary: '#0F172A',      // Dark navy for selected brand
  comparison: '#94A3B8',   // Light gray for comparison brand
};

// Sentiment badge colors (separate from bar colors)
const SENTIMENT = {
  positive: { bg: '#DCFCE7', text: '#166534', label: 'Positive' },
  neutral: { bg: '#F1F5F9', text: '#475569', label: 'Neutral' },
  negative: { bg: '#FEE2E2', text: '#991B1B', label: 'Negative' },
};

interface BrandKeywordExplorerProps {
  days?: number;
}

export function BrandKeywordExplorer({ days = 7 }: BrandKeywordExplorerProps) {
  const { settings, isLoaded } = useSettings();

  // Map settings brand to display brand name
  const getBrandFromSettings = () => {
    const brandMap: Record<string, string> = {
      'revlon': 'Revlon',
      'elf': 'e.l.f.',
      'maybelline': 'Maybelline',
    };
    return brandMap[settings.selectedBrand] || 'Revlon';
  };

  const [selectedBrand, setSelectedBrand] = useState('Revlon');
  const [compareBrand, setCompareBrand] = useState<string | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  // Sync with settings when loaded
  useEffect(() => {
    if (isLoaded) {
      setSelectedBrand(getBrandFromSettings());
    }
  }, [isLoaded, settings.selectedBrand]);

  const getSentiment = (score: number) => {
    if (score >= 0.6) return SENTIMENT.positive;
    if (score >= 0.45) return SENTIMENT.neutral;
    return SENTIMENT.negative;
  };

  const primaryData = BRAND_KEYWORDS[selectedBrand] || [];
  const compareData = compareBrand ? BRAND_KEYWORDS[compareBrand] || [] : [];

  // Sort by mentions for chart
  const sortedPrimaryData = [...primaryData].sort((a, b) => b.mentions - a.mentions).slice(0, 6);

  // Prepare comparison data - simple structure
  const chartData = sortedPrimaryData.map(item => {
    const compareItem = compareData.find(c => c.keyword.toLowerCase() === item.keyword.toLowerCase());
    return {
      keyword: item.keyword,
      [selectedBrand]: item.mentions,
      sentiment: item.sentiment,
      ...(compareBrand ? {
        [compareBrand]: compareItem?.mentions || 0,
      } : {}),
    };
  });

  // Calculate totals for share of voice
  const primaryTotal = primaryData.reduce((sum, item) => sum + item.mentions, 0);
  const compareTotal = compareBrand ? compareData.reduce((sum, item) => sum + item.mentions, 0) : 0;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-lg">
          <p className="text-[12px] font-medium text-[#0F172A] mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-[11px]">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.dataKey === selectedBrand ? BRAND_COLORS.primary : BRAND_COLORS.comparison }}
              />
              <span className="text-[#64748B]">{entry.name}:</span>
              <span className="font-medium text-[#0F172A]">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#64748B]" />
          <h2 className="text-sm font-medium text-[#0F172A]">Brand Keyword Analysis</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[#F1F5F9] rounded-md p-0.5">
            <button
              onClick={() => setView('chart')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
                view === 'chart'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
                view === 'table'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Table
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#64748B]">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
            >
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#64748B]">Compare:</span>
            <select
              value={compareBrand || ''}
              onChange={(e) => setCompareBrand(e.target.value || null)}
              className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
            >
              <option value="">None</option>
              {BRANDS.filter(b => b !== selectedBrand).map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Share of Voice (when comparing) */}
      {compareBrand && (
        <div className="mb-4 p-3 bg-[#F8FAFC] rounded-lg">
          <div className="text-[10px] text-[#64748B] uppercase tracking-wide mb-2 font-medium">
            Share of Voice (Total Mentions)
          </div>
          <div className="flex h-6 rounded-md overflow-hidden">
            <div
              className="flex items-center justify-center text-[11px] font-medium text-white transition-all"
              style={{ width: `${(primaryTotal / (primaryTotal + compareTotal)) * 100}%`, backgroundColor: BRAND_COLORS.primary }}
            >
              {selectedBrand}: {((primaryTotal / (primaryTotal + compareTotal)) * 100).toFixed(0)}%
            </div>
            <div
              className="flex items-center justify-center text-[11px] font-medium text-white transition-all"
              style={{ width: `${(compareTotal / (primaryTotal + compareTotal)) * 100}%`, backgroundColor: BRAND_COLORS.comparison }}
            >
              {compareBrand}: {((compareTotal / (primaryTotal + compareTotal)) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Chart View */}
      {view === 'chart' && (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="keyword"
                tick={{ fontSize: 11, fill: '#0F172A' }}
                axisLine={false}
                tickLine={false}
                width={75}
              />
              <Tooltip content={<CustomTooltip />} />
              {compareBrand && (
                <Legend
                  verticalAlign="top"
                  height={30}
                  formatter={(value) => <span className="text-[11px] text-[#64748B]">{value}</span>}
                />
              )}
              <Bar
                dataKey={selectedBrand}
                fill={BRAND_COLORS.primary}
                radius={[0, 4, 4, 0]}
                barSize={compareBrand ? 12 : 20}
              />
              {compareBrand && (
                <Bar
                  dataKey={compareBrand}
                  fill={BRAND_COLORS.comparison}
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left text-[10px] text-[#64748B] uppercase tracking-wide py-2 font-medium">Keyword</th>
                <th className="text-right text-[10px] text-[#64748B] uppercase tracking-wide py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded" style={{ backgroundColor: BRAND_COLORS.primary }}></span>
                    {selectedBrand}
                  </span>
                </th>
                <th className="text-center text-[10px] text-[#64748B] uppercase tracking-wide py-2 font-medium">Sentiment</th>
                {compareBrand && (
                  <>
                    <th className="text-right text-[10px] text-[#64748B] uppercase tracking-wide py-2 font-medium pl-4">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded" style={{ backgroundColor: BRAND_COLORS.comparison }}></span>
                        {compareBrand}
                      </span>
                    </th>
                    <th className="text-center text-[10px] text-[#64748B] uppercase tracking-wide py-2 font-medium">Diff</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedPrimaryData.map((item) => {
                const compareItem = compareData.find(c => c.keyword.toLowerCase() === item.keyword.toLowerCase());
                const diff = compareItem ? ((item.mentions - compareItem.mentions) / compareItem.mentions) * 100 : 0;
                const sentimentStyle = getSentiment(item.sentiment);

                return (
                  <tr key={item.keyword} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="py-2.5">
                      <span className="text-[12px] font-medium text-[#0F172A]">{item.keyword}</span>
                    </td>
                    <td className="text-right py-2.5">
                      <span className="text-[12px] font-semibold text-[#0F172A]">{item.mentions.toLocaleString()}</span>
                    </td>
                    <td className="text-center py-2.5">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: sentimentStyle.bg, color: sentimentStyle.text }}
                      >
                        {sentimentStyle.label}
                      </span>
                    </td>
                    {compareBrand && (
                      <>
                        <td className="text-right py-2.5 pl-4">
                          <span className="text-[12px] text-[#64748B]">
                            {compareItem ? compareItem.mentions.toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className="text-center py-2.5">
                          {compareItem ? (
                            <div className={`flex items-center justify-center gap-0.5 text-[10px] font-medium ${
                              diff > 0 ? 'text-[#166534]' : diff < 0 ? 'text-[#991B1B]' : 'text-[#64748B]'
                            }`}>
                              {diff > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : diff < 0 ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              <span>{diff > 0 ? '+' : ''}{diff.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#94A3B8]">-</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend - simpler */}
      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.primary }} />
              <span className="text-[10px] text-[#64748B]">{selectedBrand}</span>
            </div>
            {compareBrand && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.comparison }} />
                <span className="text-[10px] text-[#64748B]">{compareBrand}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-[9px] text-[#94A3B8]">
            <span>Sentiment shown as badges in table view</span>
          </div>
        </div>
      </div>
    </div>
  );
}
