'use client';

import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Zap, MoreHorizontal } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

// Stackline Official Colors
const COLORS = {
  carbonIndigo: '#031425',
  navyDark: '#2D3C4A',
  productCharts: '#adbdcc',
  slate: '#4E596A',
  moonbeam: '#E0E2E4',
  teal: '#16949b',
  tealLight: '#9ee0d0',
  success: '#71c184',
  danger: '#ff534a',
  warning: '#ffbd32',
};

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

interface ExecutiveSummaryProps {
  days?: number;
}

export function ExecutiveSummary({ days = 7 }: ExecutiveSummaryProps) {
  const { settings, getBrandName } = useSettings();
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    setInsights(generateInsights(getBrandName(), days));
  }, [settings.selectedBrand, days, getBrandName]);

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return { bg: 'rgba(22, 148, 155, 0.08)', border: 'rgba(22, 148, 155, 0.2)', text: COLORS.teal };
      case 'negative':
        return { bg: 'rgba(78, 89, 106, 0.08)', border: 'rgba(78, 89, 106, 0.2)', text: COLORS.slate };
      case 'alert':
        return { bg: 'rgba(255, 189, 50, 0.08)', border: 'rgba(255, 189, 50, 0.2)', text: COLORS.warning };
      default:
        return { bg: 'rgba(3, 20, 37, 0.05)', border: 'rgba(3, 20, 37, 0.15)', text: COLORS.carbonIndigo };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Card Header - Stackline style with three-dot menu */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div>
          <h3 className="text-base font-medium" style={{ color: COLORS.carbonIndigo }}>Executive Summary</h3>
          <p className="text-[13px] mt-1" style={{ color: COLORS.slate }}>
            AI-powered insights for {getBrandName()} • {days}-day analysis
          </p>
        </div>
        <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100 transition-colors">
          <MoreHorizontal className="w-4 h-4" style={{ color: COLORS.slate }} />
        </button>
      </div>

      {/* Insights Grid */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  backgroundColor: styles.bg,
                  border: `1px solid ${styles.border}`,
                }}
              >
                <div className="flex-shrink-0 mt-0.5" style={{ color: styles.text }}>
                  {insight.icon}
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: COLORS.navyDark }}>
                  {insight.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end mt-4 pt-3" style={{ borderTop: `1px solid ${COLORS.moonbeam}` }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.teal }} />
            <span className="text-[11px]" style={{ color: COLORS.slate }}>Updated just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
