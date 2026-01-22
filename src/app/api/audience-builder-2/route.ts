import { NextRequest, NextResponse } from 'next/server';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// Brand data with categories, subcategories, and competitors
const BRAND_DATA: Record<string, {
  name: string;
  categories: Record<string, {
    name: string;
    subCategories: string[];
    competitors: string[];
    genericTerms: string[];
  }>;
}> = {
  babyliss: {
    name: 'Babyliss',
    categories: {
      hairdryers: {
        name: 'Hair Dryers',
        subCategories: ['Professional', 'Travel', 'Ionic', 'Lightweight', 'Salon', 'Diffuser'],
        competitors: ['Dyson', 'GHD', 'T3', 'Hot Tools', 'Conair', 'Revlon', 'Remington', 'Chi', 'BioIonic'],
        genericTerms: ['hair dryer', 'blow dryer', 'ionic dryer', 'professional dryer', 'fast drying', 'lightweight dryer', 'salon dryer', 'quiet hair dryer', 'best hair dryer', 'affordable hair dryer'],
      },
      straighteners: {
        name: 'Straighteners',
        subCategories: ['Flat Iron', 'Steam', 'Mini', 'Wide Plate', 'Titanium', 'Ceramic', 'Travel'],
        competitors: ['GHD', 'Chi', 'T3', 'HSI', 'Paul Mitchell', 'Hot Tools', 'Remington', 'Conair', 'Kristin Ess'],
        genericTerms: ['flat iron', 'hair straightener', 'ceramic straightener', 'titanium flat iron', 'steam straightener', 'travel straightener', 'professional flat iron', 'best straightener', 'silk press iron'],
      },
      curlingirons: {
        name: 'Curling Irons',
        subCategories: ['Wand', 'Auto Curler', 'Marcel', 'Clipless', 'Interchangeable', 'Tapered', 'Triple Barrel'],
        competitors: ['GHD', 'T3', 'Hot Tools', 'Conair', 'Remington', 'Beachwaver', 'Bio Ionic', 'Drybar'],
        genericTerms: ['curling iron', 'curling wand', 'beach waves', 'auto curler', 'clipless curler', 'marcel iron', 'best curling iron', 'long lasting curls', 'professional curler'],
      },
      hotairbrushes: {
        name: 'Hot Air Brushes',
        subCategories: ['Blow Dry Brush', 'Rotating', 'Volumizing', 'One-Step', 'Round Brush', 'Paddle'],
        competitors: ['Dyson Airwrap', 'Revlon One-Step', 'Drybar', 'Hot Tools', 'Conair', 'T3', 'Shark'],
        genericTerms: ['hot air brush', 'blow dry brush', 'one step dryer', 'volumizing brush', 'rotating brush', 'salon blowout', 'at home blowout', 'best hot air brush'],
      },
      clippers: {
        name: 'Clippers & Trimmers',
        subCategories: ['Hair Clippers', 'Beard Trimmers', 'Body Groomers', 'Detail Trimmers', 'Nose Ear Trimmers'],
        competitors: ['Wahl', 'Andis', 'Philips Norelco', 'Braun', 'Remington', 'Manscaped', 'Bevel'],
        genericTerms: ['hair clippers', 'beard trimmer', 'body groomer', 'detail trimmer', 'professional clippers', 'cordless trimmer', 'best clippers', 'home haircut'],
      },
      mensgrooming: {
        name: "Men's Grooming",
        subCategories: ['Electric Shavers', 'Beard Styling', 'Grooming Kits', 'Foil Shavers', 'Rotary Shavers'],
        competitors: ['Philips Norelco', 'Braun', 'Panasonic', 'Wahl', 'Remington', 'Gillette', 'Bevel'],
        genericTerms: ['electric shaver', 'beard grooming', 'grooming kit', 'mens shaver', 'foil shaver', 'rotary shaver', 'best electric razor', 'close shave'],
      },
    },
  },
  revlon: {
    name: 'Revlon',
    categories: {
      lip: {
        name: 'Lip',
        subCategories: ['Lipstick', 'Lip Gloss', 'Lip Liner', 'Lip Stain', 'Lip Balm', 'Liquid Lipstick'],
        competitors: ['Maybelline', "L'Oreal", 'NYX', 'CoverGirl', 'Milani', 'Elf', 'Wet n Wild', 'Rimmel'],
        genericTerms: ['lipstick', 'lip gloss', 'lip liner', 'matte lipstick', 'long lasting lip', 'drugstore lipstick', 'best lip color', 'lip stain', 'liquid lipstick'],
      },
      face: {
        name: 'Face',
        subCategories: ['Foundation', 'Concealer', 'Powder', 'Primer', 'Blush', 'Bronzer', 'Highlighter', 'Setting Spray'],
        competitors: ['Maybelline', "L'Oreal", 'NYX', 'CoverGirl', 'Elf', 'Milani', 'Physicians Formula', 'Neutrogena'],
        genericTerms: ['foundation', 'concealer', 'setting powder', 'face primer', 'blush', 'bronzer', 'highlighter', 'drugstore foundation', 'full coverage', 'natural finish'],
      },
      eye: {
        name: 'Eye',
        subCategories: ['Mascara', 'Eyeshadow', 'Eyeliner', 'Brow Pencil', 'Brow Gel', 'Eye Primer', 'Lash Serum'],
        competitors: ['Maybelline', "L'Oreal", 'NYX', 'CoverGirl', 'Elf', 'Milani', 'Essence', 'Wet n Wild'],
        genericTerms: ['mascara', 'eyeshadow palette', 'eyeliner', 'brow pencil', 'volumizing mascara', 'waterproof mascara', 'drugstore eyeshadow', 'best mascara'],
      },
      nail: {
        name: 'Nail',
        subCategories: ['Nail Polish', 'Nail Care', 'Base Coat', 'Top Coat', 'Nail Treatment', 'Gel Polish'],
        competitors: ['OPI', 'Essie', 'Sally Hansen', 'Orly', 'Zoya', 'CND', 'Ella+Mila', 'Olive & June'],
        genericTerms: ['nail polish', 'nail color', 'gel polish', 'base coat', 'top coat', 'nail strengthener', 'drugstore nail polish', 'long lasting polish'],
      },
      haircolor: {
        name: 'Hair Color',
        subCategories: ['Permanent Color', 'Root Touch-Up', 'Semi-Permanent', 'Color Depositing', 'Highlights'],
        competitors: ["L'Oreal", 'Clairol', 'Garnier', 'Madison Reed', 'dpHUE', 'Schwarzkopf', 'Wella'],
        genericTerms: ['hair dye', 'hair color', 'root touch up', 'box dye', 'at home color', 'permanent hair color', 'semi permanent dye', 'gray coverage'],
      },
      hairtools: {
        name: 'Hair Tools',
        subCategories: ['Hair Dryers', 'Straighteners', 'One-Step Brush', 'Curling Irons'],
        competitors: ['Babyliss', 'Conair', 'Hot Tools', 'Chi', 'Remington', 'Drybar', 'T3'],
        genericTerms: ['hair dryer', 'one step dryer', 'blow dry brush', 'flat iron', 'curling iron', 'volumizer', 'drugstore hair tools'],
      },
    },
  },
  weleda: {
    name: 'Weleda',
    categories: {
      facecare: {
        name: 'Face Care',
        subCategories: ['Cleanser', 'Toner', 'Moisturizer', 'Serum', 'Eye Cream', 'Face Oil', 'Night Cream'],
        competitors: ["Burt's Bees", 'Dr. Hauschka', 'Herbivore', 'Tata Harper', 'Pai', 'Kora Organics', 'Juice Beauty', 'Eminence'],
        genericTerms: ['natural skincare', 'organic face cream', 'face oil', 'natural moisturizer', 'clean beauty', 'plant based skincare', 'gentle cleanser', 'natural serum'],
      },
      bodycare: {
        name: 'Body Care',
        subCategories: ['Body Lotion', 'Body Oil', 'Body Wash', 'Deodorant', 'Hand Cream', 'Foot Cream'],
        competitors: ["Burt's Bees", "Dr. Bronner's", 'Aveeno', 'Eucerin', 'CeraVe', 'Nivea', 'The Body Shop', "L'Occitane"],
        genericTerms: ['natural body lotion', 'body oil', 'organic body wash', 'natural deodorant', 'hand cream', 'dry skin lotion', 'plant based body care'],
      },
      babycare: {
        name: 'Baby Care',
        subCategories: ['Baby Lotion', 'Diaper Cream', 'Baby Oil', 'Baby Wash', 'Baby Shampoo', 'Calendula'],
        competitors: ["Burt's Bees Baby", 'Aveeno Baby', 'Mustela', 'Babyganics', 'Earth Mama', 'Honest Company', 'Cetaphil Baby'],
        genericTerms: ['natural baby lotion', 'organic diaper cream', 'baby oil', 'gentle baby wash', 'natural baby products', 'sensitive baby skin', 'calendula baby'],
      },
      haircare: {
        name: 'Hair Care',
        subCategories: ['Shampoo', 'Conditioner', 'Hair Oil', 'Scalp Treatment', 'Hair Tonic', 'Leave-In'],
        competitors: ['Briogeo', 'Rahua', 'Acure', 'Avalon Organics', 'Giovanni', 'Shea Moisture', 'Maui Moisture'],
        genericTerms: ['natural shampoo', 'organic conditioner', 'hair oil', 'scalp treatment', 'plant based hair care', 'sulfate free shampoo', 'natural hair growth'],
      },
      oralcare: {
        name: 'Oral Care',
        subCategories: ['Toothpaste', 'Mouthwash', 'Gum Care'],
        competitors: ["Tom's of Maine", "Dr. Bronner's", 'Hello', "Burt's Bees", 'Desert Essence', 'Jason', 'Auromere'],
        genericTerms: ['natural toothpaste', 'fluoride free toothpaste', 'organic mouthwash', 'plant based oral care', 'gentle toothpaste', 'herbal toothpaste'],
      },
      menscare: {
        name: "Men's Care",
        subCategories: ['Shaving Cream', 'Aftershave', "Men's Moisturizer", 'Beard Oil'],
        competitors: ["Burt's Bees Men", 'Every Man Jack', 'Bulldog', "Dr. Bronner's", 'Jack Black', "Kiehl's"],
        genericTerms: ['natural shaving cream', 'organic aftershave', 'mens moisturizer', 'natural mens skincare', 'beard oil', 'plant based mens care'],
      },
      massage: {
        name: 'Massage & Wellness',
        subCategories: ['Massage Oil', 'Arnica Products', 'Muscle Relief', 'Relaxation Oil', 'Bath Milk'],
        competitors: ['Badger', 'Saje', 'Kneipp', 'Tisserand', 'Now Foods', 'Aura Cacia', 'doTERRA'],
        genericTerms: ['massage oil', 'arnica gel', 'muscle relief', 'relaxation oil', 'natural pain relief', 'aromatherapy oil', 'sore muscle treatment'],
      },
      pregnancy: {
        name: 'Pregnancy & Nursing',
        subCategories: ['Stretch Mark Oil', 'Nursing Balm', 'Perineum Oil', 'Belly Balm', 'Nipple Cream'],
        competitors: ['Bio-Oil', "Palmer's", 'Mustela', 'Earth Mama', 'Motherlove', 'Lansinoh', 'Bamboobies'],
        genericTerms: ['stretch mark oil', 'nursing balm', 'pregnancy belly oil', 'nipple cream', 'natural stretch mark', 'organic pregnancy skincare'],
      },
    },
  },
};

