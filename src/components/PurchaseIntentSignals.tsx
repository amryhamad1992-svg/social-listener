'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, ExternalLink, TrendingUp, Clock, Loader2, WifiOff } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface IntentSignal {
  id: string;
  text: string;
  source: string;
  sourceIcon: string;
  intentType: 'purchase' | 'consideration' | 'research';
  product: string;
  timestamp: string;
  url: string;
}

const intentStyles: Record<string, { bg: string; text: string; label: string }> = {
  purchase: { bg: 'bg-[#0EA5E9]/10', text: 'text-[#0EA5E9]', label: 'PURCHASE' },
  consideration: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', label: 'CONSIDERING' },
  research: { bg: 'bg-[#64748B]/10', text: 'text-[#64748B]', label: 'RESEARCHING' },
};

// Source styling - Stackline professional palette
const SOURCE_STYLING: Record<string, { color: string; icon: string; gradient: string }> = {
  YouTube: { color: '#FF0000', icon: 'YT', gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)' },
  TikTok: { color: '#00F2EA', icon: 'TT', gradient: 'linear-gradient(135deg, #00F2EA 0%, #FF0050 100%)' },
  News: { color: '#0EA5E9', icon: 'NW', gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' },
  Reddit: { color: '#FF4500', icon: 'RD', gradient: 'linear-gradient(135deg, #FF4500 0%, #FF5722 100%)' },
};

interface PurchaseIntentSignalsProps {
  days?: number;
}

export function PurchaseIntentSignals({ days = 7 }: PurchaseIntentSignalsProps) {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const [signals, setSignals] = useState<IntentSignal[]>([]);
  const [intentCounts, setIntentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        brand: brandName,
        days: days.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/purchase-intent?${params}`);
      const data = await response.json();

      if (data.success) {
        setSignals(data.signals || []);
        setIntentCounts(data.intentCounts || {});
      } else {
        setError(data.error || 'Failed to fetch signals');
      }
    } catch (err) {
      console.error('Error fetching purchase intent:', err);
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [brandName, days]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#1E293B]" />
          <div>
            <h2 className="text-sm font-medium text-[#1E293B]">Purchase Intent Signals</h2>
            <p className="text-[10px] text-[#64748B]">
              Real-time buying signals for {brandName}
            </p>
          </div>
        </div>
        {!loading && signals.length > 0 && (
          <div className="flex items-center gap-2">
            {Object.entries(intentCounts).map(([type, count]) => (
              count > 0 && (
                <div
                  key={type}
                  className={`px-2 py-1 rounded ${intentStyles[type]?.bg || 'bg-gray-100'}`}
                >
                  <span className={`text-[10px] font-medium ${intentStyles[type]?.text || 'text-gray-600'}`}>
                    {count} {intentStyles[type]?.label || type.toUpperCase()}
                  </span>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#0EA5E9]" />
          <span className="ml-2 text-sm text-[#64748B]">Scanning for purchase intent...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-center justify-center py-8 text-[#64748B]">
          <WifiOff className="w-4 h-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && signals.length === 0 && (
        <div className="text-center py-8 text-[#64748B]">
          <p className="text-sm">No purchase intent signals detected</p>
          <p className="text-xs mt-1">Try expanding the date range</p>
        </div>
      )}

      {/* Signals List */}
      {!loading && signals.length > 0 && (
        <div className="space-y-3">
          {signals.map((signal) => {
            const style = intentStyles[signal.intentType];
            const sourceStyle = SOURCE_STYLING[signal.source] || { color: '#64748B', icon: 'SR', gradient: 'linear-gradient(135deg, #64748B 0%, #475569 100%)' };
            return (
              <div
                key={signal.id}
                className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                        style={{ background: sourceStyle.gradient }}
                      >
                        {sourceStyle.icon}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: sourceStyle.color }}>
                        {signal.source}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="text-[9px] text-[#94A3B8] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {signal.timestamp}
                      </span>
                    </div>

                    {/* Text - clickable */}
                    <a
                      href={signal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-[#334155] leading-relaxed hover:text-[#0EA5E9] hover:underline transition-colors block"
                    >
                      "{signal.text}"
                    </a>

                    {/* Product Tag */}
                    <div className="mt-2">
                      <span className="text-[10px] px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded">
                        {signal.product}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0EA5E9] hover:text-[#0284C7] transition-colors flex-shrink-0"
                    title="View source"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && signals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
          <p className="text-[10px] text-[#64748B] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#0EA5E9]" />
            <span className="font-medium text-[#0EA5E9]">{intentCounts.purchase || 0} purchase signals</span>
            <span>detected in last {days} days</span>
          </p>
        </div>
      )}
    </div>
  );
}
