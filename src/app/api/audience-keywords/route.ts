import { NextRequest, NextResponse } from 'next/server';

interface KeywordData {
  keyword: string;
  frequency: number;
  sources: Record<string, number>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend: 'rising' | 'stable' | 'falling';
  lastSeen: string;
  category: string;
}

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who',
  'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
  'then', 'once', 'if', 'my', 'your', 'his', 'her', 'our', 'their', 'me', 'him',
  'us', 'them', 'am', 'been', 'being', 'having', 'doing', 'get', 'got', 'getting',
  'go', 'going', 'went', 'gone', 'come', 'came', 'coming', 'make', 'made', 'making',
  'take', 'took', 'taking', 'see', 'saw', 'seen', 'seeing', 'know', 'knew', 'known',
  'think', 'thought', 'thinking', 'want', 'wanted', 'wanting', 'use', 'using',
  'find', 'found', 'finding', 'give', 'gave', 'given', 'tell', 'told', 'telling',
  'try', 'tried', 'trying', 'ask', 'asked', 'asking', 'work', 'worked', 'working',
  'seem', 'seemed', 'seeming', 'feel', 'felt', 'feeling', 'become', 'became',
  'leave', 'left', 'put', 'keep', 'kept', 'let', 'begin', 'began', 'begun',
  'show', 'showed', 'shown', 'hear', 'heard', 'play', 'played', 'run', 'ran',
  'move', 'moved', 'live', 'lived', 'believe', 'believed', 'bring', 'brought',
  'happen', 'happened', 'write', 'wrote', 'written', 'provide', 'provided',
  'sit', 'sat', 'stand', 'stood', 'lose', 'lost', 'pay', 'paid', 'meet', 'met',
  'include', 'included', 'continue', 'continued', 'set', 'learn', 'learned',
  'change', 'changed', 'lead', 'led', 'understand', 'understood', 'watch', 'watched',
  'follow', 'followed', 'stop', 'stopped', 'create', 'created', 'speak', 'spoke',
  'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent', 'grow', 'grew',
  'open', 'opened', 'walk', 'walked', 'win', 'won', 'offer', 'offered', 'remember',
  'love', 'loved', 'consider', 'considered', 'appear', 'appeared', 'buy', 'bought',
  'wait', 'waited', 'serve', 'served', 'die', 'died', 'send', 'sent', 'expect',
  'build', 'built', 'stay', 'stayed', 'fall', 'fell', 'cut', 'reach', 'reached',
  'kill', 'killed', 'remain', 'remained', 'suggest', 'suggested', 'raise', 'raised',
  'pass', 'passed', 'sell', 'sold', 'require', 'required', 'report', 'reported',
  'decide', 'decided', 'pull', 'pulled', 've', 'll', 're', 's', 't', 'd', 'm',
  'really', 'actually', 'like', 'just', 'even', 'still', 'well', 'back', 'much',
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other',
  'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early',
  'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'thing', 'things',
  'way', 'ways', 'day', 'days', 'time', 'times', 'year', 'years', 'people', 'person',
  'man', 'men', 'woman', 'women', 'child', 'children', 'world', 'life', 'hand',
  'part', 'place', 'case', 'week', 'weeks', 'company', 'system', 'program',
  'question', 'work', 'government', 'number', 'night', 'point', 'home', 'water',
  'room', 'mother', 'area', 'money', 'story', 'fact', 'month', 'months', 'lot',
  'lots', 'study', 'book', 'eye', 'job', 'word', 'business', 'issue', 'side',
  'kind', 'head', 'house', 'service', 'friend', 'father', 'power', 'hour', 'hours',
  'game', 'line', 'end', 'member', 'law', 'car', 'city', 'community', 'name',
  'video', 'videos', 'post', 'posts', 'comment', 'comments', 'review', 'reviews',
]);

// Category keywords for classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Product': ['product', 'products', 'item', 'items', 'purchase', 'buy', 'bought', 'price', 'cost', 'worth', 'value', 'quality'],
  'Problem': ['problem', 'issue', 'issues', 'trouble', 'difficult', 'hard', 'struggle', 'pain', 'hurt', 'damage', 'damaged', 'broken', 'doesnt work', 'not working', 'failed'],
  'Feature': ['feature', 'features', 'setting', 'settings', 'option', 'options', 'mode', 'function', 'works', 'does'],
  'Comparison': ['vs', 'versus', 'compared', 'comparison', 'better', 'worse', 'best', 'worst', 'alternative', 'instead'],
  'Recommendation': ['recommend', 'recommended', 'suggestion', 'suggest', 'advice', 'tip', 'tips', 'favorite', 'favourite', 'love', 'amazing', 'great', 'excellent'],
  'Question': ['how', 'what', 'why', 'when', 'where', 'which', 'does', 'can', 'should', 'would', 'help', 'anyone', 'somebody'],
};