// Targetable domains for beauty/personal care (NO walled gardens like YouTube, Amazon, TikTok, Instagram, Facebook)
const TARGETABLE_DOMAINS = {
  beautyBlogs: [
    'allure.com',
    'byrdie.com',
    'temptalia.com',
    'beautylish.com',
    'makeupandbeautyblog.com',
    'musingsofamuse.com',
    'thebeautylookbook.com',
    'reallyree.com',
    'intothegloss.com',
    'thecut.com/beauty',
    'coveteur.com',
    'manrepeller.com',
  ],
  reviewSites: [
    'makeupalley.com',
    'influenster.com',
    'totalbeauty.com',
    'beautypedia.com',
    'skincarisma.com',
    'beautylish.com',
    'trustpilot.com',
    'goodhousekeeping.com',
  ],
  magazines: [
    'vogue.com',
    'elle.com',
    'cosmopolitan.com',
    'glamour.com',
    'harpersbazaar.com',
    'marieclaire.com',
    'instyle.com',
    'refinery29.com',
    'whowhatwear.com',
    'popsugar.com',
    'self.com',
    'shape.com',
    'womenshealthmag.com',
  ],
  lifestyle: [
    'mindbodygreen.com',
    'wellandgood.com',
    'thethirty.com',
    'theeverygirl.com',
    'cupcakesandcashmere.com',
    'apartmenttherapy.com',
    'mydomaine.com',
    'thespruce.com',
  ],
  hairSpecific: [
    'naturallycurly.com',
    'hairromance.com',
    'therighthair.com',
    'latest-hairstyles.com',
    'hairfinder.com',
    'behindthechair.com',
    'modernsalon.com',
    'hairdresser-models.eu',
  ],
  skincareSpecific: [
    'paulaschoice.com/expert-advice',
    'dermstore.com/blog',
    'skincareaddiction.com',
    'thekindedit.com',
    'beautifulwithbrains.com',
    'labmuffin.com',
    'simpleskincarescience.com',
  ],
  naturalBeauty: [
    'organicauthority.com',
    'treehugger.com',
    'thegoodtrade.com',
    'leapingbunny.org',
    'ewg.org',
    'safecosmetics.org',
    'greenmatters.com',
  ],
  menGrooming: [
    'gq.com',
    'esquire.com',
    'menshealth.com',
    'askmen.com',
    'toolsofmen.com',
    'baldingbeards.com',
    'themanual.com',
    'mensjournal.com',
  ],
};

