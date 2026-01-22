'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink, ThumbsUp, MessageSquare, Flame, Clock, Users, TrendingUp, TrendingDown, LayoutGrid, List, RefreshCw, Calendar, Wifi, WifiOff, Brain, Search } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { PurchaseIntentSignals } from '@/components/PurchaseIntentSignals';

interface UnifiedMention {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceType: 'reddit' | 'instagram' | 'x' | 'meta' | 'tiktok' | 'youtube' | 'social' | 'mock';
  sourceIcon: string;
  sourceColor: string;
  sourceBg: string;
  author?: string;
  score: number;
  numComments: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  matchedKeyword: string;
  createdAt: string;
  url: string;
  thumbnailUrl?: string;
  isHighEngagement: boolean;
  reach: number;
}

interface SourceFilter {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  color: string;
  bgColor: string;
}

interface BrandSentiment {
  overallScore: number;
  summary: string;
  positiveThemes: string[];
  negativeThemes: string[];
  neutralThemes: string[];
}

// Updated sources: Reddit, Instagram, X, Meta, TikTok, YouTube (using Stackline colors)
const SOURCE_FILTERS: SourceFilter[] = [
  { id: 'reddit', name: 'Reddit', icon: 'RD', enabled: true, color: '#FF4500', bgColor: '#031425' },
  { id: 'instagram', name: 'Instagram', icon: '📸', enabled: true, color: '#E1306C', bgColor: '#031425' },
  { id: 'x', name: 'X (Twitter)', icon: '𝕏', enabled: true, color: '#000000', bgColor: '#031425' },
  { id: 'meta', name: 'Meta', icon: '👤', enabled: true, color: '#1877F2', bgColor: '#031425' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', enabled: true, color: '#00F2EA', bgColor: '#031425' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', enabled: true, color: '#FF0000', bgColor: '#031425' },
];

// Sentiment Configuration with Stackline colors
// Positive: Score > 0.2 - Favorable mentions, recommendations, praise
// Neutral: Score between -0.2 and 0.2 - Factual mentions, no strong opinion
// Negative: Score < -0.2 - Complaints, issues, negative reviews
const SENTIMENT_CONFIG = {
  positive: { color: '#71c184', bg: 'rgba(113, 193, 132, 0.15)', label: 'Positive' },
  neutral: { color: '#4E596A', bg: 'rgba(78, 89, 106, 0.15)', label: 'Neutral' },
  negative: { color: '#ff534a', bg: 'rgba(255, 83, 74, 0.15)', label: 'Negative' },
};


// Source styling - Updated for new sources
const SOURCE_STYLING: Record<string, { label: string }> = {
  reddit: { label: 'Reddit' },
  instagram: { label: 'Instagram' },
  x: { label: 'X (Twitter)' },
  meta: { label: 'Meta' },
  tiktok: { label: 'TikTok' },
  youtube: { label: 'YouTube' },
  social: { label: 'Social' },
  mock: { label: 'Demo' },
};

// Simple activity chart component
function ActivityChart({ data }: { data: number[] }) {
  const max = Math.max(...data);

  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 bg-[#0EA5E9] rounded-t opacity-60 hover:opacity-100 transition-opacity"
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

// Simple source badge - navy background, white text
function SourceBadge({ sourceName }: { sourceName: string }) {
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-semibold bg-[#0F172A] text-white flex-shrink-0"
      title={sourceName}
    >
      {sourceName.substring(0, 2).toUpperCase()}
    </div>
  );
}

// Simple source label - clean border style like related search terms
function SourceLabel({ sourceName }: { sourceName: string }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded border border-[#E2E8F0] bg-white text-[10px] font-medium text-[#0F172A]">
      {sourceName}
    </span>
  );
}

// Suggested searches for quick access
const SUGGESTED_SEARCHES = [
  { brand: 'Weleda', product: 'Skin Food' },
  { brand: 'Revlon', product: 'ColorStay Foundation' },
  { brand: 'Babyliss', product: 'Pro Ceramic Hair Dryer' },
  { brand: 'CeraVe', product: 'Moisturizing Cream' },
  { brand: 'The Ordinary', product: 'Niacinamide Serum' },
  { brand: 'Olaplex', product: 'No. 3 Hair Perfector' },
];

export default function MentionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [sentiment, setSentiment] = useState<string>('');
  const [sources, setSources] = useState<SourceFilter[]>(SOURCE_FILTERS);
  const [sortBy, setSortBy] = useState<'recent' | 'engagement' | 'reach'>('recent');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [mentions, setMentions] = useState<UnifiedMention[]>([]);
  const [isLiveData, setIsLiveData] = useState(false);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [brandSentiment, setBrandSentiment] = useState<BrandSentiment | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  // Simple text inputs for brand and product
  const [brand, setBrand] = useState('');
  const [product, setProduct] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch mentions from API
  const fetchMentions = useCallback(async (searchBrand: string, searchProduct: string) => {
    if (!searchBrand.trim()) return;

    setLoading(true);
    setFetchError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        brand: searchBrand.trim(),
        days: days.toString(),
        limit: '50',
        _t: Date.now().toString(), // Cache buster
      });

      if (searchProduct.trim()) {
        params.set('product', searchProduct.trim());
      }

      const response = await fetch(`/api/mentions?${params}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success) {
        // Transform API data to match our interface
        const transformedMentions: UnifiedMention[] = data.data.mentions.map((m: any) => {
          return {
            ...m,
            sourceColor: '#0F172A',
            sourceBg: '#FFFFFF',
            sourceIcon: m.source?.substring(0, 2).toUpperCase() || 'SR',
            isHighEngagement: m.score > 1000 || m.numComments > 100,
            reach: m.score || 0,
          };
        });

        setMentions(transformedMentions);
        setIsLiveData(data.isLiveData);
        setDataSources(data.sources || []);
      } else {
        setFetchError(data.error || 'Failed to fetch mentions');
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
      setFetchError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [days]);

  // Handle search
  const handleSearch = () => {
    if (brand.trim()) {
      fetchMentions(brand, product);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: { brand: string; product: string }) => {
    setBrand(suggestion.brand);
    setProduct(suggestion.product);
    fetchMentions(suggestion.brand, suggestion.product);
  };

  // Get display name for header
  const getDisplayName = () => {
    if (!brand.trim()) return 'Brand';
    if (product.trim()) return `${brand} ${product}`;
    return brand;
  };

  // Fetch AI-powered brand sentiment analysis
  const fetchBrandSentiment = useCallback(async (brand: string, mentionsData: UnifiedMention[]) => {
    if (mentionsData.length === 0) return;

    setSentimentLoading(true);
    try {
      const response = await fetch('/api/brand-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          mentions: mentionsData.map(m => ({
            title: m.title,
            body: m.body,
            sentiment: m.sentiment,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBrandSentiment(data.data);
      }
    } catch (error) {
      console.error('Error fetching brand sentiment:', error);
    } finally {
      setSentimentLoading(false);
    }
  }, []);

  // Fetch sentiment when mentions change
  useEffect(() => {
    if (mentions.length > 0 && !loading && brand.trim()) {
      fetchBrandSentiment(brand, mentions);
    }
  }, [mentions, loading, brand, fetchBrandSentiment]);

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter and sort mentions
  const enabledSourceIds = sources.filter(s => s.enabled).map(s => s.id);
  const now = new Date();
  const daysInMs = days * 24 * 60 * 60 * 1000;

  let filteredMentions = mentions.filter(m => {
    // Filter by date range
    const mentionDate = new Date(m.createdAt);
    if (now.getTime() - mentionDate.getTime() > daysInMs) return false;
    // Filter by source type (reddit, instagram, x, meta)
    // Map source name to filter IDs for matching
    const sourceNameLower = m.source.toLowerCase();
    let sourceId = sourceNameLower;
    if (sourceNameLower === 'x' || sourceNameLower === 'x (twitter)' || sourceNameLower === 'twitter') {
      sourceId = 'x';
    } else if (sourceNameLower === 'facebook' || sourceNameLower === 'meta') {
      sourceId = 'meta';
    }
    // Mock data should show for all enabled sources
    if (m.sourceType !== 'mock' && !enabledSourceIds.includes(sourceId)) return false;
    // Filter by sentiment
    if (sentiment && m.sentiment !== sentiment) return false;
    return true;
  });

  // Sort
  filteredMentions = [...filteredMentions].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'engagement') {
      return (b.score + b.numComments) - (a.score + a.numComments);
    } else {
      return b.reach - a.reach;
    }
  });

  // Summary stats
  const totalMentions = filteredMentions.length;
  const totalReach = filteredMentions.reduce((sum, m) => sum + m.reach, 0);
  const totalEngagement = filteredMentions.reduce((sum, m) => sum + m.score + m.numComments, 0);
  const sentimentBreakdown = {
    positive: filteredMentions.filter(m => m.sentiment === 'positive').length,
    neutral: filteredMentions.filter(m => m.sentiment === 'neutral').length,
    negative: filteredMentions.filter(m => m.sentiment === 'negative').length,
  };
  const hotMentions = filteredMentions.filter(m => m.isHighEngagement).length;

  // Mock activity data
  const activityData = [35, 42, 38, 55, 62, 48, 72, 85, 68, 92, 78, 65, 88, 95];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-medium text-[#1E293B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  {hasSearched ? `${getDisplayName()} Mentions` : 'Mentions'}
                </h1>
                {/* Live/Mock Data Indicator */}
                {hasSearched && !loading && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      isLiveData
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isLiveData ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        Live Data
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        Demo Data
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[13px] text-[#64748B] mt-0.5" style={{ fontFamily: 'Roboto, sans-serif' }}>
                {hasSearched && isLiveData && dataSources.length > 0
                  ? `Real-time data from ${dataSources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`
                  : 'Search for any brand or product to see mentions'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Range */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg">
                <Calendar className="w-4 h-4 text-[#64748B]" />
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                  className="text-[13px] text-[#1E293B] bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  <option value={1}>Yesterday</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchMentions(brand, product)}
                disabled={loading || !brand.trim()}
                className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Input Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1.5">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., Weleda, Revlon, CeraVe"
                  className="w-full px-3 py-2 text-[13px] text-[#1E293B] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1.5">Product (optional)</label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., Skin Food, ColorStay Foundation"
                  className="w-full px-3 py-2 text-[13px] text-[#1E293B] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A]"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !brand.trim()}
                className="flex items-center gap-2 px-5 py-2 text-[13px] text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>

            {/* Suggestions */}
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <p className="text-[11px] text-[#94A3B8] mb-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SEARCHES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="px-2.5 py-1 text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded hover:border-[#0F172A] hover:text-[#0F172A] transition-colors"
                  >
                    {s.brand} {s.product}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Only show these sections after a search */}
          {hasSearched && mentions.length > 0 && (
            <>
          {/* Purchase Intent Signals - Moved from Dashboard */}
          <PurchaseIntentSignals days={days} />

          {/* Summary Stats Bar */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A]">{totalMentions}</p>
                  <p className="text-[11px] text-[#64748B]">Total Mentions</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A]">{formatNumber(totalReach)}</p>
                  <p className="text-[11px] text-[#64748B]">Total Reach</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#0F172A]">{formatNumber(totalEngagement)}</p>
                  <p className="text-[11px] text-[#64748B]">Engagement</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[22px] font-bold text-amber-500">{hotMentions}</p>
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-[11px] text-[#64748B]">Hot Mentions</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                {/* Sentiment Breakdown */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                    <span className="text-[13px] font-semibold text-[#0F172A]">{sentimentBreakdown.positive}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#94A3B8]" />
                    <span className="text-[13px] font-semibold text-[#0F172A]">{sentimentBreakdown.neutral}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                    <span className="text-[13px] font-semibold text-[#0F172A]">{sentimentBreakdown.negative}</span>
                  </div>
                </div>
              </div>

              {/* Activity Mini Chart */}
              <div className="w-40">
                <p className="text-[9px] text-[#94A3B8] mb-1">Activity (14 days)</p>
                <ActivityChart data={activityData} />
              </div>
            </div>
          </div>

          {/* AI-Powered Brand Sentiment Summary */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-[#0F172A]" />
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">AI Brand Sentiment</h3>
                  <span className="px-2 py-0.5 bg-[#0F172A] text-white rounded text-[9px] font-medium">
                    Powered by GPT
                  </span>
                </div>

                {sentimentLoading ? (
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[13px]">Analyzing brand sentiment...</span>
                  </div>
                ) : brandSentiment ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    <p className="text-[13px] text-[#1E293B] leading-relaxed">
                      {brandSentiment.summary}
                    </p>

                    {/* Themes */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Positive Themes */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-[#71c184]" />
                          <span className="text-[11px] font-medium text-[#1E293B]">Positive Drivers</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {brandSentiment.positiveThemes.map((theme, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] rounded text-[10px]">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Negative Themes */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingDown className="w-3.5 h-3.5 text-[#ff534a]" />
                          <span className="text-[11px] font-medium text-[#1E293B]">Pain Points</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {brandSentiment.negativeThemes.map((theme, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] rounded text-[10px]">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Neutral Themes */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <MessageSquare className="w-3.5 h-3.5 text-[#64748B]" />
                          <span className="text-[11px] font-medium text-[#1E293B]">Discussion Topics</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {brandSentiment.neutralThemes.map((theme, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] rounded text-[10px]">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#64748B]">
                    No sentiment analysis available yet.
                  </p>
                )}
              </div>

              {/* Sentiment Score */}
              {brandSentiment && !sentimentLoading && (
                <div className="ml-6 flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2 ${
                    brandSentiment.overallScore >= 60 ? 'border-[#71c184] text-[#71c184] bg-[#71c184]/10' :
                    brandSentiment.overallScore >= 40 ? 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10' :
                    'border-[#ff534a] text-[#ff534a] bg-[#ff534a]/10'
                  }`}>
                    {brandSentiment.overallScore}
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-2">Sentiment Score</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            {/* Top row - Sources */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-[10px] text-[#64748B] font-medium">Sources:</span>
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`px-2.5 py-1 rounded border text-[10px] font-medium transition-all ${
                    source.enabled
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-[#94A3B8] border-[#E2E8F0] hover:border-[#0F172A] hover:text-[#0F172A]'
                  }`}
                >
                  {source.name}
                </button>
              ))}
            </div>

            {/* Bottom row - Filters and controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sentiment Filter */}
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value)}
                className="px-2.5 py-1 text-[10px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
              >
                <option value="">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'engagement' | 'reach')}
                className="px-2.5 py-1 text-[10px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
              >
                <option value="recent">Most Recent</option>
                <option value="engagement">Most Engaged</option>
                <option value="reach">Highest Reach</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-0.5 bg-[#F1F5F9] rounded ml-auto">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1 rounded transition-all ${
                    viewMode === 'cards' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1 rounded transition-all ${
                    viewMode === 'compact' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

            </>
          )}

          {/* Error Display */}
          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-700 font-medium text-sm">Failed to fetch live data</p>
                <p className="text-red-600 text-xs">{fetchError} - Showing demo data instead</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!hasSearched ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <Search className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
              <h3 className="text-[15px] font-medium text-[#0F172A] mb-2">
                Search for Brand Mentions
              </h3>
              <p className="text-[13px] text-[#64748B] max-w-md mx-auto">
                Enter a brand name and optionally a product to discover what people are saying across social media.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9]" />
            </div>
          ) : filteredMentions.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <p className="text-[#64748B]">
                No mentions found. Try enabling more sources or adjusting filters.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="space-y-4">
              {filteredMentions.map((mention) => (
                <div
                  key={mention.id}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:border-[#0EA5E9] hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <SourceLabel sourceName={mention.source} />
                        {mention.author && (
                          <span className="text-[11px] text-[#64748B]">
                            by <span className="font-medium">{mention.author}</span>
                          </span>
                        )}
                        <span
                          className="px-2 py-1 rounded-md text-[10px] font-medium"
                          style={{
                            backgroundColor: SENTIMENT_CONFIG[mention.sentiment].bg,
                            color: SENTIMENT_CONFIG[mention.sentiment].color,
                          }}
                        >
                          {SENTIMENT_CONFIG[mention.sentiment].label}
                        </span>
                        {mention.isHighEngagement && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-medium">
                            <Flame className="w-3 h-3" />
                            Hot
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      {mention.sourceType !== 'mock' && mention.url && !mention.url.startsWith('#') ? (
                        <a
                          href={mention.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[14px] font-semibold text-[#0F172A] mb-2 hover:text-[#0EA5E9] hover:underline transition-colors block"
                        >
                          {mention.title}
                        </a>
                      ) : (
                        <h3 className="text-[14px] font-semibold text-[#0F172A] mb-2">
                          {mention.title}
                        </h3>
                      )}

                      {/* Body */}
                      <p className="text-[12px] text-[#64748B] line-clamp-2 mb-3">
                        {mention.body}
                      </p>

                      {/* Meta Row */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="px-2 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-md text-[10px] font-medium">
                          {mention.matchedKeyword}
                        </span>
                        {mention.score > 0 && (
                          <div className="flex items-center gap-1 text-[#64748B]">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium">{formatNumber(mention.score)}</span>
                          </div>
                        )}
                        {mention.numComments > 0 && (
                          <div className="flex items-center gap-1 text-[#64748B]">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium">{formatNumber(mention.numComments)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[#0EA5E9]">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">{formatNumber(mention.reach)} reach</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#94A3B8]">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{formatDate(mention.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Link - shows different styling for real vs mock */}
                    {mention.sourceType !== 'mock' && mention.url && !mention.url.startsWith('#') ? (
                      <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 text-[11px] text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium shrink-0 shadow-sm"
                      >
                        <Wifi className="w-3 h-3" />
                        View Source
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div
                        className="flex items-center gap-1 px-3 py-2 text-[11px] text-gray-400 bg-gray-100 rounded-lg font-medium shrink-0 cursor-not-allowed"
                        title="Demo data - no source link available"
                      >
                        Demo
                        <WifiOff className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Compact View */
            <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
              {filteredMentions.map((mention) => (
                <div
                  key={mention.id}
                  className="flex items-center gap-4 p-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  {/* Source Icon */}
                  <SourceBadge sourceName={mention.source} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {mention.sourceType !== 'mock' && mention.url && !mention.url.startsWith('#') ? (
                      <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-medium text-[#0F172A] truncate hover:text-[#0EA5E9] hover:underline transition-colors block"
                      >
                        {mention.title}
                      </a>
                    ) : (
                      <h3 className="text-[13px] font-medium text-[#0F172A] truncate">
                        {mention.title}
                      </h3>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#64748B]">{mention.source}</span>
                      <span className="text-[10px] text-[#94A3B8]">•</span>
                      <span className="text-[10px] text-[#94A3B8]">{formatDate(mention.createdAt)}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: SENTIMENT_CONFIG[mention.sentiment].color }}
                    />
                    {mention.score > 0 && (
                      <span className="text-[11px] text-[#64748B]">{formatNumber(mention.score)} likes</span>
                    )}
                    <span className="text-[11px] font-medium text-[#0EA5E9]">{formatNumber(mention.reach)}</span>
                    {mention.isHighEngagement && (
                      <Flame className="w-4 h-4 text-amber-500" />
                    )}
                  </div>

                  {/* Link - shows different styling for real vs mock */}
                  {mention.sourceType !== 'mock' && mention.url && !mention.url.startsWith('#') ? (
                    <a
                      href={mention.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                      title="View real source"
                    >
                      <ExternalLink className="w-4 h-4 text-emerald-600" />
                    </a>
                  ) : (
                    <div
                      className="p-2 bg-gray-50 rounded-lg cursor-not-allowed"
                      title="Demo data - no source link"
                    >
                      <WifiOff className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {filteredMentions.length > 0 && (
            <div className="text-center">
              <p className="text-[11px] text-[#94A3B8]">
                Showing {filteredMentions.length} mentions from {enabledSourceIds.length} sources • {formatNumber(totalReach)} total reach
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
