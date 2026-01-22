'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AppSettings {
  selectedBrand: string;
  selectedCategory: string;
  selectedProduct: string;
  defaultDays: number;
  dataSources: {
    youtube: boolean;
    news: boolean;
    reddit: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  selectedBrand: 'revlon',
  selectedCategory: 'all',
  selectedProduct: '',
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
  getDisplayName: () => string;
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
      'babyliss': 'Babyliss',
      'revlon': 'Revlon',
      'weleda': 'Weleda',
    };
    return brandMap[settings.selectedBrand] || 'Revlon';
  }, [settings.selectedBrand]);

  // Get full display name (brand + product if selected)
  const getDisplayName = useCallback(() => {
    const brandMap: Record<string, string> = {
      'babyliss': 'Babyliss',
      'revlon': 'Revlon',
      'weleda': 'Weleda',
    };
    const brandName = brandMap[settings.selectedBrand] || 'Revlon';
    if (settings.selectedProduct) {
      return `${brandName} ${settings.selectedProduct}`;
    }
    return brandName;
  }, [settings.selectedBrand, settings.selectedProduct]);

  // Get brand search keywords (includes category-specific keywords)
  const getBrandKeywords = useCallback(() => {
    const category = settings.selectedCategory || 'all';

    // Brand + Category specific keywords
    const keywordMap: Record<string, Record<string, string[]>> = {
      'babyliss': {
        'all': ['babyliss', 'babyliss pro', 'babyliss hair'],
        'hairdryers': ['babyliss hair dryer', 'babyliss blow dryer', 'babyliss pro dryer'],
        'straighteners': ['babyliss straightener', 'babyliss flat iron', 'babyliss steam straightener'],
        'curlingirons': ['babyliss curling iron', 'babyliss curler', 'babyliss curl'],
        'hotairbrushes': ['babyliss hot air brush', 'babyliss air styler', 'babyliss rotating brush'],
      },
      'revlon': {
        'all': ['revlon', 'revlon makeup', 'revlon cosmetics'],
        'lipstick': ['revlon lipstick', 'revlon super lustrous', 'revlon lip color', 'revlon lip'],
        'foundation': ['revlon foundation', 'revlon colorstay', 'revlon face makeup', 'revlon concealer'],
        'eyemakeup': ['revlon mascara', 'revlon eyeshadow', 'revlon eyeliner', 'revlon eye makeup'],
        'nailpolish': ['revlon nail polish', 'revlon nail color', 'revlon nails'],
      },
      'weleda': {
        'all': ['weleda', 'weleda skincare', 'weleda natural'],
        'facecare': ['weleda skin food', 'weleda face cream', 'weleda facial oil', 'weleda face'],
        'bodycare': ['weleda body oil', 'weleda body lotion', 'weleda body butter', 'weleda body'],
        'babycare': ['weleda baby', 'weleda calendula baby', 'weleda baby oil', 'weleda diaper cream'],
        'haircare': ['weleda rosemary', 'weleda hair oil', 'weleda hair tonic', 'weleda shampoo'],
      },
    };

    const brandKeywords = keywordMap[settings.selectedBrand] || keywordMap['revlon'];
    return brandKeywords[category] || brandKeywords['all'];
  }, [settings.selectedBrand, settings.selectedCategory]);

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, saveSettings, getBrandName, getDisplayName, getBrandKeywords }}>
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
