import { NextRequest, NextResponse } from 'next/server';
import {
  getBrandTrends,
  compareBrands,
  getCategoryTrends,
  getRelatedQueries,
  getMockTrendsData,
  type GeoCode,
  type TimeRangeKey,
  SUPPORTED_GEOS,
  TIME_RANGES,
} from '@/lib/googleTrends';

// Cache to avoid hitting rate limits
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: Record<string, string>): string {
  return Object.entries(params).sort().map(([k, v]) => `${k}:${v}`).join('|');
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand') || 'Revlon';
    const geo = (searchParams.get('geo') || 'US') as GeoCode;
    const timeRange = (searchParams.get('timeRange') || '90d') as TimeRangeKey;
    const mode = searchParams.get('mode') || 'brand'; // 'brand', 'compare', 'category'
    const useMock = searchParams.get('mock') === 'true';

    // Validate geo
    if (!SUPPORTED_GEOS[geo]) {
      return NextResponse.json(
        { success: false, error: `Invalid geo. Supported: ${Object.keys(SUPPORTED_GEOS).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate timeRange
    if (!TIME_RANGES[timeRange]) {
      return NextResponse.json(
        { success: false, error: `Invalid timeRange. Supported: ${Object.keys(TIME_RANGES).join(', ')}` },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey({ brand, geo, timeRange, mode });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        source: 'cache',
      });
    }

    // Return mock data if requested or if there's a failure
    if (useMock) {
      const mockData = getMockTrendsData(brand, geo, timeRange);
      return NextResponse.json({
        success: true,
        data: mockData,
        source: 'mock',
      });
    }

    let data;

    try {
      switch (mode) {
        case 'compare':
          // Compare multiple brands
          const brands = searchParams.get('brands')?.split(',') || ['Revlon', 'e.l.f. Cosmetics', 'Maybelline'];
          const comparison = await compareBrands(brands, geo, timeRange);
          data = {
            interestOverTime: comparison,
            relatedQueries: [],
            geo,
            timeRange,
          };
          break;

        case 'category':
          // Get generic beauty category trends
          const categoryQueries = await getCategoryTrends(geo, timeRange);
          data = {
            interestOverTime: [],
            relatedQueries: categoryQueries,
            geo,
            timeRange,
          };
          break;

        case 'brand':
        default:
          // Get brand-specific trends
          data = await getBrandTrends(brand, geo, timeRange);
          break;
      }

      // Cache successful results
      setCache(cacheKey, data);

      return NextResponse.json({
        success: true,
        data,
        source: 'google-trends',
      });
    } catch (apiError: any) {
      console.error('Google Trends API error:', apiError.message);

      // Fall back to mock data on API failure
      const mockData = getMockTrendsData(brand, geo, timeRange);
      return NextResponse.json({
        success: true,
        data: mockData,
        source: 'mock-fallback',
        warning: 'Google Trends API unavailable, showing simulated data',
      });
    }
  } catch (error: any) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}

// POST endpoint for custom queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keywords = [],
      geo = 'US',
      timeRange = '90d',
    } = body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    // Limit to 5 keywords (Google Trends limit)
    const limitedKeywords = keywords.slice(0, 5);

    try {
      const relatedPromises = limitedKeywords.map(kw =>
        getRelatedQueries(kw, geo as GeoCode, timeRange as TimeRangeKey)
      );

      const results = await Promise.all(relatedPromises);

      const allQueries = results.flat();

      return NextResponse.json({
        success: true,
        data: {
          keywords: limitedKeywords,
          relatedQueries: allQueries,
          geo,
          timeRange,
        },
        source: 'google-trends',
      });
    } catch (apiError: any) {
      console.error('Google Trends API error:', apiError.message);
      return NextResponse.json({
        success: true,
        data: {
          keywords: limitedKeywords,
          relatedQueries: [],
          geo,
          timeRange,
        },
        source: 'mock-fallback',
        warning: 'Google Trends API unavailable',
      });
    }
  } catch (error: any) {
    console.error('Trends POST API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
