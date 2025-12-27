'use client';

import { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface KeywordData {
  keyword: string;
  mentions: number;
  sentiment: number;
  engagement: number;
}

interface BrandKeywords {
  [key: string]: KeywordData[];
}

// Mock data - in production this would come from API
const BRAND_KEYWORDS: BrandKeywords = {
  Revlon: [
    { keyword: 'ColorStay', mentions: 450, sentiment: 0.65, engagement: 12000 },
    { keyword: 'Super Lustrous', mentions: 380, sentiment: 0.72, engagement: 9500 },
    { keyword: 'lipstick', mentions: 520, sentiment: 0.45, engagement: 15000 },
    { keyword: 'foundation', mentions: 290, sentiment: 0.38, engagement: 8200 },
    { keyword: 'drugstore', mentions: 180, sentiment: 0.55, engagement: 4500 },
    { keyword: 'affordable', mentions: 220, sentiment: 0.68, engagement: 5800 },
    { keyword: 'long-wear', mentions: 150, sentiment: 0.42, engagement: 3200 },
    { keyword: 'hair dryer', mentions: 340, sentiment: 0.78, engagement: 11000 },
  ],
  'e.l.f.': [
    { keyword: 'Camo', mentions: 680, sentiment: 0.82, engagement: 22000 },
    { keyword: 'Power Grip', mentions: 520, sentiment: 0.88, engagement: 18500 },
    { keyword: 'Halo Glow', mentions: 450, sentiment: 0.75, engagement: 14000 },
    { keyword: 'affordable', mentions: 390, sentiment: 0.72, engagement: 11000 },
    { keyword: 'dupe', mentions: 620, sentiment: 0.68, engagement: 25000 },
    { keyword: 'TikTok', mentions: 480, sentiment: 0.65, engagement: 19000 },
    { keyword: 'vegan', mentions: 180, sentiment: 0.58, engagement: 4200 },
    { keyword: 'primer', mentions: 340, sentiment: 0.71, engagement: 9800 },
  ],
  Maybelline: [
    { keyword: 'Lash', mentions: 520, sentiment: 0.75, engagement: 16000 },
    { keyword: 'Fit Me', mentions: 480, sentiment: 0.68, engagement: 14500 },
    { keyword: 'SuperStay', mentions: 390, sentiment: 0.62, engagement: 11000 },
    { keyword: 'mascara', mentions: 680, sentiment: 0.72, engagement: 21000 },
    { keyword: 'drugstore', mentions: 250, sentiment: 0.55, engagement: 7200 },
    { keyword: 'affordable', mentions: 320, sentiment: 0.65, engagement: 9500 },
    { keyword: 'Sky High', mentions: 410, sentiment: 0.78, engagement: 13500 },
    { keyword: 'foundation', mentions: 360, sentiment: 0.58, engagement: 10200 },
  ],
};

const BRANDS = ['Revlon', 'e.l.f.', 'Maybelline'];

// Pastel Stackline colors
const COLORS = {
  positive: '#86EFAC', // pastel green
  neutral: '#CBD5E1',  // pastel gray
  negative: '#FCA5A5', // pastel red
  positiveDark: '#166534',
  neutralDark: '#475569',
  negativeDark: '#991B1B',
};

export function BrandKeywordExplorer() {
  const [selectedBrand, setSelectedBrand] = useState('Revlon');
  const [compareBrand, setCompareBrand] = useState<string | null>(null);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.6) return COLORS.positive;
    if (sentiment >= 0.45) return COLORS.neutral;
    return COLORS.negative;
  };

  const getSentimentTextColor = (sentiment: number) => {
    if (sentiment >= 0.6) return COLORS.positiveDark;
    if (sentiment >= 0.45) return COLORS.neutralDark;
    return COLORS.negativeDark;
  };

  const primaryData = BRAND_KEYWORDS[selectedBrand] || [];
  const compareData = compareBrand ? BRAND_KEYWORDS[compareBrand] || [] : [];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: KeywordData & { brand?: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-[#E2E8F0] rounded p-2.5 shadow-lg">
          <p className="text-[12px] font-medium text-[#0F172A] mb-1">{data.keyword}</p>
          <div className="space-y-0.5 text-[10px]">
            <p className="text-[#64748B]">
              Mentions: <span className="text-[#0F172A] font-medium">{data.mentions.toLocaleString()}</span>
            </p>
            <p className="text-[#64748B]">
              Sentiment: <span className="font-medium" style={{ color: getSentimentTextColor(data.sentiment) }}>
                {data.sentiment >= 0 ? '+' : ''}{data.sentiment.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Transform data for scatter chart - position keywords in a grid
  const scatterData = primaryData.map((item, index) => ({
    ...item,
    x: (index % 4) * 100 + 50,
    y: Math.floor(index / 4) * 150 + 100,
    z: item.engagement / 500,
    brand: selectedBrand,
  }));

  const compareScatterData = compareData.map((item, index) => ({
    ...item,
    x: (index % 4) * 100 + 50,
    y: Math.floor(index / 4) * 150 + 100,
    z: item.engagement / 500,
    brand: compareBrand,
  }));

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-[#0F172A]">Brand Keyword Analysis</h2>
          <p className="text-[10px] text-[#64748B] mt-0.5">
            Bubble size = mentions · Color = sentiment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#64748B]">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
            >
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#64748B]">Compare:</span>
            <select
              value={compareBrand || ''}
              onChange={(e) => setCompareBrand(e.target.value || null)}
              className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0F172A]"
            >
              <option value="">None</option>
              {BRANDS.filter(b => b !== selectedBrand).map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.positive }} />
          <span className="text-[10px] text-[#64748B]">Positive</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.neutral }} />
          <span className="text-[10px] text-[#64748B]">Neutral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.negative }} />
          <span className="text-[10px] text-[#64748B]">Negative</span>
        </div>
        {compareBrand && (
          <div className="flex items-center gap-2 ml-auto text-[10px] text-[#64748B]">
            <span className="font-medium text-[#0F172A]">{selectedBrand}</span>
            <span>vs</span>
            <span className="font-medium text-[#0F172A]">{compareBrand}</span>
            <span>(dashed)</span>
          </div>
        )}
      </div>

      {/* Bubble Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" hide domain={[0, 400]} />
            <YAxis type="number" dataKey="y" hide domain={[0, 350]} />
            <ZAxis type="number" dataKey="z" range={[400, 2000]} />
            <Tooltip content={<CustomTooltip />} />

            {/* Primary Brand */}
            <Scatter
              data={scatterData}
              shape={(props: unknown) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: KeywordData };
                const size = Math.max(30, Math.min(Math.sqrt(payload.mentions) * 2.5, 65));
                const fillColor = getSentimentColor(payload.sentiment);
                const textColor = getSentimentTextColor(payload.sentiment);

                // Truncate keyword to fit
                const maxChars = size > 50 ? 10 : size > 40 ? 8 : 6;
                const displayText = payload.keyword.length > maxChars
                  ? payload.keyword.slice(0, maxChars - 1) + '…'
                  : payload.keyword;

                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={size}
                      fill={fillColor}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={size > 50 ? 11 : size > 40 ? 10 : 9}
                      fill={textColor}
                      fontWeight={500}
                    >
                      {displayText}
                    </text>
                  </g>
                );
              }}
            />

            {/* Compare Brand */}
            {compareBrand && (
              <Scatter
                data={compareScatterData}
                shape={(props: unknown) => {
                  const { cx, cy, payload } = props as { cx: number; cy: number; payload: KeywordData };
                  const size = Math.max(25, Math.min(Math.sqrt(payload.mentions) * 2, 55));
                  const strokeColor = getSentimentColor(payload.sentiment);

                  return (
                    <g>
                      <circle
                        cx={cx + 15}
                        cy={cy - 15}
                        r={size}
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                      />
                    </g>
                  );
                }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Keyword Pills */}
      <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
        <div className="flex flex-wrap gap-2">
          {primaryData.map((item) => (
            <div
              key={item.keyword}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#E2E8F0]"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSentimentColor(item.sentiment) }}
              />
              <span className="text-[10px] font-medium text-[#0F172A]">{item.keyword}</span>
              <span className="text-[9px] text-[#64748B]">{item.mentions}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
