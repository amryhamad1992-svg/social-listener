'use client';

import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'alert';
  icon: React.ReactNode;
  text: string;
}

// Generate insights based on brand and time period
function generateInsights(brand: string, days: number): Insight[] {
  const brandInsights: Record<string, Record<number, Insight[]>> = {
    'Revlon': {
      7: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Mentions up 23% this week, driven by viral TikTok reviews of ColorStay Foundation' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Sentiment improved from 0.62 to 0.71 following new product launch announcements' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Top performing content: "Best Drugstore Lipsticks 2025" video (45K views, 92% positive)' },
        { type: 'alert', icon: <AlertTriangle className="w-4 h-4" />, text: 'Monitor: Increased discussion around pricing compared to e.l.f. alternatives' },
      ],
      14: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Brand visibility increased 18% over 2 weeks across YouTube and news outlets' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'One-Step Hair Dryer continues to drive 35% of all brand mentions' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Super Lustrous lipstick line seeing renewed interest (+12% searches)' },
        { type: 'alert', icon: <AlertTriangle className="w-4 h-4" />, text: 'Competitor alert: Maybelline launched similar product line' },
      ],
      30: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Monthly mentions reached 2.4K, highest since Q3 2024' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Share of voice improved to 42% in drugstore beauty category' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Hair tools category now represents 28% of total brand discussion' },
        { type: 'negative', icon: <TrendingDown className="w-4 h-4" />, text: 'Foundation category mentions down 8% month-over-month' },
      ],
      90: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Quarterly brand health score: 7.8/10 (up from 7.2 last quarter)' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Successfully maintained #2 position in drugstore beauty mentions' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Key growth driver: Hair tools expanded audience by 45%' },
        { type: 'alert', icon: <AlertTriangle className="w-4 h-4" />, text: 'Opportunity: Lip category underperforming vs. competitors' },
      ],
    },
    'e.l.f.': {
      7: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Explosive week: Mentions up 45% driven by Halo Glow viral moment' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Highest sentiment score (0.78) among all tracked brands this week' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Power Grip Primer mentioned as "Charlotte Tilbury dupe" in 340+ posts' },
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'TikTok engagement: 2.8M views on #elfcosmetics this week' },
      ],
      14: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Brand momentum continues with 38% increase in social mentions' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Bronzing Drops now the #1 searched e.l.f. product (+55% interest)' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: '"Affordable luxury" positioning resonating strongly with Gen Z' },
        { type: 'alert', icon: <AlertTriangle className="w-4 h-4" />, text: 'Stock concerns mentioned in 12% of purchase-intent discussions' },
      ],
      30: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Monthly share of voice: 35% (up 8 points from previous month)' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Average sentiment 0.74 - leading all drugstore beauty brands' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Sephora partnership driving 22% of total brand visibility' },
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: '"Dupe culture" mentions featuring e.l.f. up 65% this month' },
      ],
      90: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Quarterly brand health score: 8.5/10 - highest among competitors' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Successfully captured 35% share of voice (was 24% last quarter)' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Key insight: Brand perceived as "prestige quality at drugstore price"' },
        { type: 'alert', icon: <AlertTriangle className="w-4 h-4" />, text: 'Watch: Increased competitor activity in primer category' },
      ],
    },
    'Maybelline': {
      7: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Sky High Mascara maintains viral status with 18% mention increase' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Vinyl Ink liquid lipstick gaining traction (+25% search interest)' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Strong YouTube presence: 12 beauty influencer features this week' },
        { type: 'negative', icon: <TrendingDown className="w-4 h-4" />, text: 'Fit Me foundation sentiment dipped slightly (-0.05) due to shade range concerns' },
      ],
      14: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Two-week momentum: Brand mentions up 15% across all platforms' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'SuperStay line mentioned in 8 major beauty publication articles' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Core strength: Mascara category dominance continues (68% positive)' },
        { type: 'alert', icon: <AlertTriangle className="w-4 h-4" />, text: 'Competitive pressure: e.l.f. gaining ground in foundation segment' },
      ],
      30: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Monthly brand visibility: 23% share of voice in mascara category' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Instant Age Rewind concealer showing renewed interest (+12%)' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Brand perception: "Reliable drugstore staple" - 78% positive association' },
        { type: 'negative', icon: <TrendingDown className="w-4 h-4" />, text: 'Lip category losing ground to emerging brands (-8% share)' },
      ],
      90: [
        { type: 'positive', icon: <TrendingUp className="w-4 h-4" />, text: 'Quarterly brand health score: 7.5/10 (stable from last quarter)' },
        { type: 'neutral', icon: <Sparkles className="w-4 h-4" />, text: 'Maintained #3 position in overall drugstore beauty conversations' },
        { type: 'positive', icon: <Zap className="w-4 h-4" />, text: 'Mascara category: Undisputed leader with 45% category share' },
        { type: 'alert', icon: <AlertTriangle className="w-4 h-4" />, text: 'Strategic opportunity: Expand presence in trending "clean beauty" space' },
      ],
    },
  };

  return brandInsights[brand]?.[days] || brandInsights[brand]?.[90] || brandInsights['Revlon'][7];
}

export function ExecutiveSummary() {
  const { settings, getBrandName } = useSettings();
  const [days, setDays] = useState(7);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    setInsights(generateInsights(getBrandName(), days));
  }, [settings.selectedBrand, days, getBrandName]);

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-[#0EA5E9]/5 border-[#0EA5E9]/20 text-[#0EA5E9]';
      case 'negative':
        return 'bg-[#64748B]/5 border-[#64748B]/20 text-[#64748B]';
      case 'alert':
        return 'bg-[#F59E0B]/5 border-[#F59E0B]/20 text-[#F59E0B]';
      default:
        return 'bg-[#0F172A]/5 border-[#0F172A]/20 text-[#0F172A]';
    }
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1E293B]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#1E293B]" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-[#1E293B]">Executive Summary</h2>
            <p className="text-[10px] text-[#64748B]">AI-powered insights for {getBrandName()}</p>
          </div>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg border ${getInsightStyles(insight.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {insight.icon}
            </div>
            <p className="text-[12px] leading-relaxed text-[#334155]">
              {insight.text}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]">
        <p className="text-[10px] text-[#64748B]">
          Insights generated from {days}-day data analysis
        </p>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse" />
          <span className="text-[10px] text-[#64748B]">Updated just now</span>
        </div>
      </div>
    </div>
  );
}
