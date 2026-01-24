import { NextRequest, NextResponse } from 'next/server';
import { braveTrendingTopics, isBraveConfigured } from '@/lib/brave';

// Main categories with their sub-categories
export const MAIN_CATEGORIES: Record<string, {
  name: string;
  subCategories: string[];
}> = {
  // 1. Beauty & Cosmetics
  beauty: {
    name: 'Beauty & Cosmetics',
    subCategories: ['skincare', 'makeup', 'haircare', 'fragrance', 'nails', 'beautytools'],
  },
  // 2. Fashion & Apparel
  fashion: {
    name: 'Fashion & Apparel',
    subCategories: ['womenswear', 'menswear', 'footwear', 'accessories', 'luxury', 'streetwear'],
  },
  // 3. Technology
  technology: {
    name: 'Technology',
    subCategories: ['smartphones', 'laptops', 'audio', 'wearables', 'gaming', 'smarthome'],
  },
  // 4. Health & Wellness
  health: {
    name: 'Health & Wellness',
    subCategories: ['supplements', 'fitness', 'mentalhealth', 'sleep', 'nutrition', 'personalcare'],
  },
  // 5. Food & Beverage
  food: {
    name: 'Food & Beverage',
    subCategories: ['snacks', 'beverages', 'kitchen', 'healthfoods', 'alcohol', 'coffee'],
  },
  // 6. Home & Living
  home: {
    name: 'Home & Living',
    subCategories: ['furniture', 'decor', 'organization', 'cleaning', 'bedding', 'garden'],
  },
  // 7. Sports & Outdoors
  sports: {
    name: 'Sports & Outdoors',
    subCategories: ['running', 'gymtraining', 'outdoors', 'teamsports', 'cycling', 'watersports'],
  },
  // 8. Baby & Kids
  baby: {
    name: 'Baby & Kids',
    subCategories: ['babygear', 'toys', 'kidsclothing', 'education', 'parenting'],
  },
  // 9. Pets
  pets: {
    name: 'Pets',
    subCategories: ['dogs', 'cats', 'petfood', 'petaccessories'],
  },
  // 10. Office & Stationery
  office: {
    name: 'Office & Stationery',
    subCategories: ['notebooks', 'pens', 'desksetup', 'officeorg', 'artsupplies'],
  },
};

