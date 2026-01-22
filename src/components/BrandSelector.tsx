'use client';

import { useSettings } from '@/lib/SettingsContext';

// Brand, category, and product structure
export const BRAND_DATA: Record<string, {
  name: string;
  categories: {
    id: string;
    name: string;
    products: string[];
  }[];
}> = {
  babyliss: {
    name: 'Babyliss',
    categories: [
      { id: 'all', name: 'All Products', products: [] },
      { id: 'hairdryers', name: 'Hair Dryers', products: ['Pro Ceramic Hair Dryer', 'Hydro Fusion Hair Dryer', 'Turbo Smooth Hair Dryer', '3Q Hair Dryer', 'Elegance Hair Dryer'] },
      { id: 'straighteners', name: 'Straighteners', products: ['Pro 235 Elegance', 'Smooth Finish 230', 'ST255E Titanium', 'Steam Luxe', '9000 Cordless'] },
      { id: 'curlingirons', name: 'Curling Irons', products: ['Pro 180 Curling Iron', 'Curl Secret', 'Easy Curl', 'Titanium Expression', 'Soft Waves'] },
      { id: 'hotairbrushes', name: 'Hot Air Brushes', products: ['Big Hair Rotating Brush', 'Air Style 1000', 'Hydro Fusion Hot Air Styler', 'Volume & Curl Hot Air Brush'] },
    ],
  },
  revlon: {
    name: 'Revlon',
    categories: [
      { id: 'all', name: 'All Products', products: [] },
      { id: 'lipstick', name: 'Lipstick & Lips', products: ['Super Lustrous Lipstick', 'ColorStay Satin Ink', 'Ultra HD Matte Lip Color', 'Kiss Cushion Lip Tint', 'ColorStay Lip Liner'] },
      { id: 'foundation', name: 'Foundation & Face', products: ['ColorStay Foundation', 'PhotoReady Candid', 'Age Defying Foundation', 'ColorStay Pressed Powder', 'PhotoReady Primer'] },
      { id: 'eyemakeup', name: 'Eye Makeup', products: ['ColorStay Eyeshadow Quad', 'So Fierce Mascara', 'ColorStay Eyeliner', 'PhotoReady Eye Art', 'Volumazing Mascara'] },
      { id: 'nailpolish', name: 'Nail Polish', products: ['Ultra HD Snap', 'ColorStay Gel Envy', 'Super Lustrous Nail Enamel', 'Quick Dry Top Coat'] },
    ],
  },
  weleda: {
    name: 'Weleda',
    categories: [
      { id: 'all', name: 'All Products', products: [] },
      { id: 'facecare', name: 'Face Care', products: ['Skin Food', 'Skin Food Light', 'Almond Soothing Facial Cream', 'Pomegranate Firming Face Serum', 'Wild Rose Smoothing Facial Lotion', 'Iris Hydrating Facial Lotion'] },
      { id: 'bodycare', name: 'Body Care', products: ['Skin Food Body Butter', 'Citrus Refreshing Body Lotion', 'Sea Buckthorn Body Oil', 'Birch Cellulite Oil', 'Arnica Massage Oil', 'Lavender Relaxing Body Oil'] },
      { id: 'babycare', name: 'Baby Care', products: ['Calendula Baby Cream', 'Calendula Diaper Care', 'Calendula Baby Oil', 'Calendula Baby Shampoo', 'White Mallow Face Cream'] },
      { id: 'haircare', name: 'Hair Care', products: ['Rosemary Conditioning Hair Oil', 'Oat Replenishing Shampoo', 'Oat Replenishing Conditioner', 'Millet Nourishing Shampoo'] },
    ],
  },
};

// Keep backward compatible export
export const BRAND_CATEGORIES = Object.fromEntries(
  Object.entries(BRAND_DATA).map(([id, data]) => [
    id,
    { name: data.name, categories: data.categories.map(c => ({ id: c.id, name: c.name })) }
  ])
);

export function BrandSelector() {
  const { settings, saveSettings } = useSettings();

  const currentBrand = BRAND_DATA[settings.selectedBrand] || BRAND_DATA.revlon;
  const currentCategory = currentBrand.categories.find(c => c.id === settings.selectedCategory) || currentBrand.categories[0];
  const products = currentCategory.products || [];

  const handleBrandChange = (brandId: string) => {
    // Reset category and product when brand changes
    saveSettings({ selectedBrand: brandId, selectedCategory: 'all', selectedProduct: '' });
  };

  const handleCategoryChange = (categoryId: string) => {
    // Reset product when category changes
    saveSettings({ selectedCategory: categoryId, selectedProduct: '' });
  };

  const handleProductChange = (product: string) => {
    saveSettings({ selectedProduct: product });
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
        {Object.entries(BRAND_DATA).map(([id, brand]) => (
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

      {/* Product Selector - only show when category has products */}
      {products.length > 0 && (
        <select
          value={settings.selectedProduct || ''}
          onChange={(e) => handleProductChange(e.target.value)}
          className="px-3 py-2 text-[13px] text-[#1E293B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer font-medium"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          <option value="">All {currentCategory.name}</option>
          {products.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
