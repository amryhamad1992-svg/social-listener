'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AppSettings {
  selectedBrand: string;
  defaultDays: number;
  dataSources: {
    youtube: boolean;
    news: boolean;
    reddit: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  selectedBrand: 'revlon',
  defaultDays: 7,
  dataSources: {
    youtube: true,
    news: true,
    reddit: false,
  },
};

const STORAGE_KEY = 'social-listener-settings';

interface SettingsContextType {
  settings: AppSettings;
  isLoaded: boolean;
  saveSettings: (newSettings: Partial<AppSettings>) => void;
  getBrandName: () => string;
  getBrandKeywords: () => string[];
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
      return updated;
    });
  }, []);

  // Get brand display name
  const getBrandName = useCallback(() => {
    const brandMap: Record<string, string> = {
      'revlon': 'Revlon',
      'elf': 'e.l.f.',
      'maybelline': 'Maybelline',
    };
    return brandMap[settings.selectedBrand] || 'Revlon';
  }, [settings.selectedBrand]);

  // Get brand search keywords
  const getBrandKeywords = useCallback(() => {
    const keywordMap: Record<string, string[]> = {
      'revlon': ['revlon', 'revlon lipstick', 'revlon foundation', 'revlon makeup', 'colorstay', 'super lustrous'],
      'elf': ['e.l.f.', 'elf cosmetics', 'elf makeup', 'elf beauty', 'e.l.f. cosmetics'],
      'maybelline': ['maybelline', 'maybelline new york', 'maybelline lipstick', 'maybelline mascara', 'lash sensational', 'fit me'],
    };
    return keywordMap[settings.selectedBrand] || keywordMap['revlon'];
  }, [settings.selectedBrand]);

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, saveSettings, getBrandName, getBrandKeywords }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
