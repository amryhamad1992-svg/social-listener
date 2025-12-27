'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  format?: 'number' | 'percent' | 'sentiment';
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  format = 'number',
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
      return value.toLocaleString();
    }
    return value;
  };

  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-muted';
    return change > 0 ? 'text-success' : 'text-danger';
  };

  const getChangeIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="w-4 h-4" />;
    }
    return change > 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatValue()}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted ml-1">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-accent/10 rounded-lg text-accent">{icon}</div>
        )}
      </div>
    </div>
  );
}
