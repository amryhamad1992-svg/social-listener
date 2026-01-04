'use client';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  format?: 'number' | 'percent' | 'sentiment';
  subtitle?: string;
  benchmark?: string;
  sparklineData?: number[];
  priorSparklineData?: number[];
}

// Stackline-style sparkline component
function Sparkline({
  data,
  priorData,
  height = 40
}: {
  data: number[];
  priorData?: number[];
  height?: number;
}) {
  if (!data || data.length === 0) return null;

  const width = 120;
  const allData = priorData ? [...data, ...priorData] : data;
  const max = Math.max(...allData);
  const min = Math.min(...allData);
  const range = max - min || 1;

  const getPoints = (values: number[]) => {
    return values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <svg width={width} height={height} className="mt-3">
      {/* Prior period line (light gray) */}
      {priorData && (
        <polyline
          points={getPoints(priorData)}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Current period line (dark navy) */}
      <polyline
        points={getPoints(data)}
        fill="none"
        stroke="#1E293B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KPICard({
  title,
  value,
  change,
  format = 'number',
  sparklineData,
  priorSparklineData,
}: KPICardProps) {
  const formatValue = () => {
    if (format === 'percent') {
      return `${value}%`;
    }
    if (format === 'sentiment') {
      const num = typeof value === 'number' ? value : parseFloat(value as string);
      if (num > 0) return `+${num.toFixed(2)}`;
      return num.toFixed(2);
    }
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const formatChange = () => {
    if (change === undefined) return null;
    const symbol = change >= 0 ? '▲' : '▼';
    return `${symbol} ${Math.abs(change).toFixed(1)}%`;
  };

  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-[#64748B]';
    return change > 0 ? 'text-[#10B981]' : 'text-[#EF4444]';
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Label - Stackline style uppercase */}
      <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-2">
        {title}
      </p>

      {/* Value and Change - inline like Stackline */}
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-medium text-[#1E293B] leading-none tracking-tight">
          {formatValue()}
        </span>
        {change !== undefined && (
          <span className={`text-[12px] font-medium ${getChangeColor()}`}>
            {formatChange()}
          </span>
        )}
      </div>

      {/* Sparkline - Stackline style */}
      {sparklineData && (
        <Sparkline data={sparklineData} priorData={priorSparklineData} />
      )}
    </div>
  );
}
