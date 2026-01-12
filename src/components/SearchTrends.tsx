'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Search, ExternalLink, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSettings } from '@/lib/SettingsContext';

interface TrendDataPoint {
  date: string;
  value: number;
  formattedDate: string;
}

interface InterestOverTimeResult {
  keyword: string;
  data: TrendDataPoint[];
  averageInterest: number;
}

interface RelatedQuery {
  query: string;
  value: number;
  link: string;
  type: 'top' | 'rising';
}

interface TrendsData {
  interestOverTime: InterestOverTimeResult[];
  relatedQueries: RelatedQuery[];
  geo: string;
  timeRange: string;
}

const BRANDS = ['Revlon', 'e.l.f. Cosmetics', 'Maybelline'];

const COLORS = {
  primary: '#0F172A',
  secondary: '#64748B',
  positive: '#10B981',
  negative: '#EF4444',
  accent: '#0EA5E9',
};

const DAYS_OPTIONS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
  { value: '12m', label: '12 months', days: 365 },
];

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
];

export function SearchTrends() {
  const { settings, isLoaded } = useSettings();

  // Map settings brand to display brand name
  const getBrandFromSettings = () => {
    const brandMap: Record<string, string> = {
      'revlon': 'Revlon',
      'elf': 'e.l.f. Cosmetics',
      'maybelline': 'Maybelline',
    };
    return brandMap[settings.selectedBrand] || 'Revlon';
  };

  const [selectedBrand, setSelectedBrand] = useState('Revlon');
  const [view, setView] = useState<'branded' | 'generic'>('branded');
  const [timeRange, setTimeRange] = useState('90d');
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendsData | null>(null);
  const [source, setSource] = useState<string>('');

  // Sync with settings when loaded
  useEffect(() => {
    if (isLoaded) {
      setSelectedBrand(getBrandFromSettings());
    }
  }, [isLoaded, settings.selectedBrand]);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const mode = view === 'branded' ? 'brand' : 'category';
      const params = new URLSearchParams({
        brand: selectedBrand,
        geo: country,
        timeRange,
        mode,
      });

      const response = await fetch(`/api/trends?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trends');
      }

      setData(result.data);
      setSource(result.source || 'unknown');
    } catch (err: any) {
      console.error('Error fetching trends:', err);
      setError(err.message || 'Failed to load trends data');
    } finally {
      setLoading(false);
    }
  }, [selectedBrand, country, timeRange, view]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
  const daysOption = DAYS_OPTIONS.find(d => d.value === timeRange) || DAYS_OPTIONS[2];

  // Prepare chart data from API response
  const chartData = data?.interestOverTime?.[0]?.data?.map(point => ({
    date: point.formattedDate,
    interest: point.value,
  })) || [];

  // Get related queries - for branded view, use brand-specific; for generic, use category queries
  const displayTerms = data?.relatedQueries || [];

  const googleTrendsUrl = view === 'branded'
    ? `https://trends.google.com/trends/explore?q=${encodeURIComponent(selectedBrand)}&geo=${country}&cat=44`
    : `https://trends.google.com/trends/explore?q=makeup%20tutorial,skincare%20routine&geo=${country}&cat=44`;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#4285F4]" />
          <h2 className="text-sm font-medium text-[#0F172A]">Google Search Trends</h2>
          {source && (
            <span className={`px-2 py-0.5 text-[9px] font-medium rounded ${
              source.includes('serpapi') || source === 'google-trends' || source === 'google-trends-api'
                ? 'bg-green-50 text-green-700'
                : source.includes('cache')
                ? 'bg-blue-50 text-blue-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {source.includes('serpapi') ? 'Live' :
               source === 'google-trends' || source === 'google-trends-api' ? 'Live' :
               source.includes('cache') ? 'Cached' : 'Simulated'}
            </span>
          )}
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
              Brand Interest
            </button>
            <button
              onClick={() => setView('generic')}
              className={`px-3 py-1 text-[10px] font-medium rounded transition-colors ${
                view === 'generic'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Keywords
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

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
          >
            {DAYS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Country Selector */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchTrends}
            disabled={loading}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href={googleTrendsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-[#0EA5E9] hover:underline"
          >
            <span>Open Trends</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9]" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center h-[200px] text-[#EF4444]">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Chart (for branded view with data) */}
          {view === 'branded' && chartData.length > 0 && (
            <div className="h-[160px] mb-4">
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

              {/* Average Interest Badge */}
              {data?.interestOverTime?.[0]?.averageInterest && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-[10px] text-[#64748B]">Avg. Interest:</span>
                  <span className="text-[12px] font-semibold text-[#0F172A]">
                    {data.interestOverTime[0].averageInterest}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Section Label */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wide font-medium">
              {view === 'branded' ? `Related Searches for ${selectedBrand}` : 'Trending Beauty Keywords'}
            </span>
            <span className="text-[9px] text-[#94A3B8] ml-auto">
              {displayTerms.length} {view === 'branded' ? 'related queries' : 'trending terms'}
            </span>
          </div>

          {/* Terms Grid */}
          {displayTerms.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {displayTerms.slice(0, 12).map((term, index) => (
                <a
                  key={`${term.query}-${index}`}
                  href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(term.query)}&geo=${country}&cat=44`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#0F172A] hover:bg-[#F8FAFC] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-medium text-[#0F172A] truncate group-hover:text-[#0EA5E9]">
                        {term.query}
                      </p>
                      {term.type === 'rising' && (
                        <span className="px-1.5 py-0.5 text-[8px] font-medium bg-green-50 text-green-700 rounded">
                          Rising
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-14 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, term.value)}%`,
                            backgroundColor: term.value > 70 ? COLORS.primary : '#94A3B8',
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-[#64748B]">{Math.min(100, term.value)}</span>
                    </div>
                  </div>
                  {term.type === 'rising' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5" />
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#64748B]">
              <p className="text-sm">No trending data available</p>
              <p className="text-xs mt-1">Try a different market or time range</p>
            </div>
          )}

          {/* Footer */}
          <p className="text-[9px] text-[#94A3B8] text-center mt-4 pt-3 border-t border-[#E2E8F0]">
            {selectedCountry.flag} {selectedCountry.name} • Last {daysOption.label} •
            {source?.includes('serpapi') || source === 'google-trends' || source === 'google-trends-api'
              ? ' Live data from Google Trends'
              : source?.includes('cache')
              ? ' Cached data'
              : ' Simulated data patterns'}
          </p>
        </>
      )}
    </div>
  );
}
