'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Eye, ThumbsUp, Clock } from 'lucide-react';
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
  url: string;
  thumbnail?: string;
  publishedAt: string;
  metrics: {
    primary: number;
    secondary?: number;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Pastel Stackline colors
const SENTIMENT_COLORS = {
  positive: '#86EFAC',
  neutral: '#CBD5E1',
  negative: '#FCA5A5',
};

// Brand-specific media mentions data
function getMediaItemsByBrand(brand: string): MediaItem[] {
  const now = new Date();
  const itemsByBrand: Record<string, MediaItem[]> = {
    'Revlon': [
      { id: 'yt1', type: 'youtube', title: 'Revlon One-Step Hair Dryer Review - Worth the Hype?', source: 'Alexandra\'s Girly Talk', url: '#', publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), metrics: { primary: 892000, secondary: 45000 }, sentiment: 'positive' },
      { id: 'yt2', type: 'youtube', title: 'Revlon ColorStay vs High-End Foundations | Drugstore Dupe Test', source: 'Beauty News', url: '#', publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), metrics: { primary: 234000, secondary: 12000 }, sentiment: 'positive' },
      { id: 'n1', type: 'news', title: 'Revlon Expands Sustainable Packaging Initiative Across Lip Products', source: 'WWD', url: '#', publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), metrics: { primary: 0 }, sentiment: 'positive' },
      { id: 'yt3', type: 'youtube', title: 'Full Face Using Only Revlon Products | Drugstore Challenge', source: 'Jackie Aina', url: '#', publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), metrics: { primary: 567000, secondary: 28000 }, sentiment: 'positive' },
      { id: 'n2', type: 'news', title: 'Revlon Stock Rebounds as Q4 Sales Beat Expectations', source: 'Bloomberg', url: '#', publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), metrics: { primary: 0 }, sentiment: 'neutral' },
      { id: 'yt4', type: 'youtube', title: 'Testing Viral Revlon Products from TikTok', source: 'Hyram', url: '#', publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), metrics: { primary: 1200000, secondary: 89000 }, sentiment: 'positive' },
    ],
    'e.l.f.': [
      { id: 'yt1', type: 'youtube', title: 'e.l.f. Halo Glow vs Charlotte Tilbury Flawless Filter | $14 vs $49', source: 'Mikayla Nogueira', url: '#', publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), metrics: { primary: 2300000, secondary: 156000 }, sentiment: 'positive' },
      { id: 'yt2', type: 'youtube', title: 'e.l.f. Power Grip Primer - Why Everyone Is Obsessed', source: 'Robert Welsh', url: '#', publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), metrics: { primary: 890000, secondary: 67000 }, sentiment: 'positive' },
      { id: 'n1', type: 'news', title: 'How e.l.f. Cosmetics Became Gen Z\'s Favorite Beauty Brand', source: 'Forbes', url: '#', publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), metrics: { primary: 0 }, sentiment: 'positive' },
      { id: 'yt3', type: 'youtube', title: 'Full Face of e.l.f. Dupes for High-End Products', source: 'Kelly Strack', url: '#', publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), metrics: { primary: 456000, secondary: 23000 }, sentiment: 'positive' },
      { id: 'n2', type: 'news', title: 'e.l.f. Beauty Stock Hits All-Time High After Stellar Earnings', source: 'CNBC', url: '#', publishedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(), metrics: { primary: 0 }, sentiment: 'positive' },
      { id: 'yt4', type: 'youtube', title: 'e.l.f. Bronzing Drops Review - New Holy Grail?', source: 'Alexandra Anele', url: '#', publishedAt: new Date(now.getTime() - 42 * 60 * 60 * 1000).toISOString(), metrics: { primary: 678000, secondary: 45000 }, sentiment: 'positive' },
    ],
    'Maybelline': [
      { id: 'yt1', type: 'youtube', title: 'Maybelline Sky High Mascara - Honest Review After 6 Months', source: 'NikkieTutorials', url: '#', publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), metrics: { primary: 1500000, secondary: 98000 }, sentiment: 'positive' },
      { id: 'yt2', type: 'youtube', title: 'Maybelline Fit Me Foundation - All 40 Shades Tested', source: 'Nyma Tang', url: '#', publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), metrics: { primary: 345000, secondary: 18000 }, sentiment: 'neutral' },
      { id: 'n1', type: 'news', title: 'Maybelline Partners with NYC Fashion Week for Limited Edition Collection', source: 'Allure', url: '#', publishedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(), metrics: { primary: 0 }, sentiment: 'positive' },
      { id: 'yt3', type: 'youtube', title: 'New Maybelline Vinyl Ink Review vs e.l.f. Lip Oil', source: 'Taylor Wynn', url: '#', publishedAt: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(), metrics: { primary: 234000, secondary: 12000 }, sentiment: 'neutral' },
      { id: 'n2', type: 'news', title: 'Maybelline Expands Inclusive Shade Range After Consumer Feedback', source: 'Refinery29', url: '#', publishedAt: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString(), metrics: { primary: 0 }, sentiment: 'positive' },
      { id: 'yt4', type: 'youtube', title: 'Drugstore Mascara Battle: Maybelline vs L\'Oreal vs NYX', source: 'Tati', url: '#', publishedAt: new Date(now.getTime() - 52 * 60 * 60 * 1000).toISOString(), metrics: { primary: 789000, secondary: 34000 }, sentiment: 'neutral' },
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

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header with Checkboxes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#0F172A]">Media Mentions</h2>
        <div className="flex items-center gap-4">
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
              <span className="text-[11px] text-[#0F172A] font-medium">{source.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1.5">
        {filteredItems.length === 0 ? (
          <p className="text-[#64748B] text-center py-8 text-[12px]">
            No media mentions found. Enable at least one source.
          </p>
        ) : (
          filteredItems.slice(0, 6).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded hover:bg-[#F8FAFC] transition-colors group"
            >
              {/* Source label */}
              <div className="w-12 text-[9px] font-medium text-[#64748B] uppercase tracking-wide flex-shrink-0">
                {item.type === 'youtube' ? 'YouTube' : 'News'}
              </div>

              {/* Sentiment dot */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: SENTIMENT_COLORS[item.sentiment] }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[#0F172A] truncate group-hover:text-[#0F172A]/70 transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-[#64748B]">
                  <span>{item.source}</span>
                  {item.type === 'youtube' && item.metrics.primary > 0 && (
                    <>
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        {formatNumber(item.metrics.primary)}
                      </span>
                      {item.metrics.secondary !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <ThumbsUp className="w-2.5 h-2.5" />
                          {formatNumber(item.metrics.secondary)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-[9px] text-[#94A3B8] flex-shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {formatDate(item.publishedAt)}
              </div>

              {/* Link icon */}
              <ExternalLink className="w-3 h-3 text-[#94A3B8] group-hover:text-[#0F172A] flex-shrink-0" />
            </a>
          ))
        )}
      </div>

      {filteredItems.length > 6 && (
        <button className="w-full mt-3 pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] hover:text-[#0F172A]">
          View all {filteredItems.length} mentions →
        </button>
      )}
    </div>
  );
}
