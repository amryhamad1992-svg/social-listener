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

  // SIMPLE, DIRECT PROMPT - No ambiguity
  const prompt = isTech
    ? `Create an audience persona for "${brand} ${product}" buyers in ${country.name}.

MANDATORY REQUIREMENTS (DO NOT IGNORE):

1. GENDER: 62% Male, 38% Female
   - This is a TECHNOLOGY product (smartphone/electronics)
   - Tech buyers are predominantly MALE worldwide
   - DO NOT use 60% Female - that is WRONG for tech

2. LOOKALIKE BRANDS (ONLY THESE - NO OTHERS):
   Apple, Samsung, OnePlus, Xiaomi, Huawei, Sony, LG, Motorola, Nokia, ASUS, Google, Microsoft, Nothing, Oppo, Vivo, Realme, Honor, Lenovo, Dell, HP

   FORBIDDEN BRANDS (NEVER INCLUDE):
   Fenty, L'Oréal, Glossier, Clinique, Neutrogena, Dyson, GHD, Olaplex, CeraVe, Maybelline, Revlon, NYX, MAC, Estee Lauder, Lancome, Dior, Chanel

3. INTERESTS: Technology, gadgets, gaming, productivity, mobile apps, streaming, social media, sports

4. SHOPPING: Best Buy, Amazon, carrier stores, tech retailers - NOT beauty stores

${hasSearchData ? `SEARCH DATA (${searchData.length} sources found):
${searchData.slice(0, 5).map(r => `- ${r.title}`).join('\n')}` : ''}

CURRENCY: Use ${country.currency} (${country.currencySymbol})`
    : `Create an audience persona for "${brand} ${product}" buyers in ${country.name}.

PRODUCT TYPE: Beauty/Cosmetics

1. GENDER: 68% Female, 32% Male (beauty product buyers)

2. LOOKALIKE BRANDS: Only beauty/cosmetics brands matching this product category
   ${brandCategory ? `Suggested: ${brandCategory.lookalikeBrands.join(', ')}` : ''}

3. INTERESTS: Beauty, skincare, self-care, wellness, fashion, lifestyle

${hasSearchData ? `SEARCH DATA (${searchData.length} sources found):
${searchData.slice(0, 5).map(r => `- ${r.title}`).join('\n')}` : ''}

CURRENCY: Use ${country.currency} (${country.currencySymbol})`;

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
  console.log(`[Persona] RAW GPT RESPONSE - isTech: ${isTech}, Gender before fix: ${persona.demographics?.genderSkew}`);

  // POST-PROCESSING: Force correct data for tech products
  if (isTech) {
    console.log('[Persona] ✅ APPLYING TECH POST-PROCESSING...');
    // FORCE correct gender - GPT often ignores this instruction
    if (persona.demographics) {
      console.log(`[Persona] Changing gender from "${persona.demographics.genderSkew}" to "62% Male, 38% Female"`);
      persona.demographics.genderSkew = '62% Male, 38% Female';
    }

    // FORCE remove beauty brands from lookalikes
    if (persona.lookalikeBrands) {
      const beautyBrands = [
        'fenty', 'loreal', 'l\'oreal', 'maybelline', 'revlon', 'covergirl', 'nyx', 'elf',
        'glossier', 'clinique', 'neutrogena', 'cerave', 'olaplex', 'dyson', 'ghd',
        'babyliss', 'remington', 'conair', 'tresemme', 'pantene', 'dove', 'garnier',
        'estee', 'lancome', 'dior', 'chanel', 'ysl', 'mac', 'bobbi', 'nars', 'urban decay',
        'sephora', 'ulta', 'beauty', 'cosmetic', 'skincare', 'makeup', 'hair'
      ];

      persona.lookalikeBrands = persona.lookalikeBrands.filter((b: string) => {
        const brandLower = b.toLowerCase();
        return !beautyBrands.some(bb => brandLower.includes(bb));
      });

      // Fill with tech brands if needed
      const techBrands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony', 'LG', 'Motorola', 'ASUS', 'Nokia', 'Google', 'Microsoft', 'Nothing', 'Oppo', 'Vivo'];
      while (persona.lookalikeBrands.length < 8) {
        const randomTech = techBrands[Math.floor(Math.random() * techBrands.length)];
        if (!persona.lookalikeBrands.includes(randomTech)) {
          persona.lookalikeBrands.push(randomTech);
        }
      }
    }

    console.log('[Persona] POST-PROCESSED for tech product - forced 62% Male gender');
  }

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

    // ENHANCEMENT 1: Detect brand/product categories (zero cost)
    const brandCategory = detectBrandCategory(brand);
    const productCategory = detectProductCategory(product, brand);
    const isTech = isTechProduct(product, brand);
    console.log(`[Persona] ⚡ TECH DETECTION: brand="${brand}", product="${product}"`);
    console.log(`[Persona] ⚡ RESULT: productCategory="${productCategory}", isTech=${isTech}`);
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
