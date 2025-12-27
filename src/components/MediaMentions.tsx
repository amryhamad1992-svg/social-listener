'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Eye, ThumbsUp, Clock } from 'lucide-react';

type TabType = 'all' | 'youtube' | 'news';

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

export function MediaMentions() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-[#22C55E]';
      case 'negative': return 'text-[#EF4444]';
      default: return 'text-[#64748B]';
    }
  };

  const getSentimentDot = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-[#22C55E]';
      case 'negative': return 'bg-[#EF4444]';
      default: return 'bg-[#64748B]';
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'youtube', label: 'YouTube', count: items.filter(i => i.type === 'youtube').length },
    { id: 'news', label: 'News', count: items.filter(i => i.type === 'news').length },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-medium text-[#1E293B] mb-4">Media Mentions</h2>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#1E293B]">Media Mentions</h2>
        <div className="flex items-center gap-1 p-0.5 bg-[#F1F5F9] rounded">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-[11px] font-medium rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-[#1E293B] shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-[#94A3B8]">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <p className="text-[#64748B] text-center py-8 text-sm">
            No media mentions found.
          </p>
        ) : (
          filteredItems.slice(0, 6).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded hover:bg-[#F8FAFC] transition-colors group"
            >
              {/* Type indicator */}
              <div className="w-14 text-[10px] font-medium text-[#64748B] uppercase tracking-wide">
                {item.type === 'youtube' ? 'YouTube' : 'News'}
              </div>

              {/* Sentiment dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getSentimentDot(item.sentiment)}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#1E293B] truncate group-hover:text-[#0EA5E9] transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#64748B]">
                  <span>{item.source}</span>
                  {item.type === 'youtube' && item.metrics.primary > 0 && (
                    <>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(item.metrics.primary)}
                      </span>
                      {item.metrics.secondary !== undefined && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {formatNumber(item.metrics.secondary)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatDate(item.publishedAt)}
              </div>

              {/* Link icon */}
              <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0EA5E9] flex-shrink-0" />
            </a>
          ))
        )}
      </div>

      {filteredItems.length > 6 && (
        <button className="w-full mt-3 pt-3 border-t border-[#E2E8F0] text-[11px] text-[#0EA5E9] hover:underline">
          View all {filteredItems.length} mentions
        </button>
      )}
    </div>
  );
}
