'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { DataTable, SentimentBadge, ChangeIndicator } from '@/components/DataTable';
import { SearchTrends } from '@/components/SearchTrends';

interface TrendingItem {
  term: string;
  mentions: number;
  sentiment: number;
  change: number;
  source?: string;
}

// Mock trending data by brand
const BRAND_TRENDING: { [key: string]: { [days: number]: TrendingItem[] } } = {
  'All Brands': {
    7: [
      { term: 'drugstore makeup', mentions: 1250, sentiment: 0.45, change: 18, source: 'YouTube' },
      { term: 'clean girl aesthetic', mentions: 980, sentiment: 0.72, change: 35, source: 'News' },
      { term: 'lip combo', mentions: 820, sentiment: 0.65, change: 42, source: 'YouTube' },
      { term: 'foundation review', mentions: 750, sentiment: 0.38, change: 12, source: 'YouTube' },
      { term: 'mascara comparison', mentions: 680, sentiment: 0.55, change: 8, source: 'YouTube' },
      { term: 'affordable dupes', mentions: 620, sentiment: 0.68, change: 25, source: 'News' },
    ],
    14: [
      { term: 'drugstore makeup', mentions: 2450, sentiment: 0.48, change: 22, source: 'YouTube' },
      { term: 'clean girl aesthetic', mentions: 1850, sentiment: 0.75, change: 40, source: 'News' },
      { term: 'lip combo', mentions: 1620, sentiment: 0.62, change: 38, source: 'YouTube' },
      { term: 'foundation review', mentions: 1480, sentiment: 0.42, change: 15, source: 'YouTube' },
      { term: 'mascara comparison', mentions: 1350, sentiment: 0.58, change: 12, source: 'YouTube' },
      { term: 'affordable dupes', mentions: 1220, sentiment: 0.72, change: 28, source: 'News' },
    ],
    30: [
      { term: 'drugstore makeup', mentions: 5200, sentiment: 0.52, change: 28, source: 'YouTube' },
      { term: 'clean girl aesthetic', mentions: 3950, sentiment: 0.78, change: 45, source: 'News' },
      { term: 'lip combo', mentions: 3420, sentiment: 0.65, change: 42, source: 'YouTube' },
      { term: 'foundation review', mentions: 3150, sentiment: 0.45, change: 18, source: 'YouTube' },
      { term: 'mascara comparison', mentions: 2880, sentiment: 0.62, change: 15, source: 'YouTube' },
      { term: 'affordable dupes', mentions: 2580, sentiment: 0.75, change: 32, source: 'News' },
    ],
    90: [
      { term: 'drugstore makeup', mentions: 15800, sentiment: 0.55, change: 35, source: 'YouTube' },
      { term: 'clean girl aesthetic', mentions: 12200, sentiment: 0.80, change: 52, source: 'News' },
      { term: 'lip combo', mentions: 10500, sentiment: 0.68, change: 48, source: 'YouTube' },
      { term: 'foundation review', mentions: 9800, sentiment: 0.48, change: 22, source: 'YouTube' },
      { term: 'mascara comparison', mentions: 8900, sentiment: 0.65, change: 18, source: 'YouTube' },
      { term: 'affordable dupes', mentions: 7800, sentiment: 0.78, change: 38, source: 'News' },
      { term: 'skincare routine', mentions: 7200, sentiment: 0.72, change: 28, source: 'YouTube' },
      { term: 'viral beauty products', mentions: 6500, sentiment: 0.82, change: 65, source: 'News' },
    ],
  },
  Revlon: {
    7: [
      { term: 'colorstay foundation', mentions: 450, sentiment: 0.52, change: 15, source: 'YouTube' },
      { term: 'super lustrous lipstick', mentions: 380, sentiment: 0.68, change: 8, source: 'YouTube' },
      { term: 'one step hair dryer', mentions: 520, sentiment: 0.75, change: 32, source: 'YouTube' },
      { term: 'revlon review', mentions: 290, sentiment: 0.42, change: -5, source: 'News' },
      { term: 'drugstore vs high end', mentions: 180, sentiment: 0.55, change: 12, source: 'YouTube' },
    ],
    14: [
      { term: 'colorstay foundation', mentions: 920, sentiment: 0.55, change: 18, source: 'YouTube' },
      { term: 'super lustrous lipstick', mentions: 780, sentiment: 0.72, change: 12, source: 'YouTube' },
      { term: 'one step hair dryer', mentions: 1050, sentiment: 0.78, change: 38, source: 'YouTube' },
      { term: 'revlon review', mentions: 580, sentiment: 0.45, change: -2, source: 'News' },
      { term: 'drugstore vs high end', mentions: 380, sentiment: 0.58, change: 15, source: 'YouTube' },
    ],
    30: [
      { term: 'colorstay foundation', mentions: 1850, sentiment: 0.58, change: 22, source: 'YouTube' },
      { term: 'super lustrous lipstick', mentions: 1580, sentiment: 0.75, change: 15, source: 'YouTube' },
      { term: 'one step hair dryer', mentions: 2150, sentiment: 0.82, change: 45, source: 'YouTube' },
      { term: 'revlon review', mentions: 1180, sentiment: 0.48, change: 5, source: 'News' },
      { term: 'drugstore vs high end', mentions: 780, sentiment: 0.62, change: 18, source: 'YouTube' },
    ],
    90: [
      { term: 'one step hair dryer', mentions: 6850, sentiment: 0.85, change: 55, source: 'YouTube' },
      { term: 'colorstay foundation', mentions: 5600, sentiment: 0.62, change: 28, source: 'YouTube' },
      { term: 'super lustrous lipstick', mentions: 4800, sentiment: 0.78, change: 18, source: 'YouTube' },
      { term: 'revlon review', mentions: 3500, sentiment: 0.52, change: 12, source: 'News' },
      { term: 'drugstore vs high end', mentions: 2400, sentiment: 0.65, change: 22, source: 'YouTube' },
      { term: 'revlon hair tools', mentions: 2100, sentiment: 0.80, change: 42, source: 'YouTube' },
    ],
  },
  'e.l.f.': {
    7: [
      { term: 'power grip primer', mentions: 680, sentiment: 0.85, change: 28, source: 'YouTube' },
      { term: 'camo concealer', mentions: 520, sentiment: 0.78, change: 15, source: 'YouTube' },
      { term: 'halo glow', mentions: 450, sentiment: 0.82, change: 42, source: 'YouTube' },
      { term: 'elf dupe', mentions: 380, sentiment: 0.65, change: 35, source: 'YouTube' },
      { term: 'bronzing drops', mentions: 320, sentiment: 0.72, change: 55, source: 'News' },
    ],
    14: [
      { term: 'power grip primer', mentions: 1380, sentiment: 0.88, change: 32, source: 'YouTube' },
      { term: 'camo concealer', mentions: 1050, sentiment: 0.82, change: 18, source: 'YouTube' },
      { term: 'halo glow', mentions: 920, sentiment: 0.85, change: 48, source: 'YouTube' },
      { term: 'elf dupe', mentions: 780, sentiment: 0.68, change: 38, source: 'YouTube' },
      { term: 'bronzing drops', mentions: 650, sentiment: 0.75, change: 62, source: 'News' },
    ],
    30: [
      { term: 'power grip primer', mentions: 2850, sentiment: 0.90, change: 38, source: 'YouTube' },
      { term: 'camo concealer', mentions: 2180, sentiment: 0.85, change: 22, source: 'YouTube' },
      { term: 'halo glow', mentions: 1920, sentiment: 0.88, change: 52, source: 'YouTube' },
      { term: 'elf dupe', mentions: 1620, sentiment: 0.72, change: 42, source: 'YouTube' },
      { term: 'bronzing drops', mentions: 1350, sentiment: 0.78, change: 68, source: 'News' },
    ],
    90: [
      { term: 'power grip primer', mentions: 8600, sentiment: 0.92, change: 45, source: 'YouTube' },
      { term: 'camo concealer', mentions: 6800, sentiment: 0.88, change: 28, source: 'YouTube' },
      { term: 'halo glow', mentions: 5900, sentiment: 0.90, change: 62, source: 'YouTube' },
      { term: 'elf dupe', mentions: 4900, sentiment: 0.75, change: 52, source: 'YouTube' },
      { term: 'bronzing drops', mentions: 4200, sentiment: 0.82, change: 78, source: 'News' },
      { term: 'elf lip oil', mentions: 3500, sentiment: 0.85, change: 48, source: 'YouTube' },
      { term: 'elf vs charlotte tilbury', mentions: 2800, sentiment: 0.72, change: 38, source: 'YouTube' },
    ],
  },
  Maybelline: {
    7: [
      { term: 'sky high mascara', mentions: 580, sentiment: 0.72, change: 18, source: 'YouTube' },
      { term: 'fit me foundation', mentions: 420, sentiment: 0.62, change: 8, source: 'YouTube' },
      { term: 'superstay lipstick', mentions: 350, sentiment: 0.58, change: 12, source: 'YouTube' },
      { term: 'vinyl ink', mentions: 280, sentiment: 0.75, change: 25, source: 'YouTube' },
      { term: 'lash sensational', mentions: 220, sentiment: 0.65, change: 5, source: 'News' },
    ],
    14: [
      { term: 'sky high mascara', mentions: 1180, sentiment: 0.75, change: 22, source: 'YouTube' },
      { term: 'fit me foundation', mentions: 850, sentiment: 0.65, change: 12, source: 'YouTube' },
      { term: 'superstay lipstick', mentions: 720, sentiment: 0.62, change: 15, source: 'YouTube' },
      { term: 'vinyl ink', mentions: 580, sentiment: 0.78, change: 28, source: 'YouTube' },
      { term: 'lash sensational', mentions: 450, sentiment: 0.68, change: 8, source: 'News' },
    ],
    30: [
      { term: 'sky high mascara', mentions: 2450, sentiment: 0.78, change: 28, source: 'YouTube' },
      { term: 'fit me foundation', mentions: 1780, sentiment: 0.68, change: 15, source: 'YouTube' },
      { term: 'superstay lipstick', mentions: 1520, sentiment: 0.65, change: 18, source: 'YouTube' },
      { term: 'vinyl ink', mentions: 1220, sentiment: 0.82, change: 32, source: 'YouTube' },
      { term: 'lash sensational', mentions: 950, sentiment: 0.72, change: 12, source: 'News' },
    ],
    90: [
      { term: 'sky high mascara', mentions: 7500, sentiment: 0.82, change: 35, source: 'YouTube' },
      { term: 'fit me foundation', mentions: 5400, sentiment: 0.72, change: 20, source: 'YouTube' },
      { term: 'vinyl ink', mentions: 3800, sentiment: 0.85, change: 42, source: 'YouTube' },
      { term: 'superstay lipstick', mentions: 4600, sentiment: 0.70, change: 22, source: 'YouTube' },
      { term: 'lash sensational', mentions: 2900, sentiment: 0.75, change: 15, source: 'News' },
      { term: 'maybelline instant age rewind', mentions: 2400, sentiment: 0.78, change: 18, source: 'YouTube' },
    ],
  },
};

const BRANDS = ['All Brands', 'Revlon', 'e.l.f.', 'Maybelline'];

export default function TrendingPage() {
  const router = useRouter();
  const [data, setData] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);
  const [selectedBrand, setSelectedBrand] = useState('Revlon');

  useEffect(() => {
    fetchTrending();
  }, [days, selectedBrand]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Use mock data for now
      await new Promise(resolve => setTimeout(resolve, 300));
      const brandData = BRAND_TRENDING[selectedBrand]?.[days] || [];
      setData(brandData);
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
          </div>

          {/* Google Search Trends */}
          <SearchTrends />

          {/* Trending Topics Table */}
          <div className="bg-white rounded-xl border border-border">
            {/* Table Header with Filters */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedBrand === 'All Brands' ? 'Industry' : selectedBrand} Trending Topics
              </h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {BRANDS.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : error ? (
              <div className="bg-danger/10 text-danger p-4 m-4 rounded-lg">
                {error}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12 text-muted">
                No trending topics found for {selectedBrand}.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data.map((item, index) => ({ ...item, id: index }))}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
