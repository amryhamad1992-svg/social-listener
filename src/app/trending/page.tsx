'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { DataTable, SentimentBadge, ChangeIndicator } from '@/components/DataTable';

interface TrendingItem {
  term: string;
  mentions: number;
  sentiment: number;
  change: number;
}

export default function TrendingPage() {
  const router = useRouter();
  const [data, setData] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchTrending();
  }, [days]);

  const fetchTrending = async () => {
    try {
      const response = await fetch(`/api/trending?days=${days}`);
      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        setError(result.error);
        return;
      }

      setData(result.data.trending);
    } catch {
      setError('Failed to load trending data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getSentimentLabel = (score: number): string => {
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
  };

  const columns = [
    {
      key: 'term',
      label: 'Term',
      sortable: true,
      render: (item: TrendingItem) => (
        <span className="font-medium text-foreground">{item.term}</span>
      ),
    },
    {
      key: 'mentions',
      label: 'Mentions',
      sortable: true,
      render: (item: TrendingItem) => (
        <span className="font-semibold">{item.mentions.toLocaleString()}</span>
      ),
    },
    {
      key: 'sentiment',
      label: 'Sentiment',
      sortable: true,
      render: (item: TrendingItem) => (
        <SentimentBadge label={getSentimentLabel(item.sentiment)} />
      ),
    },
    {
      key: 'change',
      label: 'Change',
      sortable: true,
      render: (item: TrendingItem) => <ChangeIndicator value={item.change} />,
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (item: TrendingItem) => {
        if (item.change === 0) {
          return <Minus className="w-4 h-4 text-muted" />;
        }
        return item.change > 0 ? (
          <TrendingUp className="w-4 h-4 text-success" />
        ) : (
          <TrendingDown className="w-4 h-4 text-danger" />
        );
      },
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar brandName="Revlon" onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Trending Topics
              </h1>
              <p className="text-muted mt-1">
                Most discussed terms and topics related to your brand
              </p>
            </div>
            <div className="flex items-center gap-2">
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
          ) : (
            <div className="bg-white rounded-xl border border-border">
              <DataTable
                columns={columns}
                data={data.map((item, index) => ({ ...item, id: index }))}
              />
              {data.length === 0 && (
                <div className="text-center py-12 text-muted">
                  No trending topics found. Run the data fetcher to populate
                  data.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
