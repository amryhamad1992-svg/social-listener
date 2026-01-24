'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Radar,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

interface TrendItem {
  term: string;
  category: string;
  velocity: number;
  volume: number;
  platforms: {
    tiktok: number;
    instagram: number;
    youtube: number;
    reddit: number;
    twitter: number;
    web: number;
  };
  totalSources: number;
  sentiment: number;
  relatedTerms: string[];
  samplePosts: Array<{
    platform: string;
    text: string;
    engagement: number;
    date: string;
    url?: string;
  }>;
}

interface MainCategoryInfo {
  id: string;
  name: string;
  subCategories: string[];
}

interface SubCategoryInfo {
  id: string;
  name: string;
  amazonCategory: string;
  parentCategory: string;
}

interface TrendSummary {
  totalTrends: number;
  tiktokTrends: number;
  multiPlatform: number;
  avgVelocity: number;
  topPlatform: string;
  totalSources: number;
}

interface TrendData {
  category: string;
  amazonCategory: string;
  parentCategory: string;
  timeRange: string;
  summary: TrendSummary;
  trends: TrendItem[];
  mainCategories: MainCategoryInfo[];
  subCategories: SubCategoryInfo[];
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#00f2ea',
  instagram: '#E4405F',
  youtube: '#FF0000',
  reddit: '#FF4500',
  twitter: '#1DA1F2',
  web: '#64748B',
};

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  reddit: 'Reddit',
  twitter: 'X',
  web: 'Web',
};


const TIME_OPTIONS = [
  { value: '1d', label: 'Yesterday' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'web', label: 'Web' },
];

