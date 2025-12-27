'use client';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  format?: 'number' | 'percent' | 'sentiment';
  subtitle?: string;
}

export function KPICard({
  title,
  value,
  change,
  icon,
  format = 'number',
  subtitle,
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
      // Format large numbers with K/M suffix
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const formatChange = () => {
    if (change === undefined) return null;
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-muted';
    return change > 0 ? 'text-success' : 'text-danger';
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <span className="text-muted">{icon}</span>
        )}
      </div>

      {/* Value and Change */}
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-medium text-foreground leading-none">
          {formatValue()}
        </span>
        {change !== undefined && (
          <span className={`text-xs font-medium ${getChangeColor()}`}>
            {formatChange()}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
