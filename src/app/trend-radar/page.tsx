'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Radar,
  TrendingUp,
  TrendingDown,
  Zap,
  ShoppingCart,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Target,
  BarChart3,
  ArrowUpRight,
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
  };
  retailStatus: 'not_available' | 'emerging' | 'growing' | 'saturated';
  retailData: {
    amazonAvailable: boolean;
    amazonProductCount: number;
    topProducts: string[];
    opportunityScore: number;
  };
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

interface CategoryInfo {
  id: string;
  name: string;
  amazonCategory: string;
}

interface TrendSummary {
  totalTrends: number;
  notOnAmazon: number;
  earlyOnAmazon: number;
  avgVelocity: number;
  topPlatform: string;
  opportunityScore: number;
}

interface TrendData {
  category: string;
  amazonCategory: string;
  timeRange: string;
  summary: TrendSummary;
  trends: TrendItem[];
  categories: CategoryInfo[];
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#00f2ea',
  instagram: '#E4405F',
  youtube: '#FF0000',
  reddit: '#FF4500',
  twitter: '#1DA1F2',
};

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  reddit: 'Reddit',
  twitter: 'X',
};

const RETAIL_STATUS_CONFIG = {
  not_available: {
    label: 'Not on Amazon',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: Sparkles,
    description: 'High opportunity - trending socially but no products found on Amazon yet',
  },
  emerging: {
    label: 'Emerging',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Zap,
    description: 'Just starting to appear - only 1-2 products found on Amazon',
  },
  growing: {
    label: 'Growing',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: TrendingUp,
    description: 'Competition building - 3-5 products now on Amazon',
  },
  saturated: {
    label: 'Saturated',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Target,
    description: 'Market is crowded - many products already on Amazon',
  },
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
];

