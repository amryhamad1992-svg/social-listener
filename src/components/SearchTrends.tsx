'use client';

import { useState, useMemo } from 'react';
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

// Generate chart data based on days
function generateChartData(days: number, brand: string): Array<{ date: string; interest: number }> {
  const baseInterest: { [key: string]: number } = {
    'Revlon': 65,
    'e.l.f.': 78,
    'Maybelline': 70,
  };

  const base = baseInterest[brand] || 65;
  const data: Array<{ date: string; interest: number }> = [];
  const now = new Date();

  // Number of data points based on days
  const points = days <= 7 ? 7 : days <= 14 ? 7 : days <= 30 ? 8 : 10;
  const interval = Math.floor(days / points);

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * interval));

    // Add some variation
    const variation = Math.sin(i * 0.8) * 15 + Math.random() * 10;
    const interest = Math.min(100, Math.max(20, Math.round(base + variation)));

    // Format date based on range
    let dateStr: string;
    if (days <= 7) {
      dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (days <= 14) {
      dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    data.push({ date: dateStr, interest });
  }

  return data;
}

// Generate trend terms based on days (different trends for different periods)
function getBrandedTerms(brand: string, days: number): TrendTerm[] {
  const allTerms: { [key: string]: { [key: number]: TrendTerm[] } } = {
    'Revlon': {
      7: [
        { term: 'revlon colorstay', interest: 72, change: 8, type: 'branded' },
        { term: 'revlon one step', interest: 85, change: 32, type: 'branded' },
        { term: 'revlon lipstick', interest: 58, change: 12, type: 'branded' },
        { term: 'revlon hair dryer', interest: 82, change: 25, type: 'branded' },
        { term: 'revlon super lustrous', interest: 65, change: -3, type: 'branded' },
        { term: 'revlon foundation', interest: 45, change: 5, type: 'branded' },
      ],
      14: [
        { term: 'revlon one step', interest: 80, change: 28, type: 'branded' },
        { term: 'revlon colorstay', interest: 68, change: 5, type: 'branded' },
        { term: 'revlon hair dryer', interest: 78, change: 20, type: 'branded' },
        { term: 'revlon lipstick', interest: 62, change: 15, type: 'branded' },
        { term: 'revlon super lustrous', interest: 60, change: 2, type: 'branded' },
        { term: 'revlon makeup', interest: 48, change: 8, type: 'branded' },
      ],
      30: [
        { term: 'revlon one step hair dryer', interest: 75, change: 22, type: 'branded' },
        { term: 'revlon colorstay foundation', interest: 65, change: 10, type: 'branded' },
        { term: 'revlon super lustrous lipstick', interest: 58, change: 5, type: 'branded' },
        { term: 'revlon hair dryer brush', interest: 72, change: 18, type: 'branded' },
        { term: 'revlon lip liner', interest: 42, change: -2, type: 'branded' },
        { term: 'revlon mascara', interest: 38, change: 3, type: 'branded' },
      ],
      90: [
        { term: 'revlon colorstay', interest: 70, change: 15, type: 'branded' },
        { term: 'revlon one step', interest: 78, change: 35, type: 'branded' },
        { term: 'revlon super lustrous', interest: 55, change: 8, type: 'branded' },
        { term: 'revlon hair tools', interest: 68, change: 42, type: 'branded' },
        { term: 'revlon lipstick shades', interest: 52, change: 12, type: 'branded' },
        { term: 'revlon foundation match', interest: 45, change: 6, type: 'branded' },
      ],
    },
    'e.l.f.': {
      7: [
        { term: 'elf halo glow', interest: 92, change: 45, type: 'branded' },
        { term: 'elf power grip primer', interest: 88, change: 22, type: 'branded' },
        { term: 'elf camo concealer', interest: 82, change: 15, type: 'branded' },
        { term: 'elf bronzing drops', interest: 78, change: 55, type: 'branded' },
        { term: 'elf dupe', interest: 72, change: 28, type: 'branded' },
        { term: 'elf makeup', interest: 68, change: 10, type: 'branded' },
      ],
      14: [
        { term: 'elf power grip primer', interest: 90, change: 25, type: 'branded' },
        { term: 'elf halo glow', interest: 88, change: 38, type: 'branded' },
        { term: 'elf bronzing drops', interest: 75, change: 48, type: 'branded' },
        { term: 'elf camo concealer', interest: 80, change: 12, type: 'branded' },
        { term: 'elf lip oil', interest: 65, change: 35, type: 'branded' },
        { term: 'elf dupe charlotte tilbury', interest: 70, change: 32, type: 'branded' },
      ],
      30: [
        { term: 'elf power grip primer', interest: 85, change: 20, type: 'branded' },
        { term: 'elf halo glow filter', interest: 82, change: 32, type: 'branded' },
        { term: 'elf camo cc cream', interest: 72, change: 18, type: 'branded' },
        { term: 'elf bronzing drops', interest: 70, change: 42, type: 'branded' },
        { term: 'elf putty primer', interest: 65, change: 8, type: 'branded' },
        { term: 'elf sephora', interest: 58, change: 15, type: 'branded' },
      ],
      90: [
        { term: 'elf camo concealer', interest: 88, change: 25, type: 'branded' },
        { term: 'elf power grip primer', interest: 92, change: 35, type: 'branded' },
        { term: 'elf halo glow', interest: 85, change: 52, type: 'branded' },
        { term: 'elf makeup', interest: 76, change: 18, type: 'branded' },
        { term: 'elf dupe', interest: 68, change: 40, type: 'branded' },
        { term: 'elf bronzing drops', interest: 72, change: 65, type: 'branded' },
      ],
    },
    'Maybelline': {
      7: [
        { term: 'maybelline sky high mascara', interest: 88, change: 18, type: 'branded' },
        { term: 'maybelline vinyl ink', interest: 78, change: 25, type: 'branded' },
        { term: 'maybelline fit me', interest: 70, change: 8, type: 'branded' },
        { term: 'maybelline superstay', interest: 65, change: 12, type: 'branded' },
        { term: 'maybelline concealer', interest: 62, change: 5, type: 'branded' },
        { term: 'maybelline lash sensational', interest: 58, change: -2, type: 'branded' },
      ],
      14: [
        { term: 'maybelline sky high', interest: 85, change: 15, type: 'branded' },
        { term: 'maybelline vinyl ink', interest: 75, change: 22, type: 'branded' },
        { term: 'maybelline superstay lipstick', interest: 68, change: 10, type: 'branded' },
        { term: 'maybelline fit me foundation', interest: 72, change: 6, type: 'branded' },
        { term: 'maybelline instant age rewind', interest: 60, change: 8, type: 'branded' },
        { term: 'maybelline falsies', interest: 55, change: 3, type: 'branded' },
      ],
      30: [
        { term: 'maybelline sky high mascara', interest: 82, change: 12, type: 'branded' },
        { term: 'maybelline fit me', interest: 70, change: 8, type: 'branded' },
        { term: 'maybelline superstay', interest: 65, change: 5, type: 'branded' },
        { term: 'maybelline vinyl ink lip', interest: 72, change: 18, type: 'branded' },
        { term: 'maybelline age rewind', interest: 58, change: 10, type: 'branded' },
        { term: 'maybelline matte lipstick', interest: 52, change: 2, type: 'branded' },
      ],
      90: [
        { term: 'maybelline sky high mascara', interest: 85, change: 20, type: 'branded' },
        { term: 'maybelline fit me', interest: 72, change: 12, type: 'branded' },
        { term: 'maybelline superstay', interest: 68, change: 8, type: 'branded' },
        { term: 'maybelline vinyl ink', interest: 75, change: 32, type: 'branded' },
        { term: 'maybelline lash sensational', interest: 62, change: 10, type: 'branded' },
        { term: 'maybelline concealer', interest: 58, change: 5, type: 'branded' },
      ],
    },
  };

  return allTerms[brand]?.[days] || allTerms[brand]?.[90] || [];
}

