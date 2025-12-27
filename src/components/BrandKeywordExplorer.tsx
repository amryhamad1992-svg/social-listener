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
  Cell,
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
    { keyword: 'long-wearing', mentions: 150, sentiment: 0.42, engagement: 3200 },
    { keyword: 'hair dryer', mentions: 340, sentiment: 0.78, engagement: 11000 },
  ],
  'e.l.f.': [
    { keyword: 'Camo Concealer', mentions: 680, sentiment: 0.82, engagement: 22000 },
    { keyword: 'Power Grip', mentions: 520, sentiment: 0.88, engagement: 18500 },
    { keyword: 'Halo Glow', mentions: 450, sentiment: 0.75, engagement: 14000 },
    { keyword: 'affordable', mentions: 390, sentiment: 0.72, engagement: 11000 },
    { keyword: 'dupe', mentions: 620, sentiment: 0.68, engagement: 25000 },
    { keyword: 'TikTok', mentions: 480, sentiment: 0.65, engagement: 19000 },
    { keyword: 'vegan', mentions: 180, sentiment: 0.58, engagement: 4200 },
    { keyword: 'primer', mentions: 340, sentiment: 0.71, engagement: 9800 },
  ],
  Maybelline: [
    { keyword: 'Lash Sensational', mentions: 520, sentiment: 0.75, engagement: 16000 },
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

export function BrandKeywordExplorer() {
  const [selectedBrand, setSelectedBrand] = useState('Revlon');
  const [compareBrand, setCompareBrand] = useState<string | null>(null);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.65) return '#22C55E'; // Green - positive
    if (sentiment >= 0.45) return '#64748B'; // Gray - neutral
    return '#EF4444'; // Red - negative
  };

  const primaryData = BRAND_KEYWORDS[selectedBrand] || [];
  const compareData = compareBrand ? BRAND_KEYWORDS[compareBrand] || [] : [];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: KeywordData & { brand?: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-lg">
          <p className="text-[13px] font-medium text-[#1E293B] mb-1">
            {data.brand ? `${data.brand}: ` : ''}{data.keyword}
          </p>
          <div className="space-y-1 text-[11px]">
            <p className="text-[#64748B]">
              Mentions: <span className="text-[#1E293B] font-medium">{data.mentions.toLocaleString()}</span>
            </p>
            <p className="text-[#64748B]">
              Sentiment: <span className={`font-medium ${data.sentiment >= 0.65 ? 'text-[#22C55E]' : data.sentiment >= 0.45 ? 'text-[#64748B]' : 'text-[#EF4444]'}`}>
                {data.sentiment >= 0 ? '+' : ''}{data.sentiment.toFixed(2)}
              </span>
            </p>
            <p className="text-[#64748B]">
              Engagement: <span className="text-[#1E293B] font-medium">{data.engagement.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Transform data for scatter chart
  const scatterData = primaryData.map((item, index) => ({
    ...item,
    x: index * 50 + 25,
    y: item.mentions,
    z: item.engagement / 500,
    brand: selectedBrand,
  }));

  const compareScatterData = compareData.map((item, index) => ({
    ...item,
    x: index * 50 + 25,
    y: item.mentions,
    z: item.engagement / 500,
    brand: compareBrand,
  }));

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-[#1E293B]">Brand Keyword Analysis</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Bubble size = engagement · Color = sentiment
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Primary Brand Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#64748B]">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2 py-1 text-[12px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0EA5E9]"
            >
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Compare Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#64748B]">Compare:</span>
            <select
              value={compareBrand || ''}
              onChange={(e) => setCompareBrand(e.target.value || null)}
              className="px-2 py-1 text-[12px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0EA5E9]"
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
            <span className="text-[11px] text-[#64748B]">Positive (≥0.65)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#64748B]" />
            <span className="text-[11px] text-[#64748B]">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="text-[11px] text-[#64748B]">Negative (&lt;0.45)</span>
          </div>
        </div>
        {compareBrand && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-[#1E293B]" />
              <span className="text-[11px] text-[#64748B]">{selectedBrand}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-[#64748B]" />
              <span className="text-[11px] text-[#64748B]">{compareBrand}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bubble Chart */}
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
            <XAxis
              type="number"
              dataKey="x"
              tick={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Mentions"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              label={{ value: 'Mentions', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="z" range={[100, 800]} />
            <Tooltip content={<CustomTooltip />} />

            {/* Primary Brand */}
            <Scatter
              data={scatterData}
              shape={(props: unknown) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: KeywordData };
                const size = Math.sqrt(payload.engagement) / 8;
                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={Math.max(15, Math.min(size, 50))}
                      fill={getSentimentColor(payload.sentiment)}
                      fillOpacity={0.7}
                      stroke={getSentimentColor(payload.sentiment)}
                      strokeWidth={2}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fill="#fff"
                      fontWeight={500}
                    >
                      {payload.keyword.length > 10 ? payload.keyword.slice(0, 8) + '...' : payload.keyword}
                    </text>
                  </g>
                );
              }}
            >
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSentimentColor(entry.sentiment)} />
              ))}
            </Scatter>

            {/* Compare Brand */}
            {compareBrand && (
              <Scatter
                data={compareScatterData}
                shape={(props: unknown) => {
                  const { cx, cy, payload } = props as { cx: number; cy: number; payload: KeywordData };
                  const size = Math.sqrt(payload.engagement) / 8;
                  return (
                    <g>
                      <circle
                        cx={cx + 10}
                        cy={cy - 10}
                        r={Math.max(12, Math.min(size * 0.8, 40))}
                        fill="transparent"
                        stroke={getSentimentColor(payload.sentiment)}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        opacity={0.8}
                      />
                    </g>
                  );
                }}
              >
                {compareScatterData.map((entry, index) => (
                  <Cell key={`compare-cell-${index}`} fill={getSentimentColor(entry.sentiment)} />
                ))}
              </Scatter>
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Keyword Pills */}
      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
        <div className="flex flex-wrap gap-2">
          {primaryData.slice(0, 8).map((item) => (
            <div
              key={item.keyword}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] rounded-full"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSentimentColor(item.sentiment) }}
              />
              <span className="text-[11px] font-medium text-[#1E293B]">{item.keyword}</span>
              <span className="text-[10px] text-[#64748B]">{item.mentions}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