// Fetch real keywords from Brave Search API
async function fetchBraveKeywords(query: string, count: number = 10): Promise<string[]> {
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
    const keywords: string[] = [];

    // Extract keywords from titles and descriptions
    if (data.web?.results) {
      for (const result of data.web.results) {
        // Extract from title
        if (result.title) {
          const titleWords = result.title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((w: string) => w.length > 3);
          keywords.push(...titleWords.slice(0, 3));
        }
        // Extract meaningful phrases from description
        if (result.description) {
          const desc = result.description.toLowerCase();
          // Look for brand mentions and product terms
          const matches = desc.match(/\b[a-z]+\s+[a-z]+\b/g) || [];
          keywords.push(...matches.slice(0, 2));
        }
      }
    }

    // Deduplicate and return
    return [...new Set(keywords)].slice(0, 20);
  } catch (error) {
    console.error('Brave API error:', error);
    return [];
  }
}

// Generate keywords based on brand, category, subcategory, and targeting type
async function generateKeywords(
  brand: string,
  category: string,
  subCategory: string,
  targetingType: 'branded' | 'generic' | 'competitor'
): Promise<string[]> {
  const brandData = BRAND_DATA[brand.toLowerCase()];
  if (!brandData) return [];

  const categoryData = brandData.categories[category];
  if (!categoryData) return [];

  const brandName = brandData.name;
  const subCatLower = subCategory.toLowerCase();

  switch (targetingType) {
    case 'branded':
      // Brand + category/subcategory combinations
      const brandedKeywords = [
        `${brandName} ${categoryData.name.toLowerCase()}`,
        `${brandName} ${subCatLower}`,
        `${brandName} ${subCatLower} review`,
        `${brandName} ${subCatLower} best`,
        `best ${brandName} ${subCatLower}`,
        `${brandName} ${subCatLower} 2024`,
        `${brandName} ${subCatLower} 2025`,
        `${brandName} pro ${subCatLower}`,
        `${brandName} ${subCatLower} price`,
        `${brandName} ${subCatLower} sale`,
        `buy ${brandName} ${subCatLower}`,
        `${brandName} ${subCatLower} vs`,
        `is ${brandName} ${subCatLower} good`,
        `${brandName} ${subCatLower} worth it`,
        `${brandName} ${subCatLower} tutorial`,
        `how to use ${brandName} ${subCatLower}`,
        `${brandName} ${subCatLower} for thick hair`,
        `${brandName} ${subCatLower} for fine hair`,
        `${brandName} ${subCatLower} settings`,
        `${brandName} ${subCatLower} comparison`,
      ];

      // Try to enrich with Brave API
      if (BRAVE_API_KEY) {
        const braveKeywords = await fetchBraveKeywords(`${brandName} ${subCatLower} review`, 5);
        brandedKeywords.push(...braveKeywords.filter(k => k.includes(brandName.toLowerCase())));
      }

      return [...new Set(brandedKeywords)];

    case 'generic':
      // Generic category terms
      const genericBase = categoryData.genericTerms.flatMap(term => [
        term,
        `best ${term}`,
        `${term} review`,
        `${term} 2025`,
        `top ${term}`,
        `${term} for beginners`,
        `affordable ${term}`,
        `professional ${term}`,
      ]);

      // Try to enrich with Brave API
      if (BRAVE_API_KEY) {
        const braveGeneric = await fetchBraveKeywords(`best ${categoryData.name.toLowerCase()} 2025`, 5);
        genericBase.push(...braveGeneric);
      }

      return [...new Set(genericBase)].slice(0, 30);

    case 'competitor':
      // Fetch real competitor data from Brave API
      const competitorKeywords: string[] = [];

      for (const comp of categoryData.competitors.slice(0, 5)) {
        competitorKeywords.push(
          `${comp} ${subCatLower}`,
          `${comp} ${categoryData.name.toLowerCase()}`,
          `${comp} ${subCatLower} review`,
          `${comp} vs ${brandName}`,
          `${brandName} vs ${comp}`,
          `${comp} ${subCatLower} price`,
          `best ${comp} ${subCatLower}`,
        );

        // Try to get real competitor data from Brave
        if (BRAVE_API_KEY) {
          const braveComp = await fetchBraveKeywords(`${comp} ${subCatLower}`, 3);
          competitorKeywords.push(...braveComp);
        }
      }

      return [...new Set(competitorKeywords)].slice(0, 40);

    default:
      return [];
  }
}

