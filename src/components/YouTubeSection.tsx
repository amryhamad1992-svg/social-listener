'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Play, Eye, ThumbsUp, MessageCircle } from 'lucide-react';
import { SentimentBadge } from './DataTable';

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  url: string;
  sentiment: {
    label: string;
    score: number;
  };
}

interface YouTubeStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgViews: number;
}

export function YouTubeSection() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [stats, setStats] = useState<YouTubeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchYouTube();
  }, []);

  const fetchYouTube = async () => {
    try {
      const response = await fetch('/api/youtube?days=7');
      const result = await response.json();

      if (result.success) {
        setVideos(result.data.videos);
        setStats(result.data.stats);
      } else {
        setError(result.error || 'Failed to load YouTube data');
      }
    } catch {
      setError('Failed to load YouTube data');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-[#FF0000]" />
          <h2 className="text-sm font-medium text-[#1E293B]">YouTube Mentions</h2>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-[#FF0000]" />
          <h2 className="text-sm font-medium text-[#1E293B]">YouTube Mentions</h2>
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-[#FF0000]" />
          <h2 className="text-sm font-medium text-[#1E293B]">YouTube Mentions</h2>
        </div>
        <span className="text-[11px] text-[#64748B]">Last 7 days</span>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-[#F8FAFC] rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-[#1E293B]">{stats.totalVideos}</div>
            <div className="text-[10px] text-[#64748B]">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#1E293B]">{formatNumber(stats.totalViews)}</div>
            <div className="text-[10px] text-[#64748B]">Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#1E293B]">{formatNumber(stats.totalLikes)}</div>
            <div className="text-[10px] text-[#64748B]">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#1E293B]">{formatNumber(stats.totalComments)}</div>
            <div className="text-[10px] text-[#64748B]">Comments</div>
          </div>
        </div>
      )}

      {/* Videos List */}
      <div className="space-y-3">
        {videos.length === 0 ? (
          <p className="text-[#64748B] text-center py-6 text-sm">
            No YouTube videos found for this brand.
          </p>
        ) : (
          videos.slice(0, 4).map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-2 rounded hover:bg-[#F8FAFC] transition-colors group"
            >
              {/* Thumbnail */}
              <div className="w-28 h-16 flex-shrink-0 rounded overflow-hidden bg-[#E2E8F0] relative">
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=320';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium text-[#FF0000]">
                    {video.channelTitle}
                  </span>
                  <SentimentBadge label={video.sentiment.label} />
                </div>
                <h3 className="text-[12px] font-medium text-[#1E293B] line-clamp-2 group-hover:text-[#0EA5E9] transition-colors leading-tight">
                  {video.title}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(video.viewCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {formatNumber(video.likeCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {formatNumber(video.commentCount)}
                  </span>
                  <span>•</span>
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
              </div>

              {/* External link */}
              <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF0000] flex-shrink-0 mt-1" />
            </a>
          ))
        )}
      </div>

      {videos.length > 4 && (
        <button className="w-full mt-3 text-[12px] text-[#0EA5E9] hover:underline">
          View all {videos.length} videos
        </button>
      )}
    </div>
  );
}
