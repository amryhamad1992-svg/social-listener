'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Loader2,
  Copy,
  Download,
  Check,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Tag,
  Globe,
  Zap,
  Target,
  Hash,
  MessageSquare,
  TrendingUp,
  Plus,
  Ban,
  Minus,
} from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  categories: {
    id: string;
    name: string;
    subCategories: string[];
  }[];
}

interface Results {
  branded?: { keywords: string[]; domains: string[] };
  generic?: { keywords: string[]; domains: string[] };
  competitor?: { keywords: string[]; domains: string[] };
}

interface AISuggestions {
  longTail: string[];
  questions: string[];
  related: string[];
  negative: string[];
}

export default function AudienceBuilder2Page() {
  const router = useRouter();

  // Brand data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // Selection state
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [outputType, setOutputType] = useState<'keywords' | 'domains'>('keywords');
  const [targetingTypes, setTargetingTypes] = useState<string[]>(['branded', 'generic', 'competitor']);

  // Results state
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  // Fetch brand data on mount
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/audience-builder');
        const data = await res.json();
        if (data.success) {
          setBrands(data.brands);
          if (data.brands.length > 0) {
            setSelectedBrand(data.brands[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoadingBrands(false);
      }
    }
    fetchBrands();
  }, []);

  // Update category when brand changes
  useEffect(() => {
    const brand = brands.find(b => b.id === selectedBrand);
    if (brand && brand.categories.length > 0) {
      setSelectedCategory(brand.categories[0].id);
    } else {
      setSelectedCategory('');
    }
  }, [selectedBrand, brands]);

  // Update subcategory when category changes
  useEffect(() => {
    const brand = brands.find(b => b.id === selectedBrand);
    const category = brand?.categories.find(c => c.id === selectedCategory);
    if (category && category.subCategories.length > 0) {
      setSelectedSubCategory(category.subCategories[0]);
    } else {
      setSelectedSubCategory('');
    }
  }, [selectedCategory, selectedBrand, brands]);

  const currentBrand = brands.find(b => b.id === selectedBrand);
  const currentCategory = currentBrand?.categories.find(c => c.id === selectedCategory);

  const toggleTargetingType = (type: string) => {
    setTargetingTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!selectedBrand || !selectedCategory || !selectedSubCategory) return;

    setLoading(true);
    setResults(null);
    setAiSuggestions(null);
    setShowAiSuggestions(false);

    try {
      const res = await fetch('/api/audience-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrand,
          category: selectedCategory,
          subCategory: selectedSubCategory,
          outputType,
          targetingTypes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.data.results);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestions = useCallback(async () => {
    if (!results) return;

    setAiLoading(true);
    setShowAiSuggestions(true);

    try {
      // Collect all keywords from results
      const allKeywords = Object.values(results)
        .flatMap(r => r?.keywords || [])
        .slice(0, 20);

      const res = await fetch('/api/ai-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: allKeywords,
          category: currentCategory?.name || 'Beauty',
          subCategory: selectedSubCategory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data.data);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  }, [results, currentCategory?.name, selectedSubCategory]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Export as text
  const exportAsText = () => {
    let text = `Audience Builder Export\n`;
    text += `Brand: ${currentBrand?.name} > ${currentCategory?.name} > ${selectedSubCategory}\n`;
    text += `Output: ${outputType === 'keywords' ? 'Keywords' : 'Domains'}\n`;
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += `${'='.repeat(50)}\n\n`;

    if (results) {
      Object.entries(results).forEach(([targeting, data]) => {
        if (targetingTypes.includes(targeting) && data) {
          text += `## ${targeting.toUpperCase()}\n`;
          const items = outputType === 'keywords' ? data.keywords : data.domains;
          items.forEach((item: string) => {
            text += `- ${item}\n`;
          });
          text += '\n';
        }
      });
    }

    if (aiSuggestions) {
      text += `\nAI-GENERATED SUGGESTIONS\n`;
      text += `${'-'.repeat(30)}\n\n`;

      if (aiSuggestions.longTail.length > 0) {
        text += `## Long-tail Keywords\n`;
        aiSuggestions.longTail.forEach((kw: string) => text += `- ${kw}\n`);
        text += '\n';
      }
      if (aiSuggestions.questions.length > 0) {
        text += `## Question Keywords\n`;
        aiSuggestions.questions.forEach((kw: string) => text += `- ${kw}\n`);
        text += '\n';
      }
      if (aiSuggestions.related.length > 0) {
        text += `## Related Terms\n`;
        aiSuggestions.related.forEach((kw: string) => text += `- ${kw}\n`);
        text += '\n';
      }
      if (aiSuggestions.negative.length > 0) {
        text += `## Negative Keywords\n`;
        aiSuggestions.negative.forEach((kw: string) => text += `- ${kw}\n`);
        text += '\n';
      }
    }

    return text;
  };

  const handleCopy = async () => {
    const text = exportAsText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!results) return;

    const rows: string[][] = [['Type', 'Targeting', 'Value']];

    Object.entries(results).forEach(([targeting, data]) => {
      if (targetingTypes.includes(targeting) && data) {
        if (outputType === 'keywords') {
          data.keywords.forEach((kw: string) => {
            rows.push(['Keyword', targeting, kw]);
          });
        } else {
          data.domains.forEach((domain: string) => {
            rows.push(['Domain', targeting, domain]);
          });
        }
      }
    });

    if (aiSuggestions) {
      aiSuggestions.longTail.forEach((kw: string) => rows.push(['AI - Long Tail', 'ai', kw]));
      aiSuggestions.questions.forEach((kw: string) => rows.push(['AI - Question', 'ai', kw]));
      aiSuggestions.related.forEach((kw: string) => rows.push(['AI - Related', 'ai', kw]));
      aiSuggestions.negative.forEach((kw: string) => rows.push(['AI - Negative', 'ai', kw]));
    }

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audience-${selectedBrand}-${selectedCategory}-${selectedSubCategory}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getItemsForTargeting = (targeting: string) => {
    const data = results?.[targeting as keyof Results];
    if (!data) return [];
    return outputType === 'keywords' ? data.keywords : data.domains;
  };

  const getTotalItems = () => {
    if (!results) return 0;
    return targetingTypes.reduce((sum, type) => sum + getItemsForTargeting(type).length, 0);
  };

  const targetingConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    branded: { label: 'Branded', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    generic: { label: 'Generic', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
    competitor: { label: 'Competitor', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {loadingBrands ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-[#16949b]" />
            </div>
          ) : (
            <>
              {/* Header with Logo and Inline Filters - Trend Radar Style */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center gap-6">
                  {/* Logo Section */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-[15px] font-semibold text-[#0F172A]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                        Audience Builder
                      </h1>
                      <p className="text-[11px] text-[#64748B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                        Keywords & domains for targeting
                      </p>
                    </div>
                  </div>

                  <div className="w-px h-10 bg-[#E2E8F0]" />

                  {/* Inline Filters */}
                  <div className="flex items-center gap-4 flex-wrap flex-1">
                    {/* Brand */}
                    <div className="relative">
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-8 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer font-medium"
                      >
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
                    </div>

                    {/* Category */}
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-8 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer font-medium"
                      >
                        {currentBrand?.categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
                    </div>

                    {/* Sub-category */}
                    <div className="relative">
                      <select
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-8 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#F97316] cursor-pointer font-medium"
                      >
                        {currentCategory?.subCategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
                    </div>

                    {/* Output Type */}
                    <button
                      onClick={() => setOutputType('keywords')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-medium transition-all ${
                        outputType === 'keywords'
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-white text-[#94A3B8] border-[#E2E8F0] hover:border-[#0F172A] hover:text-[#0F172A]'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      Keywords
                    </button>
                    <button
                      onClick={() => setOutputType('domains')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-medium transition-all ${
                        outputType === 'domains'
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-white text-[#94A3B8] border-[#E2E8F0] hover:border-[#0F172A] hover:text-[#0F172A]'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      Domains
                    </button>

                    {/* Targeting Types with Color */}
                    {Object.entries(targetingConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => toggleTargetingType(key)}
                        className={`px-2.5 py-1 rounded border text-[10px] font-medium transition-all ${
                          targetingTypes.includes(key)
                            ? `${config.bgColor} ${config.color}`
                            : 'bg-white text-[#94A3B8] border-[#E2E8F0] hover:border-[#0F172A] hover:text-[#0F172A]'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}

                    {/* Generate Button with Orange Color */}
                    <button
                      onClick={handleGenerate}
                      disabled={loading || targetingTypes.length === 0}
                      className="flex items-center gap-2 px-4 py-1.5 text-[12px] text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      Generate
                    </button>

                    {/* Export Buttons */}
                    {results && (
                      <>
                        {/* AI Suggestions Button */}
                        <button
                          onClick={handleAISuggestions}
                          disabled={aiLoading}
                          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-white bg-[#16949b] hover:bg-[#138085] rounded-lg transition-all disabled:opacity-50"
                        >
                          {aiLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          AI
                        </button>

                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#0F172A] rounded-lg transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>

                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              {results && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-[22px] font-bold text-[#0F172A]">{getTotalItems()}</p>
                      <p className="text-[11px] text-[#64748B]">{outputType === 'keywords' ? 'Keywords' : 'Domains'} Generated</p>
                    </div>
                    <div className="w-px h-10 bg-[#E2E8F0]" />
                    {targetingTypes.map(type => (
                      <div key={type}>
                        <p className={`text-[22px] font-bold ${targetingConfig[type].color}`}>
                          {getItemsForTargeting(type).length}
                        </p>
                        <p className="text-[11px] text-[#64748B]">{targetingConfig[type].label}</p>
                      </div>
                    ))}
                    {aiSuggestions && (
                      <>
                        <div className="w-px h-10 bg-[#E2E8F0]" />
                        <div>
                          <p className="text-[22px] font-bold text-[#16949b]">
                            {aiSuggestions.longTail.length + aiSuggestions.questions.length + aiSuggestions.related.length}
                          </p>
                          <p className="text-[11px] text-[#64748B]">AI Suggestions</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* AI Suggestions Panel */}
              {showAiSuggestions && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#0F172A]" />
                      <h3 className="text-[14px] font-semibold text-[#0F172A]">AI-Powered Suggestions</h3>
                      <span className="px-2 py-0.5 bg-[#0F172A] text-white rounded text-[9px] font-medium">
                        GPT Generated
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAiSuggestions(false)}
                      className="text-[#64748B] hover:text-[#0F172A] text-[12px]"
                    >
                      Hide
                    </button>
                  </div>

                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-[#64748B] py-8 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-[13px]">Generating keyword suggestions...</span>
                    </div>
                  ) : aiSuggestions ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Long-tail Keywords */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-3">
                          <TrendingUp className="w-4 h-4 text-[#71c184]" />
                          <span className="text-[12px] font-medium text-[#1E293B]">Long-tail Keywords</span>
                        </div>
                        <div className="space-y-1.5">
                          {aiSuggestions.longTail.map((kw: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#1E293B]">
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
                          <span className="text-[12px] font-medium text-[#1E293B]">Question-based</span>
                        </div>
                        <div className="space-y-1.5">
                          {aiSuggestions.questions.map((kw: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#1E293B]">
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
                          <span className="text-[12px] font-medium text-[#1E293B]">Related Terms</span>
                        </div>
                        <div className="space-y-1.5">
                          {aiSuggestions.related.map((kw: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#1E293B]">
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
                          <span className="text-[12px] font-medium text-[#1E293B]">Negative Keywords</span>
                        </div>
                        <div className="space-y-1.5">
                          {aiSuggestions.negative.map((kw: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#1E293B]">
                              <Minus className="w-3 h-3 text-[#ff534a] flex-shrink-0" />
                              <span className="truncate">{kw}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {aiSuggestions && !aiLoading && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E2E8F0]">
                      <p className="text-[11px] text-[#94A3B8]">
                        {aiSuggestions.longTail.length + aiSuggestions.questions.length + aiSuggestions.related.length} suggestions generated
                      </p>
                      <button
                        onClick={handleAISuggestions}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded text-[11px] text-[#1E293B] transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Results Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-[#16949b]" />
                </div>
              ) : results ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {targetingTypes.map(targeting => {
                    const config = targetingConfig[targeting];
                    const items = getItemsForTargeting(targeting);

                    return (
                      <div key={targeting} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                        <div className={`px-4 py-3 border-b ${config.bgColor} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] font-semibold ${config.color}`}>{config.label}</span>
                            <span className="text-[11px] text-[#64748B]">({items.length})</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(items.join('\n'));
                            }}
                            className="p-1.5 hover:bg-white/50 rounded transition-colors"
                            title="Copy all"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                          </button>
                        </div>
                        <div className="p-4 max-h-80 overflow-y-auto">
                          <div className="flex flex-wrap gap-2">
                            {items.map((item: string, i: number) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#334155] hover:border-[#0F172A] transition-colors cursor-default"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
                  <Hash className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                  <h3 className="text-[15px] font-medium text-[#0F172A] mb-2">
                    Generate Your Audience
                  </h3>
                  <p className="text-[13px] text-[#64748B] max-w-md mx-auto">
                    Select a brand, category, and sub-category, then choose your output type and targeting preferences to generate keywords or domains.
                  </p>
                </div>
              )}

              {/* Footer */}
              {results && (
                <div className="text-center">
                  <p className="text-[11px] text-[#94A3B8]">
                    {getTotalItems()} {outputType} for {currentBrand?.name} &gt; {currentCategory?.name} &gt; {selectedSubCategory}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
