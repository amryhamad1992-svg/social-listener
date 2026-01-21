'use client';

import { useSettings } from '@/lib/SettingsContext';

// Brand and category structure
export const BRAND_CATEGORIES: Record<string, {
  name: string;
  categories: { id: string; name: string }[];
}> = {
  babyliss: {
    name: 'Babyliss',
    categories: [
      { id: 'all', name: 'All Products' },
      { id: 'hairdryers', name: 'Hair Dryers' },
      { id: 'straighteners', name: 'Straighteners' },
      { id: 'curlingirons', name: 'Curling Irons' },
      { id: 'hotairbrushes', name: 'Hot Air Brushes' },
    ],
  },
  revlon: {
    name: 'Revlon',
    categories: [
      { id: 'all', name: 'All Products' },
      { id: 'lipstick', name: 'Lipstick & Lips' },
      { id: 'foundation', name: 'Foundation & Face' },
      { id: 'eyemakeup', name: 'Eye Makeup' },
      { id: 'nailpolish', name: 'Nail Polish' },
    ],
  },
  weleda: {
    name: 'Weleda',
    categories: [
      { id: 'all', name: 'All Products' },
      { id: 'facecare', name: 'Face Care' },
      { id: 'bodycare', name: 'Body Care' },
      { id: 'babycare', name: 'Baby Care' },
      { id: 'haircare', name: 'Hair Care' },
    ],
  },
};

export function BrandSelector() {
  const { settings, saveSettings } = useSettings();

  const currentBrand = BRAND_CATEGORIES[settings.selectedBrand] || BRAND_CATEGORIES.revlon;
  const currentCategory = currentBrand.categories.find(c => c.id === settings.selectedCategory) || currentBrand.categories[0];

  const handleBrandChange = (brandId: string) => {
    // Reset category to 'all' when brand changes
    saveSettings({ selectedBrand: brandId, selectedCategory: 'all' });
  };

  const handleCategoryChange = (categoryId: string) => {
    saveSettings({ selectedCategory: categoryId });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Brand Selector */}
      <select
        value={settings.selectedBrand}
        onChange={(e) => handleBrandChange(e.target.value)}
        className="px-3 py-2 text-[13px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {Object.entries(BRAND_CATEGORIES).map(([id, brand]) => (
          <option key={id} value={id}>
            {brand.name}
          </option>
        ))}
      </select>

      {/* Category Selector */}
      <select
        value={settings.selectedCategory || 'all'}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="px-3 py-2 text-[13px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {currentBrand.categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
