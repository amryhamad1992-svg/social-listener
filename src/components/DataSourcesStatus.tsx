'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'pending' | 'disconnected';
  lastSync?: string;
  count?: number;
}

export function DataSourcesStatus() {
  const [sources, setSources] = useState<DataSource[]>([
    { id: 'youtube', name: 'YouTube', icon: '▶️', status: 'pending' },
    { id: 'news', name: 'NewsAPI', icon: '📰', status: 'pending' },
    { id: 'reddit', name: 'Reddit', icon: '🔴', status: 'pending' },
  ]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkDataSources();
  }, []);

  const checkDataSources = async () => {
    setChecking(true);
    const updatedSources: DataSource[] = [];

    // Check YouTube
    try {
      const ytRes = await fetch('/api/youtube?days=7');
      const ytData = await ytRes.json();
      updatedSources.push({
        id: 'youtube',
        name: 'YouTube',
        icon: '▶️',
        status: ytData.success ? 'connected' : 'disconnected',
        lastSync: new Date().toLocaleTimeString(),
        count: ytData.data?.videos?.length || 0,
      });
    } catch {
      updatedSources.push({
        id: 'youtube',
        name: 'YouTube',
        icon: '▶️',
        status: 'disconnected',
      });
    }

    // Check News
    try {
      const newsRes = await fetch('/api/news?days=7');
      const newsData = await newsRes.json();
      updatedSources.push({
        id: 'news',
        name: 'NewsAPI',
        icon: '📰',
        status: newsData.success ? 'connected' : 'disconnected',
        lastSync: new Date().toLocaleTimeString(),
        count: newsData.data?.length || 0,
      });
    } catch {
      updatedSources.push({
        id: 'news',
        name: 'NewsAPI',
        icon: '📰',
        status: 'disconnected',
      });
    }

    // Reddit - pending approval
    updatedSources.push({
      id: 'reddit',
      name: 'Reddit',
      icon: '🔴',
      status: 'pending',
    });

    setSources(updatedSources);
    setChecking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-[#22C55E]" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-[#F59E0B]" />;
      default:
        return <XCircle className="w-4 h-4 text-[#EF4444]" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending';
      default:
        return 'Disconnected';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-[#DCFCE7] text-[#166534]';
      case 'pending':
        return 'bg-[#FEF3C7] text-[#92400E]';
      default:
        return 'bg-[#FEE2E2] text-[#991B1B]';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-medium text-[#1E293B]">Data Sources</h3>
        <button
          onClick={checkDataSources}
          disabled={checking}
          className="p-1.5 hover:bg-[#F1F5F9] rounded transition-colors disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${checking ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{source.icon}</span>
              <span className="text-[12px] font-medium text-[#1E293B]">{source.name}</span>
            </div>

            <div className="flex items-center gap-2">
              {source.count !== undefined && source.status === 'connected' && (
                <span className="text-[10px] text-[#64748B]">
                  {source.count} items
                </span>
              )}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(source.status)}`}>
                {getStatusIcon(source.status)}
                <span>{getStatusText(source.status)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sources.some(s => s.lastSync) && (
        <p className="text-[10px] text-[#94A3B8] mt-2 text-right">
          Last checked: {sources.find(s => s.lastSync)?.lastSync}
        </p>
      )}
    </div>
  );
}
