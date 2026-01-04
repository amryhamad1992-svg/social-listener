'use client';

import { useState } from 'react';
import { AlertTriangle, TrendingUp, X, ExternalLink, Clock, Zap } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface Alert {
  id: string;
  type: 'spike' | 'sentiment_shift' | 'trending' | 'crisis';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric: string;
  change: string;
  timestamp: string;
  source: string;
  dismissed: boolean;
}

// Generate alerts based on brand
function getAlerts(brand: string): Alert[] {
  const alertsByBrand: Record<string, Alert[]> = {
    'Revlon': [
      {
        id: '1',
        type: 'spike',
        severity: 'high',
        title: 'Mention Spike Detected',
        description: 'Viral TikTok video featuring One-Step Hair Dryer driving massive engagement',
        metric: 'Mentions',
        change: '+340%',
        timestamp: '2 hours ago',
        source: 'TikTok',
        dismissed: false,
      },
      {
        id: '2',
        type: 'sentiment_shift',
        severity: 'medium',
        title: 'Positive Sentiment Surge',
        description: 'ColorStay Foundation trending in "drugstore dupes" conversations',
        metric: 'Sentiment',
        change: '+12%',
        timestamp: '5 hours ago',
        source: 'Reddit',
        dismissed: false,
      },
      {
        id: '3',
        type: 'trending',
        severity: 'low',
        title: 'New Trending Topic',
        description: '"Revlon lip liner" appearing in top beauty searches',
        metric: 'Search Volume',
        change: '+85%',
        timestamp: '1 day ago',
        source: 'Google Trends',
        dismissed: false,
      },
    ],
    'e.l.f.': [
      {
        id: '1',
        type: 'spike',
        severity: 'high',
        title: 'Viral Moment Detected',
        description: 'Halo Glow featured in viral "Get Ready With Me" with 2.3M views',
        metric: 'Mentions',
        change: '+520%',
        timestamp: '1 hour ago',
        source: 'TikTok',
        dismissed: false,
      },
      {
        id: '2',
        type: 'trending',
        severity: 'high',
        title: 'Dupe Alert Trending',
        description: 'Power Grip Primer compared to Charlotte Tilbury in 50+ posts',
        metric: 'Comparisons',
        change: '+280%',
        timestamp: '3 hours ago',
        source: 'YouTube',
        dismissed: false,
      },
      {
        id: '3',
        type: 'sentiment_shift',
        severity: 'medium',
        title: 'Stock Concerns Rising',
        description: 'Increase in "out of stock" complaints for Bronzing Drops',
        metric: 'Negative Mentions',
        change: '+45%',
        timestamp: '6 hours ago',
        source: 'Twitter',
        dismissed: false,
      },
    ],
    'Maybelline': [
      {
        id: '1',
        type: 'spike',
        severity: 'medium',
        title: 'Influencer Mention',
        description: 'Major beauty YouTuber (1.2M subs) featured Sky High Mascara',
        metric: 'Reach',
        change: '+180%',
        timestamp: '4 hours ago',
        source: 'YouTube',
        dismissed: false,
      },
      {
        id: '2',
        type: 'sentiment_shift',
        severity: 'low',
        title: 'Sentiment Improving',
        description: 'Fit Me foundation shade range discussions turning positive',
        metric: 'Sentiment',
        change: '+8%',
        timestamp: '1 day ago',
        source: 'Reddit',
        dismissed: false,
      },
      {
        id: '3',
        type: 'trending',
        severity: 'medium',
        title: 'Competitor Comparison',
        description: 'Vinyl Ink vs e.l.f. Lip Oil comparison trending',
        metric: 'Mentions',
        change: '+95%',
        timestamp: '8 hours ago',
        source: 'TikTok',
        dismissed: false,
      },
    ],
  };

  return alertsByBrand[brand] || alertsByBrand['Revlon'];
}

const severityStyles = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
};

const typeIcons = {
  spike: TrendingUp,
  sentiment_shift: Zap,
  trending: TrendingUp,
  crisis: AlertTriangle,
};

export function SpikeAlerts() {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();
  const [alerts, setAlerts] = useState(() => getAlerts(brandName));

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const highPriorityCount = activeAlerts.filter(a => a.severity === 'high').length;

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#0EA5E9]" />
          <h2 className="text-sm font-medium text-[#0F172A]">Spike Alerts</h2>
        </div>
        <div className="text-center py-8 text-[#64748B]">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active alerts</p>
          <p className="text-xs mt-1">All clear for {brandName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AlertTriangle className="w-4 h-4 text-[#0EA5E9]" />
            {highPriorityCount > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-medium text-[#0F172A]">Spike Alerts</h2>
            <p className="text-[10px] text-[#64748B]">
              {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''} for {brandName}
            </p>
          </div>
        </div>
        {highPriorityCount > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-medium rounded-full">
            {highPriorityCount} High Priority
          </span>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {activeAlerts.map((alert) => {
          const styles = severityStyles[alert.severity];
          const Icon = typeIcons[alert.type];

          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${styles.bg} ${styles.border} relative`}
            >
              {/* Dismiss Button */}
              <button
                onClick={() => dismissAlert(alert.id)}
                className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded transition-colors"
              >
                <X className="w-3 h-3 text-[#64748B]" />
              </button>

              {/* Alert Content */}
              <div className="flex items-start gap-3 pr-6">
                <div className={`p-1.5 rounded ${styles.icon} bg-white`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-medium text-[#0F172A]">
                      {alert.title}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${styles.badge}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#334155] mb-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#0EA5E9]" />
                      <span className="font-medium text-[#0EA5E9]">{alert.change}</span>
                      <span>{alert.metric}</span>
                    </span>
                    <span>•</span>
                    <span>{alert.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-2 pt-2 border-t border-white/50 flex justify-end">
                <button className="flex items-center gap-1 text-[10px] text-[#0EA5E9] hover:underline">
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
