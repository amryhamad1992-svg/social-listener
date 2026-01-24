import { NextRequest, NextResponse } from 'next/server';
import { COUNTRIES } from '@/constants/countries';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Generate media-buyable domains using AI
async function generateDomainsWithAI(
  brand: string,
  product: string,
  targetingType: 'branded' | 'generic' | 'competitor',
  country: typeof COUNTRIES[keyof typeof COUNTRIES]
): Promise<string[]> {
  if (!OPENAI_API_KEY) {
    return [];
  }

  const prompts = {
    branded: `Generate 20 domains where "${brand} ${product}" is likely mentioned, reviewed, or featured.

IMPORTANT: Only include domains where you can actually BUY MEDIA (serve programmatic ads).

✅ INCLUDE:
- News sites and online magazines
- Industry-specific blogs and publications
- Product review sites
- YouTube (youtube.com)
- Reddit (reddit.com)
- Forums and community sites
- Lifestyle and special interest publications

❌ EXCLUDE (cannot serve ads on these):
- Retailer/e-commerce sites (Amazon, Walmart, Target, Best Buy, Sephora, etc.)
- Brand websites (${brand}.com or any brand's official site)
- Marketplace platforms (eBay, Etsy, etc.)

First, identify what category "${brand} ${product}" belongs to (tech, sports, beauty, automotive, food, etc.), then list publications that cover that category and have likely featured this product.

Country focus: ${country.name}

Return JSON: { "domains": ["domain1.com", "domain2.com", ...] }`,

    generic: `Generate 20 domains that cover the product category that "${product}" belongs to.

First identify the category: Is "${product}" a tech product? Sports equipment? Beauty item? Food product? Automotive? Home goods? Then find publications covering that category.

IMPORTANT: Only include domains where you can actually BUY MEDIA (serve programmatic ads).

✅ INCLUDE:
- Industry publications for this product category
- Blogs and review sites covering this type of product
- News sites with relevant sections
- YouTube (youtube.com)
- Reddit (reddit.com)
- Niche forums and enthusiast communities
- Lifestyle publications relevant to buyers of "${product}"

❌ EXCLUDE (cannot serve ads on these):
- Retailer/e-commerce sites (Amazon, Walmart, Target, Best Buy, etc.)
- Brand websites
- Marketplace platforms

Country focus: ${country.name}

Return JSON: { "domains": ["domain1.com", "domain2.com", ...] }`,

    competitor: `Generate 20 domains where competitor products to "${brand} ${product}" are reviewed or featured.

First identify:
1. What category is "${brand} ${product}"? (tech, sports, beauty, automotive, etc.)
2. Who are the main competitors to ${brand} in this category?
3. Which publications review/feature those competitor products?

IMPORTANT: Only include domains where you can actually BUY MEDIA (serve programmatic ads).

✅ INCLUDE:
- Review sites that compare products in this category
- Industry publications featuring competitor reviews
- Blogs that cover competitor products
- YouTube (youtube.com)
- Reddit (reddit.com)
- Comparison and "best of" sites

❌ EXCLUDE (cannot serve ads on these):
- Retailer sites (Amazon, Best Buy, etc.)
- Competitor brand websites (we can't serve ads on Nike.com, Apple.com, etc.)
- E-commerce platforms

Country focus: ${country.name}

Return JSON: { "domains": ["domain1.com", "domain2.com", ...] }`
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a media buying expert who knows which domains accept programmatic advertising. Only suggest domains where ads can actually be served. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompts[targetingType],
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('[Domains] AI generation failed');
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`[Domains] AI generated ${targetingType}: ${result.domains?.length || 0} domains`);
      return result.domains || [];
    }
  } catch (error) {
    console.error('[Domains] AI error:', error);
  }

  return [];
}

interface KeywordResults {
  branded?: { keywords: string[]; domains: string[] };
  generic?: { keywords: string[]; domains: string[] };
  competitor?: { keywords: string[]; domains: string[] };
}

