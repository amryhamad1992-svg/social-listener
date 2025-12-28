'use client';

import { useState, useEffect } from 'react';
import {
  ExternalLink,
  Loader2,
  MessageSquare,
  ThumbsUp,
  Clock,
  Flame,
  Filter,
} from 'lucide-react';

interface ScrapedMention {
  id: string;
  source: string;
  sourceType: string;
  url: string;
  title: string;
  snippet: string;
  matchedKeyword: string;
  publishedAt: string;
  engagement: {
    upvotes?: number;
    comments?: number;
  };
  sentiment?: {
    label: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  author?: string;
  subreddit?: string;
  category?: string;
  isHighEngagement: boolean;
}

interface Source {
  name: string;
  enabled: boolean;
}

// Pastel Stackline colors
const SENTIMENT_COLORS = {
  positive: '#86EFAC',
  neutral: '#CBD5E1',
  negative: '#FCA5A5',
};

const SOURCE_ICONS: { [key: string]: string } = {
  Reddit: '🔴',
  MakeupAlley: '💄',
  Temptalia: '💋',
  'Into The Gloss': '✨',
  Allure: '📰',
};

export function WebMentions() {
  const [sources, setSources] = useState<Source[]>([
    { name: 'Reddit', enabled: true },
    { name: 'MakeupAlley', enabled: true },
    { name: 'Temptalia', enabled: true },
    { name: 'Into The Gloss', enabled: true },
    { name: 'Allure', enabled: true },
  ]);
  const [mentions, setMentions] = useState<ScrapedMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHighEngagementOnly, setShowHighEngagementOnly] = useState(false);

  useEffect(() => {
    fetchMentions();
  }, []);

  const toggleSource = (name: string) => {
    setSources(prev =>
      prev.map(s => s.name === name ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const fetchMentions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scrape');
      const data = await res.json();
      if (data.success && data.data?.mentions) {
        setMentions(data.data.mentions);
      }
    } catch (error) {
      console.error('Failed to fetch web mentions:', error);
    } finally {
      setLoading(false);
    }
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
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const enabledSources = sources.filter(s => s.enabled).map(s => s.name);
  let filteredMentions = mentions.filter(m => enabledSources.includes(m.source));

  if (showHighEngagementOnly) {
    filteredMentions = filteredMentions.filter(m => m.isHighEngagement);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-medium text-[#0F172A] mb-4">Web Mentions</h2>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-[#0F172A]">Web Mentions</h2>
          <p className="text-[10px] text-[#64748B] mt-0.5">
            Forums, blogs & review sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* High Engagement Filter */}
          <button
            onClick={() => setShowHighEngagementOnly(!showHighEngagementOnly)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-colors ${
              showHighEngagementOnly
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0F172A]'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Hot</span>
          </button>
        </div>
      </div>

      {/* Source Checkboxes */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-[#E2E8F0]">
        {sources.map((source) => (
          <label key={source.name} className="flex items-center gap-1.5 cursor-pointer">
            <div
              className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center transition-colors ${
                source.enabled
                  ? 'bg-[#0F172A] border-[#0F172A]'
                  : 'bg-white border-[#CBD5E1]'
              }`}
              onClick={() => toggleSource(source.name)}
            >
              {source.enabled && (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-[10px] text-[#0F172A] font-medium">
              {SOURCE_ICONS[source.name]} {source.name}
            </span>
          </label>
        ))}
      </div>

      {/* Mentions List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredMentions.length === 0 ? (
          <p className="text-[#64748B] text-center py-8 text-[12px]">
            No mentions found. Enable more sources or adjust filters.
          </p>
        ) : (
          filteredMentions.map((mention) => (
            <a
              key={mention.id}
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F172A] hover:bg-[#F8FAFC] transition-colors group"
            >
              {/* Top Row: Source + Sentiment + High Engagement */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-medium text-[#64748B] uppercase tracking-wide">
                  {SOURCE_ICONS[mention.source]} {mention.source}
                </span>
                {mention.subreddit && (
                  <span className="text-[9px] text-[#94A3B8]">
                    r/{mention.subreddit}
                  </span>
                )}
                {mention.category && (
                  <span className="text-[9px] text-[#94A3B8]">
                    {mention.category}
                  </span>
                )}
                <div className="flex-1" />
                {mention.isHighEngagement && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[8px] font-medium rounded">
                    <Flame className="w-2.5 h-2.5" />
                    Hot
                  </span>
                )}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SENTIMENT_COLORS[mention.sentiment?.label || 'neutral'] }}
                />
              </div>

              {/* Title */}
              <h3 className="text-[12px] font-medium text-[#0F172A] mb-1 line-clamp-2 group-hover:text-[#0EA5E9]">
                {mention.title}
              </h3>

              {/* Snippet */}
              <p className="text-[10px] text-[#64748B] line-clamp-2 mb-2">
                {mention.snippet}
              </p>

              {/* Bottom Row: Metrics */}
              <div className="flex items-center gap-3 text-[9px] text-[#94A3B8]">
                {mention.matchedKeyword && (
                  <span className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] rounded font-medium">
                    {mention.matchedKeyword}
                  </span>
                )}
                {(mention.engagement.upvotes ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5">
                    <ThumbsUp className="w-2.5 h-2.5" />
                    {formatNumber(mention.engagement.upvotes!)}
                  </span>
                )}
                {(mention.engagement.comments ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="w-2.5 h-2.5" />
                    {formatNumber(mention.engagement.comments!)}
                  </span>
                )}
                <span className="flex items-center gap-0.5 ml-auto">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(mention.publishedAt)}
                </span>
                <ExternalLink className="w-3 h-3 group-hover:text-[#0F172A]" />
              </div>
            </a>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredMentions.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
          <span className="text-[9px] text-[#94A3B8]">
            {filteredMentions.length} mentions from {enabledSources.length} sources
          </span>
          <button
            onClick={fetchMentions}
            className="text-[10px] text-[#0EA5E9] hover:underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
