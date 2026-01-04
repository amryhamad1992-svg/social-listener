'use client';

import { useState, useMemo } from 'react';
import {
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Clock,
  Flame,
} from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

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

// Brand-specific web mentions data
function getWebMentionsByBrand(brand: string): ScrapedMention[] {
  const now = new Date();
  const mentionsByBrand: Record<string, ScrapedMention[]> = {
    'Revlon': [
      { id: 'r1', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Revlon One-Step changed my hair routine completely', snippet: 'I was skeptical at first but this thing is amazing. My hair has never looked better and it cuts my styling time in half...', matchedKeyword: 'Revlon One-Step', publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 847, comments: 156 }, sentiment: { label: 'positive', score: 0.92 }, subreddit: 'beauty', isHighEngagement: true },
      { id: 'r2', source: 'Reddit', sourceType: 'forum', url: '#', title: 'ColorStay Foundation - which shade matches NC25?', snippet: 'Looking for shade recommendations. I\'ve heard the formula is great but finding the right shade is tricky...', matchedKeyword: 'ColorStay', publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 234, comments: 89 }, sentiment: { label: 'neutral', score: 0.55 }, subreddit: 'MakeupAddiction', isHighEngagement: false },
      { id: 'm1', source: 'MakeupAlley', sourceType: 'review', url: '#', title: 'Revlon Super Lustrous Lipstick Review', snippet: 'Classic formula that never disappoints. The shade range is incredible and the price point is unbeatable...', matchedKeyword: 'Super Lustrous', publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 45, comments: 12 }, sentiment: { label: 'positive', score: 0.88 }, category: 'Lip Products', isHighEngagement: false },
      { id: 't1', source: 'Temptalia', sourceType: 'blog', url: '#', title: 'Revlon ColorStay Looks Longwear Eye Shadow Review', snippet: 'The new eye shadow quads offer impressive pigmentation and blend beautifully. A solid drugstore option...', matchedKeyword: 'ColorStay', publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 34 }, sentiment: { label: 'positive', score: 0.78 }, category: 'Reviews', isHighEngagement: false },
      { id: 'r3', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Revlon lip liner is severely underrated', snippet: 'Why isn\'t anyone talking about these? They last all day and the color selection is perfect for everyday wear...', matchedKeyword: 'Revlon lip liner', publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 567, comments: 78 }, sentiment: { label: 'positive', score: 0.85 }, subreddit: 'drugstoreMUA', isHighEngagement: true },
      { id: 'g1', source: 'Into The Gloss', sourceType: 'blog', url: '#', title: 'The Drugstore Products Our Editors Actually Use', snippet: 'Revlon\'s One-Step is a staple in our beauty routines. It delivers salon-quality results at home...', matchedKeyword: 'Revlon', publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 23 }, sentiment: { label: 'positive', score: 0.82 }, category: 'Editor Picks', isHighEngagement: false },
    ],
    'e.l.f.': [
      { id: 'r1', source: 'Reddit', sourceType: 'forum', url: '#', title: 'e.l.f. Halo Glow is literally Charlotte Tilbury for $14', snippet: 'I cannot believe how good this is. Side by side comparison and honestly I might prefer the e.l.f. version...', matchedKeyword: 'Halo Glow', publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 2340, comments: 456 }, sentiment: { label: 'positive', score: 0.95 }, subreddit: 'MakeupAddiction', isHighEngagement: true },
      { id: 'r2', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Power Grip Primer - out of stock AGAIN', snippet: 'Third time I\'ve tried to buy this. e.l.f. please restock, this is getting ridiculous...', matchedKeyword: 'Power Grip Primer', publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 678, comments: 189 }, sentiment: { label: 'negative', score: 0.35 }, subreddit: 'beauty', isHighEngagement: true },
      { id: 't1', source: 'Temptalia', sourceType: 'blog', url: '#', title: 'e.l.f. Bronzing Drops Swatches and Review', snippet: 'These give the most beautiful natural glow. Perfect for mixing with foundation or moisturizer...', matchedKeyword: 'Bronzing Drops', publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 67 }, sentiment: { label: 'positive', score: 0.88 }, category: 'Reviews', isHighEngagement: false },
      { id: 'm1', source: 'MakeupAlley', sourceType: 'review', url: '#', title: 'e.l.f. Camo Concealer Holy Grail Review', snippet: 'I\'ve tried everything from Tarte to NARS and this $7 concealer outperforms them all...', matchedKeyword: 'Camo Concealer', publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 89, comments: 34 }, sentiment: { label: 'positive', score: 0.91 }, category: 'Face Products', isHighEngagement: false },
      { id: 'r3', source: 'Reddit', sourceType: 'forum', url: '#', title: 'e.l.f. keeps winning - new lip oil is amazing', snippet: 'Just picked this up and wow. Glossy, hydrating, and actually has a nice subtle tint. Gen Z knows what\'s up...', matchedKeyword: 'e.l.f. lip oil', publishedAt: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 1234, comments: 234 }, sentiment: { label: 'positive', score: 0.89 }, subreddit: 'drugstoreMUA', isHighEngagement: true },
      { id: 'a1', source: 'Allure', sourceType: 'blog', url: '#', title: 'Best Drugstore Makeup 2024: e.l.f. Dominates', snippet: 'From viral TikTok products to reliable everyday staples, e.l.f. continues to prove that great makeup doesn\'t have to be expensive...', matchedKeyword: 'e.l.f.', publishedAt: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 45 }, sentiment: { label: 'positive', score: 0.86 }, category: 'Best Of', isHighEngagement: false },
    ],
    'Maybelline': [
      { id: 'r1', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Sky High Mascara - Does it live up to the hype?', snippet: 'Finally tried it after seeing it everywhere. The wand is unique and it definitely gives length but I found it smudged by end of day...', matchedKeyword: 'Sky High Mascara', publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 567, comments: 234 }, sentiment: { label: 'neutral', score: 0.58 }, subreddit: 'MakeupAddiction', isHighEngagement: true },
      { id: 'r2', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Fit Me Foundation shade match help needed', snippet: 'I\'m between 220 and 230, has anyone tried both? The undertones seem different in store vs natural light...', matchedKeyword: 'Fit Me', publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 189, comments: 78 }, sentiment: { label: 'neutral', score: 0.52 }, subreddit: 'beauty', isHighEngagement: false },
      { id: 't1', source: 'Temptalia', sourceType: 'blog', url: '#', title: 'Maybelline Vinyl Ink Liquid Lipstick Review', snippet: 'Long-wearing formula that actually feels comfortable. The shade range has improved significantly...', matchedKeyword: 'Vinyl Ink', publishedAt: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 45 }, sentiment: { label: 'positive', score: 0.79 }, category: 'Reviews', isHighEngagement: false },
      { id: 'm1', source: 'MakeupAlley', sourceType: 'review', url: '#', title: 'Maybelline Lash Sensational Review', snippet: 'A classic for a reason. Buildable, doesn\'t clump, and the curved wand makes application easy...', matchedKeyword: 'Lash Sensational', publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 67, comments: 23 }, sentiment: { label: 'positive', score: 0.84 }, category: 'Eye Products', isHighEngagement: false },
      { id: 'r3', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Maybelline vs e.l.f. - which drugstore brand wins?', snippet: 'Comparing the two biggest drugstore names. Maybelline has mascaras on lock but e.l.f. is killing it with face products...', matchedKeyword: 'Maybelline', publishedAt: new Date(now.getTime() - 32 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 890, comments: 345 }, sentiment: { label: 'neutral', score: 0.55 }, subreddit: 'drugstoreMUA', isHighEngagement: true },
      { id: 'g1', source: 'Into The Gloss', sourceType: 'blog', url: '#', title: 'Drugstore Mascara Round-Up: Maybelline Still Reigns', snippet: 'After testing 15 mascaras, Maybelline formulas consistently deliver. Sky High and Lash Sensational remain top picks...', matchedKeyword: 'Maybelline', publishedAt: new Date(now.getTime() - 44 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 34 }, sentiment: { label: 'positive', score: 0.81 }, category: 'Roundups', isHighEngagement: false },
    ],
  };

  return mentionsByBrand[brand] || mentionsByBrand['Revlon'];
}

export function WebMentions() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const [sources, setSources] = useState<Source[]>([
    { name: 'Reddit', enabled: true },
    { name: 'MakeupAlley', enabled: true },
    { name: 'Temptalia', enabled: true },
    { name: 'Into The Gloss', enabled: true },
    { name: 'Allure', enabled: true },
  ]);
  const [showHighEngagementOnly, setShowHighEngagementOnly] = useState(false);

  const mentions = useMemo(() => getWebMentionsByBrand(brandName), [brandName]);

  const toggleSource = (name: string) => {
    setSources(prev =>
      prev.map(s => s.name === name ? { ...s, enabled: !s.enabled } : s)
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
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const enabledSources = sources.filter(s => s.enabled).map(s => s.name);
  let filteredMentions = mentions.filter(m => enabledSources.includes(m.source));

  if (showHighEngagementOnly) {
    filteredMentions = filteredMentions.filter(m => m.isHighEngagement);
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
          <span className="text-[10px] text-[#64748B]">
            {brandName}
          </span>
        </div>
      )}
    </div>
  );
}
