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

// Detect product category
function detectCategory(brand: string, product: string): 'tech' | 'beauty' | 'general' {
  const text = `${brand} ${product}`.toLowerCase();

  // Tech keywords
  const techKeywords = ['pixel', 'iphone', 'galaxy', 'phone', 'smartphone', 'android',
    'macbook', 'laptop', 'notebook', 'ipad', 'tablet', 'airpods', 'earbuds', 'headphones',
    'watch', 'smartwatch', 'computer', 'pc', 'gaming', 'console', 'playstation', 'xbox',
    'camera', 'tv', 'television', 'monitor', 'speaker', 'router', 'drone'];

  // Tech brands
  const techBrands = ['google', 'apple', 'samsung', 'microsoft', 'sony', 'lg', 'dell',
    'hp', 'lenovo', 'asus', 'acer', 'oneplus', 'xiaomi', 'huawei', 'motorola', 'nokia',
    'oppo', 'vivo', 'realme', 'honor', 'nintendo', 'nvidia', 'intel', 'amd'];

  if (techKeywords.some(k => text.includes(k)) || techBrands.some(b => text.includes(b))) {
    return 'tech';
  }

  // Beauty keywords
  const beautyKeywords = ['serum', 'moisturizer', 'cream', 'lipstick', 'mascara', 'foundation',
    'shampoo', 'conditioner', 'hair dryer', 'straightener', 'curling', 'skincare', 'makeup'];

  if (beautyKeywords.some(k => text.includes(k))) {
    return 'beauty';
  }

  return 'general';
}

