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

// Purchase intent signals by brand and time period
function getPurchaseIntentSignals(brand: string, days: number): IntentSignal[] {
  // Base signals for each brand (recent - last 7 days)
  const recentSignals: Record<string, IntentSignal[]> = {
    'Revlon': [
      { id: '1', text: 'Just ordered the Revlon One-Step Hair Dryer after seeing so many reviews. Can\'t wait!', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'One-Step Hair Dryer', timestamp: '2 hours ago', url: '#' },
      { id: '2', text: 'Has anyone tried the new ColorStay foundation? Thinking of buying it for my wedding...', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'ColorStay Foundation', timestamp: '4 hours ago', url: '#' },
      { id: '3', text: 'Adding the Super Lustrous lipstick to my cart rn, that shade is gorgeous', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Super Lustrous Lipstick', timestamp: '5 hours ago', url: '#' },
      { id: '4', text: 'Where can I buy the Revlon hair dryer brush? Is Target or Ulta cheaper?', source: 'Reddit', sourceIcon: '💬', intentType: 'research', product: 'Hair Dryer Brush', timestamp: '6 hours ago', url: '#' },
      { id: '5', text: 'Picked up 3 Revlon lipsticks during the Ulta sale, so excited to try them!', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Lipsticks', timestamp: '1 day ago', url: '#' },
    ],
    'e.l.f.': [
      { id: '1', text: 'Just bought the Power Grip Primer - everyone says it\'s a Charlotte Tilbury dupe!', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'Power Grip Primer', timestamp: '1 hour ago', url: '#' },
      { id: '2', text: 'The Halo Glow is sold out AGAIN. Does anyone know when Ulta restocks?', source: 'Reddit', sourceIcon: '💬', intentType: 'research', product: 'Halo Glow', timestamp: '2 hours ago', url: '#' },
      { id: '3', text: 'Ordering the bronzing drops tonight, this video convinced me 100%', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Bronzing Drops', timestamp: '3 hours ago', url: '#' },
      { id: '4', text: 'Should I get the Camo Concealer or the Hydrating one? Help me decide before I checkout', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'Camo Concealer', timestamp: '4 hours ago', url: '#' },
      { id: '5', text: 'Just did a massive e.l.f. haul at Target - got the primer, lip oils, and the new blush', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Multiple Products', timestamp: '1 day ago', url: '#' },
    ],
    'Maybelline': [
      { id: '1', text: 'Buying the Sky High mascara today, my friend swears by it', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'Sky High Mascara', timestamp: '1 hour ago', url: '#' },
      { id: '2', text: 'Is the Vinyl Ink worth it? Thinking of getting the nude shade', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'Vinyl Ink', timestamp: '3 hours ago', url: '#' },
      { id: '3', text: 'Just grabbed the Fit Me foundation from CVS, hope it matches!', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Fit Me Foundation', timestamp: '4 hours ago', url: '#' },
      { id: '4', text: 'Where\'s the best price for the Instant Age Rewind concealer?', source: 'Reddit', sourceIcon: '💬', intentType: 'research', product: 'Age Rewind Concealer', timestamp: '6 hours ago', url: '#' },
      { id: '5', text: 'Adding Lash Sensational to cart after this review, looks amazing', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Lash Sensational', timestamp: '1 day ago', url: '#' },
    ],
  };

  // Additional signals for longer time periods
  const olderSignals: Record<string, IntentSignal[]> = {
    'Revlon': [
      { id: '6', text: 'Finally tried the One-Step and WOW my hair has never looked this good!', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'One-Step Hair Dryer', timestamp: '5 days ago', url: '#' },
      { id: '7', text: 'Best drugstore foundation? Thinking ColorStay or Maybelline Fit Me', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'ColorStay Foundation', timestamp: '1 week ago', url: '#' },
      { id: '8', text: 'Bought the PhotoReady primer and it\'s actually really good for the price', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'PhotoReady Primer', timestamp: '2 weeks ago', url: '#' },
      { id: '9', text: 'Stocking up on Super Lustrous lipsticks during the BOGO sale!', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'Super Lustrous Lipstick', timestamp: '3 weeks ago', url: '#' },
      { id: '10', text: 'Does Revlon still make good nail polish? Looking for fall colors', source: 'Reddit', sourceIcon: '💬', intentType: 'research', product: 'Nail Polish', timestamp: '1 month ago', url: '#' },
      { id: '11', text: 'Got the Revlon hair tools set as a gift and I\'m obsessed', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Hair Tools Set', timestamp: '2 months ago', url: '#' },
      { id: '12', text: 'Anyone know if ColorStay works for oily skin? Considering trying it', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'ColorStay Foundation', timestamp: '2 months ago', url: '#' },
    ],
    'e.l.f.': [
      { id: '6', text: 'The lip oils are so good I bought all the colors!', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'Lip Oils', timestamp: '5 days ago', url: '#' },
      { id: '7', text: 'Is the e.l.f. putty blush worth it? Seeing it everywhere on TikTok', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'Putty Blush', timestamp: '1 week ago', url: '#' },
      { id: '8', text: 'Did a full face of e.l.f. and I\'m converted - everything was under $50!', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Full Face', timestamp: '2 weeks ago', url: '#' },
      { id: '9', text: 'Restocked on Power Grip Primer - this is my 5th bottle!', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'Power Grip Primer', timestamp: '3 weeks ago', url: '#' },
      { id: '10', text: 'Best e.l.f. products for beginners? Building my first makeup kit', source: 'Reddit', sourceIcon: '💬', intentType: 'research', product: 'Starter Kit', timestamp: '1 month ago', url: '#' },
      { id: '11', text: 'The Halo Glow is better than Charlotte Tilbury - bought 3 backups', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Halo Glow', timestamp: '2 months ago', url: '#' },
      { id: '12', text: 'Thinking of trying the new e.l.f. skincare line, anyone tried it?', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'Skincare Line', timestamp: '2 months ago', url: '#' },
    ],
    'Maybelline': [
      { id: '6', text: 'Bought 3 shades of Vinyl Ink - best lip product ever!', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'Vinyl Ink', timestamp: '5 days ago', url: '#' },
      { id: '7', text: 'SuperStay vs Vinyl Ink? Which should I try first?', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'Lip Products', timestamp: '1 week ago', url: '#' },
      { id: '8', text: 'Got the Lifter Gloss in every shade, they\'re so pretty!', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Lifter Gloss', timestamp: '2 weeks ago', url: '#' },
      { id: '9', text: 'Restocked my holy grail Age Rewind concealer', source: 'Reddit', sourceIcon: '💬', intentType: 'purchase', product: 'Age Rewind Concealer', timestamp: '3 weeks ago', url: '#' },
      { id: '10', text: 'What\'s the best Maybelline mascara besides Sky High?', source: 'Reddit', sourceIcon: '💬', intentType: 'research', product: 'Mascara', timestamp: '1 month ago', url: '#' },
      { id: '11', text: 'Did a full Maybelline haul at Ulta during 21 Days of Beauty!', source: 'YouTube', sourceIcon: '▶️', intentType: 'purchase', product: 'Multiple Products', timestamp: '2 months ago', url: '#' },
      { id: '12', text: 'Considering the Tattoo Studio brow gel, is it worth it?', source: 'Reddit', sourceIcon: '💬', intentType: 'consideration', product: 'Brow Gel', timestamp: '2 months ago', url: '#' },
    ],
  };

  const baseSignals = recentSignals[brand] || recentSignals['Revlon'];
  const extraSignals = olderSignals[brand] || olderSignals['Revlon'];

  // Return more signals for longer time periods
  if (days <= 7) {
    return baseSignals;
  } else if (days <= 14) {
    return [...baseSignals, ...extraSignals.slice(0, 2)];
  } else if (days <= 30) {
    return [...baseSignals, ...extraSignals.slice(0, 5)];
  } else {
    return [...baseSignals, ...extraSignals];
  }
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

  const signals = useMemo(() => getPurchaseIntentSignals(brandName, days), [brandName, days]);

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
              Sample buying signals for {brandName}
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
                {signal.url && signal.url !== '#' ? (
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0EA5E9] hover:text-[#0284C7] transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span
                    className="text-[9px] text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-0.5 rounded flex-shrink-0"
                    title="Sample data"
                  >
                    Demo
                  </span>
                )}
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
