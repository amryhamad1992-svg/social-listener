'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Search, ExternalLink } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendTerm {
  term: string;
  interest: number;
  change: number;
  type: 'branded' | 'generic';
}

interface BrandTrends {
  branded: TrendTerm[];
  chartData: Array<{ date: string; interest: number }>;
}

// Mock trend data by brand
const BRAND_TRENDS: { [key: string]: BrandTrends } = {
  Revlon: {
    branded: [
      { term: 'revlon colorstay', interest: 72, change: 8, type: 'branded' },
      { term: 'revlon super lustrous', interest: 65, change: -3, type: 'branded' },
      { term: 'revlon lipstick', interest: 58, change: 12, type: 'branded' },
      { term: 'revlon foundation', interest: 45, change: 5, type: 'branded' },
      { term: 'revlon hair dryer', interest: 82, change: 25, type: 'branded' },
      { term: 'revlon one step', interest: 78, change: 18, type: 'branded' },
    ],
    chartData: [
      { date: 'Oct 1', interest: 55 },
      { date: 'Oct 15', interest: 62 },
      { date: 'Nov 1', interest: 58 },
      { date: 'Nov 15', interest: 70 },
      { date: 'Dec 1', interest: 85 },
      { date: 'Dec 15', interest: 78 },
      { date: 'Dec 27', interest: 72 },
    ],
  },
  'e.l.f.': {
    branded: [
      { term: 'elf camo concealer', interest: 88, change: 15, type: 'branded' },
      { term: 'elf power grip primer', interest: 92, change: 22, type: 'branded' },
      { term: 'elf halo glow', interest: 85, change: 35, type: 'branded' },
      { term: 'elf makeup', interest: 76, change: 10, type: 'branded' },
      { term: 'elf dupe', interest: 68, change: 28, type: 'branded' },
      { term: 'elf bronzing drops', interest: 72, change: 45, type: 'branded' },
    ],
    chartData: [
      { date: 'Oct 1', interest: 65 },
      { date: 'Oct 15', interest: 72 },
      { date: 'Nov 1', interest: 78 },
      { date: 'Nov 15', interest: 82 },
      { date: 'Dec 1', interest: 90 },
      { date: 'Dec 15', interest: 88 },
      { date: 'Dec 27', interest: 85 },
    ],
  },
  Maybelline: {
    branded: [
      { term: 'maybelline sky high mascara', interest: 85, change: 12, type: 'branded' },
      { term: 'maybelline fit me', interest: 72, change: 5, type: 'branded' },
      { term: 'maybelline superstay', interest: 68, change: -2, type: 'branded' },
      { term: 'maybelline vinyl ink', interest: 75, change: 18, type: 'branded' },
      { term: 'maybelline lash sensational', interest: 62, change: 8, type: 'branded' },
      { term: 'maybelline concealer', interest: 58, change: 3, type: 'branded' },
    ],
    chartData: [
      { date: 'Oct 1', interest: 60 },
      { date: 'Oct 15', interest: 65 },
      { date: 'Nov 1', interest: 70 },
      { date: 'Nov 15', interest: 72 },
      { date: 'Dec 1', interest: 78 },
      { date: 'Dec 15', interest: 75 },
      { date: 'Dec 27', interest: 72 },
    ],
  },
};

// Generic beauty category terms (not brand-specific)
const GENERIC_TRENDS: TrendTerm[] = [
  { term: 'best drugstore foundation', interest: 82, change: 15, type: 'generic' },
  { term: 'makeup tutorial', interest: 95, change: 5, type: 'generic' },
  { term: 'clean girl makeup', interest: 88, change: 32, type: 'generic' },
  { term: 'lip combo', interest: 76, change: 45, type: 'generic' },
  { term: 'viral mascara', interest: 90, change: 28, type: 'generic' },
  { term: 'glass skin', interest: 85, change: 18, type: 'generic' },
  { term: 'drugstore dupes', interest: 78, change: 22, type: 'generic' },
  { term: 'affordable makeup', interest: 72, change: 12, type: 'generic' },
];

const BRANDS = ['Revlon', 'e.l.f.', 'Maybelline'];

// Pastel colors
const COLORS = {
  primary: '#0F172A',
  positive: '#86EFAC',
  negative: '#FCA5A5',
  accent: '#0EA5E9',
};

export function SearchTrends() {
  const [selectedBrand, setSelectedBrand] = useState('Revlon');
  const [view, setView] = useState<'branded' | 'generic'>('branded');

  const brandData = BRAND_TRENDS[selectedBrand];
  const displayTerms = view === 'branded' ? brandData.branded : GENERIC_TRENDS;

  const googleTrendsUrl = view === 'branded'
    ? `https://trends.google.com/trends/explore?q=${encodeURIComponent(selectedBrand)}&geo=US&cat=44`
    : `https://trends.google.com/trends/explore?q=drugstore%20makeup,makeup%20tutorial&geo=US&cat=44`;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#4285F4]" />
          <h2 className="text-sm font-medium text-[#0F172A]">Google Search Trends</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[#F1F5F9] rounded-md p-0.5">
            <button
              onClick={() => setView('branded')}
              className={`px-3 py-1 text-[10px] font-medium rounded transition-colors ${
                view === 'branded'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Branded
            </button>
            <button
              onClick={() => setView('generic')}
              className={`px-3 py-1 text-[10px] font-medium rounded transition-colors ${
                view === 'generic'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Category
            </button>
          </div>

          {/* Brand Selector (only for branded view) */}
          {view === 'branded' && (
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
            >
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          )}

          <a
            href={googleTrendsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-[#0EA5E9] hover:underline"
          >
            <span>Google Trends</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Chart (only for branded view) */}
      {view === 'branded' && (
        <div className="h-[140px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={brandData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                }}
                formatter={(value) => [`${value}`, 'Search Interest']}
              />
              <Line
                type="monotone"
                dataKey="interest"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ fill: COLORS.primary, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: COLORS.accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Section Label */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E2E8F0]">
        <span className="text-[10px] text-[#64748B] uppercase tracking-wide font-medium">
          {view === 'branded' ? `Top ${selectedBrand} Searches` : 'Trending Beauty Terms'}
        </span>
        <span className="text-[9px] text-[#94A3B8] ml-auto">Last 90 days</span>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-2 gap-2">
        {displayTerms.map((term) => (
          <a
            key={term.term}
            href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(term.term)}&geo=US&cat=44`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#0F172A] hover:bg-[#F8FAFC] transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[#0F172A] truncate group-hover:text-[#0EA5E9]">
                {term.term}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${term.interest}%`,
                        backgroundColor: term.interest > 70 ? COLORS.primary : '#94A3B8',
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-[#64748B]">{term.interest}</span>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
              term.change > 0 ? 'text-[#166534]' : term.change < 0 ? 'text-[#991B1B]' : 'text-[#64748B]'
            }`}>
              {term.change > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : term.change < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              <span>{term.change > 0 ? '+' : ''}{term.change}%</span>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <p className="text-[9px] text-[#94A3B8] text-center mt-3 pt-2 border-t border-[#E2E8F0]">
        Search interest scores (0-100) • Data simulated from Google Trends patterns
      </p>
    </div>
  );
}