// Sub-categories with their details
const SUB_CATEGORIES: Record<string, {
  name: string;
  keywords: string[];
  amazonCategory: string;
  trendingTerms: string[];
  parentCategory: string;
}> = {
  // ===== BEAUTY & COSMETICS =====
  skincare: {
    name: 'Skincare',
    keywords: ['serum', 'moisturizer', 'cleanser', 'retinol', 'hyaluronic acid', 'vitamin c', 'niacinamide', 'sunscreen', 'spf', 'korean skincare', 'glass skin'],
    amazonCategory: 'Skin Care',
    trendingTerms: ['glass skin', 'skin cycling', 'snail mucin', 'barrier repair'],
    parentCategory: 'beauty',
  },
  makeup: {
    name: 'Makeup',
    keywords: ['foundation', 'concealer', 'lipstick', 'mascara', 'eyeshadow', 'blush', 'bronzer', 'highlighter', 'primer', 'setting spray'],
    amazonCategory: 'Makeup',
    trendingTerms: ['clean girl makeup', 'latte makeup', 'mob wife aesthetic', 'strawberry girl'],
    parentCategory: 'beauty',
  },
  haircare: {
    name: 'Haircare',
    keywords: ['shampoo', 'conditioner', 'hair oil', 'hair mask', 'hair dryer', 'straightener', 'curling iron', 'rosemary oil', 'scalp care'],
    amazonCategory: 'Hair Care',
    trendingTerms: ['rosemary oil hair', 'hair oiling', 'salon blowout', 'hair growth'],
    parentCategory: 'beauty',
  },
  fragrance: {
    name: 'Fragrance',
    keywords: ['perfume', 'eau de parfum', 'cologne', 'body mist', 'vanilla perfume', 'oud', 'niche fragrance', 'perfume dupes'],
    amazonCategory: 'Fragrance',
    trendingTerms: ['perfume dupes', 'viral fragrance', 'signature scent', 'layering perfume'],
    parentCategory: 'beauty',
  },
  nails: {
    name: 'Nails',
    keywords: ['nail polish', 'gel nails', 'press-on nails', 'nail art', 'chrome nails', 'dip powder', 'builder gel'],
    amazonCategory: 'Nail Art & Polish',
    trendingTerms: ['chrome nails', 'glazed donut nails', 'aura nails', 'jelly nails'],
    parentCategory: 'beauty',
  },
  beautytools: {
    name: 'Beauty Tools',
    keywords: ['led mask', 'gua sha', 'jade roller', 'ice roller', 'microcurrent', 'facial steamer', 'makeup brushes', 'beauty blender'],
    amazonCategory: 'Beauty Tools',
    trendingTerms: ['red light therapy', 'facial massage', 'lymphatic drainage', 'at home facial'],
    parentCategory: 'beauty',
  },

  // ===== FASHION & APPAREL =====
  womenswear: {
    name: "Women's Clothing",
    keywords: ['dress', 'blouse', 'jeans', 'skirt', 'blazer', 'cardigan', 'activewear', 'loungewear', 'workwear'],
    amazonCategory: "Women's Fashion",
    trendingTerms: ['quiet luxury', 'old money aesthetic', 'capsule wardrobe', 'coastal grandmother'],
    parentCategory: 'fashion',
  },
  menswear: {
    name: "Men's Clothing",
    keywords: ['shirt', 'pants', 'jacket', 'suit', 'hoodie', 'shorts', 'polo', 'sweater', 'chinos'],
    amazonCategory: "Men's Fashion",
    trendingTerms: ['quiet luxury men', 'old money style', 'minimalist wardrobe', 'smart casual'],
    parentCategory: 'fashion',
  },
  footwear: {
    name: 'Footwear',
    keywords: ['sneakers', 'boots', 'heels', 'sandals', 'loafers', 'running shoes', 'trainers', 'slides'],
    amazonCategory: 'Shoes',
    trendingTerms: ['sneaker trends', 'ballet flats', 'chunky sneakers', 'platform shoes'],
    parentCategory: 'fashion',
  },
  accessories: {
    name: 'Accessories',
    keywords: ['handbag', 'watch', 'jewelry', 'sunglasses', 'belt', 'scarf', 'hat', 'wallet'],
    amazonCategory: 'Fashion Accessories',
    trendingTerms: ['quiet luxury bags', 'minimalist jewelry', 'vintage watches', 'hair accessories'],
    parentCategory: 'fashion',
  },
  luxury: {
    name: 'Luxury Fashion',
    keywords: ['designer', 'luxury handbag', 'designer shoes', 'luxury watch', 'cashmere', 'silk', 'haute couture'],
    amazonCategory: 'Luxury Fashion',
    trendingTerms: ['quiet luxury', 'investment pieces', 'designer dupes', 'luxury resale'],
    parentCategory: 'fashion',
  },
  streetwear: {
    name: 'Streetwear',
    keywords: ['hoodie', 'sneakers', 'graphic tee', 'joggers', 'cap', 'bomber jacket', 'cargo pants', 'oversized'],
    amazonCategory: 'Streetwear',
    trendingTerms: ['hypebeast', 'sneaker drops', 'limited edition', 'collab releases'],
    parentCategory: 'fashion',
  },

  // ===== TECHNOLOGY =====
  smartphones: {
    name: 'Smartphones',
    keywords: ['iphone', 'samsung galaxy', 'pixel', 'android', 'phone case', 'screen protector', 'wireless charger'],
    amazonCategory: 'Cell Phones',
    trendingTerms: ['iphone 16', 'pixel 9', 'foldable phones', 'phone photography'],
    parentCategory: 'technology',
  },
  laptops: {
    name: 'Laptops & Computers',
    keywords: ['macbook', 'laptop', 'chromebook', 'gaming laptop', 'laptop stand', 'monitor', 'keyboard', 'mouse'],
    amazonCategory: 'Computers',
    trendingTerms: ['m3 macbook', 'gaming setup', 'work from home', 'desk setup'],
    parentCategory: 'technology',
  },
  audio: {
    name: 'Audio & Headphones',
    keywords: ['airpods', 'headphones', 'earbuds', 'speaker', 'bluetooth speaker', 'noise cancelling', 'soundbar'],
    amazonCategory: 'Headphones',
    trendingTerms: ['airpods pro', 'sony wh1000', 'spatial audio', 'podcast setup'],
    parentCategory: 'technology',
  },
  wearables: {
    name: 'Wearables',
    keywords: ['apple watch', 'smartwatch', 'fitness tracker', 'fitbit', 'garmin', 'smart ring', 'health tracker'],
    amazonCategory: 'Wearable Technology',
    trendingTerms: ['apple watch ultra', 'oura ring', 'whoop band', 'sleep tracking'],
    parentCategory: 'technology',
  },
  gaming: {
    name: 'Gaming',
    keywords: ['playstation', 'xbox', 'nintendo switch', 'gaming headset', 'controller', 'gaming chair', 'gaming monitor'],
    amazonCategory: 'Video Games',
    trendingTerms: ['ps5 games', 'gaming setup', 'cozy gaming', 'steam deck'],
    parentCategory: 'technology',
  },
  smarthome: {
    name: 'Smart Home',
    keywords: ['alexa', 'google home', 'smart lights', 'ring doorbell', 'smart thermostat', 'robot vacuum', 'smart plugs'],
    amazonCategory: 'Smart Home',
    trendingTerms: ['home automation', 'smart home setup', 'alexa routines', 'matter compatible'],
    parentCategory: 'technology',
  },

  // ===== HEALTH & WELLNESS =====
  supplements: {
    name: 'Supplements',
    keywords: ['vitamins', 'protein powder', 'collagen', 'probiotics', 'omega 3', 'magnesium', 'creatine', 'pre workout'],
    amazonCategory: 'Vitamins & Supplements',
    trendingTerms: ['gut health', 'collagen peptides', 'ashwagandha', 'sea moss'],
    parentCategory: 'health',
  },
  fitness: {
    name: 'Fitness Equipment',
    keywords: ['dumbbells', 'resistance bands', 'yoga mat', 'treadmill', 'exercise bike', 'kettlebell', 'foam roller'],
    amazonCategory: 'Exercise & Fitness',
    trendingTerms: ['home gym', 'peloton alternative', 'pilates', 'hot girl walk'],
    parentCategory: 'health',
  },
  mentalhealth: {
    name: 'Mental Health',
    keywords: ['meditation', 'journal', 'aromatherapy', 'essential oils', 'stress relief', 'anxiety', 'mindfulness'],
    amazonCategory: 'Health & Wellness',
    trendingTerms: ['morning routine', 'self care', 'journaling', 'meditation app'],
    parentCategory: 'health',
  },
  sleep: {
    name: 'Sleep',
    keywords: ['pillow', 'mattress', 'weighted blanket', 'sleep mask', 'white noise', 'melatonin', 'sleep tracker'],
    amazonCategory: 'Sleep & Recovery',
    trendingTerms: ['sleep hygiene', 'mouth taping', 'sunrise alarm', 'cooling pillow'],
    parentCategory: 'health',
  },
  nutrition: {
    name: 'Nutrition',
    keywords: ['protein bars', 'meal prep', 'blender', 'air fryer recipes', 'healthy snacks', 'smoothie', 'macro tracking'],
    amazonCategory: 'Grocery & Gourmet',
    trendingTerms: ['high protein', 'meal prep ideas', 'macro friendly', 'calorie deficit'],
    parentCategory: 'health',
  },
  personalcare: {
    name: 'Personal Care',
    keywords: ['electric toothbrush', 'razor', 'deodorant', 'body wash', 'oral care', 'grooming', 'hygiene'],
    amazonCategory: 'Personal Care',
    trendingTerms: ['everything shower', 'body care routine', 'oral hygiene', 'natural deodorant'],
    parentCategory: 'health',
  },

  // ===== FOOD & BEVERAGE =====
  snacks: {
    name: 'Snacks',
    keywords: ['chips', 'chocolate', 'candy', 'nuts', 'popcorn', 'protein snacks', 'healthy snacks', 'korean snacks'],
    amazonCategory: 'Snack Food',
    trendingTerms: ['viral snacks', 'tiktok snacks', 'korean snacks', 'healthy snacks'],
    parentCategory: 'food',
  },
  beverages: {
    name: 'Beverages',
    keywords: ['energy drinks', 'sparkling water', 'juice', 'tea', 'soda', 'sports drinks', 'electrolytes'],
    amazonCategory: 'Beverages',
    trendingTerms: ['prime hydration', 'celsius', 'liquid iv', 'matcha'],
    parentCategory: 'food',
  },
  kitchen: {
    name: 'Kitchen & Cooking',
    keywords: ['air fryer', 'instant pot', 'blender', 'cookware', 'knife set', 'food storage', 'meal prep containers'],
    amazonCategory: 'Kitchen & Dining',
    trendingTerms: ['air fryer recipes', 'meal prep', 'kitchen gadgets', 'cooking hacks'],
    parentCategory: 'food',
  },
  healthfoods: {
    name: 'Health Foods',
    keywords: ['organic', 'gluten free', 'vegan', 'keto', 'superfoods', 'plant based', 'protein', 'low carb'],
    amazonCategory: 'Grocery & Gourmet',
    trendingTerms: ['high protein', 'gut health foods', 'anti inflammatory', 'whole foods'],
    parentCategory: 'food',
  },
  alcohol: {
    name: 'Alcohol',
    keywords: ['wine', 'whiskey', 'cocktails', 'beer', 'spirits', 'bar accessories', 'cocktail kit'],
    amazonCategory: 'Wine & Spirits',
    trendingTerms: ['cocktail recipes', 'wine tiktok', 'home bar', 'mocktails'],
    parentCategory: 'food',
  },
  coffee: {
    name: 'Coffee & Tea',
    keywords: ['coffee maker', 'espresso machine', 'matcha', 'cold brew', 'coffee beans', 'tea', 'nespresso'],
    amazonCategory: 'Coffee & Tea',
    trendingTerms: ['coffee routine', 'matcha latte', 'iced coffee', 'espresso at home'],
    parentCategory: 'food',
  },

  // ===== HOME & LIVING =====
  furniture: {
    name: 'Furniture',
    keywords: ['sofa', 'desk', 'chair', 'bed frame', 'bookshelf', 'dining table', 'storage'],
    amazonCategory: 'Furniture',
    trendingTerms: ['amazon furniture finds', 'small space', 'apartment decor', 'home office'],
    parentCategory: 'home',
  },
  decor: {
    name: 'Home Decor',
    keywords: ['wall art', 'candles', 'vase', 'mirror', 'throw pillows', 'rug', 'curtains', 'plants'],
    amazonCategory: 'Home Decor',
    trendingTerms: ['cozy home', 'aesthetic room', 'minimalist decor', 'boho style'],
    parentCategory: 'home',
  },
  organization: {
    name: 'Organization',
    keywords: ['storage bins', 'closet organizer', 'drawer dividers', 'labels', 'pantry organization', 'declutter'],
    amazonCategory: 'Storage & Organization',
    trendingTerms: ['home organization', 'konmari', 'pantry goals', 'closet tour'],
    parentCategory: 'home',
  },
  cleaning: {
    name: 'Cleaning',
    keywords: ['vacuum', 'mop', 'cleaning supplies', 'robot vacuum', 'laundry', 'dishwasher pods', 'air purifier'],
    amazonCategory: 'Cleaning Supplies',
    trendingTerms: ['cleaning motivation', 'clean with me', 'restocking', 'laundry routine'],
    parentCategory: 'home',
  },
  bedding: {
    name: 'Bedding',
    keywords: ['sheets', 'comforter', 'duvet', 'pillows', 'mattress topper', 'blanket', 'bed set'],
    amazonCategory: 'Bedding',
    trendingTerms: ['hotel bedding', 'linen sheets', 'cloud bed', 'bedroom makeover'],
    parentCategory: 'home',
  },
  garden: {
    name: 'Garden & Outdoor',
    keywords: ['plants', 'patio furniture', 'grill', 'outdoor lights', 'garden tools', 'planters', 'lawn care'],
    amazonCategory: 'Patio, Lawn & Garden',
    trendingTerms: ['plant mom', 'outdoor living', 'balcony garden', 'backyard makeover'],
    parentCategory: 'home',
  },

  // ===== SPORTS & OUTDOORS =====
  running: {
    name: 'Running',
    keywords: ['running shoes', 'running watch', 'running shorts', 'hydration vest', 'running belt', 'compression socks'],
    amazonCategory: 'Running',
    trendingTerms: ['marathon training', 'couch to 5k', 'running gear', 'trail running'],
    parentCategory: 'sports',
  },
  gymtraining: {
    name: 'Gym & Training',
    keywords: ['weightlifting', 'gym bag', 'lifting belt', 'gym shoes', 'workout clothes', 'shaker bottle'],
    amazonCategory: 'Exercise & Fitness',
    trendingTerms: ['gym motivation', 'workout split', 'gym outfit', 'strength training'],
    parentCategory: 'sports',
  },
  outdoors: {
    name: 'Outdoor Recreation',
    keywords: ['camping', 'hiking', 'backpack', 'tent', 'sleeping bag', 'hiking boots', 'outdoor gear'],
    amazonCategory: 'Outdoor Recreation',
    trendingTerms: ['camping essentials', 'hiking gear', 'national parks', 'van life'],
    parentCategory: 'sports',
  },
  teamsports: {
    name: 'Team Sports',
    keywords: ['basketball', 'soccer', 'football', 'baseball', 'volleyball', 'sports equipment', 'jersey'],
    amazonCategory: 'Team Sports',
    trendingTerms: ['basketball shoes', 'soccer cleats', 'sports training', 'game day'],
    parentCategory: 'sports',
  },
  cycling: {
    name: 'Cycling',
    keywords: ['bike', 'cycling shorts', 'helmet', 'bike accessories', 'indoor cycling', 'bike lights'],
    amazonCategory: 'Cycling',
    trendingTerms: ['cycling gear', 'bike commute', 'indoor cycling', 'ebike'],
    parentCategory: 'sports',
  },
  watersports: {
    name: 'Water Sports',
    keywords: ['swimwear', 'goggles', 'surfboard', 'kayak', 'paddleboard', 'snorkel', 'wetsuit'],
    amazonCategory: 'Water Sports',
    trendingTerms: ['beach essentials', 'surfing', 'paddleboard', 'pool workout'],
    parentCategory: 'sports',
  },

  // ===== BABY & KIDS =====
  babygear: {
    name: 'Baby Gear',
    keywords: ['stroller', 'car seat', 'baby carrier', 'crib', 'high chair', 'baby monitor', 'diaper bag'],
    amazonCategory: 'Baby',
    trendingTerms: ['baby registry', 'baby essentials', 'newborn must haves', 'baby gear review'],
    parentCategory: 'baby',
  },
  toys: {
    name: 'Toys',
    keywords: ['lego', 'educational toys', 'dolls', 'action figures', 'board games', 'outdoor toys', 'stem toys'],
    amazonCategory: 'Toys & Games',
    trendingTerms: ['toy unboxing', 'viral toys', 'educational toys', 'holiday toys'],
    parentCategory: 'baby',
  },
  kidsclothing: {
    name: 'Kids Clothing',
    keywords: ['kids clothes', 'baby clothes', 'school uniform', 'kids shoes', 'kids pajamas', 'rain boots'],
    amazonCategory: 'Kids Fashion',
    trendingTerms: ['kids outfit', 'back to school', 'matching outfits', 'kids style'],
    parentCategory: 'baby',
  },
  education: {
    name: 'Education',
    keywords: ['learning toys', 'books', 'workbooks', 'flashcards', 'educational games', 'school supplies'],
    amazonCategory: 'Education',
    trendingTerms: ['homeschool', 'learning activities', 'kids books', 'stem learning'],
    parentCategory: 'baby',
  },
  parenting: {
    name: 'Parenting',
    keywords: ['parenting books', 'baby food', 'nursing', 'potty training', 'sleep training', 'childproofing'],
    amazonCategory: 'Parenting',
    trendingTerms: ['mom hacks', 'parenting tips', 'toddler activities', 'baby led weaning'],
    parentCategory: 'baby',
  },

  // ===== PETS =====
  dogs: {
    name: 'Dogs',
    keywords: ['dog food', 'dog toys', 'dog bed', 'dog leash', 'dog treats', 'dog grooming', 'dog crate'],
    amazonCategory: 'Dogs',
    trendingTerms: ['dog training', 'puppy essentials', 'dog enrichment', 'dog mom'],
    parentCategory: 'pets',
  },
  cats: {
    name: 'Cats',
    keywords: ['cat food', 'cat litter', 'cat tree', 'cat toys', 'scratching post', 'cat bed', 'cat carrier'],
    amazonCategory: 'Cats',
    trendingTerms: ['cat behavior', 'kitten tips', 'cat enrichment', 'cat lady'],
    parentCategory: 'pets',
  },
  petfood: {
    name: 'Pet Food',
    keywords: ['premium pet food', 'grain free', 'raw diet', 'wet food', 'dry food', 'pet treats', 'supplements'],
    amazonCategory: 'Pet Food',
    trendingTerms: ['best pet food', 'raw feeding', 'pet nutrition', 'homemade pet food'],
    parentCategory: 'pets',
  },
  petaccessories: {
    name: 'Pet Accessories',
    keywords: ['pet carrier', 'pet camera', 'automatic feeder', 'water fountain', 'pet clothes', 'grooming'],
    amazonCategory: 'Pet Supplies',
    trendingTerms: ['pet gadgets', 'pet travel', 'pet grooming', 'matching pet owner'],
    parentCategory: 'pets',
  },

  // ===== OFFICE & STATIONERY =====
  notebooks: {
    name: 'Notebooks & Planners',
    keywords: ['planner', 'journal', 'notebook', 'bullet journal', 'diary', 'calendar', 'goal planner'],
    amazonCategory: 'Notebooks & Writing Pads',
    trendingTerms: ['planner setup', 'bullet journal', 'journaling', 'goal setting'],
    parentCategory: 'office',
  },
  pens: {
    name: 'Pens & Writing',
    keywords: ['pens', 'markers', 'highlighters', 'fountain pen', 'gel pens', 'calligraphy', 'pencils'],
    amazonCategory: 'Writing Instruments',
    trendingTerms: ['pen collection', 'calligraphy', 'handwriting', 'stationery haul'],
    parentCategory: 'office',
  },
  desksetup: {
    name: 'Desk Setup',
    keywords: ['desk organizer', 'monitor stand', 'desk mat', 'desk lamp', 'cable management', 'ergonomic'],
    amazonCategory: 'Office Products',
    trendingTerms: ['desk setup', 'work from home', 'aesthetic desk', 'productivity'],
    parentCategory: 'office',
  },
  officeorg: {
    name: 'Office Organization',
    keywords: ['file organizer', 'storage boxes', 'label maker', 'bookends', 'desk drawer', 'paper trays'],
    amazonCategory: 'Office Organization',
    trendingTerms: ['office organization', 'declutter desk', 'home office', 'filing system'],
    parentCategory: 'office',
  },
  artsupplies: {
    name: 'Art Supplies',
    keywords: ['colored pencils', 'sketchbook', 'paint', 'brushes', 'canvas', 'watercolors', 'drawing tablet'],
    amazonCategory: 'Arts & Crafts',
    trendingTerms: ['art supplies haul', 'drawing tutorial', 'sketchbook tour', 'art tips'],
    parentCategory: 'office',
  },
};

