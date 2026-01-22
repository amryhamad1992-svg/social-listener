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
  Target,
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
    } catch (err) {
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

  const handleCopy = async () => {
    if (!data) return;
    const text = generateExportText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-[#1E293B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Persona
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5" style={{ fontFamily: 'Roboto, sans-serif' }}>
                AI-powered audience profiling using search data analysis
              </p>
            </div>
            {data && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#64748B] hover:text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#0F172A] rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1.5">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Weleda"
                  className="w-full px-3 py-2 text-[13px] text-[#1E293B] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1.5">Product</label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g., Skin Food"
                  className="w-full px-3 py-2 text-[13px] text-[#1E293B] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A]"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || !brand.trim() || !product.trim()}
                className="flex items-center gap-2 px-5 py-2 text-[13px] text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Persona
              </button>
            </div>

            {/* Suggestions */}
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <p className="text-[11px] text-[#94A3B8] mb-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PRODUCTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className="px-2.5 py-1 text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded hover:border-[#0F172A] hover:text-[#0F172A] transition-colors"
                  >
                    {s.brand} {s.product}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#16949b] mx-auto mb-4" />
              <p className="text-[14px] font-medium text-[#1E293B]">Analyzing audience data...</p>
              <p className="text-[12px] text-[#64748B] mt-1">Searching reviews, forums, and discussions</p>
            </div>
          )}

          {/* Results */}
          {persona && !loading && (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-xl p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-white/60 uppercase tracking-wider mb-1">Audience Persona</p>
                    <h2 className="text-[18px] font-semibold mb-3 text-white">{data?.brand} {data?.product}</h2>
                    <p className="text-[13px] text-white/80 leading-relaxed max-w-2xl">{persona.summary}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <Target className="w-4 h-4" />
                      <span className="text-[12px] font-medium">
                        {data?.sourcesCount && data.sourcesCount > 0
                          ? `${data.sourcesCount} sources analyzed`
                          : 'AI Knowledge-based'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-[#0F172A]" />
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">Demographics</h3>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Age Range</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#1E293B]">{persona.demographics.ageRange}</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Gender</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#1E293B]">{persona.demographics.genderSkew}</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Income</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#1E293B]">{persona.demographics.incomeLevel}</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Education</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#1E293B]">{persona.demographics.education}</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Location</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#1E293B]">{persona.demographics.location}</p>
                  </div>
                </div>
              </div>

              {/* Psychographics */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-[#0F172A]" />
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">Psychographics</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] text-[#64748B] font-medium mb-2 uppercase tracking-wider">Values</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.psychographics.values.map((v, i) => (
                        <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-700">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748B] font-medium mb-2 uppercase tracking-wider">Lifestyle</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.psychographics.lifestyle.map((l, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-700">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748B] font-medium mb-2 uppercase tracking-wider">Attitudes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.psychographics.attitudes.map((a, i) => (
                        <span key={i} className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded text-[11px] text-purple-700">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-[#0F172A]" />
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">Interests</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] text-[#64748B] font-medium mb-2 uppercase tracking-wider">Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.interests.categories.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#334155]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748B] font-medium mb-2 uppercase tracking-wider">Hobbies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.interests.hobbies.map((h, i) => (
                        <span key={i} className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#334155]">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Radio className="w-3.5 h-3.5 text-[#64748B]" />
                      <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">Media Consumption</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.interests.mediaConsumption.map((m, i) => (
                        <span key={i} className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#334155]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shopping Behavior */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-[#0F172A]" />
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">Shopping Behavior</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Store className="w-3.5 h-3.5 text-[#64748B]" />
                        <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">Shopping Channels</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {persona.shoppingBehavior.channels.map((c, i) => (
                          <span key={i} className="px-2.5 py-1 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="w-3.5 h-3.5 text-[#64748B]" />
                        <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">Purchase Drivers</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {persona.shoppingBehavior.purchaseDrivers.map((d, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#334155]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Tag className="w-3.5 h-3.5 text-[#64748B]" />
                        <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Price Sensitivity</p>
                      </div>
                      <p className="text-[12px] text-[#1E293B]">{persona.shoppingBehavior.priceSensitivity}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Award className="w-3.5 h-3.5 text-[#64748B]" />
                        <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Brand Loyalty</p>
                      </div>
                      <p className="text-[12px] text-[#1E293B]">{persona.shoppingBehavior.brandLoyalty}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lookalike Brands */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[#0F172A]" />
                  <h3 className="text-[14px] font-semibold text-[#0F172A]">Lookalike Brands</h3>
                  <span className="text-[11px] text-[#64748B]">Brands this audience likely also purchases</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {persona.lookalikeBrands.map((b, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[#0F172A] text-white rounded-lg text-[12px] font-medium">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!loading && !data && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
              <h3 className="text-[15px] font-medium text-[#0F172A] mb-2">
                Build Your Audience Persona
              </h3>
              <p className="text-[13px] text-[#64748B] max-w-md mx-auto">
                Enter a brand and product to generate a detailed audience profile including demographics, psychographics, interests, and shopping behavior.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
