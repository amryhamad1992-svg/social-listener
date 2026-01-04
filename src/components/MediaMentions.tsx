'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Eye, ThumbsUp, Clock, Play, Newspaper, TrendingUp, Users, MessageSquare, Share2 } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface Source {
  id: string;
  name: string;
  enabled: boolean;
}

interface MediaItem {
  id: string;
  type: 'youtube' | 'news';
  title: string;
  source: string;
  sourceAvatar: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares?: number;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  reach: number;
  trending?: boolean;
}

// Pastel Stackline colors
const SENTIMENT_CONFIG = {
  positive: { color: '#10B981', bg: '#ECFDF5', label: 'Positive' },
  neutral: { color: '#64748B', bg: '#F1F5F9', label: 'Neutral' },
  negative: { color: '#EF4444', bg: '#FEF2F2', label: 'Negative' },
};

// Brand-specific media mentions data
function getMediaItemsByBrand(brand: string): MediaItem[] {
  const now = new Date();
  const itemsByBrand: Record<string, MediaItem[]> = {
    'Revlon': [
      { id: 'yt1', type: 'youtube', title: 'Revlon One-Step Hair Dryer Review - Worth the Hype? Full Demo & Honest Thoughts', source: 'Alexandra\'s Girly Talk', sourceAvatar: 'AG', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), metrics: { views: 892000, likes: 45000, comments: 3200 }, sentiment: 'positive', reach: 1240000, trending: true },
      { id: 'yt2', type: 'youtube', title: 'Revlon ColorStay vs High-End Foundations | Drugstore Dupe Test', source: 'Beauty News', sourceAvatar: 'BN', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), metrics: { views: 234000, likes: 12000, comments: 890 }, sentiment: 'positive', reach: 345000 },
      { id: 'n1', type: 'news', title: 'Revlon Expands Sustainable Packaging Initiative Across Entire Lip Product Line', source: 'WWD', sourceAvatar: 'WD', url: '#', thumbnail: '📰', publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), metrics: { views: 45000, likes: 2300, comments: 156, shares: 890 }, sentiment: 'positive', reach: 89000 },
      { id: 'yt3', type: 'youtube', title: 'Full Face Using Only Revlon Products | Drugstore Challenge', source: 'Jackie Aina', sourceAvatar: 'JA', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), metrics: { views: 567000, likes: 28000, comments: 1890 }, sentiment: 'positive', reach: 780000, trending: true },
      { id: 'n2', type: 'news', title: 'Revlon Stock Rebounds as Q4 Sales Beat Wall Street Expectations', source: 'Bloomberg', sourceAvatar: 'BB', url: '#', thumbnail: '📰', publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), metrics: { views: 23000, likes: 890, comments: 67, shares: 456 }, sentiment: 'neutral', reach: 56000 },
      { id: 'yt4', type: 'youtube', title: 'Testing Viral Revlon Products from TikTok - Are They Actually Good?', source: 'Hyram', sourceAvatar: 'HY', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), metrics: { views: 1200000, likes: 89000, comments: 5600 }, sentiment: 'positive', reach: 1850000, trending: true },
    ],
    'e.l.f.': [
      { id: 'yt1', type: 'youtube', title: 'e.l.f. Halo Glow vs Charlotte Tilbury Flawless Filter | $14 vs $49 Comparison', source: 'Mikayla Nogueira', sourceAvatar: 'MN', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), metrics: { views: 2300000, likes: 156000, comments: 8900 }, sentiment: 'positive', reach: 4500000, trending: true },
      { id: 'yt2', type: 'youtube', title: 'e.l.f. Power Grip Primer - Why Everyone Is Absolutely Obsessed', source: 'Robert Welsh', sourceAvatar: 'RW', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), metrics: { views: 890000, likes: 67000, comments: 4200 }, sentiment: 'positive', reach: 1200000, trending: true },
      { id: 'n1', type: 'news', title: 'How e.l.f. Cosmetics Became Gen Z\'s Favorite Beauty Brand', source: 'Forbes', sourceAvatar: 'FB', url: '#', thumbnail: '📰', publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), metrics: { views: 89000, likes: 5600, comments: 234, shares: 2100 }, sentiment: 'positive', reach: 156000 },
      { id: 'yt3', type: 'youtube', title: 'Full Face of e.l.f. Dupes for High-End Products | Save Your Money', source: 'Kelly Strack', sourceAvatar: 'KS', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), metrics: { views: 456000, likes: 23000, comments: 1560 }, sentiment: 'positive', reach: 678000 },
      { id: 'n2', type: 'news', title: 'e.l.f. Beauty Stock Hits All-Time High After Stellar Q3 Earnings Report', source: 'CNBC', sourceAvatar: 'CN', url: '#', thumbnail: '📰', publishedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(), metrics: { views: 67000, likes: 3400, comments: 189, shares: 1200 }, sentiment: 'positive', reach: 123000 },
      { id: 'yt4', type: 'youtube', title: 'e.l.f. Bronzing Drops Review - My New Holy Grail Summer Product', source: 'Alexandra Anele', sourceAvatar: 'AA', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 42 * 60 * 60 * 1000).toISOString(), metrics: { views: 678000, likes: 45000, comments: 2340 }, sentiment: 'positive', reach: 890000 },
    ],
    'Maybelline': [
      { id: 'yt1', type: 'youtube', title: 'Maybelline Sky High Mascara - Honest Review After 6 Months of Daily Use', source: 'NikkieTutorials', sourceAvatar: 'NT', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), metrics: { views: 1500000, likes: 98000, comments: 6700 }, sentiment: 'positive', reach: 3200000, trending: true },
      { id: 'yt2', type: 'youtube', title: 'Maybelline Fit Me Foundation - All 40 Shades Tested on Different Skin Tones', source: 'Nyma Tang', sourceAvatar: 'NY', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), metrics: { views: 345000, likes: 18000, comments: 1230 }, sentiment: 'neutral', reach: 567000 },
      { id: 'n1', type: 'news', title: 'Maybelline Partners with NYC Fashion Week for Limited Edition Collection', source: 'Allure', sourceAvatar: 'AL', url: '#', thumbnail: '📰', publishedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(), metrics: { views: 56000, likes: 3400, comments: 189, shares: 780 }, sentiment: 'positive', reach: 98000 },
      { id: 'yt3', type: 'youtube', title: 'New Maybelline Vinyl Ink Review vs e.l.f. Lip Oil - Which is Better?', source: 'Taylor Wynn', sourceAvatar: 'TW', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(), metrics: { views: 234000, likes: 12000, comments: 890 }, sentiment: 'neutral', reach: 345000 },
      { id: 'n2', type: 'news', title: 'Maybelline Expands Inclusive Shade Range After Consumer Feedback Campaign', source: 'Refinery29', sourceAvatar: 'R9', url: '#', thumbnail: '📰', publishedAt: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString(), metrics: { views: 34000, likes: 2100, comments: 123, shares: 560 }, sentiment: 'positive', reach: 67000 },
      { id: 'yt4', type: 'youtube', title: 'Drugstore Mascara Battle: Maybelline vs L\'Oreal vs NYX vs Covergirl', source: 'Tati', sourceAvatar: 'TT', url: '#', thumbnail: '🎬', publishedAt: new Date(now.getTime() - 52 * 60 * 60 * 1000).toISOString(), metrics: { views: 789000, likes: 34000, comments: 2100 }, sentiment: 'neutral', reach: 1100000 },
    ],
  };

  return itemsByBrand[brand] || itemsByBrand['Revlon'];
}

