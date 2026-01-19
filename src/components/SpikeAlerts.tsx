'use client';

import { useState, useMemo, useEffect } from 'react';
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

interface SpikeAlertsData {
  kpis: {
    totalMentions: number;
    mentionsChange: number;
    avgSentiment: number;
    sentimentChange: number;
    trendingTopicsCount: number;
    topSource: string;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    highEngagementCount?: number;
  };
  sentimentTrend: Array<{
    date: string;
    sentiment: number;
    mentions: number;
  }>;
  bySource?: Record<string, number>;
  recentMentions?: Array<{
    title: string;
    source: string;
    sentiment: string | null;
    score: number;
    url?: string | null;
  }>;
}

// Generate alerts from real data
function generateAlertsFromData(data: SpikeAlertsData | undefined, brand: string): Alert[] {
  if (!data) {
    return [];
  }

  const { kpis, sentimentTrend, bySource, recentMentions } = data;
  const alerts: Alert[] = [];
  let alertId = 1;

  // 1. Check for mention spike (day-over-day)
  if (sentimentTrend.length >= 2) {
    const today = sentimentTrend[sentimentTrend.length - 1];
    const yesterday = sentimentTrend[sentimentTrend.length - 2];

    if (yesterday.mentions > 0) {
      const dayChange = ((today.mentions - yesterday.mentions) / yesterday.mentions) * 100;

      if (dayChange > 50) {
        alerts.push({
          id: String(alertId++),
          type: 'spike',
          severity: dayChange > 100 ? 'high' : 'medium',
          title: 'Mention Spike Detected',
          description: `${brand} mentions increased significantly today vs yesterday`,
          metric: 'Mentions',
          change: `+${Math.round(dayChange)}%`,
          timestamp: 'Today',
          source: kpis.topSource || 'Multiple',
          dismissed: false,
        });
      }
    }
  }

  // 2. Check for sentiment shift
  if (kpis.sentimentChange !== 0) {
    const sentimentChangePercent = Math.round(kpis.sentimentChange * 100);

    if (Math.abs(sentimentChangePercent) > 10) {
      const isPositive = sentimentChangePercent > 0;
      alerts.push({
        id: String(alertId++),
        type: 'sentiment_shift',
        severity: Math.abs(sentimentChangePercent) > 20 ? 'high' : 'medium',
        title: isPositive ? 'Positive Sentiment Surge' : 'Sentiment Decline Detected',
        description: isPositive
          ? `${brand} sentiment has improved significantly`
          : `${brand} sentiment has declined - review recent mentions`,
        metric: 'Sentiment',
        change: `${sentimentChangePercent > 0 ? '+' : ''}${sentimentChangePercent}%`,
        timestamp: 'Recent',
        source: kpis.topSource || 'Multiple',
        dismissed: false,
      });
    }
  }

  // 3. Check for high negative sentiment
  const negativePercent = kpis.totalMentions > 0
    ? Math.round((kpis.negativeCount / kpis.totalMentions) * 100)
    : 0;

  if (negativePercent > 30) {
    alerts.push({
      id: String(alertId++),
      type: 'crisis',
      severity: negativePercent > 50 ? 'high' : 'medium',
      title: 'High Negative Sentiment',
      description: `${negativePercent}% of ${brand} mentions are negative - review and respond`,
      metric: 'Negative Mentions',
      change: `${negativePercent}%`,
      timestamp: 'Active',
      source: 'All Sources',
      dismissed: false,
    });
  }

  // 4. Check for high engagement content
  if (kpis.highEngagementCount && kpis.highEngagementCount > 0) {
    alerts.push({
      id: String(alertId++),
      type: 'trending',
      severity: kpis.highEngagementCount > 5 ? 'high' : 'low',
      title: 'High Engagement Content',
      description: `${kpis.highEngagementCount} ${brand} mention${kpis.highEngagementCount > 1 ? 's' : ''} with unusually high engagement`,
      metric: 'Engagement',
      change: 'High',
      timestamp: 'Recent',
      source: kpis.topSource || 'Multiple',
      dismissed: false,
    });
  }

  // 5. Check for trending topics
  if (kpis.trendingTopicsCount > 2) {
    alerts.push({
      id: String(alertId++),
      type: 'trending',
      severity: 'low',
      title: 'Multiple Trending Topics',
      description: `${kpis.trendingTopicsCount} trending topics detected for ${brand}`,
      metric: 'Topics',
      change: `${kpis.trendingTopicsCount}`,
      timestamp: 'Active',
      source: 'All Sources',
      dismissed: false,
    });
  }

  return alerts;
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

interface SpikeAlertsProps {
  days?: number;
  data?: SpikeAlertsData;
}

export function SpikeAlerts({ days = 7, data }: SpikeAlertsProps) {
  const { getBrandName } = useSettings();
  const brandName = getBrandName();

  // Generate alerts from data
  const generatedAlerts = useMemo(() => {
    return generateAlertsFromData(data, brandName);
  }, [data, brandName]);

  const [alerts, setAlerts] = useState<Alert[]>(generatedAlerts);

  // Update alerts when data changes
  useEffect(() => {
    setAlerts(generatedAlerts);
  }, [generatedAlerts]);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const highPriorityCount = activeAlerts.filter(a => a.severity === 'high').length;

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]" style={{ fontFamily: 'Roboto, sans-serif' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#1E293B]" />
          <h2 className="text-sm font-medium text-[#1E293B]">Spike Alerts</h2>
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
    <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E2E8F0]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AlertTriangle className="w-4 h-4 text-[#1E293B]" />
            {highPriorityCount > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-medium text-[#1E293B]">Spike Alerts</h2>
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