// Generic beauty category terms by time period
function getGenericTerms(days: number): TrendTerm[] {
  const allTerms: { [key: number]: TrendTerm[] } = {
    7: [
      { term: 'clean girl makeup', interest: 92, change: 35, type: 'generic' },
      { term: 'lip combo', interest: 88, change: 48, type: 'generic' },
      { term: 'viral mascara', interest: 95, change: 32, type: 'generic' },
      { term: 'glass skin routine', interest: 82, change: 25, type: 'generic' },
      { term: 'drugstore dupes', interest: 78, change: 18, type: 'generic' },
      { term: 'makeup tutorial', interest: 90, change: 5, type: 'generic' },
      { term: 'holiday makeup', interest: 85, change: 65, type: 'generic' },
      { term: 'winter skincare', interest: 72, change: 42, type: 'generic' },
    ],
    14: [
      { term: 'makeup tutorial', interest: 92, change: 8, type: 'generic' },
      { term: 'clean girl aesthetic', interest: 88, change: 28, type: 'generic' },
      { term: 'viral mascara tiktok', interest: 90, change: 35, type: 'generic' },
      { term: 'lip combo ideas', interest: 82, change: 42, type: 'generic' },
      { term: 'drugstore foundation', interest: 75, change: 15, type: 'generic' },
      { term: 'glass skin', interest: 80, change: 20, type: 'generic' },
      { term: 'affordable makeup', interest: 70, change: 12, type: 'generic' },
      { term: 'sephora sale', interest: 68, change: 55, type: 'generic' },
    ],
    30: [
      { term: 'makeup tutorial', interest: 95, change: 5, type: 'generic' },
      { term: 'clean girl makeup', interest: 85, change: 25, type: 'generic' },
      { term: 'drugstore dupes', interest: 80, change: 22, type: 'generic' },
      { term: 'viral mascara', interest: 88, change: 28, type: 'generic' },
      { term: 'glass skin', interest: 78, change: 18, type: 'generic' },
      { term: 'best drugstore foundation', interest: 82, change: 15, type: 'generic' },
      { term: 'lip combo', interest: 76, change: 38, type: 'generic' },
      { term: 'affordable makeup', interest: 72, change: 12, type: 'generic' },
    ],
    90: [
      { term: 'best drugstore foundation', interest: 82, change: 15, type: 'generic' },
      { term: 'makeup tutorial', interest: 95, change: 5, type: 'generic' },
      { term: 'clean girl makeup', interest: 88, change: 32, type: 'generic' },
      { term: 'lip combo', interest: 76, change: 45, type: 'generic' },
      { term: 'viral mascara', interest: 90, change: 28, type: 'generic' },
      { term: 'glass skin', interest: 85, change: 18, type: 'generic' },
      { term: 'drugstore dupes', interest: 78, change: 22, type: 'generic' },
      { term: 'affordable makeup', interest: 72, change: 12, type: 'generic' },
    ],
  };

  return allTerms[days] || allTerms[90];
}

