'use client';

// Stackline Official Colors
const COLORS = {
  carbonIndigo: '#031425',
  productCharts: '#adbdcc',
  slate: '#4E596A',
  moonbeam: '#E0E2E4',
  success: '#71c184',
  danger: '#ff534a',
  teal: '#16949b',
};

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
  showDonut?: boolean;
  donutPercent?: number;
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
          stroke={COLORS.productCharts}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Current period line (dark navy) */}
      <polyline
        points={getPoints(data)}
        fill="none"
        stroke={COLORS.carbonIndigo}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Stackline-style donut chart (as seen in their Key Metrics cards)
function DonutChart({ percent, size = 100 }: { percent: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.moonbeam}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.carbonIndigo}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-medium" style={{ color: COLORS.carbonIndigo }}>
          {percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export function KPICard({
  title,
  value,
  change,
  format = 'number',
  sparklineData,
  priorSparklineData,
  showDonut,
  donutPercent,
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
    if (change === undefined || change === 0) return `text-[${COLORS.slate}]`;
    return change > 0 ? `text-[${COLORS.success}]` : `text-[${COLORS.danger}]`;
  };

  // Donut chart variant (like Stackline's Key Metrics)
  if (showDonut && donutPercent !== undefined) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Title */}
        <h3 className="text-base font-medium mb-4" style={{ color: COLORS.carbonIndigo }}>
          {title}
        </h3>

        {/* Donut chart centered */}
        <div className="flex justify-center mb-4">
          <DonutChart percent={donutPercent} size={120} />
        </div>

        {/* Label and value below */}
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: COLORS.slate }}>
            {title.toUpperCase()}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-medium" style={{ color: COLORS.carbonIndigo }}>
              {formatValue()}
            </span>
            {change !== undefined && (
              <span className={`text-[12px] font-medium ${getChangeColor()}`}>
                {formatChange()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Label - Stackline style uppercase */}
      <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: COLORS.slate }}>
        {title}
      </p>

      {/* Value and Change - inline like Stackline */}
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-medium leading-none tracking-tight" style={{ color: COLORS.carbonIndigo }}>
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
