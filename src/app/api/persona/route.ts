import { NextRequest, NextResponse } from 'next/server';

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

async function analyzeWithGPT(brand: string, product: string, searchData: BraveSearchResult[]): Promise<PersonaProfile> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const hasSearchData = searchData.length > 0;
  const searchContext = hasSearchData
    ? searchData.map((r, i) => `${i + 1}. "${r.title}" - ${r.description}`).join('\n')
    : '';

  const prompt = hasSearchData
    ? `You are a market research analyst. Based on the following search results about "${brand} ${product}", create a detailed audience persona profile for the typical consumer of this product.

SEARCH RESULTS:
${searchContext}

Analyze these results and provide a comprehensive audience persona in the following JSON format. Be specific and data-driven based on the search results, but also use your knowledge about this brand/product category to fill gaps:`
    : `You are a market research analyst with deep knowledge of consumer brands. Create a detailed audience persona profile for the typical consumer of "${brand} ${product}".

Use your extensive knowledge about this brand, product category, price point, brand positioning, and target market to create an accurate and detailed persona. Consider:
- The brand's market positioning and values
- The product category and typical consumers
- Price point and what it implies about the target audience
- Common purchase channels for this type of product
- Typical lifestyle and values of consumers who choose this brand

Provide a comprehensive audience persona in the following JSON format:

{
  "demographics": {
    "ageRange": "e.g., 25-45",
    "genderSkew": "e.g., 70% Female, 30% Male",
    "incomeLevel": "e.g., Middle to Upper-Middle ($60K-$120K)",
    "education": "e.g., College educated",
    "location": "e.g., Urban/Suburban areas, eco-conscious regions"
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
          content: prompt,
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
    const { brand, product } = await request.json();

    if (!brand || !product) {
      return NextResponse.json(
        { success: false, error: 'Brand and product are required' },
        { status: 400 }
      );
    }

    // Collect search data from multiple angles
    const searchQueries = [
      `${brand} ${product} review`,
      `${brand} ${product} who uses`,
      `${brand} ${product} reddit`,
      `${brand} ${product} best for`,
      `"${brand}" "${product}" customer`,
      `${brand} target audience demographic`,
    ];

    // Execute searches in parallel
    const searchPromises = searchQueries.map(q => searchBrave(q, 5));
    const searchResults = await Promise.all(searchPromises);

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

    // Limit to top 20 results for GPT analysis
    const topResults = allResults.slice(0, 20);

    // Analyze with GPT
    const persona = await analyzeWithGPT(brand, product, topResults);

    return NextResponse.json({
      success: true,
      data: {
        brand,
        product,
        persona,
        sourcesCount: topResults.length,
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