const BRANDS = ['Revlon', 'e.l.f.', 'Maybelline'];

const COLORS = {
  primary: '#0F172A',
  positive: '#86EFAC',
  negative: '#FCA5A5',
  accent: '#0EA5E9',
};

const DAYS_OPTIONS = [
  { value: 7, label: '7 days', trendsParam: 'now 7-d' },
  { value: 14, label: '14 days', trendsParam: 'today 1-m' },
  { value: 30, label: '30 days', trendsParam: 'today 1-m' },
  { value: 90, label: '90 days', trendsParam: 'today 3-m' },
];

export function SearchTrends() {
  const [selectedBrand, setSelectedBrand] = useState('Revlon');
  const [view, setView] = useState<'branded' | 'generic'>('branded');
  const [days, setDays] = useState(90);

  // Generate dynamic data based on selections
  const chartData = useMemo(() => generateChartData(days, selectedBrand), [days, selectedBrand]);
  const brandedTerms = useMemo(() => getBrandedTerms(selectedBrand, days), [selectedBrand, days]);
  const genericTerms = useMemo(() => getGenericTerms(days), [days]);

  const displayTerms = view === 'branded' ? brandedTerms : genericTerms;

  const daysOption = DAYS_OPTIONS.find(d => d.value === days) || DAYS_OPTIONS[3];
  const googleTrendsUrl = view === 'branded'
    ? `https://trends.google.com/trends/explore?q=${encodeURIComponent(selectedBrand)}&geo=US&cat=44&date=${encodeURIComponent(daysOption.trendsParam)}`
    : `https://trends.google.com/trends/explore?q=drugstore%20makeup,makeup%20tutorial&geo=US&cat=44&date=${encodeURIComponent(daysOption.trendsParam)}`;

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

          {/* Days Selector */}
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
          >
            {DAYS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

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
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        <span className="text-[9px] text-[#94A3B8] ml-auto">Last {days} days</span>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-2 gap-2">
        {displayTerms.map((term) => (
          <a
            key={term.term}
            href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(term.term)}&geo=US&cat=44&date=${encodeURIComponent(daysOption.trendsParam)}`}
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
