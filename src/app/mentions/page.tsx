'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink, Filter, ThumbsUp, MessageSquare, Flame } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { SentimentBadge } from '@/components/DataTable';
import { useSettings } from '@/lib/SettingsContext';

interface UnifiedMention {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceIcon: string;
  author?: string;
  score: number;
  numComments: number;
  sentiment: string | null;
  matchedKeyword: string;
  createdAt: string;
  url: string;
  isHighEngagement?: boolean;
}

interface SourceFilter {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

const SOURCE_FILTERS: SourceFilter[] = [
  { id: 'youtube', name: 'YouTube', icon: '▶️', enabled: true },
  { id: 'news', name: 'News', icon: '📰', enabled: true },
  { id: 'reddit', name: 'Reddit', icon: '💬', enabled: true },
  // Disabled sources - need scraper fixes
  // { id: 'makeupalley', name: 'MakeupAlley', icon: '💄', enabled: true },
  // { id: 'temptalia', name: 'Temptalia', icon: '💋', enabled: true },
  // { id: 'intothegloss', name: 'Into The Gloss', icon: '✨', enabled: true },
  // { id: 'allure', name: 'Allure', icon: '📖', enabled: true },
];

const BRANDS = ['All Brands', 'Revlon', 'e.l.f.', 'Maybelline'];

export default function MentionsPage() {
  const router = useRouter();
  const { settings, isLoaded, getBrandName } = useSettings();
  const [mentions, setMentions] = useState<UnifiedMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);
  const [sentiment, setSentiment] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [sources, setSources] = useState<SourceFilter[]>(SOURCE_FILTERS);
  const [settingsApplied, setSettingsApplied] = useState(false);

  // Apply settings from storage
  useEffect(() => {
    if (isLoaded && !settingsApplied) {
      setDays(settings.defaultDays);
      setSettingsApplied(true);
    }
  }, [isLoaded, settings.defaultDays, settingsApplied]);

  // React to brand changes from sidebar dropdown
  useEffect(() => {
    if (isLoaded) {
      const brandMap: Record<string, string> = {
        'revlon': 'Revlon',
        'elf': 'e.l.f.',
        'maybelline': 'Maybelline',
      };
      setSelectedBrand(brandMap[settings.selectedBrand] || 'All Brands');
    }
  }, [isLoaded, settings.selectedBrand]);