async function generateKeywordsWithGPT(
  brand: string,
  product: string,
  country: typeof COUNTRIES[keyof typeof COUNTRIES],
  targetingType: 'branded' | 'generic' | 'competitor'
): Promise<{ keywords: string[]; domains: string[] }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompts = {
    branded: `Generate 15-20 branded search keywords for off-Amazon advertising targeting "${brand} ${product}" in ${country.name} (${country.flag}).

Language: ${country.language} (${country.languageCode})
Target Platform: Amazon ${country.amazonDomain}

Generate keywords that:
- Include brand name variations
- Target customers actively searching for this specific brand/product
- Use ${country.language} language (not English unless country is US/UK)
- Include common search patterns and modifiers
- Focus on purchase-intent keywords

Examples of good branded keywords:
- "${brand} ${product}" (exact match)
- "${brand} [product category]"
- "buy ${brand} ${product}"
- "${brand} official"
- "${brand} best price"

Return ONLY a JSON object:
{
  "keywords": ["array of 15-20 branded keywords in ${country.language}"]
}`,

    generic: `Generate 15-20 generic product keywords for off-Amazon advertising for "${brand} ${product}" in ${country.name} (${country.flag}).

Language: ${country.language} (${country.languageCode})
Target Platform: Amazon ${country.amazonDomain}

Generate keywords that:
- Target customers searching for this product category (without brand name)
- Use ${country.language} language (not English unless country is US/UK)
- Include common product attributes, benefits, use cases
- Focus on purchase-intent keywords
- Cover different search patterns

Examples of good generic keywords:
- "[product category] [attribute]"
- "best [product category]"
- "buy [product category]"
- "[product category] for [use case]"
- "[product benefit] [product category]"

Return ONLY a JSON object:
{
  "keywords": ["array of 15-20 generic keywords in ${country.language}"]
}`,

    competitor: `Generate 15 competitor brand keywords for off-Amazon advertising for "${brand} ${product}" in ${country.name} (${country.flag}).

Language: ${country.language} (${country.languageCode})
Target Platform: Amazon ${country.amazonDomain}

Generate keywords that:
- Target customers searching for competitor brands in this product category
- Use ${country.language} language (not English unless country is US/UK)
- Include major competitor brands and product lines
- Focus on comparison and alternative searches

Examples of good competitor keywords:
- "[Competitor Brand] alternative"
- "[Competitor Brand] vs"
- "better than [Competitor Brand]"
- "[Competitor Brand] [product category]"

Return ONLY a JSON object:
{
  "keywords": ["array of 15 competitor keywords in ${country.language}"]
}`,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert in Amazon advertising and international SEO. Generate localized, purchase-intent keywords for off-Amazon campaigns. Always respond with valid JSON only.`,
          },
          {
            role: 'user',
            content: prompts[targetingType],
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse keywords from AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Generate AI-powered media-buyable domains
    console.log(`[Audience Builder] Generating AI domains for ${targetingType}...`);
    const domains = await generateDomainsWithAI(brand, product, targetingType, country);

    return {
      keywords: result.keywords || [],
      domains: domains,
    };
  } catch (error) {
    console.error(`Failed to generate ${targetingType} keywords with GPT:`, error);
    // Return fallback keywords
    return {
      keywords: [],
      domains: [],
    };
  }
}

// Old hardcoded domain generation removed - now using AI via generateDomainsWithAI()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, product, country = 'US', targetingTypes } = body;

    if (!brand || !product) {
      return NextResponse.json(
        { success: false, error: 'Brand and product are required' },
        { status: 400 }
      );
    }

    const countryData = COUNTRIES[country] || COUNTRIES.US;
    console.log(`[Audience Builder] Generating for: ${brand} ${product} (${countryData.flag} ${countryData.name})`);

    const results: KeywordResults = {};

    // Generate keywords for each targeting type
    const types: ('branded' | 'generic' | 'competitor')[] = targetingTypes || ['branded', 'generic', 'competitor'];

    for (const targetingType of types) {
      console.log(`[Audience Builder] Generating ${targetingType} keywords in ${countryData.language}...`);
      const result = await generateKeywordsWithGPT(brand, product, countryData, targetingType);
      results[targetingType] = result;
    }

    return NextResponse.json({
      success: true,
      data: {
        brand,
        product,
        country: countryData.name,
        language: countryData.language,
        amazonDomain: countryData.amazonDomain,
        results,
      },
    });
  } catch (error) {
    console.error('Audience Builder API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate keywords' },
      { status: 500 }
    );
  }
}

// GET handler returns empty brands array (no longer used, but keeping for backwards compatibility)
export async function GET() {
  return NextResponse.json({
    success: true,
    brands: [],
  });
}
