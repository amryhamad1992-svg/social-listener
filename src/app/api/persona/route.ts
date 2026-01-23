import { NextRequest, NextResponse } from 'next/server';
import {
  generateCreativeQueries,
  extractStructuredSignals,
  synthesizeDemographics,
  detectBrandCategory,
  detectProductCategory,
  isTechProduct,
  ExtractedSignals,
} from '@/lib/personaEnrichment';
import {
  COUNTRIES,
  convertIncomeRange,
  adjustPlatformDemographicsForCountry,
  getRegionalContext,
} from '@/constants/countries';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface BraveSearchResult {
  title: string;
  description: string;
  url: string;
}

interface PersonaProfile {
  demographics: {
    ageRange: string;
    genderSkew: string;
    incomeLevel: string;
    education: string;
    location: string;
  };
  psychographics: {
    values: string[];
    lifestyle: string[];
    attitudes: string[];
  };
  interests: {
    categories: string[];
    hobbies: string[];
    mediaConsumption: string[];
  };
  shoppingBehavior: {
    channels: string[];
    priceSensitivity: string;
    brandLoyalty: string;
    purchaseDrivers: string[];
  };
  lookalikeBrands: string[];
  summary: string;
}

async function searchBrave(query: string, count: number = 10): Promise<BraveSearchResult[]> {
  if (!BRAVE_API_KEY) return [];

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.web?.results || []).map((r: { title: string; description: string; url: string }) => ({
      title: r.title,
      description: r.description,
      url: r.url,
    }));
  } catch (error) {
    console.error('Brave search error:', error);
    return [];
  }
}