  useEffect(() => {
    if (settingsApplied) {
      fetchAllMentions();
    }
  }, [days, sentiment, settingsApplied]);

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const fetchAllMentions = async () => {
    setLoading(true);
    const allMentions: UnifiedMention[] = [];

    try {
      // Fetch YouTube
      try {
        const ytRes = await fetch(`/api/youtube?days=${days}`);
        const ytData = await ytRes.json();
        if (ytData.success && ytData.data?.videos) {
          ytData.data.videos.forEach((v: {
            id: string;
            title: string;
            description: string;
            channelTitle: string;
            viewCount: number;
            likeCount: number;
            commentCount: number;
            publishedAt: string;
            url: string;
            sentiment?: { label: string };
          }) => {
            allMentions.push({
              id: `yt-${v.id}`,
              title: v.title,
              body: v.description?.slice(0, 200) || '',
              source: 'YouTube',
              sourceIcon: '▶️',
              author: v.channelTitle,
              score: v.viewCount || 0,
              numComments: v.commentCount || 0,
              sentiment: v.sentiment?.label || 'neutral',
              matchedKeyword: 'Revlon',
              createdAt: v.publishedAt,
              url: v.url,
              isHighEngagement: (v.viewCount || 0) > 10000,
            });
          });
        }
      } catch { /* silently fail */ }

      // Fetch News
      try {
        const newsRes = await fetch(`/api/news?days=${days}`);
        const newsData = await newsRes.json();
        if (newsData.success && newsData.data) {
          newsData.data.forEach((a: {
            url: string;
            title: string;
            description: string;
            source: { name: string };
            publishedAt: string;
            sentiment?: { label: string };
          }) => {
            allMentions.push({
              id: `news-${a.url}`,
              title: a.title,
              body: a.description || '',
              source: 'News',
              sourceIcon: '📰',
              author: a.source?.name,
              score: 0,
              numComments: 0,
              sentiment: a.sentiment?.label || 'neutral',
              matchedKeyword: 'Revlon',
              createdAt: a.publishedAt,
              url: a.url,
            });
          });
        }
      } catch { /* silently fail */ }

      // Fetch Web Scrapers (Reddit, MakeupAlley, Blogs) - use live=true for real data
      try {
        const scrapeRes = await fetch('/api/scrape?live=true');
        const scrapeData = await scrapeRes.json();
        if (scrapeData.success && scrapeData.data?.mentions) {
          scrapeData.data.mentions.forEach((m: {
            id: string;
            source: string;
            title: string;
            snippet: string;
            author?: string;
            engagement: { upvotes?: number; comments?: number };
            sentiment?: { label: string };
            matchedKeyword: string;
            publishedAt: string;
            url: string;
            isHighEngagement: boolean;
          }) => {
            const iconMap: { [key: string]: string } = {
              'Reddit': '💬',
              'MakeupAlley': '💄',
              'Temptalia': '💋',
              'Into The Gloss': '✨',
              'Allure': '📖',
            };
            allMentions.push({
              id: m.id,
              title: m.title,
              body: m.snippet,
              source: m.source,
              sourceIcon: iconMap[m.source] || '🌐',
              author: m.author,
              score: m.engagement?.upvotes || 0,
              numComments: m.engagement?.comments || 0,
              sentiment: m.sentiment?.label || 'neutral',
              matchedKeyword: m.matchedKeyword,
              createdAt: m.publishedAt,
              url: m.url,
              isHighEngagement: m.isHighEngagement,
            });
          });
        }
      } catch { /* silently fail */ }

      // Sort by date
      allMentions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Filter by sentiment if selected
      let filtered = allMentions;
      if (sentiment) {
        filtered = filtered.filter(m => m.sentiment === sentiment);
      }

      setMentions(filtered);
    } catch {
      setError('Failed to load mentions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Get source name mapping for filtering
  const getSourceId = (source: string): string => {
    const map: { [key: string]: string } = {
      'YouTube': 'youtube',
      'News': 'news',
      'Reddit': 'reddit',
    };
    return map[source] || source.toLowerCase();
  };

  const enabledSourceIds = sources.filter(s => s.enabled).map(s => s.id);
  const filteredMentions = mentions.filter(m => {
    // Filter by source
    if (!enabledSourceIds.includes(getSourceId(m.source))) return false;
    // Filter by brand
    if (selectedBrand !== 'All Brands') {
      const keyword = m.matchedKeyword.toLowerCase();
      const brand = selectedBrand.toLowerCase();
      if (!keyword.includes(brand) && !brand.includes(keyword.split(' ')[0])) return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {getBrandName()} Mentions
              </h1>
              <p className="text-muted mt-1">
                All mentions from YouTube, News, and Web sources
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Brand Filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {BRANDS.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              {/* Sentiment Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                <select
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              {/* Date Range */}
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Source Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border border-border">
            <span className="text-sm text-muted font-medium">Sources:</span>
            {sources.map((source) => (
              <label key={source.id} className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                    source.enabled
                      ? 'bg-[#0F172A] border-[#0F172A]'
                      : 'bg-white border-gray-300'
                  }`}
                  onClick={() => toggleSource(source.id)}
                >
                  {source.enabled && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{source.icon} {source.name}</span>
              </label>
            ))}
          </div>

          {/* Content */}
          {(loading || !isLoaded) ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="bg-danger/10 text-danger p-4 rounded-lg">
              {error}
            </div>
          ) : filteredMentions.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <p className="text-muted">
                No mentions found. Try enabling more sources or adjusting filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Showing {filteredMentions.length} mentions from {enabledSourceIds.length} sources
              </p>
              {filteredMentions.map((mention) => (
                <div
                  key={mention.id}
                  className="bg-white rounded-xl border border-border p-5 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-lg">{mention.sourceIcon}</span>
                        <span className="text-sm font-medium text-accent">
                          {mention.source}
                        </span>
                        {mention.author && (
                          <>
                            <span className="text-muted">•</span>
                            <span className="text-sm text-muted">
                              {mention.author}
                            </span>
                          </>
                        )}
                        <span className="text-muted">•</span>
                        <SentimentBadge label={mention.sentiment} />
                        {mention.isHighEngagement && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                            <Flame className="w-3 h-3" />
                            Hot
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {mention.title}
                      </h3>

                      {/* Body preview */}
                      {mention.body && (
                        <p className="text-sm text-muted line-clamp-2 mb-3">
                          {mention.body}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                        <span className="bg-accent/10 text-accent px-2 py-1 rounded">
                          {mention.matchedKeyword}
                        </span>
                        {mention.score > 0 && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {mention.score.toLocaleString()}
                          </span>
                        )}
                        {mention.numComments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {mention.numComments}
                          </span>
                        )}
                        <span>
                          {new Date(mention.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Link */}
                    {mention.url && (
                      <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-accent hover:underline shrink-0"
                      >
                        View
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
