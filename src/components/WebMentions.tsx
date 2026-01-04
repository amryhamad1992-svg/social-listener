'use client';

import { useState, useMemo } from 'react';
import {
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Clock,
  Flame,
  TrendingUp,
  Users,
  Filter,
  BarChart3,
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
  sentiment: {
    label: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  author?: string;
  subreddit?: string;
  category?: string;
  isHighEngagement: boolean;
  reach: number;
}

interface Source {
  name: string;
  enabled: boolean;
  icon: string;
  color: string;
  bgColor: string;
}

// Sentiment configuration
const SENTIMENT_CONFIG = {
  positive: { color: '#10B981', bg: '#ECFDF5', label: 'Positive', barColor: '#10B981' },
  neutral: { color: '#64748B', bg: '#F1F5F9', label: 'Neutral', barColor: '#94A3B8' },
  negative: { color: '#EF4444', bg: '#FEF2F2', label: 'Negative', barColor: '#EF4444' },
};

// Brand-specific web mentions data
function getWebMentionsByBrand(brand: string): ScrapedMention[] {
  const now = new Date();
  const mentionsByBrand: Record<string, ScrapedMention[]> = {
    'Revlon': [
      { id: 'r1', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Revlon One-Step changed my hair routine completely', snippet: 'I was skeptical at first but this thing is amazing. My hair has never looked better and it cuts my styling time in half. The heat settings are perfect and the brush bristles detangle while drying...', matchedKeyword: 'Revlon One-Step', publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 847, comments: 156 }, sentiment: { label: 'positive', score: 0.92 }, subreddit: 'beauty', isHighEngagement: true, reach: 45000, author: 'haircare_queen' },
      { id: 'r2', source: 'Reddit', sourceType: 'forum', url: '#', title: 'ColorStay Foundation - which shade matches NC25?', snippet: 'Looking for shade recommendations. I\'ve heard the formula is great but finding the right shade is tricky. Anyone with similar skin tone found their perfect match?', matchedKeyword: 'ColorStay', publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 234, comments: 89 }, sentiment: { label: 'neutral', score: 0.55 }, subreddit: 'MakeupAddiction', isHighEngagement: false, reach: 12000, author: 'makeup_newbie' },
      { id: 'm1', source: 'MakeupAlley', sourceType: 'review', url: '#', title: 'Revlon Super Lustrous Lipstick - 5 Stars!', snippet: 'Classic formula that never disappoints. The shade range is incredible and the price point is unbeatable. I\'ve been using this lipstick for years and it\'s still my go-to...', matchedKeyword: 'Super Lustrous', publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 45, comments: 12 }, sentiment: { label: 'positive', score: 0.88 }, category: 'Lip Products', isHighEngagement: false, reach: 3400 },
      { id: 't1', source: 'Temptalia', sourceType: 'blog', url: '#', title: 'Revlon ColorStay Looks Longwear Eye Shadow Review', snippet: 'The new eye shadow quads offer impressive pigmentation and blend beautifully. A solid drugstore option that rivals mid-range brands in performance...', matchedKeyword: 'ColorStay', publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 34 }, sentiment: { label: 'positive', score: 0.78 }, category: 'Reviews', isHighEngagement: false, reach: 28000 },
      { id: 'r3', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Revlon lip liner is severely underrated', snippet: 'Why isn\'t anyone talking about these? They last all day and the color selection is perfect for everyday wear. Just picked up 3 more shades...', matchedKeyword: 'Revlon lip liner', publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 567, comments: 78 }, sentiment: { label: 'positive', score: 0.85 }, subreddit: 'drugstoreMUA', isHighEngagement: true, reach: 34000, author: 'lipstick_lover' },
      { id: 'g1', source: 'Into The Gloss', sourceType: 'blog', url: '#', title: 'The Drugstore Products Our Editors Actually Use', snippet: 'Revlon\'s One-Step is a staple in our beauty routines. It delivers salon-quality results at home without the hefty price tag...', matchedKeyword: 'Revlon', publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 23 }, sentiment: { label: 'positive', score: 0.82 }, category: 'Editor Picks', isHighEngagement: false, reach: 56000 },
      { id: 'a1', source: 'Allure', sourceType: 'blog', url: '#', title: 'Best Drugstore Beauty Finds Under $15', snippet: 'Revlon continues to dominate the affordable beauty space with consistent quality across their entire product line...', matchedKeyword: 'Revlon', publishedAt: new Date(now.getTime() - 60 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 45 }, sentiment: { label: 'positive', score: 0.79 }, category: 'Best Of', isHighEngagement: false, reach: 89000 },
    ],
    'e.l.f.': [
      { id: 'r1', source: 'Reddit', sourceType: 'forum', url: '#', title: 'e.l.f. Halo Glow is literally Charlotte Tilbury for $14', snippet: 'I cannot believe how good this is. Side by side comparison and honestly I might prefer the e.l.f. version. The glow is more natural and it sits better on my skin...', matchedKeyword: 'Halo Glow', publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 2340, comments: 456 }, sentiment: { label: 'positive', score: 0.95 }, subreddit: 'MakeupAddiction', isHighEngagement: true, reach: 156000, author: 'dupe_finder' },
      { id: 'r2', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Power Grip Primer - out of stock AGAIN', snippet: 'Third time I\'ve tried to buy this. e.l.f. please restock, this is getting ridiculous. Has anyone found it in stores recently?', matchedKeyword: 'Power Grip Primer', publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 678, comments: 189 }, sentiment: { label: 'negative', score: 0.35 }, subreddit: 'beauty', isHighEngagement: true, reach: 45000, author: 'frustrated_shopper' },
      { id: 't1', source: 'Temptalia', sourceType: 'blog', url: '#', title: 'e.l.f. Bronzing Drops Swatches and Review', snippet: 'These give the most beautiful natural glow. Perfect for mixing with foundation or moisturizer for that effortless sun-kissed look...', matchedKeyword: 'Bronzing Drops', publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 67 }, sentiment: { label: 'positive', score: 0.88 }, category: 'Reviews', isHighEngagement: false, reach: 34000 },
      { id: 'm1', source: 'MakeupAlley', sourceType: 'review', url: '#', title: 'e.l.f. Camo Concealer - Holy Grail Status', snippet: 'I\'ve tried everything from Tarte to NARS and this $7 concealer outperforms them all. The coverage is insane and it doesn\'t crease...', matchedKeyword: 'Camo Concealer', publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 89, comments: 34 }, sentiment: { label: 'positive', score: 0.91 }, category: 'Face Products', isHighEngagement: false, reach: 5600 },
      { id: 'r3', source: 'Reddit', sourceType: 'forum', url: '#', title: 'e.l.f. keeps winning - new lip oil is amazing', snippet: 'Just picked this up and wow. Glossy, hydrating, and actually has a nice subtle tint. Gen Z knows what\'s up with this brand...', matchedKeyword: 'e.l.f. lip oil', publishedAt: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 1234, comments: 234 }, sentiment: { label: 'positive', score: 0.89 }, subreddit: 'drugstoreMUA', isHighEngagement: true, reach: 78000, author: 'genz_beauty' },
      { id: 'a1', source: 'Allure', sourceType: 'blog', url: '#', title: 'Best Drugstore Makeup 2024: e.l.f. Dominates', snippet: 'From viral TikTok products to reliable everyday staples, e.l.f. continues to prove that great makeup doesn\'t have to be expensive...', matchedKeyword: 'e.l.f.', publishedAt: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 45 }, sentiment: { label: 'positive', score: 0.86 }, category: 'Best Of', isHighEngagement: false, reach: 123000 },
      { id: 'g1', source: 'Into The Gloss', sourceType: 'blog', url: '#', title: 'TikTok Made Me Buy It: e.l.f. Edition', snippet: 'We tested the most viral e.l.f. products to see if they live up to the hype. Spoiler: most of them absolutely do...', matchedKeyword: 'e.l.f.', publishedAt: new Date(now.getTime() - 52 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 56 }, sentiment: { label: 'positive', score: 0.84 }, category: 'TikTok', isHighEngagement: false, reach: 67000 },
    ],
    'Maybelline': [
      { id: 'r1', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Sky High Mascara - Does it live up to the hype?', snippet: 'Finally tried it after seeing it everywhere. The wand is unique and it definitely gives length but I found it smudged by end of day. Mixed feelings overall...', matchedKeyword: 'Sky High Mascara', publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 567, comments: 234 }, sentiment: { label: 'neutral', score: 0.58 }, subreddit: 'MakeupAddiction', isHighEngagement: true, reach: 45000, author: 'mascara_tester' },
      { id: 'r2', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Fit Me Foundation shade match help needed', snippet: 'I\'m between 220 and 230, has anyone tried both? The undertones seem different in store vs natural light. Need help deciding...', matchedKeyword: 'Fit Me', publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 189, comments: 78 }, sentiment: { label: 'neutral', score: 0.52 }, subreddit: 'beauty', isHighEngagement: false, reach: 12000, author: 'shade_confused' },
      { id: 't1', source: 'Temptalia', sourceType: 'blog', url: '#', title: 'Maybelline Vinyl Ink Liquid Lipstick Review', snippet: 'Long-wearing formula that actually feels comfortable. The shade range has improved significantly and there\'s something for everyone...', matchedKeyword: 'Vinyl Ink', publishedAt: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 45 }, sentiment: { label: 'positive', score: 0.79 }, category: 'Reviews', isHighEngagement: false, reach: 28000 },
      { id: 'm1', source: 'MakeupAlley', sourceType: 'review', url: '#', title: 'Maybelline Lash Sensational - Classic for a Reason', snippet: 'A classic for a reason. Buildable, doesn\'t clump, and the curved wand makes application easy. Been repurchasing for 3 years...', matchedKeyword: 'Lash Sensational', publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 67, comments: 23 }, sentiment: { label: 'positive', score: 0.84 }, category: 'Eye Products', isHighEngagement: false, reach: 4500 },
      { id: 'r3', source: 'Reddit', sourceType: 'forum', url: '#', title: 'Maybelline vs e.l.f. - which drugstore brand wins?', snippet: 'Comparing the two biggest drugstore names. Maybelline has mascaras on lock but e.l.f. is killing it with face products. What\'s your pick?', matchedKeyword: 'Maybelline', publishedAt: new Date(now.getTime() - 32 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 890, comments: 345 }, sentiment: { label: 'neutral', score: 0.55 }, subreddit: 'drugstoreMUA', isHighEngagement: true, reach: 56000, author: 'drugstore_debate' },
      { id: 'g1', source: 'Into The Gloss', sourceType: 'blog', url: '#', title: 'Drugstore Mascara Round-Up: Maybelline Still Reigns', snippet: 'After testing 15 mascaras, Maybelline formulas consistently deliver. Sky High and Lash Sensational remain top picks for different lash goals...', matchedKeyword: 'Maybelline', publishedAt: new Date(now.getTime() - 44 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 34 }, sentiment: { label: 'positive', score: 0.81 }, category: 'Roundups', isHighEngagement: false, reach: 45000 },
      { id: 'a1', source: 'Allure', sourceType: 'blog', url: '#', title: 'Maybelline\'s New Launches for Spring 2024', snippet: 'The L\'Oreal-owned brand continues to innovate with fresh formulas and trendy shades that compete with prestige brands...', matchedKeyword: 'Maybelline', publishedAt: new Date(now.getTime() - 56 * 60 * 60 * 1000).toISOString(), engagement: { upvotes: 0, comments: 28 }, sentiment: { label: 'positive', score: 0.76 }, category: 'New Launches', isHighEngagement: false, reach: 78000 },
    ],
  };

  return mentionsByBrand[brand] || mentionsByBrand['Revlon'];
}

