'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import {
  Users,
  ChevronDown,
  Loader2,
  Copy,
  Download,
  Check,
  Sparkles,
  Target,
  Globe,
  Tag,
  Zap,
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
  const [copied, setCopied] = useState<string | null>(null);

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch brand data on mount
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/audience-builder-2');
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

    try {
      const res = await fetch('/api/audience-builder-2', {
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

  const handleAISuggestions = async () => {
    if (!results) return;

    setAiLoading(true);

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
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportCSV = () => {
    if (!results) return;

    const rows: string[][] = [['Type', 'Targeting', 'Value']];

    Object.entries(results).forEach(([targeting, data]) => {
      if (targetingTypes.includes(targeting)) {
        if (outputType === 'keywords') {
          data?.keywords.forEach((kw: string) => {
            rows.push(['Keyword', targeting, kw]);
          });
        } else {
          data?.domains.forEach((domain: string) => {
            rows.push(['Domain', targeting, domain]);
          });
        }
      }
    });

    // Add AI suggestions if available
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
  };

  const getItemsForTargeting = (targeting: string) => {
    const data = results?.[targeting as keyof Results];
    if (!data) return [];
    return outputType === 'keywords' ? data.keywords : data.domains;
  };

  const targetingConfig = {
    branded: { label: 'Branded', icon: Tag, color: 'bg-blue-500' },
    generic: { label: 'Generic', icon: Target, color: 'bg-green-500' },
    competitor: { label: 'Competitor', icon: Zap, color: 'bg-orange-500' },
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#16949b]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#16949b]" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-[#0F172A]">Audience Builder 2.0</h1>
                <p className="text-[12px] text-[#64748B]">Generate keywords & domains for off-Amazon targeting</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {loadingBrands ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-[#16949b]" />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Selection Panel */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Brand Select */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                      Brand
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16949b] focus:border-transparent pr-10"
                      >
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                    </div>
                  </div>

                  {/* Category Select */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16949b] focus:border-transparent pr-10"
                      >
                        {currentBrand?.categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                    </div>
                  </div>

                  {/* Sub-category Select */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                      Sub-category
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16949b] focus:border-transparent pr-10"
                      >
                        {currentCategory?.subCategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Output Type & Targeting */}
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  {/* Output Type */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                      Output Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOutputType('keywords')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                          outputType === 'keywords'
                            ? 'bg-[#16949b] text-white'
                            : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        <Tag className="w-4 h-4" />
                        Keywords
                      </button>
                      <button
                        onClick={() => setOutputType('domains')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                          outputType === 'domains'
                            ? 'bg-[#16949b] text-white'
                            : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        Domains
                      </button>
                    </div>
                  </div>

                  {/* Targeting Types */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                      Targeting Type
                    </label>
                    <div className="flex gap-2">
                      {Object.entries(targetingConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        const isActive = targetingTypes.includes(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleTargetingType(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                              isActive
                                ? `${config.color} text-white`
                                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !selectedBrand || !selectedCategory || !selectedSubCategory || targetingTypes.length === 0}
                  className="w-full md:w-auto px-8 py-3 bg-[#0F172A] text-white rounded-lg text-[13px] font-medium hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-4">
                  {/* Results Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold text-[#0F172A]">
                      Results for {currentBrand?.name} &gt; {currentCategory?.name} &gt; {selectedSubCategory}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAISuggestions}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-[#16949b]" />
                        )}
                        AI Suggestions
                      </button>
                      <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {targetingTypes.map(targeting => {
                      const config = targetingConfig[targeting as keyof typeof targetingConfig];
                      const items = getItemsForTargeting(targeting);
                      const Icon = config.icon;
                      const copyId = `${targeting}-${outputType}`;

                      return (
                        <div key={targeting} className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                          <div className={`px-4 py-3 ${config.color} text-white flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="text-[13px] font-medium">{config.label}</span>
                              <span className="text-[11px] opacity-80">({items.length})</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(items.join('\n'), copyId)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                            >
                              {copied === copyId ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <div className="p-4 max-h-80 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {items.map((item, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-[#F1F5F9] rounded text-[12px] text-[#334155]"
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

                  {/* AI Suggestions */}
                  {aiSuggestions && (
                    <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-[#16949b]" />
                        <h3 className="text-[14px] font-semibold text-[#0F172A]">AI-Powered Suggestions</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Long Tail */}
                        <div>
                          <h4 className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                            Long Tail Keywords
                          </h4>
                          <div className="space-y-1">
                            {aiSuggestions.longTail.map((kw, i) => (
                              <div key={i} className="text-[12px] text-[#334155] py-1 px-2 bg-[#F8FAFC] rounded">
                                {kw}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Questions */}
                        <div>
                          <h4 className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                            Question Keywords
                          </h4>
                          <div className="space-y-1">
                            {aiSuggestions.questions.map((kw, i) => (
                              <div key={i} className="text-[12px] text-[#334155] py-1 px-2 bg-[#F8FAFC] rounded">
                                {kw}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Related */}
                        <div>
                          <h4 className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                            Related Terms
                          </h4>
                          <div className="space-y-1">
                            {aiSuggestions.related.map((kw, i) => (
                              <div key={i} className="text-[12px] text-[#334155] py-1 px-2 bg-[#F8FAFC] rounded">
                                {kw}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Negative */}
                        <div>
                          <h4 className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
                            Negative Keywords
                          </h4>
                          <div className="space-y-1">
                            {aiSuggestions.negative.map((kw, i) => (
                              <div key={i} className="text-[12px] text-[#ff534a] py-1 px-2 bg-red-50 rounded">
                                {kw}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!results && !loading && (
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center">
                  <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#64748B]" />
                  </div>
                  <h3 className="text-[15px] font-medium text-[#0F172A] mb-2">
                    Generate Your Audience
                  </h3>
                  <p className="text-[13px] text-[#64748B] max-w-md mx-auto">
                    Select a brand, category, and sub-category, then choose your output type and targeting preferences to generate keywords or domains.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
