'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink, ThumbsUp, MessageSquare, Flame, Clock, Users, TrendingUp, Filter, LayoutGrid, List, ArrowUpDown, Download, Calendar, Wifi, WifiOff } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { PurchaseIntentSignals } from '@/components/PurchaseIntentSignals';
import { useSettings } from '@/lib/SettingsContext';

interface UnifiedMention {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceType: 'youtube' | 'news' | 'reddit' | 'tiktok' | 'temptalia' | 'makeupalley' | 'mock';
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

const SOURCE_FILTERS: SourceFilter[] = [
  { id: 'youtube', name: 'YouTube', icon: 'YT', enabled: true, color: '#FF0000', bgColor: '#0F172A' },
  { id: 'tiktok', name: 'TikTok', icon: 'TT', enabled: true, color: '#00F2EA', bgColor: '#0F172A' },
  { id: 'news', name: 'News', icon: 'NW', enabled: true, color: '#0EA5E9', bgColor: '#0F172A' },
  { id: 'reddit', name: 'Reddit', icon: 'RD', enabled: true, color: '#FF4500', bgColor: '#0F172A' },
  { id: 'makeupalley', name: 'MakeupAlley', icon: 'MA', enabled: true, color: '#F472B6', bgColor: '#0F172A' },
  { id: 'temptalia', name: 'Temptalia', icon: 'TP', enabled: true, color: '#A78BFA', bgColor: '#0F172A' },
];

const SENTIMENT_CONFIG = {
  positive: { color: '#10B981', bg: '#ECFDF5', label: 'Positive' },
  neutral: { color: '#64748B', bg: '#F1F5F9', label: 'Neutral' },
  negative: { color: '#EF4444', bg: '#FEF2F2', label: 'Negative' },
};


// Source styling - Simple navy and white palette
const SOURCE_STYLING: Record<string, { label: string }> = {
  youtube: { label: 'YouTube' },
  tiktok: { label: 'TikTok' },
  news: { label: 'News' },
  reddit: { label: 'Reddit' },
  temptalia: { label: 'Temptalia' },
  makeupalley: { label: 'MakeupAlley' },
  mock: { label: 'Mock' },
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

export default function MentionsPage() {
  const router = useRouter();
  const { settings, isLoaded, getBrandName } = useSettings();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [sentiment, setSentiment] = useState<string>('');
  const [sources, setSources] = useState<SourceFilter[]>(SOURCE_FILTERS);
  const [sortBy, setSortBy] = useState<'recent' | 'engagement' | 'reach'>('recent');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [settingsApplied, setSettingsApplied] = useState(false);
  const [mentions, setMentions] = useState<UnifiedMention[]>([]);
  const [isLiveData, setIsLiveData] = useState(false);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Get brand from settings
  const selectedBrand = useMemo(() => {
    if (!isLoaded) return 'Revlon';
    const brandMap: Record<string, string> = {
      'revlon': 'Revlon',
      'elf': 'e.l.f.',
      'maybelline': 'Maybelline',
    };
    return brandMap[settings.selectedBrand] || 'Revlon';
  }, [isLoaded, settings.selectedBrand]);

  // Fetch mentions from API
  const fetchMentions = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams({
        brand: selectedBrand,
        days: days.toString(),
        limit: '50',
      });

      const response = await fetch(`/api/mentions?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match our interface
        const transformedMentions: UnifiedMention[] = data.data.mentions.map((m: any) => {
          const styling = SOURCE_STYLING[m.sourceType] || SOURCE_STYLING.mock;
          return {
            ...m,
            sourceColor: styling.color,
            sourceBg: styling.bg,
            sourceIcon: m.sourceIcon || styling.icon,
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
  }, [isLoaded, selectedBrand, days]);

  // Apply settings from storage and fetch data
  useEffect(() => {
    if (isLoaded && !settingsApplied) {
      setDays(settings.defaultDays);
      setSettingsApplied(true);
    }
  }, [isLoaded, settings.defaultDays, settingsApplied]);

  // Fetch when dependencies change
  useEffect(() => {
    if (settingsApplied) {
      fetchMentions();
    }
  }, [settingsApplied, selectedBrand, days, fetchMentions]);

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
    // Filter by source type (youtube, news, reddit, mock)
    // Map sourceType to filter IDs (mock maps to all since it's demo data)
    const sourceId = m.sourceType === 'mock' ? 'youtube' : m.sourceType; // mock data shows as various sources
    if (!enabledSourceIds.includes(sourceId)) return false;
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
                  {getBrandName()} Mentions
                </h1>
                {/* Live/Mock Data Indicator */}
                {!loading && (
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
                {isLiveData && dataSources.length > 0
                  ? `Real-time data from ${dataSources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`
                  : 'All brand mentions & purchase intent signals'}
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
          {(loading || !isLoaded) ? (
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
