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
  sourceType: 'youtube' | 'news' | 'reddit' | 'mock';
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
  { id: 'youtube', name: 'YouTube', icon: '▶️', enabled: true, color: '#DC2626', bgColor: '#FEF2F2' },
  { id: 'news', name: 'News', icon: '📰', enabled: true, color: '#2563EB', bgColor: '#EFF6FF' },
  { id: 'reddit', name: 'Reddit', icon: '🔴', enabled: true, color: '#F97316', bgColor: '#FFF7ED' },
  { id: 'makeupalley', name: 'MakeupAlley', icon: '💄', enabled: true, color: '#EC4899', bgColor: '#FDF2F8' },
  { id: 'temptalia', name: 'Temptalia', icon: '💋', enabled: true, color: '#A855F7', bgColor: '#FAF5FF' },
];

const SENTIMENT_CONFIG = {
  positive: { color: '#10B981', bg: '#ECFDF5', label: 'Positive' },
  neutral: { color: '#64748B', bg: '#F1F5F9', label: 'Neutral' },
  negative: { color: '#EF4444', bg: '#FEF2F2', label: 'Negative' },
};

// Generate brand-specific mock mentions
function getMockMentionsByBrand(brand: string): UnifiedMention[] {
  const now = new Date();
  const mentionsByBrand: Record<string, UnifiedMention[]> = {
    'Revlon': [
      { id: '1', title: 'Revlon One-Step Hair Dryer Full Review - Is It Worth The Hype?', body: 'Testing out the viral Revlon hair dryer brush that everyone has been talking about. Full demo and honest review of the results...', source: 'YouTube', sourceIcon: '▶️', sourceColor: '#DC2626', sourceBg: '#FEF2F2', author: 'Alexandra Beauty', score: 892000, numComments: 4500, sentiment: 'positive', matchedKeyword: 'One-Step Hair Dryer', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 1240000 },
      { id: '2', title: 'ColorStay Foundation vs High-End: Drugstore Dupe Test', body: 'Comparing Revlon ColorStay to luxury foundations to see if it can really compete. Full day wear test included...', source: 'YouTube', sourceIcon: '▶️', sourceColor: '#DC2626', sourceBg: '#FEF2F2', author: 'Beauty News', score: 234000, numComments: 1200, sentiment: 'positive', matchedKeyword: 'ColorStay Foundation', createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 345000 },
      { id: '3', title: 'Revlon Expands Sustainable Packaging Across Lip Product Line', body: 'The beauty giant announces new eco-friendly packaging initiative that will roll out across all lip products by end of year...', source: 'News', sourceIcon: '📰', sourceColor: '#2563EB', sourceBg: '#EFF6FF', author: 'WWD', score: 0, numComments: 156, sentiment: 'positive', matchedKeyword: 'Revlon', createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 89000 },
      { id: '4', title: 'The One-Step changed my entire morning routine', body: 'I was skeptical at first but this thing is amazing. My hair has never looked better and it cuts my styling time in half...', source: 'Reddit', sourceIcon: '🔴', sourceColor: '#F97316', sourceBg: '#FFF7ED', author: 'u/haircare_queen', score: 847, numComments: 156, sentiment: 'positive', matchedKeyword: 'Revlon One-Step', createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 45000 },
      { id: '5', title: 'Revlon Super Lustrous Lipstick Review - 5 Stars', body: 'Classic formula that never disappoints. The shade range is incredible and the price point is unbeatable...', source: 'MakeupAlley', sourceIcon: '💄', sourceColor: '#EC4899', sourceBg: '#FDF2F8', author: 'lipstick_lover', score: 45, numComments: 12, sentiment: 'positive', matchedKeyword: 'Super Lustrous', createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 3400 },
      { id: '6', title: 'ColorStay Foundation - which shade matches NC25?', body: 'Looking for shade recommendations. The formula is great but finding the right shade is tricky...', source: 'Reddit', sourceIcon: '🔴', sourceColor: '#F97316', sourceBg: '#FFF7ED', author: 'u/makeup_newbie', score: 234, numComments: 89, sentiment: 'neutral', matchedKeyword: 'ColorStay', createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 12000 },
      { id: '7', title: 'Revlon ColorStay Longwear Eye Shadow Quad Review', body: 'The new eye shadow quads offer impressive pigmentation and blend beautifully. A solid drugstore option...', source: 'Temptalia', sourceIcon: '💋', sourceColor: '#A855F7', sourceBg: '#FAF5FF', author: 'Christine', score: 0, numComments: 34, sentiment: 'positive', matchedKeyword: 'ColorStay', createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 28000 },
      { id: '8', title: 'Revlon lip liner is severely underrated', body: 'Why isn\'t anyone talking about these? They last all day and the color selection is perfect...', source: 'Reddit', sourceIcon: '🔴', sourceColor: '#F97316', sourceBg: '#FFF7ED', author: 'u/lipstick_lover', score: 567, numComments: 78, sentiment: 'positive', matchedKeyword: 'Revlon lip liner', createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 34000 },
    ],
    'e.l.f.': [
      { id: '1', title: 'e.l.f. Halo Glow vs Charlotte Tilbury Flawless Filter - $14 vs $49', body: 'Side by side comparison of the viral dupe. Is the e.l.f. version really as good as everyone says?', source: 'YouTube', sourceIcon: '▶️', sourceColor: '#DC2626', sourceBg: '#FEF2F2', author: 'Mikayla Nogueira', score: 2300000, numComments: 15600, sentiment: 'positive', matchedKeyword: 'Halo Glow', createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 4500000 },
      { id: '2', title: 'Power Grip Primer - Why Everyone Is Obsessed', body: 'Breaking down the science behind why this primer has taken over TikTok and Instagram...', source: 'YouTube', sourceIcon: '▶️', sourceColor: '#DC2626', sourceBg: '#FEF2F2', author: 'Robert Welsh', score: 890000, numComments: 6700, sentiment: 'positive', matchedKeyword: 'Power Grip Primer', createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 1200000 },
      { id: '3', title: 'How e.l.f. Became Gen Z\'s Favorite Beauty Brand', body: 'The affordable cosmetics brand has seen explosive growth among younger consumers...', source: 'News', sourceIcon: '📰', sourceColor: '#2563EB', sourceBg: '#EFF6FF', author: 'Forbes', score: 0, numComments: 234, sentiment: 'positive', matchedKeyword: 'e.l.f.', createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 156000 },
      { id: '4', title: 'Halo Glow is literally CT for $14', body: 'I cannot believe how good this is. Side by side comparison and honestly I might prefer the e.l.f. version...', source: 'Reddit', sourceIcon: '🔴', sourceColor: '#F97316', sourceBg: '#FFF7ED', author: 'u/dupe_finder', score: 2340, numComments: 456, sentiment: 'positive', matchedKeyword: 'Halo Glow', createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 156000 },
      { id: '5', title: 'Power Grip Primer - out of stock AGAIN', body: 'Third time I\'ve tried to buy this. e.l.f. please restock, this is getting ridiculous...', source: 'Reddit', sourceIcon: '🔴', sourceColor: '#F97316', sourceBg: '#FFF7ED', author: 'u/frustrated_shopper', score: 678, numComments: 189, sentiment: 'negative', matchedKeyword: 'Power Grip Primer', createdAt: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 45000 },
      { id: '6', title: 'e.l.f. Bronzing Drops Swatches and Review', body: 'These give the most beautiful natural glow. Perfect for mixing with foundation or moisturizer...', source: 'Temptalia', sourceIcon: '💋', sourceColor: '#A855F7', sourceBg: '#FAF5FF', author: 'Christine', score: 0, numComments: 67, sentiment: 'positive', matchedKeyword: 'Bronzing Drops', createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 34000 },
      { id: '7', title: 'e.l.f. Camo Concealer - Holy Grail Status', body: 'I\'ve tried everything from Tarte to NARS and this $7 concealer outperforms them all...', source: 'MakeupAlley', sourceIcon: '💄', sourceColor: '#EC4899', sourceBg: '#FDF2F8', author: 'concealer_queen', score: 89, numComments: 34, sentiment: 'positive', matchedKeyword: 'Camo Concealer', createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 5600 },
    ],
    'Maybelline': [
      { id: '1', title: 'Sky High Mascara - Honest Review After 6 Months', body: 'Long-term review of the viral mascara. Does it hold up after daily use?', source: 'YouTube', sourceIcon: '▶️', sourceColor: '#DC2626', sourceBg: '#FEF2F2', author: 'NikkieTutorials', score: 1500000, numComments: 9800, sentiment: 'positive', matchedKeyword: 'Sky High Mascara', createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 3200000 },
      { id: '2', title: 'Fit Me Foundation - All 40 Shades Tested', body: 'Testing every shade of the Fit Me foundation to help you find your perfect match...', source: 'YouTube', sourceIcon: '▶️', sourceColor: '#DC2626', sourceBg: '#FEF2F2', author: 'Nyma Tang', score: 345000, numComments: 2100, sentiment: 'neutral', matchedKeyword: 'Fit Me Foundation', createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 567000 },
      { id: '3', title: 'Maybelline Partners with NYC Fashion Week', body: 'The brand announces exclusive limited edition collection in partnership with top designers...', source: 'News', sourceIcon: '📰', sourceColor: '#2563EB', sourceBg: '#EFF6FF', author: 'Allure', score: 0, numComments: 189, sentiment: 'positive', matchedKeyword: 'Maybelline', createdAt: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 98000 },
      { id: '4', title: 'Sky High Mascara - Does it live up to the hype?', body: 'Finally tried it after seeing it everywhere. The wand is unique and it definitely gives length...', source: 'Reddit', sourceIcon: '🔴', sourceColor: '#F97316', sourceBg: '#FFF7ED', author: 'u/mascara_tester', score: 567, numComments: 234, sentiment: 'neutral', matchedKeyword: 'Sky High Mascara', createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: true, reach: 45000 },
      { id: '5', title: 'Maybelline Vinyl Ink Liquid Lipstick Review', body: 'Long-wearing formula that actually feels comfortable. The shade range has improved significantly...', source: 'Temptalia', sourceIcon: '💋', sourceColor: '#A855F7', sourceBg: '#FAF5FF', author: 'Christine', score: 0, numComments: 45, sentiment: 'positive', matchedKeyword: 'Vinyl Ink', createdAt: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 28000 },
      { id: '6', title: 'Maybelline Lash Sensational - Classic for a Reason', body: 'A classic for a reason. Buildable, doesn\'t clump, and the curved wand makes application easy...', source: 'MakeupAlley', sourceIcon: '💄', sourceColor: '#EC4899', sourceBg: '#FDF2F8', author: 'lash_lover', score: 67, numComments: 23, sentiment: 'positive', matchedKeyword: 'Lash Sensational', createdAt: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString(), url: '#', isHighEngagement: false, reach: 4500 },
    ],
  };

  return mentionsByBrand[brand] || mentionsByBrand['Revlon'];
}

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

