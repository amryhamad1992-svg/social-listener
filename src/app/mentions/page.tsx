'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink, Filter } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { SentimentBadge } from '@/components/DataTable';
import { SourceSelector } from '@/components/SourceSelector';

interface Mention {
  id: number;
  title: string;
  body: string;
  source: string;
  sourceIcon: string;
  author: string;
  score: number;
  numComments: number;
  sentiment: string | null;
  sentimentScore: number | null;
  matchedKeyword: string;
  createdAt: string;
  url: string | null;
}

export default function MentionsPage() {
  const router = useRouter();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);
  const [sentiment, setSentiment] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchMentions();
  }, [days, sentiment]);

  const fetchMentions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        days: days.toString(),
        limit: '50',
      });
      if (sentiment) {
        params.set('sentiment', sentiment);
      }

      const response = await fetch(`/api/mentions?${params}`);
      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        setError(result.error);
        return;
      }

      setMentions(result.data.mentions);
      setHasMore(result.data.pagination.hasMore);
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar brandName="Revlon" onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Brand Mentions
              </h1>
              <p className="text-muted mt-1">
                All social media posts mentioning your brand
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Source Selector */}
              <SourceSelector />

              {/* Sentiment Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                <select
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
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
                className="px-4 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="bg-danger/10 text-danger p-4 rounded-lg">
              {error}
            </div>
          ) : mentions.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <p className="text-muted">
                No mentions found. Connect a data source to start monitoring.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mentions.map((mention) => (
                <div
                  key={mention.id}
                  className="bg-white rounded-xl border border-border p-6 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{mention.sourceIcon}</span>
                        <span className="text-sm font-medium text-accent">
                          {mention.source}
                        </span>
                        <span className="text-muted">•</span>
                        <span className="text-sm text-muted">
                          {mention.author}
                        </span>
                        <span className="text-muted">•</span>
                        <SentimentBadge label={mention.sentiment} />
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground mb-2">
                        {mention.title}
                      </h3>

                      {/* Body preview */}
                      {mention.body && (
                        <p className="text-sm text-muted line-clamp-2 mb-3">
                          {mention.body}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="bg-accent/10 text-accent px-2 py-1 rounded">
                          Matched: {mention.matchedKeyword}
                        </span>
                        <span>{mention.score.toLocaleString()} engagements</span>
                        <span>{mention.numComments} comments</span>
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
                        View Source
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={() => {
                      /* Load more logic */
                    }}
                    className="text-accent hover:underline"
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
