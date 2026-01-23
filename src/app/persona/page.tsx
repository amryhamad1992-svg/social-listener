'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Loader2,
  Users,
  Heart,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  MapPin,
  DollarSign,
  GraduationCap,
  User,
  Compass,
  Radio,
  Store,
  Tag,
  Award,
  Zap,
  Copy,
  Check,
  Download,
  ChevronDown,
} from 'lucide-react';

interface PersonaProfile {
  demographics: {
    ageRange: string;
    genderSkew: string;
    incomeLevel: string;
    education: string;
    location: string;
  };
  psychographics: {
    values: string[];
    lifestyle: string[];
    attitudes: string[];
  };
  interests: {
    categories: string[];
    hobbies: string[];
    mediaConsumption: string[];
  };
  shoppingBehavior: {
    channels: string[];
    priceSensitivity: string;
    brandLoyalty: string;
    purchaseDrivers: string[];
  };
  lookalikeBrands: string[];
  summary: string;
}

interface PersonaData {
  brand: string;
  product: string;
  persona: PersonaProfile;
  sourcesCount: number;
}

const SUGGESTED_PRODUCTS = [
  { brand: 'Weleda', product: 'Skin Food' },
  { brand: 'Babyliss', product: 'Pro Ceramic Hair Dryer' },
  { brand: 'Revlon', product: 'ColorStay Foundation' },
  { brand: 'The Ordinary', product: 'Niacinamide Serum' },
  { brand: 'Olaplex', product: 'No. 3 Hair Perfector' },
  { brand: 'CeraVe', product: 'Moisturizing Cream' },
];

