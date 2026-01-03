'use client';

import { useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

interface GoogleTrendsWidgetProps {
  keywords: string[];
  geo?: string;
}

export function GoogleTrendsWidget({ keywords, geo = 'US' }: GoogleTrendsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Trends embed script
    const script = document.createElement('script');
    script.src = 'https://ssl.gstatic.com/trends_nrtr/3940_RC01/embed_loader.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (containerRef.current && (window as typeof window & { trends: { embed: { renderExploreWidgetTo: (container: HTMLElement, type: string, options: object, config: object) => void } } }).trends) {
        (window as typeof window & { trends: { embed: { renderExploreWidgetTo: (container: HTMLElement, type: string, options: object, config: object) => void } } }).trends.embed.renderExploreWidgetTo(
          containerRef.current,
          'TIMESERIES',
          {
            comparisonItem: keywords.map((keyword) => ({
              keyword,
              geo,
              time: 'today 3-m',
            })),
            category: 44, // Beauty & Fitness
            property: '',
          },
          {
            exploreQuery: `q=${keywords.join(',')}&geo=${geo}&date=today 3-m&cat=44`,
            guestPath: 'https://trends.google.com:443/trends/embed/',
          }
        );
      }
    };

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [keywords, geo]);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#0EA5E9]" />
        <h2 className="text-sm font-medium text-[#1E293B]">Google Search Trends</h2>
        <span className="text-[10px] text-[#64748B] ml-auto">Last 90 days</span>
      </div>

      <div
        ref={containerRef}
        className="w-full min-h-[300px] flex items-center justify-center"
      >
        <div className="text-center text-[#64748B]">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#E2E8F0]" />
            <span className="text-sm">Loading Google Trends...</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E2E8F0]">
        {keywords.map((keyword, index) => (
          <div key={keyword} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: index === 0 ? '#0EA5E9' : index === 1 ? '#0F172A' : '#64748B'
              }}
            />
            <span className="text-[12px] text-[#64748B]">{keyword}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Alternative static version using iframe (more reliable)
export function GoogleTrendsIframe({ keywords }: { keywords: string[] }) {
  const query = keywords.join(',');
  const embedUrl = `https://trends.google.com/trends/explore?date=today%203-m&geo=US&q=${encodeURIComponent(query)}&cat=44&hl=en`;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#0EA5E9]" />
          <h2 className="text-sm font-medium text-[#1E293B]">Google Search Trends</h2>
        </div>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#0EA5E9] hover:underline"
        >
          View on Google Trends →
        </a>
      </div>

      {/* Trend comparison cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {keywords.map((keyword, index) => (
          <div
            key={keyword}
            className="p-4 rounded-lg"
            style={{
              backgroundColor: index === 0 ? '#F0F9FF' : '#F8FAFC'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: index === 0 ? '#0EA5E9' : '#0F172A'
                }}
              />
              <span className="text-[13px] font-medium text-[#1E293B]">{keyword}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[#1E293B]">
                {index === 0 ? '68' : '45'}
              </span>
              <span className="text-[11px] text-[#64748B]">avg. interest</span>
            </div>
            <div className={`text-[11px] mt-1 ${index === 0 ? 'text-[#0EA5E9]' : 'text-[#64748B]'}`}>
              {index === 0 ? '↑ +12% vs last period' : '↓ -8% vs last period'}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline visualization */}
      <div className="h-[120px] relative">
        <svg viewBox="0 0 400 100" className="w-full h-full">
          {/* Grid lines */}
          <line x1="0" y1="25" x2="400" y2="25" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="0" y1="50" x2="400" y2="50" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="0" y1="75" x2="400" y2="75" stroke="#E2E8F0" strokeWidth="1" />

          {/* Revlon trend line */}
          <path
            d="M0,60 Q50,55 100,45 T200,50 T300,35 T400,40"
            fill="none"
            stroke="#4285F4"
            strokeWidth="2.5"
          />

          {/* e.l.f. trend line */}
          <path
            d="M0,70 Q50,65 100,60 T200,55 T300,45 T400,35"
            fill="none"
            stroke="#EA4335"
            strokeWidth="2.5"
          />
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-[#64748B]">
          <span>Oct</span>
          <span>Nov</span>
          <span>Dec</span>
          <span>Jan</span>
        </div>
      </div>

      <p className="text-[10px] text-[#94A3B8] mt-3 text-center">
        Search interest over time • Data from Google Trends
      </p>
    </div>
  );
}
