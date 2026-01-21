'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar, Download, Copy, Check, Filter, TrendingUp, TrendingDown, Minus, Hash, MessageSquare, RefreshCw, Sparkles, Plus, Ban } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { useSettings } from '@/lib/SettingsContext';

interface KeywordData {
  keyword: string;
  frequency: number;
  sources: Record<string, number>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend: 'rising' | 'stable' | 'falling';
  lastSeen: string;
  category: string;
}

interface SourceFilter {
  id: string;
  name: string;
  enabled: boolean;
}

interface AISuggestions {
  longTail: string[];
  questions: string[];
  related: string[];
  negative: string[];
}

const SOURCE_FILTERS: SourceFilter[] = [
  { id: 'reddit', name: 'Reddit', enabled: true },
  { id: 'youtube', name: 'YouTube', enabled: true },
  { id: 'tiktok', name: 'TikTok', enabled: true },
  { id: 'twitter', name: 'X (Twitter)', enabled: true },
  { id: 'instagram', name: 'Instagram', enabled: true },
  { id: 'news', name: 'News', enabled: true },
];

// Category structure matching the rest of the app
const CATEGORIES: Record<string, { name: string; subCategories: { id: string; name: string }[] }> = {
  skin: {
    name: 'Skin',
    subCategories: [
      { id: 'all_skin', name: 'All Skin' },
      { id: 'skincare', name: 'Skincare' },
      { id: 'suncare', name: 'Sun Care' },
      { id: 'kbeauty', name: 'K-Beauty' },
      { id: 'cleanbeauty', name: 'Clean Beauty' },
    ],
  },
  makeup: {
    name: 'Makeup',
    subCategories: [
      { id: 'all_makeup', name: 'All Makeup' },
      { id: 'colorcosmetics', name: 'Color Cosmetics' },
      { id: 'nails', name: 'Nails' },
    ],
  },
  hair: {
    name: 'Hair',
    subCategories: [
      { id: 'all_hair', name: 'All Hair' },
      { id: 'haircare', name: 'Hair Care' },
      { id: 'hairdryers', name: 'Hair Dryers' },
      { id: 'straighteners', name: 'Straighteners' },
      { id: 'curlingirons', name: 'Curling Irons' },
      { id: 'hotairbrushes', name: 'Hot Air Brushes' },
    ],
  },
  body: {
    name: 'Body',
    subCategories: [
      { id: 'all_body', name: 'All Body' },
      { id: 'bodycare', name: 'Body Care' },
      { id: 'fragrance', name: 'Fragrance' },
    ],
  },
  beautytech: {
    name: 'Beauty Tech',
    subCategories: [
      { id: 'beautytech', name: 'Beauty Tech' },
    ],
  },
};

