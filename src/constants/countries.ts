// Country configuration for internationalization

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyRate: number; // Conversion rate from USD (1 USD = X local currency)
  language: string;
  languageCode: string;
  amazonDomain: string;
  platformWeights: {
    // Platform popularity multipliers (1.0 = average, >1.0 = more popular, <1.0 = less popular)
    tiktok: number;
    youtube: number;
    reddit: number;
    instagram: number;
    twitter: number;
    facebook: number;
  };
  beautyPreferences: string[]; // Cultural beauty preferences for persona enrichment
}

export const COUNTRIES: Record<string, Country> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    currencyRate: 1.0,
    language: 'English',
    languageCode: 'en-US',
    amazonDomain: 'amazon.com',
    platformWeights: {
      tiktok: 1.3,
      youtube: 1.2,
      reddit: 1.5,
      instagram: 1.2,
      twitter: 1.2,
      facebook: 1.0,
    },
    beautyPreferences: [
      'Trend-driven and influencer-led',
      'Diverse market with varying preferences',
      'Strong focus on innovation and new launches',
      'Value convenience and online shopping',
      'Mix of drugstore and luxury preferences',
    ],
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    currencyRate: 0.79,
    language: 'English',
    languageCode: 'en-GB',
    amazonDomain: 'amazon.co.uk',
    platformWeights: {
      tiktok: 1.2,
      youtube: 1.1,
      reddit: 1.0,
      instagram: 1.0,
      twitter: 1.1,
      facebook: 1.0,
    },
    beautyPreferences: [
      'Practical and value-conscious',
      'Love drugstore discoveries (Boots, Superdrug)',
      'Research-oriented with honest reviews',
      'Appreciate British heritage brands',
      'Eco-conscious and sustainability-focused',
    ],
  },
  FR: {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    currencyRate: 0.92,
    language: 'French',
    languageCode: 'fr-FR',
    amazonDomain: 'amazon.fr',
    platformWeights: {
      tiktok: 1.1,
      youtube: 1.0,
      reddit: 0.3,
      instagram: 1.3,
      twitter: 0.8,
      facebook: 1.1,
    },
    beautyPreferences: [
      'Natural beauty and "French pharmacy" aesthetic',
      'Ingredient-focused and dermatologist-recommended',
      'Prefer subtle, effortless looks',
      'Strong loyalty to French heritage brands',
      'Value quality over quantity',
    ],
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    currencyRate: 0.92,
    language: 'German',
    languageCode: 'de-DE',
    amazonDomain: 'amazon.de',
    platformWeights: {
      tiktok: 0.9,
      youtube: 1.2,
      reddit: 0.4,
      instagram: 0.9,
      twitter: 0.7,
      facebook: 1.0,
    },
    beautyPreferences: [
      'Research-heavy and ingredient-obsessed',
      'Skeptical of marketing claims',
      'Value scientific backing and efficacy',
      'Prefer natural and organic formulations',
      'Loyal to trusted DM and Rossmann brands',
    ],
  },
  IT: {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    currencySymbol: '€',
    currencyRate: 0.92,
    language: 'Italian',
    languageCode: 'it-IT',
    amazonDomain: 'amazon.it',
    platformWeights: {
      tiktok: 1.0,
      youtube: 1.0,
      reddit: 0.2,
      instagram: 1.5,
      twitter: 0.6,
      facebook: 1.2,
    },
    beautyPreferences: [
      'Aesthetic-driven and image-conscious',
      'Strong preference for luxury brands',
      'Value Italian heritage and craftsmanship',
      'Influenced by fashion and style trends',
      'Instagram is primary discovery platform',
    ],
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    currencySymbol: '€',
    currencyRate: 0.92,
    language: 'Spanish',
    languageCode: 'es-ES',
    amazonDomain: 'amazon.es',
    platformWeights: {
      tiktok: 1.1,
      youtube: 1.1,
      reddit: 0.2,
      instagram: 1.4,
      twitter: 0.9,
      facebook: 1.1,
    },
    beautyPreferences: [
      'Social and community-driven purchases',
      'Value recommendations from friends/family',
      'Strong influence from Spanish beauty influencers',
      'Mix of affordable and premium preferences',
      'Growing interest in K-beauty and Asian brands',
    ],
  },
};

export const COUNTRY_OPTIONS = Object.values(COUNTRIES).map(c => ({
  value: c.code,
  label: `${c.flag} ${c.code}`,
  country: c,
}));

// Helper function to convert USD income range to local currency
export function convertIncomeRange(usdRange: string, country: Country): string {
  // Parse USD range like "$50K-$90K" or "Middle ($50K-$90K)"
  const match = usdRange.match(/\$(\d+)K-\$(\d+)K/);
  if (!match) return usdRange;

  const [, min, max] = match;
  const minLocal = Math.round((parseInt(min) * 1000) / country.currencyRate / 1000);
  const maxLocal = Math.round((parseInt(max) * 1000) / country.currencyRate / 1000);

  // Format with local currency symbol
  const localRange = `${country.currencySymbol}${minLocal}K-${country.currencySymbol}${maxLocal}K`;

  // If original had descriptive text, preserve it
  if (usdRange.includes('(')) {
    return usdRange.replace(/\$\d+K-\$\d+K/, localRange);
  }

  return localRange;
}

// Helper function to adjust platform demographics based on country
export function adjustPlatformDemographicsForCountry(
  platforms: Record<string, number>,
  country: Country
): Record<string, number> {
  const adjusted: Record<string, number> = {};

  for (const [platform, count] of Object.entries(platforms)) {
    const platformLower = platform.toLowerCase();
    const weight = country.platformWeights[platformLower as keyof typeof country.platformWeights] || 1.0;
    adjusted[platform] = Math.round(count * weight);
  }

  return adjusted;
}

// Helper function to get regional beauty context for GPT
export function getRegionalContext(country: Country): string {
  return `
REGIONAL MARKET: ${country.flag} ${country.name}
BEAUTY PREFERENCES:
${country.beautyPreferences.map(p => `- ${p}`).join('\n')}

PLATFORM POPULARITY (relative to global average):
- TikTok: ${country.platformWeights.tiktok > 1 ? 'Very Popular' : country.platformWeights.tiktok < 0.7 ? 'Less Popular' : 'Average'}
- Instagram: ${country.platformWeights.instagram > 1 ? 'Very Popular' : country.platformWeights.instagram < 0.7 ? 'Less Popular' : 'Average'}
- YouTube: ${country.platformWeights.youtube > 1 ? 'Very Popular' : country.platformWeights.youtube < 0.7 ? 'Less Popular' : 'Average'}
- Reddit: ${country.platformWeights.reddit > 1 ? 'Popular' : country.platformWeights.reddit < 0.7 ? 'Less Popular' : 'Average'}
`.trim();
}
