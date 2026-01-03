'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSettings } from '@/lib/useSettings';

interface BrandData {
  name: string;
  value: number;
  change: number;
  color: string;
  sentiment: number;
  [key: string]: string | number;
}

// Generate share of voice data based on time period
function getShareOfVoiceData(days: number): BrandData[] {
  const dataByPeriod: Record<number, BrandData[]> = {
    7: [
      { name: 'Revlon', value: 38, change: -2, color: '#0F172A', sentiment: 0.68 },
      { name: 'e.l.f.', value: 42, change: 8, color: '#0EA5E9', sentiment: 0.78 },
      { name: 'Maybelline', value: 20, change: -6, color: '#64748B', sentiment: 0.65 },
    ],
    14: [
      { name: 'Revlon', value: 40, change: 2, color: '#0F172A', sentiment: 0.66 },
      { name: 'e.l.f.', value: 38, change: 5, color: '#0EA5E9', sentiment: 0.75 },
      { name: 'Maybelline', value: 22, change: -7, color: '#64748B', sentiment: 0.64 },
    ],
    30: [
      { name: 'Revlon', value: 42, change: 3, color: '#0F172A', sentiment: 0.65 },
      { name: 'e.l.f.', value: 35, change: 8, color: '#0EA5E9', sentiment: 0.74 },
      { name: 'Maybelline', value: 23, change: -11, color: '#64748B', sentiment: 0.62 },
    ],
    90: [
      { name: 'Revlon', value: 40, change: -5, color: '#0F172A', sentiment: 0.64 },
      { name: 'e.l.f.', value: 35, change: 12, color: '#0EA5E9', sentiment: 0.72 },
      { name: 'Maybelline', value: 25, change: -7, color: '#64748B', sentiment: 0.63 },
    ],
  };

  return dataByPeriod[days] || dataByPeriod[90];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BrandData }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-lg">
        <p className="text-[12px] font-medium text-[#0F172A]">{data.name}</p>
        <div className="flex items-center gap-4 mt-1">
          <div>
            <p className="text-[10px] text-[#64748B]">Share</p>
            <p className="text-[14px] font-semibold text-[#0F172A]">{data.value}%</p>
          </div>
          <div>
            <p className="text-[10px] text-[#64748B]">Sentiment</p>
            <p className="text-[14px] font-semibold text-[#0F172A]">{data.sentiment.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ShareOfVoice() {
  const { settings, getBrandName } = useSettings();
  const [days, setDays] = useState(7);

  const data = useMemo(() => getShareOfVoiceData(days), [days]);

  // Find selected brand data
  const selectedBrandData = data.find(
    d => d.name.toLowerCase() === getBrandName().toLowerCase() ||
         (d.name === 'e.l.f.' && settings.selectedBrand === 'elf')
  ) || data[0];

  // Calculate total mentions (simulated)
  const totalMentions = useMemo(() => {
    const base = days === 7 ? 1250 : days === 14 ? 2400 : days === 30 ? 4800 : 12500;
    return base + Math.floor(Math.random() * 200);
  }, [days]);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-[#0F172A]">Share of Voice</h2>
          <p className="text-[10px] text-[#64748B] mt-0.5">
            Brand mention distribution • {totalMentions.toLocaleString()} total mentions
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-2 py-1 text-[11px] border border-[#E2E8F0] rounded bg-white focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="w-[140px] h-[140px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Stats */}
        <div className="flex-1 space-y-3">
          {data.map((brand) => {
            const isSelected = brand.name.toLowerCase() === getBrandName().toLowerCase() ||
                               (brand.name === 'e.l.f.' && settings.selectedBrand === 'elf');
            return (
              <div
                key={brand.name}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isSelected ? 'bg-[#F8FAFC] border border-[#E2E8F0]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: brand.color }}
                  />
                  <span className={`text-[12px] ${isSelected ? 'font-medium text-[#0F172A]' : 'text-[#64748B]'}`}>
                    {brand.name}
                  </span>
                  {isSelected && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded">
                      Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-[#0F172A] w-10 text-right">
                    {brand.value}%
                  </span>
                  <div className={`flex items-center gap-0.5 text-[10px] w-12 justify-end ${
                    brand.change > 0 ? 'text-[#0EA5E9]' : brand.change < 0 ? 'text-[#64748B]' : 'text-[#94A3B8]'
                  }`}>
                    {brand.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : brand.change < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    <span>{brand.change > 0 ? '+' : ''}{brand.change}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Brand Highlight */}
      <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedBrandData.color }}
            />
            <span className="text-[11px] text-[#64748B]">
              {getBrandName()} leads in
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-[#64748B]">Sentiment</p>
              <p className="text-[13px] font-semibold text-[#0F172A]">
                {selectedBrandData.sentiment.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[#64748B]">Est. Reach</p>
              <p className="text-[13px] font-semibold text-[#0F172A]">
                {((totalMentions * selectedBrandData.value / 100) * 125).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
