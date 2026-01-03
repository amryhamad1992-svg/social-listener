'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Package } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface ProductCategory {
  name: string;
  mentions: number;
  percentage: number;
  sentiment: number;
  trending: boolean;
  color: string;
  [key: string]: string | number | boolean;
}

// Product breakdown data by brand
function getProductBreakdown(brand: string): ProductCategory[] {
  const dataByBrand: Record<string, ProductCategory[]> = {
    'Revlon': [
      { name: 'Hair Tools', mentions: 892, percentage: 35, sentiment: 0.78, trending: true, color: '#0F172A' },
      { name: 'Lipstick', mentions: 634, percentage: 25, sentiment: 0.72, trending: false, color: '#0EA5E9' },
      { name: 'Foundation', mentions: 508, percentage: 20, sentiment: 0.65, trending: false, color: '#64748B' },
      { name: 'Mascara', mentions: 305, percentage: 12, sentiment: 0.68, trending: false, color: '#94A3B8' },
      { name: 'Nail Polish', mentions: 203, percentage: 8, sentiment: 0.71, trending: false, color: '#CBD5E1' },
    ],
    'e.l.f.': [
      { name: 'Primers', mentions: 1245, percentage: 32, sentiment: 0.82, trending: true, color: '#0F172A' },
      { name: 'Concealers', mentions: 934, percentage: 24, sentiment: 0.79, trending: true, color: '#0EA5E9' },
      { name: 'Bronzers', mentions: 778, percentage: 20, sentiment: 0.85, trending: true, color: '#64748B' },
      { name: 'Lip Products', mentions: 545, percentage: 14, sentiment: 0.76, trending: false, color: '#94A3B8' },
      { name: 'Brushes', mentions: 389, percentage: 10, sentiment: 0.74, trending: false, color: '#CBD5E1' },
    ],
    'Maybelline': [
      { name: 'Mascara', mentions: 1456, percentage: 38, sentiment: 0.81, trending: true, color: '#0F172A' },
      { name: 'Foundation', mentions: 842, percentage: 22, sentiment: 0.69, trending: false, color: '#0EA5E9' },
      { name: 'Lipstick', mentions: 689, percentage: 18, sentiment: 0.75, trending: false, color: '#64748B' },
      { name: 'Concealer', mentions: 534, percentage: 14, sentiment: 0.72, trending: false, color: '#94A3B8' },
      { name: 'Brow Products', mentions: 306, percentage: 8, sentiment: 0.70, trending: false, color: '#CBD5E1' },
    ],
  };

  return dataByBrand[brand] || dataByBrand['Revlon'];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ProductCategory }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-lg">
        <p className="text-[12px] font-medium text-[#0F172A]">{data.name}</p>
        <div className="flex items-center gap-4 mt-1">
          <div>
            <p className="text-[10px] text-[#64748B]">Mentions</p>
            <p className="text-[14px] font-semibold text-[#0F172A]">{data.mentions.toLocaleString()}</p>
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

export function ProductBreakdown() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const data = useMemo(() => getProductBreakdown(brandName), [brandName]);
  const totalMentions = useMemo(() => data.reduce((sum, p) => sum + p.mentions, 0), [data]);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-[#0EA5E9]" />
        <div>
          <h2 className="text-sm font-medium text-[#0F172A]">Product Category Breakdown</h2>
          <p className="text-[10px] text-[#64748B]">
            {brandName} mentions by product type • {totalMentions.toLocaleString()} total
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="w-[120px] h-[120px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="mentions"
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

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-[11px] text-[#334155]">{category.name}</span>
                {category.trending && (
                  <span className="text-[8px] px-1.5 py-0.5 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded font-medium">
                    TRENDING
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-[#0F172A] w-8 text-right">
                  {category.percentage}%
                </span>
                <span className="text-[10px] text-[#64748B] w-16 text-right">
                  {category.mentions.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