interface TrendItem {
  term: string;
  category: string;
  velocity: number;
  volume: number;
  platforms: {
    tiktok: number;
    instagram: number;
    youtube: number;
    reddit: number;
    twitter: number;
    web: number;
  };
  totalSources: number;
  sentiment: number;
  relatedTerms: string[];
  samplePosts: Array<{
    platform: string;
    text: string;
    engagement: number;
    date: string;
    url?: string;
  }>;
}

// Cache for API responses - longer TTL to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours cache (free API friendly)

function getCacheKey(category: string, timeRange: string): string {
  return `trend-radar:${category}:${timeRange}`;
}



// Calculate platform distribution from social mentions
function calculatePlatformDistribution(mentions: any[]): TrendItem['platforms'] {
  const platforms = {
    tiktok: 0,
    instagram: 0,
    youtube: 0,
    reddit: 0,
    twitter: 0,
    web: 0,
  };

  const total = mentions.length || 1;

  mentions.forEach(m => {
    const source = m.source?.toLowerCase() || '';
    if (source.includes('tiktok')) platforms.tiktok++;
    else if (source.includes('instagram')) platforms.instagram++;
    else if (source.includes('youtube')) platforms.youtube++;
    else if (source.includes('reddit')) platforms.reddit++;
    else if (source.includes('x') || source.includes('twitter')) platforms.twitter++;
    else platforms.web++;
  });

  // Return actual counts
  return {
    tiktok: platforms.tiktok,
    instagram: platforms.instagram,
    youtube: platforms.youtube,
    reddit: platforms.reddit,
    twitter: platforms.twitter,
    web: platforms.web,
  };
}

