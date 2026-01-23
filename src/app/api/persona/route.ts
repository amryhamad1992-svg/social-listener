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

// Category detection using AI
interface CategoryInfo {
  category: string;
  subcategory: string;
  genderSplit: string;
  lookalikeBrands: string[];
}

async function detectCategoryWithAI(brand: string, product: string): Promise<CategoryInfo> {
  if (!OPENAI_API_KEY) {
    return {
      category: 'General',
      subcategory: 'Consumer Product',
      genderSplit: '50% Male, 50% Female',
      lookalikeBrands: []
    };
  }

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
            content: 'You are a product categorization expert. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: `Categorize this product: "${brand} ${product}"

Return JSON:
{
  "category": "one of: Technology, Sports & Athletics, Fashion & Apparel, Beauty & Cosmetics, Home & Garden, Food & Beverage, Automotive, Health & Wellness, Entertainment, Finance, Travel, Other",
  "subcategory": "specific type like Smartphone, Running Shoes, Skincare, etc.",
  "genderSplit": "realistic buyer demographics like '65% Male, 35% Female' or '70% Female, 30% Male' based on actual market data for this product type",
  "lookalikeBrands": ["8-10 competitor/similar brands in the SAME category - must be real brands that compete with ${brand}"]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Category detection failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`[Persona] AI Category Detection: ${brand} ${product} → ${result.category} / ${result.subcategory}`);
      console.log(`[Persona] AI Gender Split: ${result.genderSplit}`);
      console.log(`[Persona] AI Lookalikes: ${result.lookalikeBrands?.join(', ')}`);
      return result;
    }
  } catch (error) {
    console.error('[Persona] Category detection error:', error);
  }

  return {
    category: 'General',
    subcategory: 'Consumer Product',
    genderSplit: '50% Male, 50% Female',
    lookalikeBrands: []
  };
}

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
  isTech: boolean,
  aiCategory: CategoryInfo
): Promise<PersonaProfile> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const hasSearchData = searchData.length > 0;

  // Convert income level to local currency
  const localizedIncome = convertIncomeRange(platformDemo.incomeLevel, country);

  // Build search context from Brave results
  const searchContext = hasSearchData ? `
REAL SEARCH DATA FROM ${searchData.length} SOURCES:

Platform Breakdown:
${Object.entries(signals.platforms).map(([p, c]) => `- ${p}: ${c} mentions`).join('\n') || '- No platform data'}

What People Are Saying:
${searchData.slice(0, 10).map(r => `- "${r.title}" - ${r.description?.slice(0, 100) || ''}`).join('\n')}

Extracted Signals:
- Age mentions: ${signals.ages.slice(0, 8).join(', ') || 'None found'}
- Gender mentions: ${signals.genders.slice(0, 5).join(', ') || 'None found'}
- Price perception: ${signals.prices.slice(0, 5).join(', ') || 'None found'}
- Positive sentiment: ${signals.benefits.slice(0, 5).join(', ') || 'None found'}
- Negative sentiment: ${signals.complaints.slice(0, 3).join(', ') || 'None found'}
` : '';

  // Build DYNAMIC prompt using AI-detected category
  const prompt = `Create an audience persona for "${brand} ${product}" buyers in ${country.name}.

PRODUCT CATEGORY: ${aiCategory.category} / ${aiCategory.subcategory}

${searchContext}

MANDATORY REQUIREMENTS (from AI category analysis):

1. GENDER SPLIT: ${aiCategory.genderSplit}
   - This is based on real market research for ${aiCategory.subcategory} buyers
   - Use this exact split, do not change it

2. LOOKALIKE BRANDS - Use ONLY these brands (they are competitors in the same category):
   ${aiCategory.lookalikeBrands.join(', ')}

   DO NOT add brands from other categories. These are the verified competitors for ${brand}.

3. Use the REAL SEARCH DATA above to inform:
   - What platforms this audience uses (based on where discussions happen)
   - Their interests and hobbies (relevant to ${aiCategory.category})
   - Shopping behavior and price sensitivity
   - Values and attitudes

CURRENCY: ${country.currency} (${country.currencySymbol})`;

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

  const persona = JSON.parse(jsonMatch[0]);

  // DEBUG: Log what GPT returned before post-processing
  console.log(`[Persona] RAW GPT RESPONSE - Category: ${aiCategory.category}, Gender before fix: ${persona.demographics?.genderSkew}`);

  // POST-PROCESSING: Always force AI-detected values (GPT often ignores instructions)
  console.log('[Persona] ✅ APPLYING POST-PROCESSING with AI-detected values...');

  // FORCE correct gender from AI category detection
  if (persona.demographics && aiCategory.genderSplit) {
    console.log(`[Persona] Forcing gender from "${persona.demographics.genderSkew}" to "${aiCategory.genderSplit}"`);
    persona.demographics.genderSkew = aiCategory.genderSplit;
  }

  // FORCE correct lookalike brands from AI category detection
  if (aiCategory.lookalikeBrands && aiCategory.lookalikeBrands.length > 0) {
    console.log(`[Persona] Forcing lookalikes to: ${aiCategory.lookalikeBrands.join(', ')}`);
    persona.lookalikeBrands = aiCategory.lookalikeBrands;
  }

  console.log(`[Persona] POST-PROCESSED for ${aiCategory.category} product`);

  return persona;
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

    // STEP 1: Use AI to detect category, gender split, and lookalike brands
    console.log(`[Persona] 🤖 Calling AI for category detection...`);
    const aiCategory = await detectCategoryWithAI(brand, product);
    console.log(`[Persona] ✅ AI DETECTED: ${aiCategory.category} / ${aiCategory.subcategory}`);
    console.log(`[Persona] ✅ AI GENDER: ${aiCategory.genderSplit}`);
    console.log(`[Persona] ✅ AI LOOKALIKES: ${aiCategory.lookalikeBrands.join(', ')}`);

    // Keep legacy detection for backwards compatibility
    const brandCategory = detectBrandCategory(brand);
    const productCategory = aiCategory.subcategory || detectProductCategory(product, brand);
    const isTech = aiCategory.category === 'Technology';

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
    const persona = await analyzeWithGPT(brand, product, topResults, signals, platformDemo, brandCategory, countryData, productCategory, isTech, aiCategory);

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