async function analyzeWithGPT(
  brand: string,
  product: string,
  searchData: BraveSearchResult[],
  signals: ExtractedSignals,
  platformDemo: ReturnType<typeof synthesizeDemographics>,
  brandCategory: ReturnType<typeof detectBrandCategory> | null,
  country: typeof COUNTRIES[keyof typeof COUNTRIES],
  productCategory: string,
  isTech: boolean
): Promise<PersonaProfile> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const hasSearchData = searchData.length > 0;

  // Convert income level to local currency
  const localizedIncome = convertIncomeRange(platformDemo.incomeLevel, country);

  // ENHANCEMENT: Send structured signals with regional context instead of raw text (reduces tokens by 40%)
  const enrichedContext = hasSearchData
    ? `${getRegionalContext(country)}

PLATFORM DISTRIBUTION (Real data from ${searchData.length} sources):
${Object.entries(signals.platforms)
  .map(([platform, count]) => `- ${platform}: ${count} mentions`)
  .join('\n')}

DEMOGRAPHIC SIGNALS EXTRACTED:
- Age mentions: ${signals.ages.slice(0, 10).join(', ') || 'Not specified'}
- Gender mentions: ${signals.genders.slice(0, 5).join(', ') || 'Not specified'}
- Price signals: ${signals.prices.slice(0, 10).join(', ') || 'Not specified'}

SYNTHESIZED PLATFORM DEMOGRAPHICS:
- Age Range: ${platformDemo.ageRange}
- Gender Skew: ${platformDemo.genderSkew}
- Income Level: ${localizedIncome}
- Key Traits: ${platformDemo.traits.join(', ')}

SENTIMENT SIGNALS:
- Positive mentions: ${signals.benefits.length} (${signals.benefits.slice(0, 5).join(', ')})
- Negative mentions: ${signals.complaints.length} (${signals.complaints.slice(0, 3).join(', ')})

BRAND CATEGORY: ${brandCategory?.category || 'General Beauty'}
PRICE POINT: ${brandCategory?.pricePoint || 'Mid-range'}

TOP SEARCH INSIGHTS (First 8 sources):
${searchData.slice(0, 8).map((r, i) => `${i + 1}. ${r.title.slice(0, 100)}`).join('\n')}`
    : `${getRegionalContext(country)}

BRAND CATEGORY: ${brandCategory?.category || 'General Beauty'}
PRICE POINT: ${brandCategory?.pricePoint || 'Mid-range'}
${brandCategory ? `CATEGORY LOOKALIKE BRANDS: ${brandCategory.lookalikeBrands.slice(0, 6).join(', ')}` : ''}`;

  const prompt = hasSearchData
    ? `You are a market research analyst specializing in the ${country.name} market. Using the ENRICHED DATA SIGNALS below about "${brand} ${product}", create a detailed audience persona profile FOR ${country.flag} ${country.name.toUpperCase()} CONSUMERS.

${enrichedContext}

⚠️ CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. PRODUCT CATEGORY: "${brand} ${product}" is a ${productCategory}. ${isTech ? '🔧 THIS IS A TECH PRODUCT - NOT A BEAUTY PRODUCT!' : '💄 THIS IS A BEAUTY PRODUCT - NOT A TECH PRODUCT!'}

2. DEMOGRAPHICS - USE REAL MARKET DATA:
   ${isTech ? '- Gender: Tech products = 60-65% MALE, 35-40% Female (based on actual smartphone/tech buyer demographics)' : '- Gender: Beauty products = 60-75% Female, 25-40% Male'}
   - DO NOT use platform demographics alone - they are biased toward beauty audiences
   - Override platform data with ACTUAL category research

3. LOOKALIKE BRANDS - STAY IN THE SAME CATEGORY:
   ${isTech ? '- ONLY tech/electronics brands: Apple, Samsung, OnePlus, Huawei, Xiaomi, Sony, LG, Motorola, ASUS, etc.' : '- ONLY beauty/cosmetics brands: matching the product category'}
   - ❌ NEVER mix tech and beauty brands in lookalike list
   - ❌ DO NOT include Fenty, L'Oréal, Glossier, etc. for tech products
   - ✅ ONLY include brands in the SAME product category

4. USE THE SEARCH DATA:
   - Base your persona on the ${searchData.length} real search results provided
   - Extract demographics, interests, and behaviors from actual user discussions
   - The platform breakdown and signals are REAL DATA - use them

Create a comprehensive persona using the real data above AND accurate market research for ${isTech ? 'TECH PRODUCTS' : 'BEAUTY PRODUCTS'} in ${country.name}.`
    : `You are a market research analyst with deep knowledge of consumer brands in the ${country.name} market. Create a detailed audience persona profile for "${brand} ${product}" targeting ${country.flag} ${country.name.toUpperCase()} consumers.

${enrichedContext}

⚠️ CRITICAL INSTRUCTIONS:

1. PRODUCT CATEGORY: "${brand} ${product}" is a ${productCategory}. ${isTech ? 'THIS IS A TECH PRODUCT!' : 'THIS IS A BEAUTY PRODUCT!'}

2. DEMOGRAPHICS: ${isTech ? 'Tech buyers = 60-65% MALE, 35-40% Female' : 'Beauty buyers = 60-75% Female'}

3. LOOKALIKE BRANDS: ${isTech ? 'ONLY tech brands (Apple, Samsung, OnePlus, etc.) - NO beauty brands!' : 'ONLY beauty brands - NO tech brands!'}

Use accurate market research for ${isTech ? 'TECH PRODUCTS' : 'BEAUTY PRODUCTS'} in ${country.name}.`;

  const jsonSchema = `
Provide the persona in this JSON format:

{
  "demographics": {
    "ageRange": "e.g., 25-45",
    "genderSkew": "e.g., 70% Female, 30% Male",
    "incomeLevel": "e.g., Middle to Upper-Middle (${country.currencySymbol}60K-${country.currencySymbol}120K) - USE ${country.currency} CURRENCY",
    "education": "e.g., College educated",
    "location": "e.g., ${country.name} - Urban/Suburban areas, key regional insights"
  },
  "psychographics": {
    "values": ["array of 4-6 core values"],
    "lifestyle": ["array of 4-6 lifestyle traits"],
    "attitudes": ["array of 3-5 attitudes/beliefs"]
  },
  "interests": {
    "categories": ["array of 5-7 product/service categories they care about"],
    "hobbies": ["array of 4-6 hobbies"],
    "mediaConsumption": ["array of 4-6 media sources/platforms they use"]
  },
  "shoppingBehavior": {
    "channels": ["array of 4-6 shopping channels"],
    "priceSensitivity": "description of price sensitivity",
    "brandLoyalty": "description of brand loyalty tendency",
    "purchaseDrivers": ["array of 4-6 key purchase drivers"]
  },
  "lookalikeBrands": ["array of 8-10 brands this audience likely also buys"],
  "summary": "A 2-3 sentence summary of this persona"
}

Return ONLY valid JSON, no additional text.`;

  const fullPrompt = `${prompt}\n\n${jsonSchema}`;

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
          content: 'You are a market research expert. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
    throw new Error('Failed to parse persona from AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: NextRequest) {
  try {
    const { brand, product, country = 'US' } = await request.json();

    if (!brand || !product) {
      return NextResponse.json(
        { success: false, error: 'Brand and product are required' },
        { status: 400 }
      );
    }

    const countryData = COUNTRIES[country] || COUNTRIES.US;
    console.log(`[Persona] Generating for: ${brand} ${product} (${countryData.flag} ${countryData.name})`);

    // ENHANCEMENT 1: Detect brand/product categories (zero cost)
    const brandCategory = detectBrandCategory(brand);
    const productCategory = detectProductCategory(product, brand);
    const isTech = isTechProduct(product, brand);
    console.log(`[Persona] Category detected: ${brandCategory?.category || 'Unknown'}, Product: ${productCategory}, IsTech: ${isTech}`);

    // ENHANCEMENT 2: Use creative, targeted queries (same cost, better results)
    const searchQueries = generateCreativeQueries(brand, product);
    console.log(`[Persona] 🔍 BRAVE SEARCH QUERIES:`);
    searchQueries.slice(0, 6).forEach((q, i) => console.log(`  ${i + 1}. "${q}"`));

    // Execute searches in parallel (take first 6 to stay within same API budget)
    const searchPromises = searchQueries.slice(0, 6).map(q => searchBrave(q, 5));
    const searchResults = await Promise.all(searchPromises);

    console.log(`[Persona] 📊 BRAVE SEARCH RESULTS:`, searchResults.map((r, i) => ({
      query: i + 1,
      resultsFound: r.length,
      sources: r.map(result => result.url.split('/')[2]).slice(0, 3)
    })));

    // Flatten and deduplicate results
    const allResults: BraveSearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const results of searchResults) {
      for (const result of results) {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          allResults.push(result);
        }
      }
    }

    // Limit to top 25 results
    const topResults = allResults.slice(0, 25);
    console.log(`[Persona] Found ${topResults.length} unique sources`);

    // ENHANCEMENT 3: Extract structured signals (reduces GPT load!)
    const signals = extractStructuredSignals(topResults);
    console.log(`[Persona] Extracted signals:`, {
      platforms: Object.keys(signals.platforms).length,
      ages: signals.ages.length,
      benefits: signals.benefits.length,
    });

    // ENHANCEMENT 4: Adjust platform demographics for target country
    const adjustedPlatforms = adjustPlatformDemographicsForCountry(signals.platforms, countryData);
    const platformDemo = synthesizeDemographics(adjustedPlatforms, isTech);
    console.log(`[Persona] Platform demographics (${countryData.name}):`, platformDemo);

    // ENHANCEMENT 5: Send enriched, structured data to GPT (not raw text) with regional context
    const persona = await analyzeWithGPT(brand, product, topResults, signals, platformDemo, brandCategory, countryData, productCategory, isTech);

    return NextResponse.json({
      success: true,
      data: {
        brand,
        product,
        persona,
        sourcesCount: topResults.length,
        platformBreakdown: signals.platforms,
        categoryDetected: brandCategory?.category || 'Unknown',
      },
    });
  } catch (error) {
    console.error('Persona API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate persona' },
      { status: 500 }
    );
  }
}
