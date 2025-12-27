'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Newspaper } from 'lucide-react';
import { SentimentBadge } from './DataTable';

interface NewsArticle {
  source: { name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  sentiment: {
    label: string;
    score: number;
  };
}

export function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news?days=7');
      const result = await response.json();

      if (result.success) {
        setArticles(result.data);
      } else {
        setError(result.error || 'Failed to load news');
      }
    } catch {
      setError('Failed to load news');
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-[#64748B]" />
          <h2 className="text-sm font-medium text-[#1E293B]">News Coverage</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-[#64748B]" />
          <h2 className="text-sm font-medium text-[#1E293B]">News Coverage</h2>
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#64748B]" />
          <h2 className="text-sm font-medium text-[#1E293B]">News Coverage</h2>
        </div>
        <span className="text-[11px] text-[#64748B]">Last 7 days</span>
      </div>

      <div className="space-y-3">
        {articles.length === 0 ? (
          <p className="text-[#64748B] text-center py-6 text-sm">
            No news articles found for this brand.
          </p>
        ) : (
          articles.slice(0, 5).map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3 bg-[#F8FAFC] rounded hover:bg-[#F1F5F9] transition-colors group"
            >
              {/* Thumbnail */}
              {article.urlToImage && (
                <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-[#E2E8F0]">
                  <img
                    src={article.urlToImage}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-[#0EA5E9]">
                    {article.source.name}
                  </span>
                  <SentimentBadge label={article.sentiment.label} />
                </div>
                <h3 className="text-[13px] font-medium text-[#1E293B] line-clamp-2 group-hover:text-[#0EA5E9] transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
                  <span>{formatDate(article.publishedAt)}</span>
                  {article.author && (
                    <>
                      <span>•</span>
                      <span className="truncate">{article.author}</span>
                    </>
                  )}
                </div>
              </div>

              {/* External link icon */}
              <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0EA5E9] flex-shrink-0" />
            </a>
          ))
        )}
      </div>

      {articles.length > 5 && (
        <button className="w-full mt-3 text-[12px] text-[#0EA5E9] hover:underline">
          View all {articles.length} articles
        </button>
      )}
    </div>
  );
}
