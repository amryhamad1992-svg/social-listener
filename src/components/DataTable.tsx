'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;

    const aValue = (a as Record<string, unknown>)[sortKey];
    const bValue = (b as Record<string, unknown>)[sortKey];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue || '');
    const bStr = String(bValue || '');

    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={column.sortable ? 'cursor-pointer select-none' : ''}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr
              key={item.id}
              className={onRowClick ? 'cursor-pointer' : ''}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {column.render
                    ? column.render(item)
                    : String((item as Record<string, unknown>)[String(column.key)] || '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-muted">
          No data available
        </div>
      )}
    </div>
  );
}

// Sentiment badge component for use in tables
export function SentimentBadge({ label }: { label: string | null }) {
  const getClass = () => {
    switch (label) {
      case 'positive':
        return 'sentiment-positive';
      case 'negative':
        return 'sentiment-negative';
      default:
        return 'sentiment-neutral';
    }
  };

  return (
    <span className={getClass()}>
      {label || 'neutral'}
    </span>
  );
}

// Change indicator component
export function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-muted">-</span>;
  }

  const isPositive = value > 0;
  return (
    <span className={isPositive ? 'change-positive' : 'change-negative'}>
      {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

// External link component
export function ExternalLinkCell({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-accent hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