export default function PersonaPage() {
  const router = useRouter();

  const [brand, setBrand] = useState('');
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PersonaData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!brand.trim() || !product.trim()) {
      setError('Please enter both brand and product');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: brand.trim(), product: product.trim() }),
      });

      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to generate persona');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (suggestion: { brand: string; product: string }) => {
    setBrand(suggestion.brand);
    setProduct(suggestion.product);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const generateExportText = () => {
    if (!data) return '';
    const p = data.persona;

    let text = `AUDIENCE PERSONA: ${data.brand} ${data.product}\n`;
    text += `${'='.repeat(50)}\n\n`;

    text += `SUMMARY\n${p.summary}\n\n`;

    text += `DEMOGRAPHICS\n`;
    text += `- Age Range: ${p.demographics.ageRange}\n`;
    text += `- Gender: ${p.demographics.genderSkew}\n`;
    text += `- Income: ${p.demographics.incomeLevel}\n`;
    text += `- Education: ${p.demographics.education}\n`;
    text += `- Location: ${p.demographics.location}\n\n`;

    text += `PSYCHOGRAPHICS\n`;
    text += `Values: ${p.psychographics.values.join(', ')}\n`;
    text += `Lifestyle: ${p.psychographics.lifestyle.join(', ')}\n`;
    text += `Attitudes: ${p.psychographics.attitudes.join(', ')}\n\n`;

    text += `INTERESTS\n`;
    text += `Categories: ${p.interests.categories.join(', ')}\n`;
    text += `Hobbies: ${p.interests.hobbies.join(', ')}\n`;
    text += `Media: ${p.interests.mediaConsumption.join(', ')}\n\n`;

    text += `SHOPPING BEHAVIOR\n`;
    text += `Channels: ${p.shoppingBehavior.channels.join(', ')}\n`;
    text += `Price Sensitivity: ${p.shoppingBehavior.priceSensitivity}\n`;
    text += `Brand Loyalty: ${p.shoppingBehavior.brandLoyalty}\n`;
    text += `Purchase Drivers: ${p.shoppingBehavior.purchaseDrivers.join(', ')}\n\n`;

    text += `LOOKALIKE BRANDS\n${p.lookalikeBrands.join(', ')}\n`;

    return text;
  };

  const handleCopy = async () => {
    const text = generateExportText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!data) return;
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persona-${data.brand}-${data.product}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const persona = data?.persona;

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header with Logo and Inline Filters - Trend Radar Style */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-6">
              {/* Logo Section */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[15px] font-semibold text-[#0F172A]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Persona
                  </h1>
                  <p className="text-[11px] text-[#64748B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    AI-powered audience profiling
                  </p>
                </div>
              </div>

              <div className="w-px h-10 bg-[#E2E8F0]" />

              {/* Inline Filters */}
              <div className="flex items-center gap-4 flex-wrap flex-1">
                {/* Brand Input */}
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="Brand (e.g., Weleda)"
                  className="px-3 py-1.5 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#3B82F6] font-medium w-44"
                />

                {/* Product Input */}
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="Product (e.g., Skin Food)"
                  className="px-3 py-1.5 text-[12px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#3B82F6] font-medium w-44"
                />

                {/* Generate Button with Blue Color */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !brand.trim() || !product.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 text-[12px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate
                </button>

                {/* Export Buttons */}
                {data && (
                  <>
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

            {/* Suggestions Row */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
              <span className="text-[10px] text-[#94A3B8] font-medium">Quick try:</span>
              {SUGGESTED_PRODUCTS.slice(0, 3).map((s, i) => {
                const colors = [
                  'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                  'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                  'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                ];
                return (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className={`px-2.5 py-1 text-[10px] border rounded-lg transition-colors font-medium ${colors[i]}`}
                  >
                    {s.brand} {s.product}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-[#16949b]" />
            </div>
          )}

          {/* Stats Bar */}
          {persona && !loading && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[18px] font-bold text-[#0F172A]">{data?.brand} {data?.product}</p>
                  <p className="text-[11px] text-[#64748B]">Audience Persona</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#16949b]">{persona.psychographics.values.length}</p>
                  <p className="text-[11px] text-[#64748B]">Core Values</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#0EA5E9]">{persona.interests.categories.length}</p>
                  <p className="text-[11px] text-[#64748B]">Interest Categories</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[22px] font-bold text-[#F59E0B]">{persona.lookalikeBrands.length}</p>
                  <p className="text-[11px] text-[#64748B]">Lookalike Brands</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[14px] font-medium text-[#64748B]">
                    {data?.sourcesCount && data.sourcesCount > 0
                      ? `${data.sourcesCount} sources`
                      : 'AI Knowledge'}
                  </p>
                  <p className="text-[11px] text-[#64748B]">Data Source</p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Card */}
          {persona && !loading && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-[#0F172A]" />
                <h3 className="text-[14px] font-semibold text-[#0F172A]">Summary</h3>
              </div>
              <p className="text-[13px] text-[#334155] leading-relaxed">{persona.summary}</p>
            </div>
          )}

          {/* Results Grid - 3 columns like Audience Builder */}
          {persona && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Demographics */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 border-b bg-blue-50 border-blue-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-[13px] font-semibold text-blue-600">Demographics</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">Age Range</span>
                    <span className="text-[12px] font-medium text-[#1E293B]">{persona.demographics.ageRange}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">Gender</span>
                    <span className="text-[12px] font-medium text-[#1E293B]">{persona.demographics.genderSkew}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">Income</span>
                    <span className="text-[12px] font-medium text-[#1E293B]">{persona.demographics.incomeLevel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">Education</span>
                    <span className="text-[12px] font-medium text-[#1E293B]">{persona.demographics.education}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">Location</span>
                    <span className="text-[12px] font-medium text-[#1E293B]">{persona.demographics.location}</span>
                  </div>
                </div>
              </div>

              {/* Psychographics */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 border-b bg-emerald-50 border-emerald-200 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-600" />
                  <span className="text-[13px] font-semibold text-emerald-600">Psychographics</span>
                </div>
                <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">VALUES</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.psychographics.values.map((v, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">LIFESTYLE</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.psychographics.lifestyle.map((l, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-700">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">ATTITUDES</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.psychographics.attitudes.map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-50 border border-purple-200 rounded text-[10px] text-purple-700">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 border-b bg-orange-50 border-orange-200 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-orange-600" />
                  <span className="text-[13px] font-semibold text-orange-600">Interests</span>
                </div>
                <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">CATEGORIES</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.interests.categories.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[10px] text-[#334155]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">HOBBIES</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.interests.hobbies.map((h, i) => (
                        <span key={i} className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[10px] text-[#334155]">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">MEDIA</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.interests.mediaConsumption.map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[10px] text-[#334155]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shopping Behavior & Lookalike Brands */}
          {persona && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Shopping Behavior */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 border-b bg-[#F8FAFC] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#0F172A]" />
                  <span className="text-[13px] font-semibold text-[#0F172A]">Shopping Behavior</span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">SHOPPING CHANNELS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.shoppingBehavior.channels.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-orange-50 border border-orange-200 rounded text-[10px] text-orange-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <p className="text-[10px] text-[#64748B] mb-1">Price Sensitivity</p>
                      <p className="text-[11px] text-[#1E293B]">{persona.shoppingBehavior.priceSensitivity}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <p className="text-[10px] text-[#64748B] mb-1">Brand Loyalty</p>
                      <p className="text-[11px] text-[#1E293B]">{persona.shoppingBehavior.brandLoyalty}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B] mb-2">PURCHASE DRIVERS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.shoppingBehavior.purchaseDrivers.map((d, i) => (
                        <span key={i} className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[10px] text-[#334155]">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lookalike Brands */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 border-b bg-[#0F172A] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-[13px] font-semibold text-white">Lookalike Brands</span>
                  <span className="text-[10px] text-white/60 ml-2">Brands this audience likely also purchases</span>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {persona.lookalikeBrands.map((b, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[#0F172A] text-white rounded-lg text-[11px] font-medium">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !data && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
              <h3 className="text-[15px] font-medium text-[#0F172A] mb-2">
                Generate Your Audience Persona
              </h3>
              <p className="text-[13px] text-[#64748B] max-w-md mx-auto">
                Enter a brand and product to generate a detailed audience profile including demographics, psychographics, interests, and shopping behavior.
              </p>
            </div>
          )}

          {/* Footer */}
          {data && !loading && (
            <div className="text-center">
              <p className="text-[11px] text-[#94A3B8]">
                Persona generated for {data.brand} {data.product}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
