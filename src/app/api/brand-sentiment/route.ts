import { NextRequest, NextResponse } from 'next/server';
import { analyzeBrandSentiment, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { brand, mentions } = body;

    if (!brand || !mentions || !Array.isArray(mentions)) {
      return NextResponse.json(
        { success: false, error: 'Brand and mentions array required' },
        { status: 400 }
      );
    }

    const sentiment = await analyzeBrandSentiment(brand, mentions);

    return NextResponse.json({
      success: true,
      data: sentiment,
    });
  } catch (error) {
    console.error('Brand sentiment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}
