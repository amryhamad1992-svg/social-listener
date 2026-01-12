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

// SerpAPI time range mapping
const SERPAPI_TIME_RANGES: Record<TimeRangeKey, string> = {
  '7d': 'now 7-d',
  '30d': 'today 1-m',
  '90d': 'today 3-m',
  '12m': 'today 12-m',
};

export type TimeRangeKey = keyof typeof TIME_RANGES;

// Beauty brands to track
export const BEAUTY_BRANDS = ['Revlon', 'e.l.f. Cosmetics', 'Maybelline'];

// Category ID for Beauty & Personal Care
const BEAUTY_CATEGORY = 44;

// SerpAPI key (free tier: 100 searches/month)
const SERPAPI_KEY = process.env.SERPAPI_KEY;

/**
 * Fetch trends data from SerpAPI (reliable, works from cloud servers)
 * Free tier: 100 searches/month
 */
async function fetchFromSerpAPI(
  keyword: string,
  geo: GeoCode,
  timeRange: TimeRangeKey
): Promise<{ interestOverTime: InterestOverTimeResult; relatedQueries: RelatedQuery[] } | null> {
  console.log('[SerpAPI] Checking key:', SERPAPI_KEY ? 'Key exists' : 'NO KEY FOUND');

  if (!SERPAPI_KEY) {
    console.log('[SerpAPI] Key not configured, skipping SerpAPI');
    return null;
  }

  try {
    // Fetch interest over time
    const interestUrl = new URL('https://serpapi.com/search.json');
    interestUrl.searchParams.set('engine', 'google_trends');
    interestUrl.searchParams.set('q', keyword);
    interestUrl.searchParams.set('geo', geo);
    interestUrl.searchParams.set('date', SERPAPI_TIME_RANGES[timeRange]);
    interestUrl.searchParams.set('data_type', 'TIMESERIES');
    interestUrl.searchParams.set('api_key', SERPAPI_KEY);

    console.log('[SerpAPI] Fetching:', keyword, geo, timeRange);
    const interestResponse = await fetch(interestUrl.toString());

    if (!interestResponse.ok) {
      const errorText = await interestResponse.text();
      console.error('[SerpAPI] HTTP error:', interestResponse.status, errorText);
      return null;
    }

    const interestData = await interestResponse.json();
    console.log('[SerpAPI] Response keys:', Object.keys(interestData));

    // Check for error in response
    if (interestData.error) {
      console.error('[SerpAPI] API error:', interestData.error);
      return null;
    }

    // Parse interest over time data - try multiple possible paths
    const timelineData = interestData.interest_over_time?.timeline_data ||
                         interestData.timeline_data ||
                         [];

    console.log('[SerpAPI] Timeline data points:', timelineData.length);
    if (timelineData.length > 0) {
      console.log('[SerpAPI] First data point:', JSON.stringify(timelineData[0]));
    }

    const data: TrendDataPoint[] = timelineData.map((point: any) => ({
      date: point.timestamp || point.date,
      value: point.values?.[0]?.extracted_value ?? point.value ?? 0,
      formattedDate: point.date || new Date(parseInt(point.timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    const averageInterest = data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)
      : 0;

    // Fetch related queries (separate API call)
    const relatedUrl = new URL('https://serpapi.com/search.json');
    relatedUrl.searchParams.set('engine', 'google_trends');
    relatedUrl.searchParams.set('q', keyword);
    relatedUrl.searchParams.set('geo', geo);
    relatedUrl.searchParams.set('date', SERPAPI_TIME_RANGES[timeRange]);
    relatedUrl.searchParams.set('cat', BEAUTY_CATEGORY.toString());
    relatedUrl.searchParams.set('data_type', 'RELATED_QUERIES');
    relatedUrl.searchParams.set('api_key', SERPAPI_KEY);

    const relatedResponse = await fetch(relatedUrl.toString());
    const relatedQueries: RelatedQuery[] = [];

    if (relatedResponse.ok) {
      const relatedData = await relatedResponse.json();

      // Parse top queries
      const topQueries = relatedData.related_queries?.top || [];
      topQueries.slice(0, 8).forEach((item: any) => {
        relatedQueries.push({
          query: item.query,
          value: item.value || item.extracted_value || 50,
          link: item.link || `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.query)}&geo=${geo}`,
          type: 'top',
        });
      });

      // Parse rising queries
      const risingQueries = relatedData.related_queries?.rising || [];
      risingQueries.slice(0, 8).forEach((item: any) => {
        relatedQueries.push({
          query: item.query,
          value: item.value || item.extracted_value || 100,
          link: item.link || `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.query)}&geo=${geo}`,
          type: 'rising',
        });
      });
    }

    console.log(`SerpAPI success: ${keyword} - ${data.length} data points, ${relatedQueries.length} related queries`);

    return {
      interestOverTime: {
        keyword,
        data,
        averageInterest,
      },
      relatedQueries,
    };
  } catch (error) {
    console.error('SerpAPI fetch error:', error);
    return null;
  }
}

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
 * Fallback chain: SerpAPI -> google-trends-api -> mock data
 */
export async function getBrandTrends(
  brand: string,
  geo: GeoCode = 'US',
  timeRange: TimeRangeKey = '90d'
): Promise<TrendsResult & { source?: string }> {
  // Try SerpAPI first (most reliable from cloud servers)
  const serpApiResult = await fetchFromSerpAPI(brand, geo, timeRange);
  if (serpApiResult && serpApiResult.interestOverTime.data.length > 0) {
    return {
      interestOverTime: [serpApiResult.interestOverTime],
      relatedQueries: serpApiResult.relatedQueries,
      geo,
      timeRange,
      source: 'serpapi',
    };
  }

  // Fall back to google-trends-api (may fail from cloud IPs)
  try {
    console.log('SerpAPI unavailable, trying google-trends-api...');
    const [interestData, relatedQueries] = await Promise.all([
      getInterestOverTime([brand], geo, timeRange),
      getRelatedQueries(brand, geo, timeRange),
    ]);

    if (interestData[0]?.data?.length > 0) {
      return {
        interestOverTime: interestData,
        relatedQueries,
        geo,
        timeRange,
        source: 'google-trends-api',
      };
    }
  } catch (error) {
    console.warn('google-trends-api failed:', error);
  }

  // Final fallback: mock data
  console.log('All APIs failed, returning mock data');
  return {
    ...getMockTrendsData(brand, geo, timeRange),
    source: 'mock',
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
