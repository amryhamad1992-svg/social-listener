import googleTrends from 'google-trends-api';

export interface TrendDataPoint {
  date: string;
  value: number;
  formattedDate: string;
}

export interface InterestOverTimeResult {
  keyword: string;
  data: TrendDataPoint[];
  averageInterest: number;
}

export interface RelatedQuery {
  query: string;
  value: number;
  link: string;
  type: 'top' | 'rising';
}

export interface TrendsResult {
  interestOverTime: InterestOverTimeResult[];
  relatedQueries: RelatedQuery[];
  geo: string;
  timeRange: string;
}

// Supported countries - US + EU5
export const SUPPORTED_GEOS = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
} as const;

export type GeoCode = keyof typeof SUPPORTED_GEOS;

// Time range options
export const TIME_RANGES = {
  '7d': 'now 7-d',
  '30d': 'today 1-m',
  '90d': 'today 3-m',
  '12m': 'today 12-m',
} as const;

export type TimeRangeKey = keyof typeof TIME_RANGES;

// Beauty brands to track
export const BEAUTY_BRANDS = ['Revlon', 'e.l.f. Cosmetics', 'Maybelline'];

// Category ID for Beauty & Personal Care
const BEAUTY_CATEGORY = 44;

/**
 * Fetch interest over time for given keywords
 */
export async function getInterestOverTime(
  keywords: string[],
  geo: GeoCode = 'US',
  timeRange: TimeRangeKey = '90d'
): Promise<InterestOverTimeResult[]> {
  try {
    const results = await googleTrends.interestOverTime({
      keyword: keywords,
      geo,
      startTime: getStartTime(timeRange),
      category: BEAUTY_CATEGORY,
    });

    const parsed = JSON.parse(results);

    if (!parsed.default?.timelineData) {
      console.warn('No timeline data returned from Google Trends');
      return keywords.map(kw => ({
        keyword: kw,
        data: [],
        averageInterest: 0,
      }));
    }

    const timelineData = parsed.default.timelineData;

    return keywords.map((keyword, index) => {
      const data: TrendDataPoint[] = timelineData.map((point: any) => ({
        date: point.time,
        value: point.value?.[index] ?? 0,
        formattedDate: point.formattedTime,
      }));

      const averageInterest = data.length > 0
        ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)
        : 0;

      return {
        keyword,
        data,
        averageInterest,
      };
    });
  } catch (error) {
    console.error('Error fetching interest over time:', error);
    throw error;
  }
}

/**
 * Fetch related queries for a keyword
 */
export async function getRelatedQueries(
  keyword: string,
  geo: GeoCode = 'US',
  timeRange: TimeRangeKey = '90d'
): Promise<RelatedQuery[]> {
  try {
    const results = await googleTrends.relatedQueries({
      keyword,
      geo,
      startTime: getStartTime(timeRange),
      category: BEAUTY_CATEGORY,
    });

    const parsed = JSON.parse(results);
    const queries: RelatedQuery[] = [];

    // Get top queries
    const topQueries = parsed.default?.rankedList?.[0]?.rankedKeyword || [];
    topQueries.slice(0, 8).forEach((item: any) => {
      queries.push({
        query: item.query,
        value: item.value,
        link: item.link,
        type: 'top',
      });
    });

    // Get rising queries
    const risingQueries = parsed.default?.rankedList?.[1]?.rankedKeyword || [];
    risingQueries.slice(0, 8).forEach((item: any) => {
      queries.push({
        query: item.query,
        value: typeof item.value === 'string' ? parseInt(item.value.replace(/[^0-9]/g, '')) || 100 : item.value,
        link: item.link,
        type: 'rising',
      });
    });

    return queries;
  } catch (error) {
    console.error('Error fetching related queries:', error);
    return [];
  }
}

/**
 * Fetch real-time trending searches in beauty category
 */
export async function getRealTimeTrends(geo: GeoCode = 'US'): Promise<string[]> {
  try {
    const results = await googleTrends.realTimeTrends({
      geo,
      category: 'b', // Beauty category for real-time
    });

    const parsed = JSON.parse(results);
    const trends: string[] = [];

    parsed.storySummaries?.trendingStories?.forEach((story: any) => {
      if (story.title) {
        trends.push(story.title);
      }
    });

    return trends.slice(0, 10);
  } catch (error) {
    console.error('Error fetching real-time trends:', error);
    return [];
  }
}

/**
 * Fetch daily trends
 */
