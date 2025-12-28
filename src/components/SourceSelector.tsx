'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  enabled: boolean;
  comingSoon?: boolean;
  icon?: string;
}

interface SourceSelectorProps {
  onSourceChange?: (sources: string[]) => void;
}

export function SourceSelector({ onSourceChange }: SourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sources, setSources] = useState<Source[]>([
    { id: 'youtube', name: 'YouTube', enabled: true, icon: '▶️' },
    { id: 'news', name: 'News', enabled: true, icon: '📰' },
    { id: 'reddit', name: 'Reddit', enabled: true, icon: '🔴' },
    { id: 'makeupalley', name: 'MakeupAlley', enabled: true, icon: '💄' },
    { id: 'temptalia', name: 'Temptalia', enabled: true, icon: '💋' },
    { id: 'intothegloss', name: 'Into The Gloss', enabled: true, icon: '✨' },
    { id: 'allure', name: 'Allure', enabled: true, icon: '📖' },
  ]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSource = (id: string) => {
    const source = sources.find(s => s.id === id);
    if (source?.comingSoon) return;

    const updated = sources.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setSources(updated);

    const enabledSources = updated.filter(s => s.enabled).map(s => s.id);
    onSourceChange?.(enabledSources);
  };

  const enabledCount = sources.filter(s => s.enabled).length;
  const enabledNames = sources.filter(s => s.enabled).map(s => s.name);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <span className="text-sm font-medium text-foreground">
          {enabledCount === 0
            ? 'Select Sources'
            : enabledCount === 1
              ? enabledNames[0]
              : `${enabledCount} sources selected`
          }
        </span>
        <ChevronDown className={`w-4 h-4 text-muted ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-border rounded-lg shadow-lg z-50">
          <div className="p-2">
            <p className="text-xs text-muted px-3 py-2 border-b border-border mb-2">
              Data Sources
            </p>
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                disabled={source.comingSoon}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  source.comingSoon
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  source.enabled
                    ? 'bg-accent border-accent'
                    : 'border-gray-300'
                }`}>
                  {source.enabled && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-lg">{source.icon}</span>
                <span className="text-sm font-medium text-foreground flex-1 text-left">
                  {source.name}
                </span>
                {source.comingSoon && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-muted rounded-full">
                    Coming Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
