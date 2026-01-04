'use client';

import { useMemo } from 'react';
import { ShoppingCart, ExternalLink, TrendingUp, Clock } from 'lucide-react';
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

// Purchase intent signals by brand
function getPurchaseIntentSignals(brand: string): IntentSignal[] {
  const signalsByBrand: Record<string, IntentSignal[]> = {
    'Revlon': [
      {
        id: '1',
        text: 'Just ordered the Revlon One-Step Hair Dryer after seeing so many reviews. Can\'t wait!',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'purchase',
        product: 'One-Step Hair Dryer',
        timestamp: '2 hours ago',
        url: '#',
      },
      {
        id: '2',
        text: 'Has anyone tried the new ColorStay foundation? Thinking of buying it for my wedding...',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'consideration',
        product: 'ColorStay Foundation',
        timestamp: '4 hours ago',
        url: '#',
      },
      {
        id: '3',
        text: 'Adding the Super Lustrous lipstick to my cart rn, that shade is gorgeous',
        source: 'YouTube',
        sourceIcon: '▶️',
        intentType: 'purchase',
        product: 'Super Lustrous Lipstick',
        timestamp: '5 hours ago',
        url: '#',
      },
      {
        id: '4',
        text: 'Where can I buy the Revlon hair dryer brush? Is Target or Ulta cheaper?',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'research',
        product: 'Hair Dryer Brush',
        timestamp: '6 hours ago',
        url: '#',
      },
      {
        id: '5',
        text: 'Picked up 3 Revlon lipsticks during the Ulta sale, so excited to try them!',
        source: 'YouTube',
        sourceIcon: '▶️',
        intentType: 'purchase',
        product: 'Lipsticks',
        timestamp: '8 hours ago',
        url: '#',
      },
    ],
    'e.l.f.': [
      {
        id: '1',
        text: 'Just bought the Power Grip Primer - everyone says it\'s a Charlotte Tilbury dupe!',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'purchase',
        product: 'Power Grip Primer',
        timestamp: '1 hour ago',
        url: '#',
      },
      {
        id: '2',
        text: 'The Halo Glow is sold out AGAIN. Does anyone know when Ulta restocks?',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'research',
        product: 'Halo Glow',
        timestamp: '2 hours ago',
        url: '#',
      },
      {
        id: '3',
        text: 'Ordering the bronzing drops tonight, this video convinced me 100%',
        source: 'YouTube',
        sourceIcon: '▶️',
        intentType: 'purchase',
        product: 'Bronzing Drops',
        timestamp: '3 hours ago',
        url: '#',
      },
      {
        id: '4',
        text: 'Should I get the Camo Concealer or the Hydrating one? Help me decide before I checkout',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'consideration',
        product: 'Camo Concealer',
        timestamp: '4 hours ago',
        url: '#',
      },
      {
        id: '5',
        text: 'Just did a massive e.l.f. haul at Target - got the primer, lip oils, and the new blush',
        source: 'YouTube',
        sourceIcon: '▶️',
        intentType: 'purchase',
        product: 'Multiple Products',
        timestamp: '5 hours ago',
        url: '#',
      },
    ],
    'Maybelline': [
      {
        id: '1',
        text: 'Buying the Sky High mascara today, my friend swears by it',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'purchase',
        product: 'Sky High Mascara',
        timestamp: '1 hour ago',
        url: '#',
      },
      {
        id: '2',
        text: 'Is the Vinyl Ink worth it? Thinking of getting the nude shade',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'consideration',
        product: 'Vinyl Ink',
        timestamp: '3 hours ago',
        url: '#',
      },
      {
        id: '3',
        text: 'Just grabbed the Fit Me foundation from CVS, hope it matches!',
        source: 'YouTube',
        sourceIcon: '▶️',
        intentType: 'purchase',
        product: 'Fit Me Foundation',
        timestamp: '4 hours ago',
        url: '#',
      },
      {
        id: '4',
        text: 'Where\'s the best price for the Instant Age Rewind concealer?',
        source: 'Reddit',
        sourceIcon: '💬',
        intentType: 'research',
        product: 'Age Rewind Concealer',
        timestamp: '6 hours ago',
        url: '#',
      },
      {
        id: '5',
        text: 'Adding Lash Sensational to cart after this review, looks amazing',
        source: 'YouTube',
        sourceIcon: '▶️',
        intentType: 'purchase',
        product: 'Lash Sensational',
        timestamp: '7 hours ago',
        url: '#',
      },
    ],
  };

  return signalsByBrand[brand] || signalsByBrand['Revlon'];
}

const intentStyles: Record<string, { bg: string; text: string; label: string }> = {
  purchase: { bg: 'bg-[#0EA5E9]/10', text: 'text-[#0EA5E9]', label: 'PURCHASE' },
  consideration: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', label: 'CONSIDERING' },
  research: { bg: 'bg-[#64748B]/10', text: 'text-[#64748B]', label: 'RESEARCHING' },
};

interface PurchaseIntentSignalsProps {
  days?: number;
}

export function PurchaseIntentSignals({ days = 7 }: PurchaseIntentSignalsProps) {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  const signals = useMemo(() => getPurchaseIntentSignals(brandName), [brandName]);

  const intentCounts = useMemo(() => {
    return signals.reduce((acc, s) => {
      acc[s.intentType] = (acc[s.intentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [signals]);

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
        <div className="flex items-center gap-2">
          {Object.entries(intentCounts).map(([type, count]) => (
            <div
              key={type}
              className={`px-2 py-1 rounded ${intentStyles[type].bg}`}
            >
              <span className={`text-[10px] font-medium ${intentStyles[type].text}`}>
                {count} {intentStyles[type].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        {signals.map((signal) => {
          const style = intentStyles[signal.intentType];
          return (
            <div
              key={signal.id}
              className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm">{signal.sourceIcon}</span>
                    <span className="text-[10px] font-medium text-[#64748B]">{signal.source}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-[9px] text-[#94A3B8] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {signal.timestamp}
                    </span>
                  </div>

                  {/* Text */}
                  <p className="text-[12px] text-[#334155] leading-relaxed">
                    "{signal.text}"
                  </p>

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
                  className="text-[#0EA5E9] hover:text-[#0284C7] transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
        <p className="text-[10px] text-[#64748B] flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#0EA5E9]" />
          <span className="font-medium text-[#0EA5E9]">{intentCounts.purchase || 0} confirmed purchases</span>
          <span>detected in last {days} days</span>
        </p>
        <button className="text-[10px] text-[#0EA5E9] hover:underline">
          View all signals →
        </button>
      </div>
    </div>
  );
}