export default function TrendRadarPage() {
  const router = useRouter();
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('skincare');
  const [timeRange, setTimeRange] = useState('7d');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [source, setSource] = useState('');

  const fetchTrendData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        category: selectedCategory,
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
  }, [selectedCategory, timeRange, platformFilter]);

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
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0F172A] to-[#334155] rounded-xl flex items-center justify-center">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#0F172A]">Trend Radar</h1>
                <p className="text-xs text-[#64748B]">
                  TikTok viral today → Amazon bestseller tomorrow
                </p>
              </div>
              {source && (
                <span className={`px-2 py-0.5 text-[9px] font-medium rounded ml-2 ${
                  source === 'brave' || source === 'cache' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {source === 'brave' ? 'Live Data' : source === 'cache' ? 'Cached' : 'Demo Data'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Category Selector */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedTrend(null);
                }}
                className="px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#0F172A]"
              >
                {data?.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => {
                  setPlatformFilter(e.target.value);
                  setSelectedTrend(null);
                }}
                className="px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#0F172A]"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Time Range */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#0F172A]"
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Refresh */}
              <button
                onClick={fetchTrendData}
                disabled={loading}
                className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F172A] mx-auto mb-3" />
              <p className="text-sm text-[#64748B]">Scanning social trends...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
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
          <div className="p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-[#64748B]">High Opportunity</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[#0F172A]">{data.summary.notOnAmazon}</span>
                  <span className="text-sm text-[#64748B] mb-1">trends not on Amazon</span>
                </div>
                <div className="mt-2 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${data.summary.opportunityScore}%` }}
                  />
                </div>
                <p className="text-[9px] text-[#94A3B8] mt-1">Avg opportunity: {data.summary.opportunityScore}%</p>
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
                  <h2 className="text-sm font-medium text-[#0F172A]">TikTok → Amazon Opportunities</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Sorted by opportunity - TikTok viral trends not yet on Amazon
                  </p>
                </div>

                <div className="divide-y divide-[#E2E8F0]">
                  {data.trends.map((trend, index) => {
                    const statusConfig = RETAIL_STATUS_CONFIG[trend.retailStatus];
                    const StatusIcon = statusConfig.icon;
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
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${statusConfig.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </span>
                              {/* Opportunity Score Badge */}
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                trend.retailData.opportunityScore >= 70 ? 'bg-green-500 text-white' :
                                trend.retailData.opportunityScore >= 40 ? 'bg-yellow-500 text-white' :
                                'bg-gray-400 text-white'
                              }`}>
                                {trend.retailData.opportunityScore}% opportunity
                              </span>
                            </div>

                            <div className="flex items-center gap-4 mt-2">
                              {/* TikTok Signal - Primary Indicator */}
                              {trend.platforms.tiktok > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00f2ea]/10">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ea]" />
                                  <span className="text-[10px] font-medium text-[#00f2ea]">
                                    {trend.platforms.tiktok} TikTok {trend.platforms.tiktok === 1 ? 'source' : 'sources'}
                                  </span>
                                </div>
                              )}

                              {/* Amazon Status */}
                              <div className="flex items-center gap-1 text-[10px]">
                                <ShoppingCart className="w-3 h-3 text-[#64748B]" />
                                <span className={trend.retailData.amazonProductCount === 0 ? 'text-green-600 font-medium' : 'text-[#64748B]'}>
                                  {trend.retailData.amazonProductCount === 0
                                    ? '✓ Not on Amazon yet'
                                    : `${trend.retailData.amazonProductCount} on Amazon`}
                                </span>
                              </div>
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
                        {RETAIL_STATUS_CONFIG[selectedTrend.retailStatus].description}
                      </p>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* TikTok → Amazon Pipeline */}
                      <div className="p-3 bg-[#0F172A] rounded-lg text-white">
                        <div className="text-[10px] text-white/60 mb-2">TikTok → Amazon Pipeline</div>

                        {/* Visual Pipeline */}
                        <div className="flex items-center gap-2 mb-3">
                          {/* TikTok */}
                          <div className="flex-1 text-center">
                            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                              selectedTrend.platforms.tiktok > 0 ? 'bg-[#00f2ea]' : 'bg-white/20'
                            }`}>
                              <span className="text-lg">📱</span>
                            </div>
                            <div className="text-[10px] mt-1">TikTok</div>
                            <div className={`text-xs font-bold ${selectedTrend.platforms.tiktok > 0 ? 'text-[#00f2ea]' : 'text-white/40'}`}>
                              {selectedTrend.platforms.tiktok > 0 ? `${selectedTrend.platforms.tiktok} sources` : 'No data'}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="text-white/40">→</div>

                          {/* Amazon */}
                          <div className="flex-1 text-center">
                            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                              selectedTrend.retailData.amazonProductCount === 0 ? 'bg-green-500' : 'bg-orange-500'
                            }`}>
                              <span className="text-lg">🛒</span>
                            </div>
                            <div className="text-[10px] mt-1">Amazon</div>
                            <div className={`text-xs font-bold ${
                              selectedTrend.retailData.amazonProductCount === 0 ? 'text-green-400' : 'text-orange-400'
                            }`}>
                              {selectedTrend.retailData.amazonProductCount === 0 ? 'Not yet!' : `${selectedTrend.retailData.amazonProductCount} products`}
                            </div>
                          </div>
                        </div>

                        {/* Opportunity Assessment */}
                        <div className={`p-2 rounded text-center ${
                          selectedTrend.platforms.tiktok > 0 && selectedTrend.retailData.amazonProductCount === 0
                            ? 'bg-green-500/20 border border-green-500/30'
                            : selectedTrend.retailData.amazonProductCount === 0
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-white/10'
                        }`}>
                          <div className="text-sm font-bold">
                            {selectedTrend.platforms.tiktok > 0 && selectedTrend.retailData.amazonProductCount === 0
                              ? '🔥 Prime Opportunity!'
                              : selectedTrend.retailData.amazonProductCount === 0
                              ? '✨ Early Opportunity'
                              : selectedTrend.retailData.amazonProductCount <= 3
                              ? '⚡ Still Time'
                              : '📊 Market Active'}
                          </div>
                          <div className="text-[10px] text-white/60 mt-1">
                            {selectedTrend.platforms.tiktok > 0 && selectedTrend.retailData.amazonProductCount === 0
                              ? 'Trending on TikTok, not on Amazon - act now!'
                              : selectedTrend.retailData.amazonProductCount === 0
                              ? 'Social buzz building, no Amazon products yet'
                              : `${selectedTrend.retailData.amazonProductCount} competitors already on Amazon`}
                          </div>
                        </div>

                        {/* Opportunity Score */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/60">Opportunity Score</span>
                            <span className="font-bold">{selectedTrend.retailData.opportunityScore}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/20 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full ${
                                selectedTrend.retailData.opportunityScore >= 70 ? 'bg-green-500' :
                                selectedTrend.retailData.opportunityScore >= 40 ? 'bg-yellow-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${selectedTrend.retailData.opportunityScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Top Amazon Products (if any) */}
                      {selectedTrend.retailData.topProducts.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-[#0F172A] mb-2">Existing Products on Amazon</h4>
                          <div className="space-y-1.5">
                            {selectedTrend.retailData.topProducts.map((product, idx) => (
                              <div key={idx} className="text-[10px] text-[#64748B] bg-[#F8FAFC] p-2 rounded truncate">
                                {product}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Platform Breakdown - Only show platforms with actual sources */}
                      <div>
                        <h4 className="text-xs font-medium text-[#0F172A] mb-2">Sources by Platform</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedTrend.platforms)
                            .filter(([, value]) => value > 0)
                            .sort(([,a], [,b]) => b - a)
                            .map(([platform, value]) => (
                              <div key={platform} className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                                />
                                <span className="text-xs text-[#64748B] w-16">{PLATFORM_NAMES[platform]}</span>
                                <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, value * 20)}%`,
                                      backgroundColor: PLATFORM_COLORS[platform],
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-[#0F172A] font-medium w-16 text-right">{value} {value === 1 ? 'source' : 'sources'}</span>
                              </div>
                            ))}
                          {Object.values(selectedTrend.platforms).every(v => v === 0) && (
                            <p className="text-xs text-[#94A3B8] italic">Sources from web/news articles only</p>
                          )}
                        </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