// Normalize platform scores to 0-100
function normalizePlatforms(platforms: TrendItem['platforms']): TrendItem['platforms'] {
  const max = Math.max(...Object.values(platforms), 1);
  return {
    tiktok: Math.round((platforms.tiktok / max) * 100),
    instagram: Math.round((platforms.instagram / max) * 100),
    youtube: Math.round((platforms.youtube / max) * 100),
    reddit: Math.round((platforms.reddit / max) * 100),
    twitter: Math.round((platforms.twitter / max) * 100),
    web: Math.round((platforms.web / max) * 100),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'skincare';
  const timeRange = searchParams.get('timeRange') || '7d';
  const platformFilter = searchParams.get('platform') || 'all';

  // Check cache first
  const cacheKey = getCacheKey(category, `${timeRange}-${platformFilter}`);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      data: cached.data,
      source: 'cache',
    });
  }

  try {
    const categoryInfo = SUB_CATEGORIES[category] || SUB_CATEGORIES.skincare;
    const trends: TrendItem[] = [];
    let source = 'demo';

    // Step 1: Get trending topics using Brave Search API
    let uniqueQueries: Array<{
      query: string;
      value: number;
      type: 'rising' | 'top';
      snippet: string;
      url?: string;
      sourceTitle?: string;
      sources?: Array<{ snippet: string; url: string; title: string; platform?: string }>;
      platformCounts?: Record<string, number>;
    }> = [];

    if (isBraveConfigured()) {
      try {
        const braveResults = await braveTrendingTopics(category, categoryInfo.keywords, platformFilter);
        // Map brave results to expected format
        uniqueQueries = braveResults.map(r => ({
          query: r.term,
          value: r.volume,
          type: r.type,
          snippet: r.snippet,
          url: r.url,
          sourceTitle: r.sourceTitle,
          sources: r.sources,
          platformCounts: r.platformCounts,
        }));
        if (uniqueQueries.length > 0) {
          source = 'brave';
        }
      } catch (err) {
        console.error('Brave fetch error:', err);
      }
    }

    // Fallback to category keywords if no results
    if (uniqueQueries.length === 0) {
      source = 'demo';
      uniqueQueries = categoryInfo.keywords.slice(0, 8).map((kw, i) => ({
        query: kw,
        value: 90 - i * 10,
        type: (i < 3 ? 'rising' : 'top') as 'rising' | 'top',
        snippet: '',
      }));
    }

    // Step 3: Build trend items - focus on social media presence
    for (const query of uniqueQueries) {
      const isRising = query.type === 'rising';
      const baseVelocity = isRising ? 150 + Math.random() * 200 : 50 + Math.random() * 100;
      const velocity = Math.round(baseVelocity);
      const volume = Math.min(100, query.value || 50);

      // Use REAL platform counts from search results
      const realPlatformCounts = query.platformCounts || {};
      const platforms = {
        tiktok: realPlatformCounts['tiktok'] || 0,
        instagram: realPlatformCounts['instagram'] || 0,
        youtube: realPlatformCounts['youtube'] || 0,
        reddit: realPlatformCounts['reddit'] || 0,
        twitter: realPlatformCounts['twitter'] || 0,
        web: realPlatformCounts['web'] || 0,
      };

      // Calculate total sources across all platforms
      const totalSources = Object.values(platforms).reduce((a, b) => a + b, 0);

      trends.push({
        term: query.query,
        category,
        velocity,
        volume,
        platforms,
        totalSources,
        sentiment: 0.65 + Math.random() * 0.3,
        relatedTerms: uniqueQueries
          .filter((q: any) => q.query !== query.query)
          .slice(0, 4)
          .map((q: any) => q.query),
        samplePosts: (query.sources && query.sources.length > 0
          ? query.sources.map((src) => ({
              platform: src.platform ? src.platform.charAt(0).toUpperCase() + src.platform.slice(1) :
                        src.url?.includes('youtube') ? 'YouTube' :
                        src.url?.includes('tiktok') ? 'TikTok' :
                        src.url?.includes('reddit') ? 'Reddit' :
                        src.url?.includes('instagram') ? 'Instagram' :
                        src.url?.includes('twitter') || src.url?.includes('x.com') ? 'Twitter' :
                        'Web',
              text: src.snippet || `${query.query} - trending!`,
              engagement: Math.floor(Math.random() * 80000 + 20000),
              date: timeRange === '1d' ? 'Yesterday' : `${Math.floor(Math.random() * 5 + 1)} days ago`,
              url: src.url,
            }))
          : [{
              platform: isRising ? 'TikTok' : 'YouTube',
              text: query.snippet || `${query.query} - trending ${isRising ? 'now' : 'steadily'}!`,
              engagement: Math.floor(Math.random() * 80000 + 20000),
              date: timeRange === '1d' ? 'Yesterday' : `${Math.floor(Math.random() * 5 + 1)} days ago`,
              url: query.url,
            }]
        ),
      });
    }

    // Fallback: Generate demo data if no real data available
    if (trends.length === 0) {
      source = 'demo';
      trends.push(...generateDemoTrends(category, timeRange));
    }

    // Sort by social media presence: TikTok first, then total sources, then velocity
    trends.sort((a, b) => {
      // Primary: TikTok source count (TikTok is the leading indicator)
      const tiktokDiff = b.platforms.tiktok - a.platforms.tiktok;
      if (tiktokDiff !== 0) return tiktokDiff;

      // Secondary: Total sources across all platforms
      const sourcesDiff = b.totalSources - a.totalSources;
      if (sourcesDiff !== 0) return sourcesDiff;

      // Tertiary: Overall velocity
      return b.velocity - a.velocity;
    });

    // Calculate summary focused on social media
    const summary = {
      totalTrends: trends.length,
      tiktokTrends: trends.filter(t => t.platforms.tiktok > 0).length,
      multiPlatform: trends.filter(t => Object.values(t.platforms).filter(v => v > 0).length > 1).length,
      avgVelocity: Math.round(trends.reduce((sum, t) => sum + t.velocity, 0) / (trends.length || 1)),
      topPlatform: getTopPlatform(trends),
      totalSources: trends.reduce((sum, t) => sum + t.totalSources, 0),
    };

    const responseData = {
      category: categoryInfo.name,
      amazonCategory: categoryInfo.amazonCategory,
      parentCategory: categoryInfo.parentCategory,
      timeRange,
      summary,
      trends,
      // Return hierarchical category structure
      mainCategories: Object.entries(MAIN_CATEGORIES).map(([id, cat]) => ({
        id,
        name: cat.name,
        subCategories: cat.subCategories,
      })),
      subCategories: Object.entries(SUB_CATEGORIES).map(([id, cat]) => ({
        id,
        name: cat.name,
        amazonCategory: cat.amazonCategory,
        parentCategory: cat.parentCategory,
      })),
    };

    // Cache the response
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: responseData,
      source,
    });
  } catch (error: any) {
    console.error('Trend radar error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch trend data',
    }, { status: 500 });
  }
}

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return 'Recently';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return 'Recently';
  }
}

