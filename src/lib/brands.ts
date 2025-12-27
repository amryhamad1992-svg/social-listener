// Brand configuration for Social Listener

export interface Brand {
  id: string;
  name: string;
  displayName: string;
  color: string;
  keywords: string[];
  youtubeKeywords: string[];
  newsKeywords: string[];
}

export const BRANDS: Brand[] = [
  {
    id: 'revlon',
    name: 'Revlon',
    displayName: 'Revlon',
    color: '#E11D48', // Revlon red
    keywords: [
      'revlon',
      'revlon cosmetics',
      'revlon makeup',
      'revlon lipstick',
      'revlon colorstay',
      'revlon super lustrous',
      'revlon foundation',
    ],
    youtubeKeywords: [
      'Revlon makeup tutorial',
      'Revlon review',
      'Revlon lipstick',
      'Revlon ColorStay',
      'Revlon foundation review',
    ],
    newsKeywords: [
      'Revlon',
      'Revlon cosmetics',
      'Revlon makeup',
      'Revlon beauty',
    ],
  },
  {
    id: 'elf',
    name: 'e.l.f.',
    displayName: 'e.l.f. Cosmetics',
    color: '#000000', // e.l.f. black
    keywords: [
      'e.l.f.',
      'elf cosmetics',
      'elf makeup',
      'elf beauty',
      'eyes lips face',
      'elf camo concealer',
      'elf power grip primer',
      'elf halo glow',
    ],
    youtubeKeywords: [
      'e.l.f. makeup tutorial',
      'elf cosmetics review',
      'elf makeup review',
      'elf halo glow',
      'elf camo concealer',
    ],
    newsKeywords: [
      'e.l.f. cosmetics',
      'e.l.f. beauty',
      'elf cosmetics',
      'elf beauty stock',
    ],
  },
];

export const PRIMARY_BRAND = BRANDS[0]; // Revlon
export const COMPETITOR_BRAND = BRANDS[1]; // e.l.f.

export function getBrandById(id: string): Brand | undefined {
  return BRANDS.find((b) => b.id === id);
}

export function getBrandByName(name: string): Brand | undefined {
  return BRANDS.find(
    (b) =>
      b.name.toLowerCase() === name.toLowerCase() ||
      b.displayName.toLowerCase() === name.toLowerCase()
  );
}