export function MediaMentions() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const [sources, setSources] = useState<Source[]>([
    { id: 'youtube', name: 'YouTube', enabled: true },
    { id: 'news', name: 'News', enabled: true },
  ]);

  const items = useMemo(() => getMediaItemsByBrand(brandName), [brandName]);

  const toggleSource = (id: string) => {
    setSources(prev =>
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const enabledSources = sources.filter(s => s.enabled).map(s => s.id);
  const filteredItems = items.filter(item => enabledSources.includes(item.type));

  // Calculate totals
  const totalReach = filteredItems.reduce((sum, item) => sum + item.reach, 0);
  const totalEngagement = filteredItems.reduce((sum, item) => sum + item.metrics.likes + item.metrics.comments, 0);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[#0F172A]">Media Mentions</h2>
            <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-medium rounded-full">
              {filteredItems.length} mentions
            </span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-0.5">
            YouTube videos & news articles mentioning {brandName}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Summary Stats */}
          <div className="flex items-center gap-4 pr-4 border-r border-[#E2E8F0]">
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[#0F172A]">{formatNumber(totalReach)}</p>
              <p className="text-[9px] text-[#64748B]">Total Reach</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[#0F172A]">{formatNumber(totalEngagement)}</p>
              <p className="text-[9px] text-[#64748B]">Engagement</p>
            </div>
          </div>
          {/* Source Filters */}
          <div className="flex items-center gap-3">
            {sources.map((source) => (
              <label key={source.id} className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                    source.enabled
                      ? 'bg-[#0F172A] border-[#0F172A]'
                      : 'bg-white border-[#CBD5E1]'
                  }`}
                  onClick={() => toggleSource(source.id)}
                >
                  {source.enabled && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] text-[#0F172A] font-medium">
                  {source.id === 'youtube' ? '▶️' : '📰'} {source.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <p className="text-[#64748B] text-center py-8 text-[12px] col-span-2">
            No media mentions found. Enable at least one source.
          </p>
        ) : (
          filteredItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0EA5E9] hover:shadow-md transition-all group"
            >
              {/* Top Row: Type Badge + Trending + Sentiment */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
                    item.type === 'youtube'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {item.type === 'youtube' ? <Play className="w-3 h-3" /> : <Newspaper className="w-3 h-3" />}
                    {item.type === 'youtube' ? 'YouTube' : 'News'}
                  </span>
                  {item.trending && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-medium">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </span>
                  )}
                </div>
                <span
                  className="px-2 py-1 rounded-md text-[10px] font-medium"
                  style={{
                    backgroundColor: SENTIMENT_CONFIG[item.sentiment].bg,
                    color: SENTIMENT_CONFIG[item.sentiment].color,
                  }}
                >
                  {SENTIMENT_CONFIG[item.sentiment].label}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[13px] font-medium text-[#0F172A] mb-3 line-clamp-2 group-hover:text-[#0EA5E9] transition-colors">
                {item.title}
              </h3>

              {/* Source Row */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] flex items-center justify-center text-white text-[9px] font-bold">
                  {item.sourceAvatar}
                </div>
                <span className="text-[11px] font-medium text-[#334155]">{item.source}</span>
                <span className="text-[10px] text-[#94A3B8]">•</span>
                <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.publishedAt)}
                </span>
              </div>

              {/* Metrics Row */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[#64748B]">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{formatNumber(item.metrics.views)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#64748B]">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{formatNumber(item.metrics.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#64748B]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{formatNumber(item.metrics.comments)}</span>
                  </div>
                  {item.metrics.shares && (
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{formatNumber(item.metrics.shares)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#0EA5E9]">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">{formatNumber(item.reach)} reach</span>
                </div>
              </div>

              {/* Engagement Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[9px] text-[#94A3B8] mb-1">
                  <span>Engagement Rate</span>
                  <span>{((item.metrics.likes + item.metrics.comments) / item.metrics.views * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] rounded-full"
                    style={{ width: `${Math.min(((item.metrics.likes + item.metrics.comments) / item.metrics.views * 100) * 5, 100)}%` }}
                  />
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
          <p className="text-[10px] text-[#64748B]">
            Showing {filteredItems.length} mentions with{' '}
            <span className="font-medium text-[#0EA5E9]">{formatNumber(totalReach)} total reach</span>
          </p>
          <button className="flex items-center gap-1 text-[10px] text-[#0EA5E9] hover:underline font-medium">
            View all media mentions
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