export async function getDailyTrends(geo: GeoCode = 'US'): Promise<Array<{ title: string; traffic: string }>> {
  try {
    const results = await googleTrends.dailyTrends({
      geo,
    });

    const parsed = JSON.parse(results);
    const trends: Array<{ title: string; traffic: string }> = [];

    parsed.default?.trendingSearchesDays?.[0]?.trendingSearches?.forEach((item: any) => {
      trends.push({
        title: item.title?.query || '',
        traffic: item.formattedTraffic || '',
      });
    });

    return trends.slice(0, 20);
  } catch (error) {
    console.error('Error fetching daily trends:', error);
    return [];
  }
}

/**
 * Comprehensive trends fetch for a brand - combines multiple data points
 */
export async function getBrandTrends(
  brand: string,
  geo: GeoCode = 'US',
  timeRange: TimeRangeKey = '90d'
): Promise<TrendsResult> {
  const [interestData, relatedQueries] = await Promise.all([
    getInterestOverTime([brand], geo, timeRange),
    getRelatedQueries(brand, geo, timeRange),
  ]);

  return {
    interestOverTime: interestData,
    relatedQueries,
    geo,
    timeRange,
  };
}

/**
 * Compare multiple brands
 */
export async function compareBrands(
  brands: string[],
  geo: GeoCode = 'US',
  timeRange: TimeRangeKey = '90d'
): Promise<InterestOverTimeResult[]> {
  // Google Trends allows max 5 keywords at once
  const limitedBrands = brands.slice(0, 5);
  return getInterestOverTime(limitedBrands, geo, timeRange);
}

/**
 * Get generic beauty category trends (not brand-specific)
 */
export async function getCategoryTrends(
  geo: GeoCode = 'US',
  timeRange: TimeRangeKey = '90d'
): Promise<RelatedQuery[]> {
  // Use generic beauty terms to find trending topics
  const genericTerms = ['makeup tutorial', 'skincare routine', 'beauty tips'];

  const allQueries: RelatedQuery[] = [];

  for (const term of genericTerms) {
    try {
      const queries = await getRelatedQueries(term, geo, timeRange);
      allQueries.push(...queries);
      // Small delay to avoid rate limiting
      await delay(500);
    } catch (error) {
      console.warn(`Failed to get trends for "${term}":`, error);
    }
  }

  // Deduplicate and sort by value
  const uniqueQueries = allQueries.reduce((acc, query) => {
    const existing = acc.find(q => q.query.toLowerCase() === query.query.toLowerCase());
    if (!existing) {
      acc.push(query);
    } else if (query.value > existing.value) {
      const index = acc.indexOf(existing);
      acc[index] = query;
    }
    return acc;
  }, [] as RelatedQuery[]);

  return uniqueQueries
    .sort((a, b) => b.value - a.value)
    .slice(0, 16);
}

// Helper functions
function getStartTime(timeRange: TimeRangeKey): Date {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '12m':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 90));
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock data fallback for when API fails or rate limited
export function getMockTrendsData(
  brand: string,
  geo: GeoCode,
  timeRange: TimeRangeKey
): TrendsResult {
  const baseInterest: Record<string, number> = {
    'Revlon': 65,
    'e.l.f. Cosmetics': 78,
    'e.l.f.': 78,
    'Maybelline': 70,
  };

  const geoModifier: Record<GeoCode, number> = {
    'US': 1.0,
    'GB': 0.9,
    'DE': 0.85,
    'FR': 0.88,
    'IT': 0.82,
    'ES': 0.87,
  };

  const base = (baseInterest[brand] || 60) * (geoModifier[geo] || 1);
  const points = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 12 : 12;

  const data: TrendDataPoint[] = [];
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    const daysBack = timeRange === '7d' ? i : timeRange === '30d' ? i : i * 7;
    date.setDate(date.getDate() - daysBack);

    const variation = Math.sin(i * 0.5) * 15 + (Math.random() * 10 - 5);
    const value = Math.min(100, Math.max(10, Math.round(base + variation)));

    data.push({
      date: date.toISOString(),
      value,
      formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  const mockRelatedQueries: RelatedQuery[] = [
    { query: `${brand.toLowerCase()} foundation`, value: 85, link: '#', type: 'top' },
    { query: `${brand.toLowerCase()} lipstick`, value: 72, link: '#', type: 'top' },
    { query: `${brand.toLowerCase()} mascara`, value: 68, link: '#', type: 'top' },
    { query: `best ${brand.toLowerCase()} products`, value: 55, link: '#', type: 'top' },
    { query: `${brand.toLowerCase()} review`, value: 150, link: '#', type: 'rising' },
    { query: `${brand.toLowerCase()} 2024`, value: 200, link: '#', type: 'rising' },
  ];

  return {
    interestOverTime: [{
      keyword: brand,
      data,
      averageInterest: Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length),
    }],
    relatedQueries: mockRelatedQueries,
    geo,
    timeRange,
  };
}
