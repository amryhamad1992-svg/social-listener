import { NextResponse } from 'next/server';

export async function GET() {
  const SERPAPI_KEY = process.env.SERPAPI_KEY;

  const result: any = {
    keyExists: !!SERPAPI_KEY,
    keyLength: SERPAPI_KEY?.length || 0,
    keyPreview: SERPAPI_KEY ? `${SERPAPI_KEY.substring(0, 8)}...` : 'NOT SET',
  };

  if (!SERPAPI_KEY) {
    return NextResponse.json({
      ...result,
      error: 'SERPAPI_KEY not configured',
    });
  }

  try {
    // Test SerpAPI with a simple query
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_trends');
    url.searchParams.set('q', 'Revlon');
    url.searchParams.set('geo', 'US');
    url.searchParams.set('date', 'today 3-m');
    url.searchParams.set('data_type', 'TIMESERIES');
    url.searchParams.set('api_key', SERPAPI_KEY);

    console.log('[Test] Fetching from SerpAPI...');
    const response = await fetch(url.toString());
    const data = await response.json();

    result.httpStatus = response.status;
    result.responseKeys = Object.keys(data);
    result.hasError = !!data.error;
    result.errorMessage = data.error || null;
    result.hasTimelineData = !!(data.interest_over_time?.timeline_data?.length);
    result.timelineDataCount = data.interest_over_time?.timeline_data?.length || 0;

    if (data.interest_over_time?.timeline_data?.[0]) {
      result.sampleDataPoint = data.interest_over_time.timeline_data[0];
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      ...result,
      error: error.message,
    });
  }
}