// Source styling mapping
const SOURCE_STYLING: Record<string, { color: string; bg: string; icon: string }> = {
  youtube: { color: '#DC2626', bg: '#FEF2F2', icon: '▶️' },
  news: { color: '#2563EB', bg: '#EFF6FF', icon: '📰' },
  reddit: { color: '#F97316', bg: '#FFF7ED', icon: '🔴' },
  mock: { color: '#64748B', bg: '#F1F5F9', icon: '🔧' },
};

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
            <div className="flex items-center justify-between">
              {/* Source Filters */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#64748B] font-medium mr-2">Sources:</span>
                {sources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      source.enabled
                        ? 'border-2'
                        : 'border border-[#E2E8F0] opacity-50 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: source.enabled ? source.bgColor : 'white',
                      borderColor: source.enabled ? source.color : '#E2E8F0',
                      color: source.enabled ? source.color : '#64748B',
                    }}
                  >
                    <span>{source.icon}</span>
                    <span>{source.name}</span>
                  </button>
                ))}
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-3">
                {/* Sentiment Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#64748B]" />
                  <select
                    value={sentiment}
                    onChange={(e) => setSentiment(e.target.value)}
                    className="px-3 py-1.5 text-[11px] border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#64748B]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'engagement' | 'reach')}
                    className="px-3 py-1.5 text-[11px] border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="engagement">Most Engaged</option>
                    <option value="reach">Highest Reach</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'cards' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'compact' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
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
                        <span
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium"
                          style={{ backgroundColor: mention.sourceBg, color: mention.sourceColor }}
                        >
                          {mention.sourceIcon} {mention.source}
                        </span>
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
                      <h3 className="text-[14px] font-semibold text-[#0F172A] mb-2">
                        {mention.title}
                      </h3>

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
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: mention.sourceBg }}
                  >
                    {mention.sourceIcon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-medium text-[#0F172A] truncate">
                      {mention.title}
                    </h3>
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
