'use client';

import { useMemo } from 'react';
import { Users, ExternalLink, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface Voice {
  id: string;
  name: string;
  handle: string;
  platform: string;
  platformIcon: string;
  followers: number;
  mentions: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  reach: number;
  isVerified: boolean;
  isInfluencer: boolean;
  avatarColor: string;
}

// Top voices data by brand
function getTopVoices(brand: string): Voice[] {
  const voicesByBrand: Record<string, Voice[]> = {
    'Revlon': [
      { id: '1', name: 'Jordan Beauty', handle: '@beautybyjordan', platform: 'TikTok', platformIcon: '🎵', followers: 245000, mentions: 5, sentiment: 'positive', reach: 892000, isVerified: true, isInfluencer: true, avatarColor: '#E91E63' },
      { id: '2', name: 'MakeupByKay', handle: '@makeupbykay', platform: 'YouTube', platformIcon: '▶️', followers: 180000, mentions: 3, sentiment: 'positive', reach: 456000, isVerified: true, isInfluencer: true, avatarColor: '#9C27B0' },
      { id: '3', name: 'DrugstoreQueen', handle: '@drugstorequeen', platform: 'Instagram', platformIcon: '📸', followers: 95000, mentions: 8, sentiment: 'positive', reach: 234000, isVerified: false, isInfluencer: true, avatarColor: '#2196F3' },
      { id: '4', name: 'BeautyOnBudget', handle: '@beautyonbudget', platform: 'TikTok', platformIcon: '🎵', followers: 67000, mentions: 4, sentiment: 'neutral', reach: 145000, isVerified: false, isInfluencer: false, avatarColor: '#4CAF50' },
      { id: '5', name: 'HairToolsReview', handle: '@hairtoolsreview', platform: 'YouTube', platformIcon: '▶️', followers: 52000, mentions: 6, sentiment: 'positive', reach: 98000, isVerified: false, isInfluencer: false, avatarColor: '#FF9800' },
    ],
    'e.l.f.': [
      { id: '1', name: 'Mikayla Nogueira', handle: '@mikaylanogueira', platform: 'TikTok', platformIcon: '🎵', followers: 15200000, mentions: 2, sentiment: 'positive', reach: 4500000, isVerified: true, isInfluencer: true, avatarColor: '#E91E63' },
      { id: '2', name: 'DupeThat', handle: '@dupethat', platform: 'TikTok', platformIcon: '🎵', followers: 890000, mentions: 7, sentiment: 'positive', reach: 1200000, isVerified: true, isInfluencer: true, avatarColor: '#9C27B0' },
      { id: '3', name: 'AffordableBeauty', handle: '@affordablebeauty', platform: 'Instagram', platformIcon: '📸', followers: 320000, mentions: 5, sentiment: 'positive', reach: 567000, isVerified: true, isInfluencer: true, avatarColor: '#2196F3' },
      { id: '4', name: 'GlowUpDaily', handle: '@glowupdaily', platform: 'YouTube', platformIcon: '▶️', followers: 156000, mentions: 3, sentiment: 'positive', reach: 234000, isVerified: false, isInfluencer: true, avatarColor: '#4CAF50' },
      { id: '5', name: 'BudgetBeautyBabe', handle: '@budgetbeautybabe', platform: 'TikTok', platformIcon: '🎵', followers: 78000, mentions: 9, sentiment: 'neutral', reach: 145000, isVerified: false, isInfluencer: false, avatarColor: '#FF9800' },
    ],
    'Maybelline': [
      { id: '1', name: 'NikkieTutorials', handle: '@nikkietutorials', platform: 'YouTube', platformIcon: '▶️', followers: 14000000, mentions: 1, sentiment: 'positive', reach: 3200000, isVerified: true, isInfluencer: true, avatarColor: '#E91E63' },
      { id: '2', name: 'MascaraQueen', handle: '@mascaraqueen', platform: 'TikTok', platformIcon: '🎵', followers: 456000, mentions: 4, sentiment: 'positive', reach: 780000, isVerified: true, isInfluencer: true, avatarColor: '#9C27B0' },
      { id: '3', name: 'DrugstoreMUA', handle: '@drugstoremua', platform: 'Instagram', platformIcon: '📸', followers: 234000, mentions: 6, sentiment: 'neutral', reach: 345000, isVerified: false, isInfluencer: true, avatarColor: '#2196F3' },
      { id: '4', name: 'LashLover', handle: '@lashlover', platform: 'TikTok', platformIcon: '🎵', followers: 123000, mentions: 3, sentiment: 'positive', reach: 198000, isVerified: false, isInfluencer: false, avatarColor: '#4CAF50' },
      { id: '5', name: 'BeautyBargains', handle: '@beautybargains', platform: 'YouTube', platformIcon: '▶️', followers: 67000, mentions: 5, sentiment: 'positive', reach: 89000, isVerified: false, isInfluencer: false, avatarColor: '#FF9800' },
    ],
  };

  return voicesByBrand[brand] || voicesByBrand['Revlon'];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const sentimentIcons = {
  positive: { icon: TrendingUp, color: 'text-[#0EA5E9]' },
  neutral: { icon: Minus, color: 'text-[#64748B]' },
  negative: { icon: TrendingDown, color: 'text-[#EF4444]' },
};

export function TopVoices() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const voices = useMemo(() => getTopVoices(brandName), [brandName]);
  const totalReach = useMemo(() => voices.reduce((sum, v) => sum + v.reach, 0), [voices]);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0EA5E9]" />
          <div>
            <h2 className="text-sm font-medium text-[#0F172A]">Top Voices</h2>
            <p className="text-[10px] text-[#64748B]">
              Influencers & advocates for {brandName} • {formatNumber(totalReach)} total reach
            </p>
          </div>
        </div>
        <span className="text-[10px] text-[#64748B]">Last 7 days</span>
      </div>

      {/* Voices List */}
      <div className="space-y-3">
        {voices.map((voice, index) => {
          const SentimentIcon = sentimentIcons[voice.sentiment].icon;
          const sentimentColor = sentimentIcons[voice.sentiment].color;

          return (
            <div
              key={voice.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
            >
              {/* Rank */}
              <div className="w-5 h-5 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-medium text-[#64748B]">{index + 1}</span>
              </div>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: voice.avatarColor }}
              >
                {voice.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-[#0F172A] truncate">
                    {voice.name}
                  </span>
                  {voice.isVerified && (
                    <span className="text-[#0EA5E9]">✓</span>
                  )}
                  {voice.isInfluencer && (
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                  <span>{voice.platformIcon}</span>
                  <span>{voice.handle}</span>
                  <span>•</span>
                  <span>{formatNumber(voice.followers)} followers</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[11px] font-medium text-[#0F172A]">{voice.mentions}</p>
                  <p className="text-[9px] text-[#64748B]">mentions</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium text-[#0F172A]">{formatNumber(voice.reach)}</p>
                  <p className="text-[9px] text-[#64748B]">reach</p>
                </div>
                <div className={`${sentimentColor}`}>
                  <SentimentIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Link */}
              <button className="p-1 hover:bg-[#E2E8F0] rounded transition-colors flex-shrink-0">
                <ExternalLink className="w-3 h-3 text-[#64748B]" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
        <p className="text-[10px] text-[#64748B]">
          <span className="font-medium text-[#0EA5E9]">{voices.filter(v => v.isInfluencer).length} influencers</span>
          {' '}driving {brandName} conversations
        </p>
        <button className="text-[10px] text-[#0EA5E9] hover:underline">
          View all voices →
        </button>
      </div>
    </div>
  );
}
