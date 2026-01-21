import { NextRequest, NextResponse } from 'next/server';
import { generateKeywordSuggestions, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { keywords, category, subCategory } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array required' },
        { status: 400 }
      );
    }

    const suggestions = await generateKeywordSuggestions(
      keywords,
      category || 'Beauty',
      subCategory || 'General'
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('AI keywords error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