// Beauty-specific keywords to prioritize
const BEAUTY_KEYWORDS = new Set([
  'skin', 'skincare', 'hair', 'haircare', 'makeup', 'cosmetics', 'beauty', 'face', 'body',
  'moisturizer', 'serum', 'cream', 'lotion', 'cleanser', 'toner', 'sunscreen', 'spf',
  'foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter', 'contour',
  'lipstick', 'lipgloss', 'lipliner', 'eyeshadow', 'eyeliner', 'mascara', 'brow',
  'nail', 'polish', 'manicure', 'pedicure', 'cuticle',
  'shampoo', 'conditioner', 'treatment', 'mask', 'oil', 'styling', 'curl', 'straight',
  'dryer', 'straightener', 'curler', 'brush', 'comb', 'diffuser', 'heat',
  'acne', 'wrinkle', 'aging', 'hydrating', 'dry', 'oily', 'sensitive', 'combination',
  'glow', 'radiant', 'matte', 'dewy', 'natural', 'organic', 'vegan', 'cruelty-free',
  'pigment', 'coverage', 'formula', 'texture', 'finish', 'shade', 'color', 'tone',
  'fragrance', 'perfume', 'scent', 'cologne', 'eau',
  'babyliss', 'revlon', 'weleda', 'dyson', 'ghd', 'olaplex', 'ordinary', 'cerave',
  'niacinamide', 'retinol', 'vitamin', 'hyaluronic', 'salicylic', 'glycolic', 'aha', 'bha',
]);

// Extract keywords from text
function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Normalize text
  const normalized = text.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ').filter(w => w.length > 2);
  const keywords: string[] = [];

  // Extract single words
  words.forEach(word => {
    if (!STOP_WORDS.has(word) && word.length > 2) {
      keywords.push(word);
    }
  });

  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    // Only include phrases where at least one word is meaningful
    if (!STOP_WORDS.has(words[i]) || !STOP_WORDS.has(words[i + 1])) {
      if (words[i].length > 2 && words[i + 1].length > 2) {
        keywords.push(phrase);
      }
    }
  }

  // Extract 3-word phrases (less common but valuable)
  for (let i = 0; i < words.length - 2; i++) {
    const hasBeautyWord = BEAUTY_KEYWORDS.has(words[i]) ||
                          BEAUTY_KEYWORDS.has(words[i + 1]) ||
                          BEAUTY_KEYWORDS.has(words[i + 2]);
    if (hasBeautyWord) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      keywords.push(phrase);
    }
  }

  return keywords;
}

// Classify keyword into category
function classifyKeyword(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();

  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some(w => lowerKeyword.includes(w))) {
      return category;
    }
  }

  // Check if it's a beauty-specific term
  const keywordWords = lowerKeyword.split(' ');
  if (keywordWords.some(w => BEAUTY_KEYWORDS.has(w))) {
    return 'Beauty';
  }

  return 'General';
}

