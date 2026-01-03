'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Database,
  Bell,
  User,
  Check,
  Youtube,
  Newspaper,
  MessageCircle
} from 'lucide-react';
import { useSettings } from '@/lib/useSettings';

interface SettingsSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string;
}

function SettingsCard({ title, description, icon, children, badge }: SettingsSection) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9]">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[#1E293B]">{title}</h2>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 bg-[#94A3B8]/20 text-[#64748B] rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#64748B] mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, isLoaded, saveSettings, getBrandName } = useSettings();
  const [selectedBrand, setSelectedBrand] = useState('revlon');
  const [defaultDays, setDefaultDays] = useState(7);
  const [dataSources, setDataSources] = useState({
    youtube: true,
    news: true,
    reddit: false,
  });
  const [saved, setSaved] = useState(false);

  // Load settings from hook when available
  useEffect(() => {
    if (isLoaded) {
      setSelectedBrand(settings.selectedBrand);
      setDefaultDays(settings.defaultDays);
      setDataSources(settings.dataSources);
    }
  }, [isLoaded, settings]);

  const brands = [
    { id: 'revlon', name: 'Revlon', emoji: '💄' },
    { id: 'elf', name: 'e.l.f. Cosmetics', emoji: '✨' },
    { id: 'maybelline', name: 'Maybelline', emoji: '💋' },
  ];

  const handleSave = () => {
    saveSettings({
      selectedBrand,
      defaultDays,
      dataSources,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
  };

  const handleDaysChange = (days: number) => {
    setDefaultDays(days);
  };

  const toggleDataSource = (source: keyof typeof dataSources) => {
    setDataSources(prev => ({ ...prev, [source]: !prev[source] }));
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">Settings</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Configure your monitoring preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            saved
              ? 'bg-[#0EA5E9] text-white'
              : 'bg-[#0EA5E9] text-white hover:bg-[#0284C7]'
          }`}
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Saved
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Brand Selection */}
      <SettingsCard
        title="Brand Selection"
        description="Choose which brand to monitor across all data sources"
        icon={<Building2 className="w-5 h-5" />}
      >
        <div className="grid grid-cols-3 gap-3">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleBrandChange(brand.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedBrand === brand.id
                  ? 'border-[#0EA5E9] bg-[#0EA5E9]/5'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="text-2xl mb-2">{brand.emoji}</div>
              <div className="text-[13px] font-medium text-[#1E293B]">
                {brand.name}
              </div>
              {selectedBrand === brand.id && (
                <div className="mt-2">
                  <span className="text-[10px] px-2 py-0.5 bg-[#0EA5E9] text-white rounded-full">
                    Active
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Default Date Range */}
      <SettingsCard
        title="Default Date Range"
        description="Set the default time period for dashboard analytics"
        icon={<Calendar className="w-5 h-5" />}
      >
        <div className="flex gap-3">
          {[
            { value: 7, label: '7 Days' },
            { value: 14, label: '14 Days' },
            { value: 30, label: '30 Days' },
            { value: 90, label: '90 Days' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleDaysChange(option.value)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                defaultDays === option.value
                  ? 'bg-[#0EA5E9] text-white'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Data Sources */}
      <SettingsCard
        title="Data Sources"
        description="Enable or disable data collection from each platform"
        icon={<Database className="w-5 h-5" />}
      >
        <div className="space-y-3">
          {[
            {
              key: 'youtube' as const,
              name: 'YouTube',
              icon: <Youtube className="w-5 h-5" />,
              description: 'Video mentions and comments',
            },
            {
              key: 'news' as const,
              name: 'News Articles',
              icon: <Newspaper className="w-5 h-5" />,
              description: 'Press coverage and articles',
            },
            {
              key: 'reddit' as const,
              name: 'Reddit',
              icon: <MessageCircle className="w-5 h-5" />,
              description: 'Community discussions',
              comingSoon: true
            },
          ].map((source) => (
            <div
              key={source.key}
              className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <div className="text-[#0EA5E9]">{source.icon}</div>
                <div>
                  <div className="text-[13px] font-medium text-[#1E293B] flex items-center gap-2">
                    {source.name}
                    {source.comingSoon && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#94A3B8]/20 text-[#64748B] rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#64748B]">
                    {source.description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleDataSource(source.key)}
                disabled={source.comingSoon}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  source.comingSoon
                    ? 'bg-[#E2E8F0] cursor-not-allowed'
                    : dataSources[source.key]
                    ? 'bg-[#0EA5E9]'
                    : 'bg-[#CBD5E1]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    dataSources[source.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Notifications - Coming Soon */}
      <SettingsCard
        title="Notifications"
        description="Configure alerts and report delivery preferences"
        icon={<Bell className="w-5 h-5" />}
        badge="Coming Soon"
      >
        <div className="space-y-3 opacity-50 pointer-events-none">
          {[
            {
              key: 'trending',
              name: 'Trending Alerts',
              description: 'Get notified when topics spike in mentions'
            },
            {
              key: 'sentiment',
              name: 'Sentiment Changes',
              description: 'Alert when sentiment shifts significantly'
            },
            {
              key: 'weekly',
              name: 'Weekly Digest',
              description: 'Summary report every Monday'
            },
          ].map((notif) => (
            <div
              key={notif.key}
              className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0]"
            >
              <div>
                <div className="text-[13px] font-medium text-[#1E293B]">
                  {notif.name}
                </div>
                <div className="text-[12px] text-[#64748B]">
                  {notif.description}
                </div>
              </div>
              <div className="relative w-11 h-6 rounded-full bg-[#E2E8F0]">
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Account Info */}
      <SettingsCard
        title="Account"
        description="Your account information and session details"
        icon={<User className="w-5 h-5" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">Email</span>
            <span className="text-[13px] font-medium text-[#1E293B]">
              demo@stackline.com
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">Organization</span>
            <span className="text-[13px] font-medium text-[#1E293B]">
              Stackline
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">Selected Brand</span>
            <span className="text-[13px] font-medium text-[#1E293B]">
              {getBrandName()}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[13px] text-[#64748B]">Role</span>
            <span className="text-[13px] font-medium text-[#1E293B]">
              Admin
            </span>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