export function WebMentions() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const [sources, setSources] = useState<Source[]>([
    { name: 'Reddit', enabled: true, icon: '🔴', color: '#FF4500', bgColor: '#FFF1EE' },
    { name: 'MakeupAlley', enabled: true, icon: '💄', color: '#E91E63', bgColor: '#FCE4EC' },
    { name: 'Temptalia', enabled: true, icon: '💋', color: '#9C27B0', bgColor: '#F3E5F5' },
    { name: 'Into The Gloss', enabled: true, icon: '✨', color: '#00BCD4', bgColor: '#E0F7FA' },
    { name: 'Allure', enabled: true, icon: '📰', color: '#607D8B', bgColor: '#ECEFF1' },
  ]);
  const [showHighEngagementOnly, setShowHighEngagementOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'engagement' | 'reach'>('recent');

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
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const enabledSources = sources.filter(s => s.enabled).map(s => s.name);
  let filteredMentions = mentions.filter(m => enabledSources.includes(m.source));

  if (showHighEngagementOnly) {
    filteredMentions = filteredMentions.filter(m => m.isHighEngagement);
  }

  // Sort mentions
  filteredMentions = [...filteredMentions].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    } else if (sortBy === 'engagement') {
      return ((b.engagement.upvotes || 0) + (b.engagement.comments || 0)) -
             ((a.engagement.upvotes || 0) + (a.engagement.comments || 0));
    } else {
      return b.reach - a.reach;
    }
  });

  // Calculate summary stats
  const totalReach = filteredMentions.reduce((sum, m) => sum + m.reach, 0);
  const totalEngagement = filteredMentions.reduce((sum, m) => sum + (m.engagement.upvotes || 0) + (m.engagement.comments || 0), 0);
  const sentimentBreakdown = {
    positive: filteredMentions.filter(m => m.sentiment.label === 'positive').length,
    neutral: filteredMentions.filter(m => m.sentiment.label === 'neutral').length,
    negative: filteredMentions.filter(m => m.sentiment.label === 'negative').length,
  };

  const getSourceConfig = (sourceName: string) => {
    return sources.find(s => s.name === sourceName) || sources[0];
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[#0F172A]">Web Mentions</h2>
            <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-medium rounded-full">
              {filteredMentions.length} mentions
            </span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-0.5">
            Forums, blogs & review sites discussing {brandName}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-6">
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

          {/* Sentiment Mini Chart */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {sentimentBreakdown.positive > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-[10px] text-[#64748B]">{sentimentBreakdown.positive}</span>
                </div>
              )}
              {sentimentBreakdown.neutral > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                  <span className="text-[10px] text-[#64748B]">{sentimentBreakdown.neutral}</span>
                </div>
              )}
              {sentimentBreakdown.negative > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <span className="text-[10px] text-[#64748B]">{sentimentBreakdown.negative}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
        {/* Source Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {sources.map((source) => (
            <button
              key={source.name}
              onClick={() => toggleSource(source.name)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
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

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHighEngagementOnly(!showHighEngagementOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
              showHighEngagementOnly
                ? 'bg-amber-50 text-amber-600 border-2 border-amber-300'
                : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-amber-300'
            }`}
          >
            <Flame className="w-3 h-3" />
            Hot Only
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'engagement' | 'reach')}
            className="px-2.5 py-1.5 text-[10px] border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="recent">Most Recent</option>
            <option value="engagement">Most Engaged</option>
            <option value="reach">Highest Reach</option>
          </select>
        </div>
      </div>

      {/* Mentions List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredMentions.length === 0 ? (
          <p className="text-[#64748B] text-center py-8 text-[12px]">
            No mentions found. Enable more sources or adjust filters.
          </p>
        ) : (
          filteredMentions.map((mention) => {
            const sourceConfig = getSourceConfig(mention.source);
            const totalEngagement = (mention.engagement.upvotes || 0) + (mention.engagement.comments || 0);

            return (
              <a
                key={mention.id}
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0EA5E9] hover:shadow-md transition-all group"
              >
                {/* Top Row: Source + Badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium"
                      style={{ backgroundColor: sourceConfig.bgColor, color: sourceConfig.color }}
                    >
                      {sourceConfig.icon} {mention.source}
                    </span>
                    {mention.subreddit && (
                      <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded-md">
                        r/{mention.subreddit}
                      </span>
                    )}
                    {mention.category && (
                      <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded-md">
                        {mention.category}
                      </span>
                    )}
                    {mention.isHighEngagement && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-medium">
                        <Flame className="w-3 h-3" />
                        Hot
                      </span>
                    )}
                  </div>
                  <span
                    className="px-2 py-1 rounded-md text-[10px] font-medium"
                    style={{
                      backgroundColor: SENTIMENT_CONFIG[mention.sentiment.label].bg,
                      color: SENTIMENT_CONFIG[mention.sentiment.label].color,
                    }}
                  >
                    {SENTIMENT_CONFIG[mention.sentiment.label].label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-[13px] font-medium text-[#0F172A] mb-2 group-hover:text-[#0EA5E9] transition-colors">
                  {mention.title}
                </h3>

                {/* Snippet */}
                <p className="text-[11px] text-[#64748B] line-clamp-2 mb-3">
                  {mention.snippet}
                </p>

                {/* Keyword Tag */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-md text-[10px] font-medium">
                    {mention.matchedKeyword}
                  </span>
                  {mention.author && (
                    <span className="text-[10px] text-[#94A3B8]">
                      by <span className="font-medium text-[#64748B]">u/{mention.author}</span>
                    </span>
                  )}
                  <span className="text-[10px] text-[#94A3B8]">•</span>
                  <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <Clock className="w-3 h-3" />
                    {formatDate(mention.publishedAt)}
                  </span>
                </div>

                {/* Metrics Row */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-4">
                    {(mention.engagement.upvotes ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-[#64748B]">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">{formatNumber(mention.engagement.upvotes!)}</span>
                      </div>
                    )}
                    {(mention.engagement.comments ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-[#64748B]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">{formatNumber(mention.engagement.comments!)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[#0EA5E9]">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-semibold">{formatNumber(mention.reach)} reach</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0EA5E9]" />
                  </div>
                </div>

                {/* Sentiment Confidence Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[9px] text-[#94A3B8] mb-1">
                    <span>Sentiment Confidence</span>
                    <span>{Math.round(mention.sentiment.score * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${mention.sentiment.score * 100}%`,
                        backgroundColor: SENTIMENT_CONFIG[mention.sentiment.label].barColor,
                      }}
                    />
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filteredMentions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
          <p className="text-[10px] text-[#64748B]">
            Showing {filteredMentions.length} mentions from {enabledSources.length} sources •{' '}
            <span className="font-medium text-[#0EA5E9]">{formatNumber(totalReach)} total reach</span>
          </p>
          <button className="flex items-center gap-1 text-[10px] text-[#0EA5E9] hover:underline font-medium">
            View all web mentions
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
