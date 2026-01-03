'use client';

import { useState, useEffect } from 'react';

interface Source {
  id: string;
  name: string;
  status: 'connected' | 'pending' | 'disconnected';
}

export function SourceStatusBar() {
  const [sources, setSources] = useState<Source[]>([
    { id: 'youtube', name: 'YouTube', status: 'pending' },
    { id: 'news', name: 'News', status: 'pending' },
    { id: 'web', name: 'Web', status: 'pending' },
  ]);

  useEffect(() => {
    checkSources();
  }, []);

  const checkSources = async () => {
    const updated: Source[] = [];

    // Check YouTube
    try {
      const res = await fetch('/api/youtube?days=7');
      const data = await res.json();
      updated.push({
        id: 'youtube',
        name: 'YouTube',
        status: data.success ? 'connected' : 'disconnected',
      });
    } catch {
      updated.push({ id: 'youtube', name: 'YouTube', status: 'disconnected' });
    }

    // Check News
    try {
      const res = await fetch('/api/news?days=7');
      const data = await res.json();
      updated.push({
        id: 'news',
        name: 'News',
        status: data.success ? 'connected' : 'disconnected',
      });
    } catch {
      updated.push({ id: 'news', name: 'News', status: 'disconnected' });
    }

    // Check Web Scrapers (Reddit, MakeupAlley, Blogs)
    try {
      const res = await fetch('/api/scrape');
      const data = await res.json();
      updated.push({
        id: 'web',
        name: 'Web',
        status: data.success ? 'connected' : 'disconnected',
      });
    } catch {
      updated.push({ id: 'web', name: 'Web', status: 'disconnected' });
    }

    setSources(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-[#0EA5E9]';
      case 'pending': return 'bg-[#94A3B8]';
      default: return 'bg-[#64748B]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'pending': return 'Pending';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center gap-6 text-[12px]">
      <span className="text-[#64748B] font-medium">Sources:</span>
      {sources.map((source, index) => (
        <div key={source.id} className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(source.status)}`} />
            <span className="text-[#1E293B] font-medium">{source.name}</span>
            <span className="text-[#94A3B8]">•</span>
            <span className="text-[#64748B]">{getStatusText(source.status)}</span>
          </div>
          {index < sources.length - 1 && (
            <div className="w-px h-3 bg-[#E2E8F0]" />
          )}
        </div>
      ))}
    </div>
  );
}
