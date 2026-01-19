'use client';

import { useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, MessageSquare, Heart, MoreHorizontal } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

// Stackline Official Colors
const COLORS = {
  carbonIndigo: '#031425',
  navyDark: '#2D3C4A',
  productCharts: '#adbdcc',
  slate: '#4E596A',
  moonbeam: '#E0E2E4',
  productHeader: '#F6F7F8',
  teal: '#16949b',
  tealLight: '#9ee0d0',
  success: '#71c184',
  danger: '#ff534a',
  warning: '#ffbd32',
};

interface BrandMetrics {
  id: string;
  name: string;
  emoji: string;
  shareOfVoice: number;
  sovChange: number;
  sentiment: number;
  sentimentChange: number;
  mentions: number;
  engagement: number;
  topProduct: string;
  strength: string;
  weakness: string;
}

function getBattlecardData(): BrandMetrics[] {
  return [
    {
      id: 'revlon',
      name: 'Revlon',
      emoji: '💄',
      shareOfVoice: 38,
      sovChange: 2,
      sentiment: 0.68,
      sentimentChange: 0.03,
      mentions: 2450,
      engagement: 45200,
      topProduct: 'One-Step Hair Dryer',
      strength: 'Hair tools dominance',
      weakness: 'Foundation perception',
    },
    {
      id: 'elf',
      name: 'e.l.f.',
      emoji: '✨',
      shareOfVoice: 42,
      sovChange: 8,
      sentiment: 0.78,
      sentimentChange: 0.05,
      mentions: 3120,
      engagement: 68400,
      topProduct: 'Power Grip Primer',
      strength: 'Value perception, viral moments',
      weakness: 'Limited shade ranges',
    },
    {
      id: 'maybelline',
      name: 'Maybelline',
      emoji: '💋',
      shareOfVoice: 20,
      sovChange: -6,
      sentiment: 0.65,
      sentimentChange: -0.02,
      mentions: 1680,
      engagement: 32100,
      topProduct: 'Sky High Mascara',
      strength: 'Mascara category leader',
      weakness: 'Losing ground to e.l.f.',
    },
  ];
}

function ChangeIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: COLORS.teal }}>
        <TrendingUp className="w-3 h-3" />
        +{value}{suffix}
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: COLORS.slate }}>
        <TrendingDown className="w-3 h-3" />
        {value}{suffix}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: COLORS.productCharts }}>
      <Minus className="w-3 h-3" />
      0{suffix}
    </span>
  );
}

interface CompetitorBattlecardProps {
  days?: number;
}

export function CompetitorBattlecard({ days = 30 }: CompetitorBattlecardProps) {
  const { settings } = useSettings();
  const data = useMemo(() => getBattlecardData(), []);

  // Find the leader (highest share of voice)
  const leader = useMemo(() => {
    return data.reduce((prev, current) =>
      prev.shareOfVoice > current.shareOfVoice ? prev : current
    );
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Card Header - Stackline style */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div>
          <h3 className="text-base font-medium" style={{ color: COLORS.carbonIndigo }}>Competitor Battlecard</h3>
          <p className="text-[13px] mt-1" style={{ color: COLORS.slate }}>
            Head-to-head brand comparison • Last {days} days
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(3, 20, 37, 0.08)' }}>
            <Trophy className="w-3 h-3" style={{ color: COLORS.warning }} />
            <span className="text-[10px] font-medium" style={{ color: COLORS.carbonIndigo }}>Leader: {leader.emoji} {leader.name}</span>
          </div>
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100 transition-colors">
            <MoreHorizontal className="w-4 h-4" style={{ color: COLORS.slate }} />
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="px-5 pb-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.moonbeam}` }}>
                <th className="text-left text-[10px] font-medium pb-3 uppercase tracking-wider" style={{ color: COLORS.slate }}>Brand</th>
                <th className="text-center text-[10px] font-medium pb-3 uppercase tracking-wider" style={{ color: COLORS.slate }}>SOV</th>
                <th className="text-center text-[10px] font-medium pb-3 uppercase tracking-wider" style={{ color: COLORS.slate }}>Sentiment</th>
                <th className="text-center text-[10px] font-medium pb-3 uppercase tracking-wider" style={{ color: COLORS.slate }}>Mentions</th>
                <th className="text-center text-[10px] font-medium pb-3 uppercase tracking-wider" style={{ color: COLORS.slate }}>Engagement</th>
                <th className="text-left text-[10px] font-medium pb-3 uppercase tracking-wider" style={{ color: COLORS.slate }}>Top Product</th>
              </tr>
            </thead>
            <tbody>
              {data.map((brand) => {
                const isSelected = brand.id === settings.selectedBrand;
                const isLeader = brand.id === leader.id;
                return (
                  <tr
                    key={brand.id}
                    style={{
                      borderBottom: `1px solid ${COLORS.moonbeam}`,
                      backgroundColor: isSelected ? COLORS.productHeader : 'transparent',
                    }}
                    className="last:border-0"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{brand.emoji}</span>
                        <span
                          className="text-[12px]"
                          style={{
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? COLORS.carbonIndigo : COLORS.navyDark
                          }}
                        >
                          {brand.name}
                        </span>
                        {isLeader && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: 'rgba(255, 189, 50, 0.2)', color: COLORS.warning }}
                          >
                            #1
                          </span>
                        )}
                        {isSelected && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: 'rgba(22, 148, 155, 0.15)', color: COLORS.teal }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[13px] font-semibold" style={{ color: COLORS.carbonIndigo }}>{brand.shareOfVoice}%</span>
                        <ChangeIndicator value={brand.sovChange} />
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[13px] font-semibold" style={{ color: COLORS.carbonIndigo }}>{brand.sentiment.toFixed(2)}</span>
                        <ChangeIndicator value={brand.sentimentChange} suffix="" />
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="w-3 h-3" style={{ color: COLORS.slate }} />
                        <span className="text-[12px]" style={{ color: COLORS.navyDark }}>{brand.mentions.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3" style={{ color: COLORS.slate }} />
                        <span className="text-[12px]" style={{ color: COLORS.navyDark }}>{(brand.engagement / 1000).toFixed(1)}K</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-[11px]" style={{ color: COLORS.navyDark }}>{brand.topProduct}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SWOT Summary for Selected Brand */}
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.moonbeam}` }}>
          <div className="grid grid-cols-2 gap-4">
            {data.filter(b => b.id === settings.selectedBrand).map(brand => (
              <>
                <div key={`${brand.id}-strength`} className="flex items-start gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(22, 148, 155, 0.15)' }}
                  >
                    <TrendingUp className="w-3 h-3" style={{ color: COLORS.teal }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: COLORS.slate }}>Strength</p>
                    <p className="text-[11px]" style={{ color: COLORS.navyDark }}>{brand.strength}</p>
                  </div>
                </div>
                <div key={`${brand.id}-weakness`} className="flex items-start gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(78, 89, 106, 0.15)' }}
                  >
                    <TrendingDown className="w-3 h-3" style={{ color: COLORS.slate }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: COLORS.slate }}>Watch Area</p>
                    <p className="text-[11px]" style={{ color: COLORS.navyDark }}>{brand.weakness}</p>
                  </div>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
