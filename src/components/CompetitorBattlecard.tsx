'use client';

import { useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, MessageSquare, Heart, Users } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

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
      <span className="flex items-center gap-0.5 text-[10px] text-[#0EA5E9]">
        <TrendingUp className="w-3 h-3" />
        +{value}{suffix}
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-[#64748B]">
        <TrendingDown className="w-3 h-3" />
        {value}{suffix}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-[#94A3B8]">
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
    <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#1E293B]" />
          <div>
            <h2 className="text-sm font-medium text-[#1E293B]">Competitor Battlecard</h2>
            <p className="text-[10px] text-[#64748B]">
              Head-to-head brand comparison • Last {days} days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-[#1E293B]/10 rounded">
          <span className="text-[10px] text-[#1E293B] font-medium">Leader:</span>
          <span className="text-[10px] font-semibold text-[#1E293B]">{leader.emoji} {leader.name}</span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left text-[10px] font-medium text-[#64748B] pb-2 uppercase tracking-wide">Brand</th>
              <th className="text-center text-[10px] font-medium text-[#64748B] pb-2 uppercase tracking-wide">SOV</th>
              <th className="text-center text-[10px] font-medium text-[#64748B] pb-2 uppercase tracking-wide">Sentiment</th>
              <th className="text-center text-[10px] font-medium text-[#64748B] pb-2 uppercase tracking-wide">Mentions</th>
              <th className="text-center text-[10px] font-medium text-[#64748B] pb-2 uppercase tracking-wide">Engagement</th>
              <th className="text-left text-[10px] font-medium text-[#64748B] pb-2 uppercase tracking-wide">Top Product</th>
            </tr>
          </thead>
          <tbody>
            {data.map((brand) => {
              const isSelected = brand.id === settings.selectedBrand;
              const isLeader = brand.id === leader.id;
              return (
                <tr
                  key={brand.id}
                  className={`border-b border-[#E2E8F0] last:border-0 ${
                    isSelected ? 'bg-[#F8FAFC]' : ''
                  }`}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{brand.emoji}</span>
                      <span className={`text-[12px] ${isSelected ? 'font-semibold text-[#0F172A]' : 'text-[#334155]'}`}>
                        {brand.name}
                      </span>
                      {isLeader && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-[#FEF3C7] text-[#D97706] rounded font-medium">
                          #1
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded font-medium">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[13px] font-semibold text-[#0F172A]">{brand.shareOfVoice}%</span>
                      <ChangeIndicator value={brand.sovChange} />
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[13px] font-semibold text-[#0F172A]">{brand.sentiment.toFixed(2)}</span>
                      <ChangeIndicator value={brand.sentimentChange} suffix="" />
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="w-3 h-3 text-[#64748B]" />
                      <span className="text-[12px] text-[#334155]">{brand.mentions.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3 text-[#64748B]" />
                      <span className="text-[12px] text-[#334155]">{(brand.engagement / 1000).toFixed(1)}K</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-[11px] text-[#334155]">{brand.topProduct}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SWOT Summary for Selected Brand */}
      <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
        <div className="grid grid-cols-2 gap-4">
          {data.filter(b => b.id === settings.selectedBrand).map(brand => (
            <>
              <div key={`${brand.id}-strength`} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-[#0EA5E9]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-[#0EA5E9]" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Strength</p>
                  <p className="text-[11px] text-[#334155]">{brand.strength}</p>
                </div>
              </div>
              <div key={`${brand.id}-weakness`} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-[#64748B]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingDown className="w-3 h-3 text-[#64748B]" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Watch Area</p>
                  <p className="text-[11px] text-[#334155]">{brand.weakness}</p>
                </div>
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