export default function AudienceBuilderPage() {
  const router = useRouter();
  const { settings, isLoaded } = useSettings();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [sources, setSources] = useState<SourceFilter[]>(SOURCE_FILTERS);
  const [selectedMainCategory, setSelectedMainCategory] = useState('skin');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all_skin');
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'frequency' | 'recent'>('frequency');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  // Get available sub-categories based on selected main category
  const availableSubCategories = useMemo(() => {
    return CATEGORIES[selectedMainCategory]?.subCategories || [];
  }, [selectedMainCategory]);

  // Handle main category change
  const handleMainCategoryChange = (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    const firstSub = CATEGORIES[categoryId]?.subCategories[0]?.id || 'all';
    setSelectedSubCategory(firstSub);
  };

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  // Fetch keywords from API
  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const enabledSources = sources.filter(s => s.enabled).map(s => s.id);
      const params = new URLSearchParams({
        days: days.toString(),
        category: selectedSubCategory,
        mainCategory: selectedMainCategory,
        sources: enabledSources.join(','),
        _t: Date.now().toString(),
      });

      const response = await fetch(`/api/audience-keywords?${params}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success) {
        setKeywords(data.keywords);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoading(false);
    }
  }, [days, selectedSubCategory, selectedMainCategory, sources]);

  useEffect(() => {
    if (isLoaded) {
      fetchKeywords();
    }
  }, [isLoaded, fetchKeywords]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Fetch AI-powered keyword suggestions
  const fetchAiSuggestions = useCallback(async () => {
    if (keywords.length === 0) return;

    setAiLoading(true);
    setShowAiSuggestions(true);
    try {
      const response = await fetch('/api/ai-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.map(k => k.keyword),
          category: CATEGORIES[selectedMainCategory]?.name || 'Beauty',
          subCategory: availableSubCategories.find(s => s.id === selectedSubCategory)?.name || 'General',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.data);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  }, [keywords, selectedMainCategory, selectedSubCategory, availableSubCategories]);

  // Sort keywords
  const sortedKeywords = useMemo(() => {
    return [...keywords].sort((a, b) => {
      if (sortBy === 'frequency') {
        return b.frequency - a.frequency;
      }
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
  }, [keywords, sortBy]);

  // Group keywords by category for export
  const groupedForExport = useMemo(() => {
    const groups: Record<string, KeywordData[]> = {};
    sortedKeywords.forEach(kw => {
      const cat = kw.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(kw);
    });
    return groups;
  }, [sortedKeywords]);

  // Export as text
  const exportAsText = () => {
    let text = `Audience Builder Keywords Export\n`;
    text += `Category: ${CATEGORIES[selectedMainCategory]?.name} > ${availableSubCategories.find(s => s.id === selectedSubCategory)?.name}\n`;
    text += `Time Period: Last ${days} day${days > 1 ? 's' : ''}\n`;
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += `${'='.repeat(50)}\n\n`;

    // Harvested Keywords
    text += `HARVESTED KEYWORDS (${sortedKeywords.length} total)\n`;
    text += `${'-'.repeat(30)}\n\n`;
    Object.entries(groupedForExport).forEach(([category, kws]) => {
      text += `## ${category}\n`;
      kws.forEach(kw => {
        text += `- ${kw.keyword} (${kw.frequency}x)\n`;
      });
      text += '\n';
    });

    // AI Suggestions
    if (aiSuggestions) {
      text += `\nAI-GENERATED SUGGESTIONS\n`;
      text += `${'-'.repeat(30)}\n\n`;

      if (aiSuggestions.longTail.length > 0) {
        text += `## Long-tail Keywords\n`;
        aiSuggestions.longTail.forEach(kw => {
          text += `- ${kw}\n`;
        });
        text += '\n';
      }

      if (aiSuggestions.questions.length > 0) {
        text += `## Question-based Keywords\n`;
        aiSuggestions.questions.forEach(kw => {
          text += `- ${kw}\n`;
        });
        text += '\n';
      }

      if (aiSuggestions.related.length > 0) {
        text += `## Related Terms\n`;
        aiSuggestions.related.forEach(kw => {
          text += `- ${kw}\n`;
        });
        text += '\n';
      }

      if (aiSuggestions.negative.length > 0) {
        text += `## Negative Keywords (exclude these)\n`;
        aiSuggestions.negative.forEach(kw => {
          text += `- ${kw}\n`;
        });
        text += '\n';
      }
    }

    return text;
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const text = exportAsText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as CSV
  const handleDownload = () => {
    let csv = 'Keyword,Type,Frequency,Category,Sentiment,Top Source,Last Seen\n';

    // Harvested keywords
    sortedKeywords.forEach(kw => {
      const topSource = Object.entries(kw.sources).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
      const sentiment = kw.sentiment.positive > kw.sentiment.negative ? 'Positive' :
                       kw.sentiment.negative > kw.sentiment.positive ? 'Negative' : 'Neutral';
      csv += `"${kw.keyword}","Harvested",${kw.frequency},"${kw.category}","${sentiment}","${topSource}","${new Date(kw.lastSeen).toLocaleDateString()}"\n`;
    });

    // AI Suggestions
    if (aiSuggestions) {
      aiSuggestions.longTail.forEach(kw => {
        csv += `"${kw}","AI - Long-tail","","","","",""\n`;
      });
      aiSuggestions.questions.forEach(kw => {
        csv += `"${kw}","AI - Question","","","","",""\n`;
      });
      aiSuggestions.related.forEach(kw => {
        csv += `"${kw}","AI - Related","","","","",""\n`;
      });
      aiSuggestions.negative.forEach(kw => {
        csv += `"${kw}","AI - Negative (exclude)","","","","",""\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audience-keywords-${selectedMainCategory}-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get trend icon
  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-[#71c184]" />;
    if (trend === 'falling') return <TrendingDown className="w-3.5 h-3.5 text-[#ff534a]" />;
    return <Minus className="w-3.5 h-3.5 text-[#94A3B8]" />;
  };

  // Get dominant sentiment color
  const getSentimentColor = (sentiment: KeywordData['sentiment']) => {
    const total = sentiment.positive + sentiment.neutral + sentiment.negative;
    if (total === 0) return 'bg-[#F1F5F9] text-[#64748B]';
    const positiveRatio = sentiment.positive / total;
    const negativeRatio = sentiment.negative / total;
    if (positiveRatio > 0.5) return 'bg-[#71c184]/15 text-[#71c184]';
    if (negativeRatio > 0.5) return 'bg-[#ff534a]/15 text-[#ff534a]';
    return 'bg-[#F1F5F9] text-[#64748B]';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-[#1E293B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Audience Builder
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Harvest keywords for Google Ads & paid media campaigns
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Period */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg">
                <Calendar className="w-4 h-4 text-[#64748B]" />
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                  className="text-[13px] text-[#1E293B] bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  <option value={1}>Yesterday</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchKeywords}
                disabled={loading}
                className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* AI Suggestions */}
              <button
                onClick={fetchAiSuggestions}
                disabled={keywords.length === 0 || aiLoading}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-white bg-[#16949b] hover:bg-[#138085] rounded-lg transition-all disabled:opacity-50 shadow-sm"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI Suggest
              </button>

              {/* Copy */}
              <button
                onClick={handleCopy}
                disabled={keywords.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#0F172A] rounded-lg transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={keywords.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Category Selectors */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#64748B] font-medium">Category:</span>
                <select
                  value={selectedMainCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="px-3 py-1.5 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium"
                >
                  {Object.entries(CATEGORIES).map(([id, cat]) => (
                    <option key={id} value={id}>{cat.name}</option>
                  ))}
                </select>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="px-3 py-1.5 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium"
                >
                  {availableSubCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-px h-6 bg-[#E2E8F0]" />

              {/* Source Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#64748B] font-medium">Sources:</span>
                {sources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`px-2.5 py-1 rounded border text-[10px] font-medium transition-all ${
                      source.enabled
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-[#94A3B8] border-[#E2E8F0] hover:border-[#0F172A] hover:text-[#0F172A]'
                    }`}
                  >
                    {source.name}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-[#E2E8F0]" />

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#64748B] font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'frequency' | 'recent')}
                  className="px-2.5 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
                >
                  <option value="frequency">Most Frequent</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[22px] font-bold text-[#0F172A]">{keywords.length}</p>
                <p className="text-[11px] text-[#64748B]">Keywords Found</p>
              </div>
              <div className="w-px h-10 bg-[#E2E8F0]" />
              <div>
                <p className="text-[22px] font-bold text-[#0F172A]">
                  {keywords.reduce((sum, k) => sum + k.frequency, 0)}
                </p>
                <p className="text-[11px] text-[#64748B]">Total Mentions</p>
              </div>
              <div className="w-px h-10 bg-[#E2E8F0]" />
              <div>
                <p className="text-[22px] font-bold text-emerald-600">
                  {keywords.filter(k => k.trend === 'rising').length}
                </p>
                <p className="text-[11px] text-[#64748B]">Rising Keywords</p>
              </div>
              <div className="w-px h-10 bg-[#E2E8F0]" />
              <div>
                <p className="text-[22px] font-bold text-[#0F172A]">
                  {Object.keys(groupedForExport).length}
                </p>
                <p className="text-[11px] text-[#64748B]">Categories</p>
              </div>
            </div>
          </div>

          {/* AI-Powered Suggestions Panel */}
          {showAiSuggestions && (
            <div className="bg-[#031425] rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#16949b]" />
                  <h3 className="text-[14px] font-semibold">AI-Powered Suggestions</h3>
                  <span className="px-2 py-0.5 bg-[#16949b]/20 text-[#16949b] rounded text-[9px] font-medium">
                    GPT Generated
                  </span>
                </div>
                <button
                  onClick={() => setShowAiSuggestions(false)}
                  className="text-white/60 hover:text-white text-[12px]"
                >
                  Hide
                </button>
              </div>

              {aiLoading ? (
                <div className="flex items-center gap-2 text-white/60 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[13px]">Generating keyword suggestions...</span>
                </div>
              ) : aiSuggestions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Long-tail Keywords */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <TrendingUp className="w-4 h-4 text-[#71c184]" />
                      <span className="text-[12px] font-medium text-[#71c184]">Long-tail Keywords</span>
                    </div>
                    <div className="space-y-1.5">
                      {aiSuggestions.longTail.map((kw, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 rounded text-[11px] text-white/90">
                          <Plus className="w-3 h-3 text-[#71c184] flex-shrink-0" />
                          <span className="truncate">{kw}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Keywords */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <MessageSquare className="w-4 h-4 text-[#0EA5E9]" />
                      <span className="text-[12px] font-medium text-[#0EA5E9]">Question-based</span>
                    </div>
                    <div className="space-y-1.5">
                      {aiSuggestions.questions.map((kw, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 rounded text-[11px] text-white/90">
                          <Plus className="w-3 h-3 text-[#0EA5E9] flex-shrink-0" />
                          <span className="truncate">{kw}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Related Keywords */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Hash className="w-4 h-4 text-[#16949b]" />
                      <span className="text-[12px] font-medium text-[#16949b]">Related Terms</span>
                    </div>
                    <div className="space-y-1.5">
                      {aiSuggestions.related.map((kw, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 rounded text-[11px] text-white/90">
                          <Plus className="w-3 h-3 text-[#16949b] flex-shrink-0" />
                          <span className="truncate">{kw}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Negative Keywords */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Ban className="w-4 h-4 text-[#ff534a]" />
                      <span className="text-[12px] font-medium text-[#ff534a]">Negative Keywords</span>
                    </div>
                    <div className="space-y-1.5">
                      {aiSuggestions.negative.map((kw, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 rounded text-[11px] text-white/90">
                          <Minus className="w-3 h-3 text-[#ff534a] flex-shrink-0" />
                          <span className="truncate">{kw}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-white/60 text-center py-4">
                  Click "AI Suggest" to generate keyword suggestions.
                </p>
              )}

              {aiSuggestions && !aiLoading && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <p className="text-[11px] text-white/50">
                    {aiSuggestions.longTail.length + aiSuggestions.questions.length + aiSuggestions.related.length} suggestions generated
                  </p>
                  <button
                    onClick={fetchAiSuggestions}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-[11px] text-white/80 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Keywords Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9]" />
            </div>
          ) : keywords.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <Hash className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
              <p className="text-[#64748B]">No keywords found for this selection.</p>
              <p className="text-[#94A3B8] text-sm mt-1">Try adjusting your filters or time period.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedKeywords.map((keyword, index) => (
                <div
                  key={`${keyword.keyword}-${index}`}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:border-[#0EA5E9] hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-[#0F172A] truncate">
                        {keyword.keyword}
                      </h3>
                      <span className="text-[10px] text-[#94A3B8]">{keyword.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <TrendIcon trend={keyword.trend} />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getSentimentColor(keyword.sentiment)}`}>
                        {keyword.sentiment.positive > keyword.sentiment.negative ? 'Positive' :
                         keyword.sentiment.negative > keyword.sentiment.positive ? 'Negative' : 'Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-medium">{keyword.frequency}x</span>
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">
                      Last seen {formatDate(keyword.lastSeen)}
                    </div>
                  </div>

                  {/* Source breakdown */}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(keyword.sources)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([source, count]) => (
                        <span
                          key={source}
                          className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded text-[9px] font-medium"
                        >
                          {source} ({count})
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {keywords.length > 0 && (
            <div className="text-center">
              <p className="text-[11px] text-[#94A3B8]">
                {keywords.length} keywords from {sources.filter(s => s.enabled).length} sources • Last {days} day{days > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