export default function TrendRadarPage() {
  const router = useRouter();
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState('beauty');
  const [selectedSubCategory, setSelectedSubCategory] = useState('skincare');
  const [timeRange, setTimeRange] = useState('7d');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [source, setSource] = useState('');

  // Get available sub-categories for the selected main category
  const getAvailableSubCategories = useCallback(() => {
    if (!data?.mainCategories || !data?.subCategories) return [];
    const mainCat = data.mainCategories.find(c => c.id === selectedMainCategory);
    if (!mainCat) return [];
    return data.subCategories.filter(sub => mainCat.subCategories.includes(sub.id));
  }, [data, selectedMainCategory]);

  const fetchTrendData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        category: selectedSubCategory,
        timeRange,
        platform: platformFilter,
      });

      const response = await fetch(`/api/trend-radar?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trend data');
      }

      setData(result.data);
      setSource(result.source || 'unknown');

      // Auto-select first trend if none selected
      if (result.data.trends.length > 0 && !selectedTrend) {
        setSelectedTrend(result.data.trends[0]);
      }
    } catch (err: any) {
      console.error('Error fetching trend data:', err);
      setError(err.message || 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  }, [selectedSubCategory, timeRange, platformFilter]);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <div className="px-8 pt-6 pb-8 space-y-6">
          {/* Header with Logo and Inline Filters - Matching Other Pages */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-6">
              {/* Logo Section */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center flex-shrink-0">
                  <Radar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[15px] font-semibold text-[#0F172A]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Trend Radar
                  </h1>
                  <p className="text-[11px] text-[#64748B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    What's trending across social media
                  </p>
                </div>
                {source && (
                  <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full ${
                    source === 'brave' || source === 'cache' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {source === 'brave' ? 'Live' : source === 'cache' ? 'Cached' : 'Demo'}
                  </span>
                )}
              </div>

              <div className="w-px h-10 bg-[#E2E8F0]" />

              {/* Inline Filters */}
              <div className="flex items-center gap-3 flex-1 overflow-x-auto">
                {/* Main Category Selector */}
                <div className="relative flex-shrink-0">
                  <select
                    value={selectedMainCategory}
                    onChange={(e) => {
                      const newMainCat = e.target.value;
                      setSelectedMainCategory(newMainCat);
                      const mainCat = data?.mainCategories.find(c => c.id === newMainCat);
                      if (mainCat && mainCat.subCategories.length > 0) {
                        setSelectedSubCategory(mainCat.subCategories[0]);
                      }
                      setSelectedTrend(null);
                    }}
                    className="appearance-none px-3 py-1.5 pr-8 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium min-w-[140px]"
                  >
                    {data?.mainCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none rotate-90" />
                </div>

                {/* Sub-Category Selector */}
                <div className="relative flex-shrink-0">
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => {
                      setSelectedSubCategory(e.target.value);
                      setSelectedTrend(null);
                    }}
                    className="appearance-none px-3 py-1.5 pr-8 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium min-w-[120px]"
                  >
                    {getAvailableSubCategories().map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none rotate-90" />
                </div>

                {/* Platform Filter */}
                <div className="relative flex-shrink-0">
                  <select
                    value={platformFilter}
                    onChange={(e) => {
                      setPlatformFilter(e.target.value);
                      setSelectedTrend(null);
                    }}
                    className="appearance-none px-3 py-1.5 pr-8 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium min-w-[100px]"
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none rotate-90" />
                </div>

                {/* Time Range & Refresh */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="appearance-none px-3 py-1.5 pr-8 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium min-w-[80px]"
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none rotate-90" />
                  </div>

                  <button
                    onClick={fetchTrendData}
                    disabled={loading}
                    className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0F172A] mx-auto mb-3" />
                <p className="text-sm text-[#64748B]">Scanning social trends...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-[#64748B]">{error}</p>
                <button
                  onClick={fetchTrendData}
                  className="mt-4 px-4 py-2 text-sm bg-[#0F172A] text-white rounded-lg hover:bg-[#1E293B]"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && data && (
            <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#00f2ea]" />
                  <span className="text-xs text-[#64748B]">TikTok Trends</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[#0F172A]">{data.summary.tiktokTrends}</span>
                  <span className="text-sm text-[#64748B] mb-1">trending on TikTok</span>
                </div>
                <div className="mt-2 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00f2ea] rounded-full"
                    style={{ width: `${(data.summary.tiktokTrends / data.summary.totalTrends) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#0EA5E9]" />
                  <span className="text-xs text-[#64748B]">Avg. Velocity</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[#0F172A]">+{data.summary.avgVelocity}%</span>
                  <span className="text-sm text-[#64748B] mb-1">growth rate</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[#0F172A]" />
                  <span className="text-xs text-[#64748B]">Total Trends</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[#0F172A]">{data.summary.totalTrends}</span>
                  <span className="text-sm text-[#64748B] mb-1">tracked in {data.category}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[#00f2ea]" />
                  <span className="text-xs text-[#64748B]">Top Platform</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[#0F172A] capitalize">{PLATFORM_NAMES[data.summary.topPlatform]}</span>
                  <span className="text-sm text-[#64748B] mb-1">driving trends</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Trend List */}
              <div className="col-span-2 bg-white rounded-xl border border-[#E2E8F0]">
                <div className="p-4 border-b border-[#E2E8F0]">
                  <h2 className="text-sm font-medium text-[#0F172A]">Trending Terms</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Sorted by social media presence - TikTok trends first
                  </p>
                </div>

                <div className="divide-y divide-[#E2E8F0]">
                  {data.trends.map((trend, index) => {
                    const isSelected = selectedTrend?.term === trend.term;

                    return (
                      <div
                        key={trend.term}
                        onClick={() => setSelectedTrend(trend)}
                        className={`p-4 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F8FAFC]' : 'hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#94A3B8] font-mono">#{index + 1}</span>
                              <h3 className="text-sm font-medium text-[#0F172A] truncate">{trend.term}</h3>
                              {/* Total Sources Badge */}
                              <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-[#0F172A] text-white">
                                {trend.totalSources} {trend.totalSources === 1 ? 'source' : 'sources'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mt-2">
                              {/* TikTok Signal - Primary Indicator */}
                              {trend.platforms.tiktok > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00f2ea]/10">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ea]" />
                                  <span className="text-[10px] font-medium text-[#00f2ea]">
                                    {trend.platforms.tiktok} TikTok
                                  </span>
                                </div>
                              )}

                              {/* Instagram */}
                              {trend.platforms.instagram > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#E4405F]/10">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#E4405F]" />
                                  <span className="text-[10px] font-medium text-[#E4405F]">
                                    {trend.platforms.instagram} Instagram
                                  </span>
                                </div>
                              )}

                              {/* YouTube */}
                              {trend.platforms.youtube > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FF0000]/10">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF0000]" />
                                  <span className="text-[10px] font-medium text-[#FF0000]">
                                    {trend.platforms.youtube} YouTube
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Platform Distribution - Only show platforms with actual sources */}
                            <div className="flex items-center gap-1 mt-2">
                              {Object.entries(trend.platforms)
                                .filter(([, value]) => value > 0) // Only show platforms with sources
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 4)
                                .map(([platform, value]) => (
                                  <div
                                    key={platform}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]"
                                    style={{ backgroundColor: `${PLATFORM_COLORS[platform]}15` }}
                                  >
                                    <div
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                                    />
                                    <span className="text-[#0F172A]">{PLATFORM_NAMES[platform]}</span>
                                    <span className="text-[#64748B]">{value} {value === 1 ? 'source' : 'sources'}</span>
                                  </div>
                                ))}
                              {Object.values(trend.platforms).every(v => v === 0) && (
                                <span className="text-[9px] text-[#94A3B8]">Web sources only</span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trend Detail Panel */}
              <div className="col-span-1">
                {selectedTrend ? (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] sticky top-24">
                    <div className="p-4 border-b border-[#E2E8F0]">
                      <h3 className="text-base font-semibold text-[#0F172A]">{selectedTrend.term}</h3>
                      <p className="text-xs text-[#64748B] mt-1">
                        {selectedTrend.totalSources} sources across social media
                      </p>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Source Distribution - Vertical Bar Chart */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-medium text-[#0F172A]">Source Distribution</h4>
                          <span className="text-[10px] text-[#64748B]">{selectedTrend.totalSources} total</span>
                        </div>

                        {/* Vertical bars - 6 columns */}
                        <div className="flex items-end justify-between gap-2 h-32">
                          {(() => {
                            const maxValue = Math.max(...Object.values(selectedTrend.platforms), 1);
                            const platformOrder = ['tiktok', 'instagram', 'youtube', 'reddit', 'twitter', 'web'] as const;

                            return platformOrder.map((platform) => {
                              const value = selectedTrend.platforms[platform] || 0;
                              const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;

                              return (
                                <div key={platform} className="flex-1 flex flex-col items-center">
                                  {/* Count above bar */}
                                  <span className="text-[11px] font-semibold text-[#0F172A] mb-1">
                                    {value}
                                  </span>
                                  {/* Vertical bar */}
                                  <div className="w-full h-24 bg-[#F1F5F9] rounded-t relative flex items-end">
                                    <div
                                      className="w-full rounded-t transition-all duration-300"
                                      style={{
                                        height: value > 0 ? `${Math.max(barHeight, 5)}%` : '0%',
                                        backgroundColor: PLATFORM_COLORS[platform],
                                      }}
                                    />
                                  </div>
                                  {/* Label below */}
                                  <span className="text-[9px] text-[#64748B] mt-1.5 text-center leading-tight">
                                    {PLATFORM_NAMES[platform]}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {Object.values(selectedTrend.platforms).every(v => v === 0) && (
                          <p className="text-[10px] text-[#94A3B8] italic mt-2 text-center">No sources detected</p>
                        )}
                      </div>

                      {/* Related Terms */}
                      <div>
                        <h4 className="text-xs font-medium text-[#0F172A] mb-2">Related Terms</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTrend.relatedTerms.map((term) => (
                            <span
                              key={term}
                              className="px-2 py-1 text-[10px] bg-[#F1F5F9] text-[#64748B] rounded"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Sample Posts */}
                      <div>
                        <h4 className="text-xs font-medium text-[#0F172A] mb-2">Sample Posts</h4>
                        <div className="space-y-2">
                          {selectedTrend.samplePosts.map((post, idx) => (
                            <a
                              key={idx}
                              href={post.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block p-2.5 bg-[#F8FAFC] rounded-lg transition-colors ${
                                post.url ? 'hover:bg-[#F1F5F9] cursor-pointer' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className="text-[10px] font-medium"
                                  style={{ color: PLATFORM_COLORS[post.platform.toLowerCase()] || '#64748B' }}
                                >
                                  {post.platform}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-[#94A3B8]">{post.date}</span>
                                  {post.url && <ExternalLink className="w-3 h-3 text-[#94A3B8]" />}
                                </div>
                              </div>
                              <p className="text-[11px] text-[#0F172A] line-clamp-2">{post.text}</p>
                              <div className="flex items-center gap-1 mt-1.5 text-[9px] text-[#64748B]">
                                <TrendingUp className="w-3 h-3" />
                                <span>{formatNumber(post.engagement)} engagement</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Sentiment */}
                      <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                        <span className="text-xs text-[#64748B]">Sentiment Score</span>
                        <span className={`text-sm font-semibold ${
                          selectedTrend.sentiment > 0.6 ? 'text-green-600' :
                          selectedTrend.sentiment > 0.3 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(selectedTrend.sentiment * 100).toFixed(0)}% positive
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
                    <Radar className="w-8 h-8 text-[#94A3B8] mx-auto mb-3" />
                    <p className="text-sm text-[#64748B]">Select a trend to see details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-6 text-center">
              <p className="text-[10px] text-[#94A3B8]">
                {data.category} trends tracked in {data.amazonCategory} on Amazon
                {source === 'demo' && ' • Demo data shown'}
              </p>
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
