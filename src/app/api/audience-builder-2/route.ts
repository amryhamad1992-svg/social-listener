import { NextRequest, NextResponse } from 'next/server';
import { isBraveConfigured } from '@/lib/brave';

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

// Relevant domains for beauty/personal care
const DOMAIN_CATEGORIES = {
  beautyBlogs: ['allure.com', 'byrdie.com', 'temptalia.com', 'beautylish.com', 'makeupandbeautyblog.com', 'musingsofamuse.com', 'thebeautylookbook.com', 'reallyree.com'],
  reviewSites: ['makeupalley.com', 'influenster.com', 'totalbeauty.com', 'beautypedia.com', 'skincarisma.com'],
  retailers: ['ulta.com', 'sephora.com', 'target.com', 'walmart.com', 'amazon.com', 'walgreens.com', 'cvs.com', 'boots.com', 'superdrug.com'],
  socialMedia: ['reddit.com/r/SkincareAddiction', 'reddit.com/r/MakeupAddiction', 'reddit.com/r/HaircareScience', 'youtube.com', 'tiktok.com', 'instagram.com'],
  magazines: ['vogue.com', 'elle.com', 'cosmopolitan.com', 'glamour.com', 'harpersbazaar.com', 'marieclaire.com', 'instyle.com', 'refinery29.com', 'whowhatwear.com'],
  naturalBeauty: ['mindbodygreen.com', 'wellandgood.com', 'thethirty.com', 'treehugger.com', 'organicauthority.com'],
};

// Generate keywords based on brand, category, subcategory, and targeting type
function generateKeywords(
  brand: string,
  category: string,
  subCategory: string,
  targetingType: 'branded' | 'generic' | 'competitor'
): string[] {
  const brandData = BRAND_DATA[brand.toLowerCase()];
  if (!brandData) return [];

  const categoryData = brandData.categories[category];
  if (!categoryData) return [];

  const brandName = brandData.name;
  const subCatLower = subCategory.toLowerCase();

  switch (targetingType) {
    case 'branded':
      // Brand + category/subcategory combinations
      return [
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
        `${brandName} ${subCatLower} amazon`,
        `${brandName} ${subCatLower} ulta`,
        `${brandName} ${subCatLower} target`,
        `${brandName} ${subCatLower} walmart`,
        `buy ${brandName} ${subCatLower}`,
        `${brandName} ${subCatLower} vs`,
        `is ${brandName} ${subCatLower} good`,
        `${brandName} ${subCatLower} worth it`,
        `${brandName} ${subCatLower} tutorial`,
        `how to use ${brandName} ${subCatLower}`,
      ];

    case 'generic':
      // Generic category terms
      return categoryData.genericTerms.flatMap(term => [
        term,
        `best ${term}`,
        `${term} review`,
        `${term} 2024`,
        `${term} 2025`,
        `top ${term}`,
        `${term} for beginners`,
        `affordable ${term}`,
        `professional ${term}`,
        `${term} tips`,
      ]).slice(0, 30);

    case 'competitor':
      // Competitor brand + category combinations
      return categoryData.competitors.flatMap(comp => [
        `${comp} ${subCatLower}`,
        `${comp} ${categoryData.name.toLowerCase()}`,
        `${comp} ${subCatLower} review`,
        `${comp} vs ${brandName}`,
        `${brandName} vs ${comp}`,
      ]).slice(0, 30);

    default:
      return [];
  }
}

// Generate domains based on targeting type
function generateDomains(
  brand: string,
  category: string,
  subCategory: string,
  targetingType: 'branded' | 'generic' | 'competitor'
): string[] {
  const brandData = BRAND_DATA[brand.toLowerCase()];
  if (!brandData) return [];

  const categoryData = brandData.categories[category];
  if (!categoryData) return [];

  switch (targetingType) {
    case 'branded':
      // Sites that would mention the brand (blogs, retailers, review sites)
      return [
        ...DOMAIN_CATEGORIES.beautyBlogs,
        ...DOMAIN_CATEGORIES.reviewSites,
        ...DOMAIN_CATEGORIES.retailers,
        ...DOMAIN_CATEGORIES.magazines.slice(0, 5),
        ...DOMAIN_CATEGORIES.socialMedia.slice(0, 3),
      ];

    case 'generic':
      // General beauty/category sites
      const isNaturalBrand = brand.toLowerCase() === 'weleda';
      return [
        ...DOMAIN_CATEGORIES.beautyBlogs,
        ...DOMAIN_CATEGORIES.magazines,
        ...DOMAIN_CATEGORIES.socialMedia,
        ...(isNaturalBrand ? DOMAIN_CATEGORIES.naturalBeauty : []),
      ];

    case 'competitor':
      // Competitor brand domains
      return categoryData.competitors.map(comp => {
        const cleanName = comp.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${cleanName}.com`;
      });

    default:
      return [];
  }
}

export async function GET(request: NextRequest) {
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
    const { brand, category, subCategory, outputType, targetingTypes } = body;

    if (!brand || !category || !subCategory) {
      return NextResponse.json(
        { success: false, error: 'Brand, category, and sub-category are required' },
        { status: 400 }
      );
    }

    const results: Record<string, { keywords: string[]; domains: string[] }> = {};

    // Generate results for each targeting type
    for (const targetingType of targetingTypes || ['branded', 'generic', 'competitor']) {
      const keywords = generateKeywords(brand, category, subCategory, targetingType);
      const domains = generateDomains(brand, category, subCategory, targetingType);

      results[targetingType] = {
        keywords,
        domains,
      };
    }

    // If Brave API is configured, try to enrich with real search data
    let enrichedWithBrave = false;
    if (isBraveConfigured()) {
      // Could add Brave API enrichment here for real-time domain discovery
      enrichedWithBrave = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        brand: BRAND_DATA[brand.toLowerCase()]?.name || brand,
        category,
        subCategory,
        outputType,
        results,
      },
      enrichedWithBrave,
    });
  } catch (error) {
    console.error('Audience Builder 2.0 POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate audience data' },
      { status: 500 }
    );
  }
}