function generateDomains(
  brand: string,
  product: string,
  targetingType: 'branded' | 'generic' | 'competitor',
  country: typeof COUNTRIES[keyof typeof COUNTRIES]
): string[] {
  const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
  const category = detectCategory(brand, product);

  console.log(`[Domains] Brand: ${brand}, Product: ${product}, Category: ${category}`);

  const domains: string[] = [];
  domains.push(`amazon.${country.amazonDomain.split('.').pop()}`);

  if (targetingType === 'branded') {
    // Core brand domains
    domains.push(
      `${brandSlug}.com`,
      `www.${brandSlug}.com`,
      `shop.${brandSlug}.com`,
      `store.${brandSlug}.com`,
      `buy.${brandSlug}.com`,
      `${brandSlug}store.com`,
      `get${brandSlug}.com`,
      `my${brandSlug}.com`
    );

    // Country-specific TLDs
    const countryTlds: Record<string, string> = {
      UK: 'co.uk', DE: 'de', FR: 'fr', IT: 'it', ES: 'es',
      JP: 'co.jp', AU: 'com.au', CA: 'ca', NL: 'nl', SE: 'se'
    };

    if (countryTlds[country.code]) {
      domains.push(
        `${brandSlug}.${countryTlds[country.code]}`,
        `www.${brandSlug}.${countryTlds[country.code]}`
      );
    }

    // Official retail partnerships
    domains.push(
      `${brandSlug}.amazon.com`,
      `amazon.com/${brandSlug}`,
      `${brandSlug}.ebay.com`
    );

    // Social/content domains
    domains.push(
      `${brandSlug}.com/products`,
      `${brandSlug}.com/shop`,
      `support.${brandSlug}.com`,
      `help.${brandSlug}.com`,
      `community.${brandSlug}.com`
    );

    return domains;
  }

  if (targetingType === 'generic') {
    if (category === 'tech') {
      // TECH RETAILERS - 20+ per region
      const techRetailers: Record<string, string[]> = {
        US: [
          'bestbuy.com', 'newegg.com', 'bhphotovideo.com', 'microcenter.com', 'adorama.com',
          'walmart.com', 'target.com', 'costco.com', 'ebay.com', 'backmarket.com',
          'verizon.com', 'att.com', 't-mobile.com', 'apple.com', 'samsung.com',
          'gazelle.com', 'swappa.com', 'woot.com', 'monoprice.com', 'frys.com',
          'staples.com', 'officedepot.com', 'gamestop.com', 'rakuten.com'
        ],
        UK: [
          'currys.co.uk', 'argos.co.uk', 'johnlewis.com', 'ao.com', 'cex.co.uk',
          'ee.co.uk', 'vodafone.co.uk', 'o2.co.uk', 'carphonewarehouse.com', 'apple.com/uk',
          'samsung.com/uk', 'very.co.uk', 'box.co.uk', 'scan.co.uk', 'ebuyer.com',
          'laptopsdirect.co.uk', 'maplin.co.uk', 'richer-sounds.com', 'game.co.uk', 'mobiles.co.uk'
        ],
        FR: [
          'fnac.com', 'darty.com', 'boulanger.com', 'cdiscount.com', 'ldlc.com',
          'backmarket.fr', 'rue-du-commerce.fr', 'materiel.net', 'grosbill.com', 'topachat.com',
          'samsung.com/fr', 'apple.com/fr', 'free.fr', 'orange.fr', 'sfr.fr',
          'bouyguestelecom.fr', 'electrodepot.fr', 'conforama.fr', 'carrefour.fr', 'auchan.fr'
        ],
        DE: [
          'mediamarkt.de', 'saturn.de', 'conrad.de', 'cyberport.de', 'notebooksbilliger.de',
          'alternate.de', 'mindfactory.de', 'caseking.de', 'computeruniverse.de', 'expert.de',
          'euronics.de', 'otto.de', 'kaufland.de', 'lidl.de', 'aldi.de',
          'samsung.de', 'apple.com/de', 'telekom.de', 'vodafone.de', 'o2online.de'
        ],
        IT: [
          'mediaworld.it', 'unieuro.it', 'euronics.it', 'expert.it', 'apple.com/it',
          'samsung.com/it', 'trony.it', 'eprice.it', 'monclick.it', 'bytecno.it',
          'tim.it', 'vodafone.it', 'wind.it', 'fastweb.it', 'comet.it',
          'yeppon.it', 'onlinestore.it', 'redcoon.it', 'stockisti.com', 'amazon.it'
        ],
        ES: [
          'mediamarkt.es', 'pccomponentes.com', 'fnac.es', 'elcorteingles.es', 'worten.es',
          'apple.com/es', 'samsung.com/es', 'phonehouse.es', 'mielectro.es', 'coolmod.com',
          'aussar.es', 'app-informatica.com', 'versus-gamers.com', 'movistar.es', 'orange.es',
          'vodafone.es', 'carrefour.es', 'alcampo.es', 'amazon.es', 'ebay.es'
        ]
      };
      domains.push(...(techRetailers[country.code] || techRetailers.US));
    } else {
      // BEAUTY RETAILERS - 20+ per region
      const beautyRetailers: Record<string, string[]> = {
        US: [
          'ulta.com', 'sephora.com', 'dermstore.com', 'bluemercury.com', 'nordstrom.com',
          'target.com', 'walmart.com', 'walgreens.com', 'cvs.com', 'macys.com',
          'bloomingdales.com', 'neimanmarcus.com', 'saksfifthavenue.com', 'jcpenney.com', 'kohls.com',
          'beautylish.com', 'skinstore.com', 'lookfantastic.com', 'cultbeauty.com', 'violetgrey.com',
          'revolve.com', 'glossier.com', 'colourpop.com', 'fentybeauty.com'
        ],
        UK: [
          'boots.com', 'superdrug.com', 'lookfantastic.com', 'cultbeauty.co.uk', 'spacenk.com',
          'feelunique.com', 'beautybay.com', 'selfridges.com', 'harrods.com', 'libertylondon.com',
          'johnlewis.com', 'debenhams.com', 'marksandspencer.com', 'theperfumeshop.com', 'fragrance-direct.co.uk',
          'asos.com', 'escentual.com', 'mankind.co.uk', 'allbeauty.com', 'sephora.co.uk'
        ],
        FR: [
          'sephora.fr', 'nocibe.fr', 'marionnaud.fr', 'yves-rocher.fr', 'galerieslafayette.com',
          'printemps.com', 'monoprix.fr', 'pharmacie-lafayette.com', 'parapharmacie-en-ligne.com', 'cocooncenter.com',
          'parfumdreams.fr', 'origines-parfums.com', 'tendance-parfums.com', 'beauteprivee.fr', 'look-fantastic.fr',
          'cultbeauty.fr', 'feelunique.fr', 'notino.fr', 'easypara.fr', 'pharmarket.com'
        ],
        DE: [
          'douglas.de', 'dm.de', 'rossmann.de', 'flaconi.de', 'mueller.de',
          'parfumdreams.de', 'notino.de', 'lookfantastic.de', 'beautylish.de', 'sephora.de',
          'galeria.de', 'breuninger.com', 'ludwig-beck.de', 'kadewe.de', 'parfuemerie-pieper.de',
          'asambeauty.com', 'cocopanda.de', 'feelunique.de', 'iparfumerie.de', 'parfum.de'
        ],
        IT: [
          'sephora.it', 'douglas.it', 'kiko.com', 'tigota.it', 'pinalli.it',
          'profumeriaweb.com', 'notino.it', 'lookfantastic.it', 'abiby.it', 'beautyprivee.it',
          'limoni.it', 'marionnaud.it', 'garnier.it', 'lancome.it', 'ysl.com/it',
          'deborah-group.com', 'wycon-cosmetics.com', 'mulac-cosmetics.com', 'nabla.it', 'neve-cosmetics.it'
        ],
        ES: [
          'sephora.es', 'douglas.es', 'primor.eu', 'druni.es', 'perfumesclub.com',
          'elcorteingles.es', 'arenal.com', 'bodybell.com', 'clarel.es', 'perfumerias-if.es',
          'maquillalia.com', 'notino.es', 'lookfantastic.es', 'beautyprivee.es', 'perfumes24h.com',
          'perfumeriasana.es', 'juteco.es', 'deliplus.es', 'mercadona.es', 'carrefour.es'
        ]
      };
      domains.push(...(beautyRetailers[country.code] || beautyRetailers.US));
    }
    return domains;
  }

  if (targetingType === 'competitor') {
    if (category === 'tech') {
      // TECH COMPETITORS - 20+ domains
      domains.push(
        'apple.com', 'samsung.com', 'oneplus.com', 'xiaomi.com', 'huawei.com',
        'sony.com', 'lg.com', 'motorola.com', 'asus.com', 'nokia.com',
        'lenovo.com', 'dell.com', 'hp.com', 'microsoft.com', 'google.com',
        'oppo.com', 'vivo.com', 'realme.com', 'honor.com', 'nothing.tech',
        'tcl.com', 'zte.com', 'razer.com', 'blackberry.com', 'fairphone.com'
      );
    } else {
      // BEAUTY COMPETITORS - 20+ domains
      domains.push(
        'loreal.com', 'maybelline.com', 'revlon.com', 'covergirl.com', 'nyx.com',
        'elfcosmetics.com', 'milanicosmetics.com', 'wetnwild.com', 'rimmel.com', 'almay.com',
        'dyson.com', 'ghd.com', 'babyliss.com', 'olaplex.com', 't3micro.com',
        'theordinary.com', 'cerave.com', 'neutrogena.com', 'clinique.com', 'esteelauder.com',
        'lancome.com', 'shiseido.com', 'dior.com', 'chanel.com', 'yslbeauty.com'
      );
    }
    return domains;
  }

  return domains;
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