function getTopPlatform(trends: TrendItem[]): string {
  const platformTotals = { tiktok: 0, instagram: 0, youtube: 0, reddit: 0, twitter: 0, web: 0 };

  trends.forEach(t => {
    Object.keys(platformTotals).forEach(p => {
      platformTotals[p as keyof typeof platformTotals] += t.platforms[p as keyof typeof t.platforms];
    });
  });

  const sorted = Object.entries(platformTotals).sort(([,a], [,b]) => b - a);
  return sorted[0][0];
}

// Generate demo trends when APIs are unavailable
function generateDemoTrends(category: string, timeRange: string): TrendItem[] {
  const cat = SUB_CATEGORIES[category] || SUB_CATEGORIES.skincare;

  const demoTerms: Record<string, string[]> = {
    // ===== BEAUTY & COSMETICS =====
    skincare: ['glass skin', 'skin cycling', 'snail mucin', 'retinol sandwich', 'barrier repair', 'korean sunscreen'],
    makeup: ['latte makeup', 'clean girl look', 'mob wife aesthetic', 'strawberry girl makeup', 'lip combo', 'cold girl makeup'],
    haircare: ['rosemary oil', 'hair oiling', 'rice water rinse', 'scalp care', 'castor oil growth', 'protein treatment'],
    fragrance: ['vanilla perfume', 'perfume layering', 'clean girl scent', 'cozy fragrance', 'perfume dupes', 'niche discovery'],
    nails: ['chrome nails', 'glazed donut nails', 'jelly nails', 'aura nails', 'milk bath nails', 'lip gloss nails'],
    beautytools: ['led mask', 'gua sha routine', 'ice roller', 'microcurrent device', 'facial steamer', 'dermaplaning'],

    // ===== FASHION & APPAREL =====
    womenswear: ['quiet luxury', 'old money aesthetic', 'capsule wardrobe', 'coastal grandmother', 'clean girl style', 'mob wife fashion'],
    menswear: ['quiet luxury men', 'old money style', 'minimalist wardrobe', 'smart casual', 'capsule closet', 'timeless menswear'],
    footwear: ['ballet flats', 'chunky sneakers', 'platform shoes', 'loafers trend', 'sneaker drops', 'comfortable heels'],
    accessories: ['quiet luxury bags', 'minimalist jewelry', 'vintage watches', 'hair accessories', 'silk scarves', 'statement earrings'],
    luxury: ['investment pieces', 'designer dupes', 'luxury resale', 'quiet luxury brands', 'timeless classics', 'heritage fashion'],
    streetwear: ['hypebeast drops', 'sneaker releases', 'limited edition', 'collab releases', 'streetwear fits', 'vintage finds'],

    // ===== TECHNOLOGY =====
    smartphones: ['iphone 16 pro', 'pixel 9', 'foldable phones', 'phone photography', 'best phone camera', 'android vs iphone'],
    laptops: ['m3 macbook', 'gaming setup', 'work from home desk', 'desk setup tour', 'best laptop 2024', 'ultrabook comparison'],
    audio: ['airpods pro 2', 'sony wh1000xm5', 'spatial audio', 'podcast setup', 'audiophile headphones', 'earbuds comparison'],
    wearables: ['apple watch ultra', 'oura ring', 'whoop band', 'sleep tracking', 'fitness tracker', 'smart ring'],
    gaming: ['ps5 games', 'gaming setup tour', 'cozy gaming', 'steam deck', 'best gaming headset', 'rgb setup'],
    smarthome: ['home automation', 'alexa routines', 'matter compatible', 'smart home setup', 'robot vacuum', 'smart lighting'],

    // ===== HEALTH & WELLNESS =====
    supplements: ['gut health supplements', 'collagen peptides', 'ashwagandha', 'sea moss gel', 'magnesium glycinate', 'creatine monohydrate'],
    fitness: ['home gym setup', 'pilates workout', 'hot girl walk', 'strength training', 'peloton alternative', 'resistance bands'],
    mentalhealth: ['morning routine', 'self care sunday', 'journaling prompts', 'meditation app', 'mental health tips', 'stress relief'],
    sleep: ['sleep hygiene', 'mouth taping', 'sunrise alarm clock', 'cooling pillow', 'weighted blanket', 'sleep tracker'],
    nutrition: ['high protein meals', 'meal prep ideas', 'macro friendly', 'calorie deficit tips', 'healthy recipes', 'protein snacks'],
    personalcare: ['everything shower', 'body care routine', 'oral hygiene', 'natural deodorant', 'grooming routine', 'self care tips'],

    // ===== FOOD & BEVERAGE =====
    snacks: ['viral snacks', 'tiktok snacks', 'korean snacks', 'healthy snacks', 'protein snacks', 'japanese snacks'],
    beverages: ['prime hydration', 'celsius energy', 'liquid iv', 'matcha latte', 'electrolyte drinks', 'sparkling water'],
    kitchen: ['air fryer recipes', 'meal prep containers', 'kitchen gadgets', 'cooking hacks', 'instant pot recipes', 'best blender'],
    healthfoods: ['high protein foods', 'gut health foods', 'anti inflammatory diet', 'whole foods finds', 'superfood smoothie', 'organic eating'],
    alcohol: ['cocktail recipes', 'wine tiktok', 'home bar setup', 'mocktails', 'whiskey collection', 'cocktail kit'],
    coffee: ['coffee routine', 'matcha latte recipe', 'iced coffee hacks', 'espresso at home', 'best coffee maker', 'cold brew tips'],

    // ===== HOME & LIVING =====
    furniture: ['amazon furniture finds', 'small space hacks', 'apartment decor', 'home office setup', 'cozy bedroom', 'living room makeover'],
    decor: ['cozy home aesthetic', 'minimalist decor', 'boho style', 'wall art ideas', 'candle collection', 'plant corner'],
    organization: ['pantry organization', 'closet tour', 'konmari method', 'home organization', 'declutter tips', 'label maker ideas'],
    cleaning: ['cleaning motivation', 'clean with me', 'restocking videos', 'laundry routine', 'robot vacuum', 'deep cleaning tips'],
    bedding: ['hotel bedding dupes', 'linen sheets', 'cloud bed setup', 'bedroom makeover', 'cozy bedding', 'silk pillowcase'],
    garden: ['plant mom tips', 'balcony garden', 'backyard makeover', 'outdoor living', 'patio furniture', 'indoor plants'],

    // ===== SPORTS & OUTDOORS =====
    running: ['marathon training', 'couch to 5k', 'running gear', 'trail running shoes', 'running watch', 'run club'],
    gymtraining: ['gym motivation', 'workout split', 'gym outfit', 'strength training', 'gym essentials', 'fitness journey'],
    outdoors: ['camping essentials', 'hiking gear', 'national parks', 'van life', 'backpacking tips', 'outdoor adventures'],
    teamsports: ['basketball shoes', 'soccer cleats', 'sports training', 'game day prep', 'team jerseys', 'sports equipment'],
    cycling: ['cycling gear', 'bike commute', 'indoor cycling', 'ebike review', 'cycling shorts', 'bike accessories'],
    watersports: ['beach essentials', 'surfing tips', 'paddleboard workout', 'pool workout', 'swimwear haul', 'snorkeling gear'],

    // ===== BABY & KIDS =====
    babygear: ['baby registry must haves', 'newborn essentials', 'stroller review', 'baby monitor', 'car seat safety', 'diaper bag'],
    toys: ['toy unboxing', 'viral toys 2024', 'educational toys', 'holiday toy list', 'stem toys', 'sensory toys'],
    kidsclothing: ['kids outfit ideas', 'back to school haul', 'matching outfits', 'kids style', 'baby clothes haul', 'toddler fashion'],
    education: ['homeschool tips', 'learning activities', 'kids books', 'stem learning', 'educational games', 'reading corner'],
    parenting: ['mom hacks', 'parenting tips', 'toddler activities', 'baby led weaning', 'potty training tips', 'sleep training'],

    // ===== PETS =====
    dogs: ['dog training tips', 'puppy essentials', 'dog enrichment', 'dog mom life', 'dog toy review', 'dog food comparison'],
    cats: ['cat behavior tips', 'kitten essentials', 'cat enrichment', 'cat lady life', 'cat tree review', 'cat toy ideas'],
    petfood: ['best pet food', 'raw feeding pets', 'pet nutrition', 'homemade pet food', 'grain free debate', 'pet treats'],
    petaccessories: ['pet gadgets', 'pet travel essentials', 'pet grooming', 'matching pet owner', 'pet camera', 'automatic feeder'],

    // ===== OFFICE & STATIONERY =====
    notebooks: ['planner setup 2024', 'bullet journal ideas', 'journaling tips', 'goal planner', 'notebook collection', 'planning routine'],
    pens: ['pen collection tour', 'calligraphy practice', 'handwriting tips', 'stationery haul', 'fountain pen review', 'best gel pens'],
    desksetup: ['desk setup tour', 'work from home office', 'aesthetic desk', 'productivity setup', 'cable management', 'monitor setup'],
    officeorg: ['office organization', 'desk declutter', 'home office tour', 'filing system', 'label maker projects', 'workspace makeover'],
    artsupplies: ['art supplies haul', 'drawing tutorial', 'sketchbook tour', 'art tips for beginners', 'watercolor painting', 'digital art setup'],
  };

  const terms = demoTerms[category] || cat.trendingTerms || demoTerms.skincare;

  return terms.map((term, index) => {
    const velocity = Math.round(300 - index * 40 + Math.random() * 50);
    const volume = Math.round(90 - index * 8 + Math.random() * 10);

    // Demo platform sources - TikTok dominant for beauty trends
    const platforms = {
      tiktok: Math.max(0, 5 - index + Math.floor(Math.random() * 3)),
      instagram: Math.max(0, 3 - Math.floor(index / 2) + Math.floor(Math.random() * 2)),
      youtube: Math.max(0, 2 - Math.floor(index / 3) + Math.floor(Math.random() * 2)),
      reddit: Math.floor(Math.random() * 2),
      twitter: Math.floor(Math.random() * 2),
      web: Math.max(0, 3 - Math.floor(index / 2) + Math.floor(Math.random() * 2)),
    };

    const totalSources = Object.values(platforms).reduce((a, b) => a + b, 0);

    return {
      term,
      category,
      velocity,
      volume,
      platforms,
      totalSources,
      sentiment: 0.7 + Math.random() * 0.25,
      relatedTerms: terms.filter(t => t !== term).slice(0, 4),
      samplePosts: [
        {
          platform: 'TikTok',
          text: `${term} is taking over! Here's why everyone's obsessed...`,
          engagement: Math.floor(50000 - index * 5000 + Math.random() * 20000),
          date: timeRange === '1d' ? 'Yesterday' : `${index + 1} days ago`,
        },
      ],
    };
  });
}