// Generate targetable domains based on brand category
function generateDomains(
  brand: string,
  category: string,
  targetingType: 'branded' | 'generic' | 'competitor'
): string[] {
  const brandData = BRAND_DATA[brand.toLowerCase()];
  if (!brandData) return [];

  const categoryData = brandData.categories[category];
  if (!categoryData) return [];

  // Determine which domain categories to include based on the brand/category
  const isHairCategory = ['hairdryers', 'straighteners', 'curlingirons', 'hotairbrushes', 'haircare', 'haircolor', 'hairtools'].includes(category);
  const isSkinCategory = ['facecare', 'bodycare', 'skincare'].includes(category);
  const isNaturalBrand = brand.toLowerCase() === 'weleda';
  const isMensCategory = ['clippers', 'mensgrooming', 'menscare'].includes(category);

  switch (targetingType) {
    case 'branded':
      // Sites that would review/mention the brand
      const brandedDomains = [
        ...TARGETABLE_DOMAINS.beautyBlogs,
        ...TARGETABLE_DOMAINS.reviewSites,
        ...TARGETABLE_DOMAINS.magazines.slice(0, 8),
      ];

      if (isHairCategory) {
        brandedDomains.push(...TARGETABLE_DOMAINS.hairSpecific);
      }
      if (isSkinCategory) {
        brandedDomains.push(...TARGETABLE_DOMAINS.skincareSpecific);
      }
      if (isNaturalBrand) {
        brandedDomains.push(...TARGETABLE_DOMAINS.naturalBeauty);
      }
      if (isMensCategory) {
        brandedDomains.push(...TARGETABLE_DOMAINS.menGrooming);
      }

      return [...new Set(brandedDomains)];

    case 'generic':
      // General beauty/category content sites
      const genericDomains = [
        ...TARGETABLE_DOMAINS.beautyBlogs,
        ...TARGETABLE_DOMAINS.magazines,
        ...TARGETABLE_DOMAINS.lifestyle,
      ];

      if (isHairCategory) {
        genericDomains.push(...TARGETABLE_DOMAINS.hairSpecific);
      }
      if (isSkinCategory) {
        genericDomains.push(...TARGETABLE_DOMAINS.skincareSpecific);
      }
      if (isNaturalBrand) {
        genericDomains.push(...TARGETABLE_DOMAINS.naturalBeauty);
      }
      if (isMensCategory) {
        genericDomains.push(...TARGETABLE_DOMAINS.menGrooming);
      }

      return [...new Set(genericDomains)];

    case 'competitor':
      // Competitor brand domains (actual brand websites)
      return categoryData.competitors.map(comp => {
        const cleanName = comp.toLowerCase()
          .replace(/['\s]/g, '')
          .replace('é', 'e');
        return `${cleanName}.com`;
      });

    default:
      return [];
  }
}

export async function GET() {
  try {
    // Return brand structure for the UI
    const brands = Object.entries(BRAND_DATA).map(([id, data]) => ({
      id,
      name: data.name,
      categories: Object.entries(data.categories).map(([catId, catData]) => ({
        id: catId,
        name: catData.name,
        subCategories: catData.subCategories,
      })),
    }));

    return NextResponse.json({
      success: true,
      brands,
    });
  } catch (error) {
    console.error('Audience Builder 2.0 GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load brand data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, category, subCategory, targetingTypes } = body;

    if (!brand || !category || !subCategory) {
      return NextResponse.json(
        { success: false, error: 'Brand, category, and sub-category are required' },
        { status: 400 }
      );
    }

    const results: Record<string, { keywords: string[]; domains: string[] }> = {};

    // Generate results for each targeting type
    for (const targetingType of targetingTypes || ['branded', 'generic', 'competitor']) {
      const keywords = await generateKeywords(brand, category, subCategory, targetingType);
      const domains = generateDomains(brand, category, targetingType);

      results[targetingType] = {
        keywords,
        domains,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        brand: BRAND_DATA[brand.toLowerCase()]?.name || brand,
        category,
        subCategory,
        results,
      },
      usedBraveAPI: !!BRAVE_API_KEY,
    });
  } catch (error) {
    console.error('Audience Builder 2.0 POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate audience data' },
      { status: 500 }
    );
  }
}
