'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Eye, ThumbsUp, Clock } from 'lucide-react';

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

export function MediaMentions() {
  const [sources, setSources] = useState<Source[]>([
    { id: 'youtube', name: 'YouTube', enabled: true },
    { id: 'news', name: 'News', enabled: true },
  ]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const toggleSource = (id: string) => {
    setSources(prev =>
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const fetchMedia = async () => {
    setLoading(true);

    const allItems: MediaItem[] = [];

    // Fetch YouTube
    try {
      const ytRes = await fetch('/api/youtube?days=7');
      const ytData = await ytRes.json();
      if (ytData.success && ytData.data?.videos) {
        ytData.data.videos.slice(0, 5).forEach((video: {
          id: string;
          title: string;
          channelTitle: string;
          url: string;
          thumbnailUrl: string;
          publishedAt: string;
          viewCount: number;
          likeCount: number;
          sentiment: { label: string };
        }) => {
          allItems.push({
            id: video.id,
            type: 'youtube',
            title: video.title,
            source: video.channelTitle,
            url: video.url,
            thumbnail: video.thumbnailUrl,
            publishedAt: video.publishedAt,
            metrics: { primary: video.viewCount, secondary: video.likeCount },
            sentiment: video.sentiment?.label as 'positive' | 'neutral' | 'negative' || 'neutral',
          });
        });
      }
    } catch {
      // Silently fail
    }

    // Fetch News
    try {
      const newsRes = await fetch('/api/news?days=7');
      const newsData = await newsRes.json();
      if (newsData.success && newsData.data) {
        newsData.data.slice(0, 5).forEach((article: {
          url: string;
          title: string;
          source: { name: string };
          urlToImage: string;
          publishedAt: string;
          sentiment: { label: string };
        }) => {
          allItems.push({
            id: article.url,
            type: 'news',
            title: article.title,
            source: article.source.name,
            url: article.url,
            thumbnail: article.urlToImage,
            publishedAt: article.publishedAt,
            metrics: { primary: 0 },
            sentiment: article.sentiment?.label as 'positive' | 'neutral' | 'negative' || 'neutral',
          });
        });
      }
    } catch {
      // Silently fail
    }

    // Sort by date
    allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    setItems(allItems);
    setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-medium text-[#0F172A] mb-4">Media Mentions</h2>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
        </div>
      </div>
    );
  }

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
