'use client';

import { useSettings } from '@/lib/SettingsContext';

const BRANDS = [
  { id: 'revlon', name: 'Revlon', emoji: '💄' },
  { id: 'elf', name: 'e.l.f.', emoji: '✨' },
  { id: 'maybelline', name: 'Maybelline', emoji: '💋' },
  { id: 'weleda', name: 'Weleda', emoji: '🌿' },
];

export function BrandSelector() {
  const { settings, saveSettings } = useSettings();

  const currentBrand = BRANDS.find(b => b.id === settings.selectedBrand) || BRANDS[0];

  const handleBrandChange = (brandId: string) => {
    saveSettings({ selectedBrand: brandId });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg">
      <span className="text-sm">{currentBrand.emoji}</span>
      <select
        value={settings.selectedBrand}
        onChange={(e) => handleBrandChange(e.target.value)}
        className="text-[13px] text-[#1E293B] bg-transparent border-none focus:outline-none cursor-pointer font-medium"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {BRANDS.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
    </div>
  );
}