// Generate mock keyword data based on category
function generateMockKeywords(mainCategory: string, subCategory: string, days: number): KeywordData[] {
  const categoryKeywordSets: Record<string, Record<string, string[]>> = {
    skin: {
      all_skin: [
        'vitamin c serum', 'hyaluronic acid', 'retinol cream', 'niacinamide', 'moisturizer spf', 'double cleanse', 'skin barrier', 'glass skin', 'slugging', 'skin cycling',
        'ceramide cream', 'peptide serum', 'bakuchiol', 'azelaic acid', 'tranexamic acid', 'centella asiatica', 'squalane oil', 'zinc sunscreen', 'chemical exfoliant', 'physical exfoliant',
        'anti aging serum', 'dark spot corrector', 'pore minimizer', 'oil control', 'dewy skin', 'skin flooding', 'barrier repair', 'moisture barrier', 'skinimalism', 'skip care'
      ],
      skincare: [
        'gentle cleanser', 'hydrating toner', 'exfoliating acid', 'face oil', 'night cream', 'eye cream', 'sheet mask', 'essence', 'ampoule', 'spot treatment',
        'micellar water', 'oil cleanser', 'foam cleanser', 'gel moisturizer', 'sleeping mask', 'clay mask', 'peel off mask', 'face mist', 'facial spray', 'skin serum',
        'aha bha', 'glycolic acid', 'lactic acid', 'mandelic acid', 'salicylic acid', 'benzoyl peroxide', 'adapalene', 'tretinoin', 'retinaldehyde', 'vitamin e'
      ],
      suncare: [
        'mineral sunscreen', 'spf 50', 'reef safe', 'tinted sunscreen', 'sunscreen stick', 'reapply sunscreen', 'uva protection', 'water resistant', 'daily spf', 'sun damage',
        'chemical sunscreen', 'hybrid sunscreen', 'sunscreen primer', 'spf moisturizer', 'sunscreen serum', 'invisible sunscreen', 'no white cast', 'korean sunscreen', 'japanese sunscreen', 'european sunscreen',
        'pa++++', 'broad spectrum', 'sun protection factor', 'uv filter', 'photostable', 'antioxidant sunscreen', 'after sun care', 'sun repair', 'sunburn relief', 'tan removal'
      ],
      kbeauty: [
        'snail mucin', 'centella asiatica', 'rice water', 'ginseng', 'propolis', 'mugwort', 'bamboo water', 'green tea', 'honey mask', 'fermented',
        'korean skincare', 'glass skin routine', '10 step routine', '7 skin method', 'skip care', 'essence toner', 'ampoule serum', 'cushion compact', 'bb cream', 'cc cream',
        'cica cream', 'heartleaf', 'birch juice', 'yuzu', 'soybean', 'lotus extract', 'galactomyces', 'bifida ferment', 'saccharomyces', 'natto gum'
      ],
      cleanbeauty: [
        'clean ingredients', 'non-toxic', 'paraben free', 'sulfate free', 'fragrance free', 'plant based', 'sustainable packaging', 'reef safe', 'vegan formula', 'organic certified',
        'ewa certified', 'leaping bunny', 'cruelty free', 'zero waste beauty', 'refillable packaging', 'biodegradable', 'natural preservatives', 'essential oils', 'botanical extracts', 'mineral makeup',
        'silicone free', 'phthalate free', 'synthetic free', 'chemical free', 'green beauty', 'eco beauty', 'conscious beauty', 'ethical beauty', 'transparency', 'clean label'
      ],
    },
    makeup: {
      all_makeup: [
        'full coverage', 'natural finish', 'long wearing', 'transfer proof', 'buildable coverage', 'skin like finish', 'dewy look', 'matte lipstick', 'cream blush', 'setting spray',
        'makeup primer', 'color corrector', 'contour stick', 'highlight palette', 'bronzer drops', 'lip oil', 'lip stain', 'tinted moisturizer', 'skin tint', 'bb cream',
        'baking powder', 'translucent powder', 'setting powder', 'fixing spray', 'makeup remover', 'micellar makeup', 'waterproof makeup', 'smudge proof', 'crease proof', 'fade resistant'
      ],
      colorcosmetics: [
        'liquid lipstick', 'eyeshadow palette', 'bronzer contour', 'highlighter glow', 'blush palette', 'lip liner', 'brow gel', 'mascara waterproof', 'concealer brightening', 'primer pore',
        'velvet lipstick', 'satin finish', 'shimmer eyeshadow', 'matte eyeshadow', 'glitter makeup', 'duochrome', 'multichrome', 'cream contour', 'powder contour', 'liquid blush',
        'brow pencil', 'brow pomade', 'lash primer', 'tubing mascara', 'fiber mascara', 'kohl eyeliner', 'gel eyeliner', 'felt tip liner', 'graphic liner', 'wing liner'
      ],
      nails: [
        'gel polish', 'nail art', 'press on nails', 'nail strengthener', 'cuticle oil', 'base coat', 'top coat', 'nail lamp', 'dip powder', 'chrome nails',
        'builder gel', 'polygel', 'acrylic nails', 'nail tips', 'nail forms', 'nail glue', 'nail dehydrator', 'nail primer', 'slip solution', 'nail drill',
        'french manicure', 'ombre nails', 'marble nails', 'foil nails', 'stamping plates', 'nail stickers', 'water decals', 'rhinestones', 'nail charms', 'encapsulated nails'
      ],
    },
    hair: {
      all_hair: [
        'hair growth', 'damage repair', 'frizz control', 'heat protection', 'scalp treatment', 'bond repair', 'protein treatment', 'deep conditioning', 'leave in', 'hair oil',
        'hair serum', 'hair mask', 'scalp serum', 'root volumizer', 'anti breakage', 'split end repair', 'color protection', 'blonde toning', 'curl definition', 'straightening treatment',
        'keratin treatment', 'brazilian blowout', 'hair botox', 'olaplex dupe', 'rice water', 'rosemary oil', 'castor oil hair', 'argan oil', 'coconut oil hair', 'hair slugging'
      ],
      haircare: [
        'sulfate free shampoo', 'hydrating conditioner', 'hair mask', 'scalp scrub', 'dry shampoo', 'purple shampoo', 'curl cream', 'smoothing serum', 'split end', 'keratin treatment',
        'clarifying shampoo', 'co wash', 'pre poo', 'detangling spray', 'heat protectant spray', 'anti frizz serum', 'volumizing mousse', 'texturizing spray', 'sea salt spray', 'hair gel',
        'edge control', 'pomade', 'hair wax', 'hair clay', 'finishing cream', 'shine spray', 'gloss treatment', 'bond builder', 'protein mask', 'moisture balance'
      ],
      hairdryers: [
        'ionic dryer', 'fast drying', 'lightweight dryer', 'professional dryer', 'quiet motor', 'multiple heat', 'cool shot', 'diffuser attachment', 'concentrator nozzle', 'salon quality',
        'ceramic dryer', 'tourmaline dryer', 'titanium dryer', 'infrared dryer', 'dual voltage', 'travel dryer', 'compact dryer', 'powerful motor', 'ac motor', 'dc motor',
        'negative ions', 'frizz reduction', 'shine boost', 'quick dry time', 'heat settings', 'speed settings', 'ergonomic design', 'long cord', 'hanging loop', 'dyson dupe'
      ],
      straighteners: [
        'flat iron', 'ceramic plates', 'titanium straightener', 'temperature control', 'floating plates', 'steam straightener', 'frizz free', 'silk press', 'keratin flat iron', 'travel straightener',
        'tourmaline plates', 'infrared straightener', 'wet to dry', 'wide plates', 'narrow plates', 'rounded edges', 'digital display', 'auto shut off', 'dual voltage iron', 'cordless straightener',
        'ghd dupe', 'professional flat iron', 'salon straightener', 'one pass straight', 'heat recovery', 'even heat', 'no snag plates', 'smooth glide', 'babyliss straightener', 'chi flat iron'
      ],
      curlingirons: [
        'curling wand', 'barrel size', 'clipless curler', 'beach waves', 'tight curls', 'loose waves', 'auto curler', 'rotating barrel', 'ceramic curler', 'tourmaline curler',
        'titanium curler', 'interchangeable barrels', 'tapered wand', 'bubble wand', 'triple barrel', 'spiral curler', 'conical wand', '1 inch curler', '1.5 inch curler', '2 inch curler',
        'cool tip', 'heat glove', 'spring clamp', 'marcel iron', 'long lasting curls', 'heatless alternative', 'overnight curls', 'flexi rods', 'curl formers', 'babyliss curler'
      ],
      hotairbrushes: [
        'blow dry brush', 'one step dryer', 'volumizing brush', 'round brush dryer', 'rotating brush', 'styling brush', 'root lift', 'smooth blowout', 'salon blowout', 'paddle brush dryer',
        'ionic brush', 'ceramic brush', 'boar bristle', 'nylon bristle', 'detachable brush', 'cool setting', 'multiple speeds', 'swivel cord', 'oval brush', 'round barrel',
        'revlon one step', 'dyson airwrap dupe', 'hot tools brush', 'babyliss big hair', 'double shot dryer', 'anti static', 'volume boost', 'smooth finish', 'frizz free blowout', 'at home blowout'
      ],
    },
    body: {
      all_body: [
        'body lotion', 'body oil', 'body scrub', 'cellulite treatment', 'stretch marks', 'firming cream', 'self tanner', 'body butter', 'dry brushing', 'body mist',
        'body serum', 'body moisturizer', 'shower gel', 'body wash', 'exfoliating gloves', 'konjac sponge', 'loofah', 'body polish', 'sugar scrub', 'salt scrub',
        'in shower lotion', 'after shower oil', 'body glow', 'shimmer lotion', 'gradual tan', 'bronzing drops', 'fake tan', 'tan eraser', 'body acne wash', 'kp treatment'
      ],
      bodycare: [
        'moisturizing body', 'exfoliating scrub', 'shower oil', 'body serum', 'hand cream', 'foot cream', 'body acne', 'keratosis pilaris', 'ingrown hair', 'rough skin',
        'chicken skin', 'strawberry legs', 'back acne', 'butt acne', 'body breakouts', 'eczema cream', 'psoriasis treatment', 'dry skin patches', 'cracked heels', 'rough elbows',
        'hand mask', 'foot peel', 'callus remover', 'cuticle cream', 'nail oil', 'body whitening', 'dark spot body', 'underarm care', 'intimate care', 'deodorant natural'
      ],
      fragrance: [
        'eau de parfum', 'long lasting scent', 'signature scent', 'perfume layering', 'fragrance notes', 'unisex perfume', 'niche fragrance', 'designer perfume', 'body spray', 'perfume oil',
        'eau de toilette', 'parfum', 'cologne', 'fragrance mist', 'hair perfume', 'solid perfume', 'rollerball perfume', 'travel perfume', 'decant', 'perfume sample',
        'top notes', 'heart notes', 'base notes', 'sillage', 'projection', 'longevity', 'skin scent', 'beast mode', 'compliment getter', 'dupe fragrance'
      ],
    },
    beautytech: {
      beautytech: [
        'led mask', 'microcurrent device', 'facial steamer', 'derma roller', 'ice roller', 'gua sha tool', 'facial massager', 'cleansing brush', 'hair removal', 'skin analyzer',
        'red light therapy', 'blue light acne', 'rf device', 'ems device', 'ultrasonic spatula', 'blackhead vacuum', 'pore extractor', 'jade roller', 'rose quartz roller', 'cryo stick',
        'nuface dupe', 'foreo dupe', 'at home laser', 'ipl device', 'dermaplaning tool', 'face shaver', 'eyebrow trimmer', 'nose trimmer', 'heated lash curler', 'lash lift kit'
      ],
    },
  };

  const baseKeywords = categoryKeywordSets[mainCategory]?.[subCategory] ||
                       categoryKeywordSets[mainCategory]?.['all_' + mainCategory] ||
                       ['beauty product', 'skincare routine', 'makeup look', 'hair styling', 'self care'];

  const sources = ['Reddit', 'YouTube', 'TikTok', 'Twitter', 'Instagram', 'News'];
  const now = new Date();
  const keywords: KeywordData[] = [];

  baseKeywords.forEach((keyword, index) => {
    // Generate random but realistic data
    const frequency = Math.floor(Math.random() * 50) + 2; // 2-52 mentions
    const sourceDist: Record<string, number> = {};

    // Distribute across sources
    let remaining = frequency;
    const shuffledSources = [...sources].sort(() => Math.random() - 0.5);
    shuffledSources.forEach((source, i) => {
      if (i === shuffledSources.length - 1) {
        if (remaining > 0) sourceDist[source] = remaining;
      } else {
        const count = Math.floor(Math.random() * (remaining * 0.6));
        if (count > 0) {
          sourceDist[source] = count;
          remaining -= count;
        }
      }
    });

    // Random sentiment distribution
    const positive = Math.floor(Math.random() * frequency * 0.6);
    const negative = Math.floor(Math.random() * (frequency - positive) * 0.3);
    const neutral = frequency - positive - negative;

    // Determine trend
    const trendRoll = Math.random();
    const trend: 'rising' | 'stable' | 'falling' =
      trendRoll < 0.4 ? 'rising' : trendRoll < 0.8 ? 'stable' : 'falling';

    // Last seen within the time period
    const daysAgo = Math.random() * days;
    const lastSeen = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    keywords.push({
      keyword,
      frequency,
      sources: sourceDist,
      sentiment: { positive, neutral, negative },
      trend,
      lastSeen: lastSeen.toISOString(),
      category: classifyKeyword(keyword),
    });
  });

  // Sort by frequency
  return keywords.sort((a, b) => b.frequency - a.frequency);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const mainCategory = searchParams.get('mainCategory') || 'skin';
    const subCategory = searchParams.get('category') || 'all_skin';
    const sourcesParam = searchParams.get('sources') || '';
    const enabledSources = sourcesParam ? sourcesParam.split(',') : [];

    // For now, generate mock keyword data
    // In production, this would aggregate from actual mentions
    let keywords = generateMockKeywords(mainCategory, subCategory, days);

    // Filter by enabled sources
    if (enabledSources.length > 0) {
      keywords = keywords.map(kw => {
        const filteredSources: Record<string, number> = {};
        let newFrequency = 0;

        Object.entries(kw.sources).forEach(([source, count]) => {
          if (enabledSources.some(s => source.toLowerCase().includes(s))) {
            filteredSources[source] = count;
            newFrequency += count;
          }
        });

        return {
          ...kw,
          sources: filteredSources,
          frequency: newFrequency,
        };
      }).filter(kw => kw.frequency >= 2); // Minimum 2 mentions
    }

    return NextResponse.json({
      success: true,
      keywords,
      meta: {
        total: keywords.length,
        days,
        mainCategory,
        subCategory,
      },
    });
  } catch (error) {
    console.error('Audience keywords error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
