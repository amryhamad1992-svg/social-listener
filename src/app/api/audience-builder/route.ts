import { NextRequest, NextResponse } from 'next/server';
import { COUNTRIES } from '@/constants/countries';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

    // Generate domain recommendations
    const domains = generateDomains(brand, product, targetingType, country);

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

function generateDomains(
  brand: string,
  product: string,
  targetingType: 'branded' | 'generic' | 'competitor',
  country: typeof COUNTRIES[keyof typeof COUNTRIES]
): string[] {
  const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
  const combined = `${brand} ${product}`.toLowerCase();

  // Detect if tech product
  const isTech = /(pixel|iphone|galaxy|android|phone|smartphone|macbook|laptop|ipad|tablet|airpods|watch|smartwatch|computer|gaming)/i.test(combined);

  const domains: string[] = [];

  // Always include official Amazon domain for the country
  domains.push(`amazon.${country.amazonDomain.split('.').pop()}`);

  switch (targetingType) {
    case 'branded':
      // Official brand sites
      domains.push(`${brandSlug}.com`);
      domains.push(`www.${brandSlug}.com`);
      domains.push(`shop.${brandSlug}.com`);
      domains.push(`store.${brandSlug}.com`);
      domains.push(`buy.${brandSlug}.com`);
      // Country-specific brand sites
      if (country.code !== 'US') {
        const tld = country.code === 'UK' ? 'co.uk' : country.code.toLowerCase();
        domains.push(`${brandSlug}.${tld}`);
        domains.push(`www.${brandSlug}.${tld}`);
      }
      // Social commerce
      domains.push(`${brandSlug}.shop`);
      domains.push(`${brandSlug}.store`);
      break;

    case 'generic':
      if (isTech) {
        // Tech retailers by country
        if (country.code === 'US') {
          domains.push('bestbuy.com', 'apple.com', 'samsung.com', 'newegg.com', 'bhphotovideo.com',
            'microcenter.com', 'adorama.com', 'walmart.com', 'target.com', 'costco.com',
            'ebay.com', 'backmarket.com', 'gazelle.com', 'swappa.com', 'decluttr.com',
            'verizon.com', 'att.com', 't-mobile.com', 'google.com/store', 'microsoft.com/store');
        } else if (country.code === 'UK') {
          domains.push('currys.co.uk', 'argos.co.uk', 'johnlewis.com', 'very.co.uk', 'ao.com',
            'pcworld.co.uk', 'carphonewarehouse.com', 'apple.com/uk', 'samsung.com/uk',
            'ee.co.uk', 'vodafone.co.uk', 'o2.co.uk', 'three.co.uk', 'scan.co.uk',
            'overclockers.co.uk', 'cex.co.uk', 'musicmagpie.co.uk', 'amazon.co.uk');
        } else if (country.code === 'FR') {
          domains.push('fnac.com', 'darty.com', 'boulanger.com', 'cdiscount.com', 'ldlc.com',
            'materiel.net', 'rueducommerce.fr', 'apple.com/fr', 'samsung.com/fr',
            'orange.fr', 'sfr.fr', 'bouyguestelecom.fr', 'backmarket.fr');
        } else if (country.code === 'DE') {
          domains.push('mediamarkt.de', 'saturn.de', 'conrad.de', 'cyberport.de', 'notebooksbilliger.de',
            'alternate.de', 'mindfactory.de', 'apple.com/de', 'samsung.com/de',
            'telekom.de', 'vodafone.de', 'o2online.de', 'rebuy.de', 'clevertronic.de');
        } else if (country.code === 'IT') {
          domains.push('mediaworld.it', 'unieuro.it', 'euronics.it', 'trony.it', 'expert.it',
            'apple.com/it', 'samsung.com/it', 'tim.it', 'vodafone.it', 'windtre.it');
        } else if (country.code === 'ES') {
          domains.push('mediamarkt.es', 'pccomponentes.com', 'elcorteingles.es', 'fnac.es', 'worten.es',
            'apple.com/es', 'samsung.com/es', 'movistar.es', 'orange.es', 'vodafone.es');
        }
      } else {
        // Beauty/health retailers by country
        if (country.code === 'US') {
          domains.push('ulta.com', 'sephora.com', 'target.com', 'walmart.com', 'walgreens.com',
            'cvs.com', 'dermstore.com', 'bluemercury.com', 'spacenk.com', 'beautylish.com',
            'nordstrom.com', 'macys.com', 'kohls.com', 'tjmaxx.com', 'marshalls.com');
        } else if (country.code === 'UK') {
          domains.push('boots.com', 'superdrug.com', 'lookfantastic.com', 'feelunique.com', 'beautybay.com',
            'cultbeauty.co.uk', 'spacenk.com', 'johnlewis.com', 'marksandspencer.com', 'debenhams.com');
        } else if (country.code === 'FR') {
          domains.push('sephora.fr', 'nocibe.fr', 'marionnaud.fr', 'beautysuccess.fr', 'yves-rocher.fr',
            'monoprix.fr', 'galerieslafayette.com', 'printemps.com');
        } else if (country.code === 'DE') {
          domains.push('douglas.de', 'dm.de', 'rossmann.de', 'mueller.de', 'flaconi.de',
            'parfumdreams.de', 'notino.de', 'beautywelt.de');
        } else if (country.code === 'IT') {
          domains.push('sephora.it', 'douglas.it', 'tigota.it', 'kiko.com', 'limoni.it');
        } else if (country.code === 'ES') {
          domains.push('primor.eu', 'douglas.es', 'sephora.es', 'druni.es', 'perfumeriasjulia.es');
        }
      }
      break;

    case 'competitor':
      if (isTech) {
        // Tech competitor brands
        domains.push('apple.com', 'samsung.com', 'oneplus.com', 'xiaomi.com', 'huawei.com',
          'sony.com', 'lg.com', 'motorola.com', 'asus.com', 'nokia.com',
          'lenovo.com', 'dell.com', 'hp.com', 'microsoft.com', 'google.com',
          'oppo.com', 'vivo.com', 'realme.com', 'honor.com', 'tcl.com');
      } else {
        // Beauty competitor brands
        domains.push('loreal.com', 'maybelline.com', 'revlon.com', 'covergirl.com',
          'dyson.com', 'ghd.com', 'babyliss.com', 'conair.com', 'olaplex.com',
          'theordinary.com', 'cerave.com', 'neutrogena.com', 'clinique.com', 'esteelauder.com');
      }
      break;
  }

  return domains.slice(0, 25); // Increased from 10 to 25
}

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
