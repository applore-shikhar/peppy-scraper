import { BundledProduct } from '../parsers/types';

interface TagRule {
  tags: string[];
  pattern: RegExp;
}

// Order matters — more specific rules first
const TAG_RULES: TagRule[] = [
  // ── Brands ────────────────────────────────────────────────────────────────
  { pattern: /\bapple\b/i,        tags: ['brand-apple'] },
  { pattern: /\bsamsung\b/i,      tags: ['brand-samsung'] },
  { pattern: /\blg\b/i,           tags: ['brand-lg'] },
  { pattern: /\bsony\b/i,         tags: ['brand-sony'] },
  { pattern: /\bdyson\b/i,        tags: ['brand-dyson'] },
  { pattern: /\bnespresso\b/i,    tags: ['brand-nespresso'] },
  { pattern: /\bphilips\b/i,      tags: ['brand-philips'] },
  { pattern: /\bbosch\b/i,        tags: ['brand-bosch'] },
  { pattern: /\bxiaomi\b/i,       tags: ['brand-xiaomi'] },
  { pattern: /\bhuawei\b/i,       tags: ['brand-huawei'] },
  { pattern: /\bdell\b/i,         tags: ['brand-dell'] },
  { pattern: /\bhp\b/i,           tags: ['brand-hp'] },
  { pattern: /\blenovo\b/i,       tags: ['brand-lenovo'] },
  { pattern: /\binstant.?pot\b/i, tags: ['brand-instant-pot'] },
  { pattern: /\bmidea\b/i,        tags: ['brand-midea'] },

  // ── Smartphones ───────────────────────────────────────────────────────────
  { pattern: /iphone/i,           tags: ['smartphone', 'electronics', 'mobile', 'brand-apple'] },
  { pattern: /galaxy\s*s\d/i,     tags: ['smartphone', 'electronics', 'mobile', 'brand-samsung'] },
  { pattern: /galaxy\s*a\d/i,     tags: ['smartphone', 'electronics', 'mobile', 'brand-samsung'] },
  { pattern: /galaxy\s*z/i,       tags: ['smartphone', 'electronics', 'mobile', 'foldable', 'brand-samsung'] },
  { pattern: /pixel\s*\d/i,       tags: ['smartphone', 'electronics', 'mobile', 'brand-google'] },
  { pattern: /\b5g\b/i,           tags: ['5g'] },
  { pattern: /\b(smartphone|mobile phone)\b/i, tags: ['smartphone', 'electronics', 'mobile'] },

  // ── Laptops & Computers ───────────────────────────────────────────────────
  { pattern: /macbook/i,          tags: ['laptop', 'electronics', 'computing', 'brand-apple'] },
  { pattern: /\b(laptop|notebook)\b/i, tags: ['laptop', 'electronics', 'computing'] },
  { pattern: /\b(gaming laptop|gaming pc)\b/i, tags: ['laptop', 'gaming', 'electronics', 'computing'] },
  { pattern: /\b(desktop|all-in-one|imac)\b/i, tags: ['desktop', 'electronics', 'computing'] },

  // ── Tablets ───────────────────────────────────────────────────────────────
  { pattern: /\bipad\b/i,         tags: ['tablet', 'electronics', 'brand-apple'] },
  { pattern: /\b(tablet|ipad)\b/i, tags: ['tablet', 'electronics'] },
  { pattern: /galaxy\s*tab/i,     tags: ['tablet', 'electronics', 'brand-samsung'] },

  // ── Audio ─────────────────────────────────────────────────────────────────
  { pattern: /airpods/i,          tags: ['headphones', 'wireless', 'audio', 'electronics', 'brand-apple'] },
  { pattern: /\b(earbuds|earphones|tws)\b/i, tags: ['headphones', 'wireless', 'audio', 'electronics'] },
  { pattern: /\b(headphones|over-ear|on-ear)\b/i, tags: ['headphones', 'audio', 'electronics'] },
  { pattern: /\b(speaker|soundbar)\b/i, tags: ['speaker', 'audio', 'electronics'] },

  // ── Televisions ───────────────────────────────────────────────────────────
  { pattern: /\b(oled|qled|neo qled)\b/i, tags: ['television', 'electronics', 'smart-tv', 'premium'] },
  { pattern: /\b(tv|television|smart tv)\b/i, tags: ['television', 'electronics'] },
  { pattern: /\b(4k|8k|uhd)\b/i, tags: ['4k', 'high-resolution'] },

  // ── Cameras ───────────────────────────────────────────────────────────────
  { pattern: /\b(camera|dslr|mirrorless|gopro)\b/i, tags: ['camera', 'electronics', 'photography'] },

  // ── Wearables ─────────────────────────────────────────────────────────────
  { pattern: /\b(smartwatch|smart watch|apple watch|galaxy watch)\b/i, tags: ['smartwatch', 'wearables', 'electronics'] },
  { pattern: /\b(fitness tracker|band|wristband)\b/i, tags: ['fitness-tracker', 'wearables', 'electronics'] },

  // ── Gaming ────────────────────────────────────────────────────────────────
  { pattern: /\b(playstation|ps5|ps4)\b/i, tags: ['gaming', 'console', 'electronics', 'brand-sony'] },
  { pattern: /\b(xbox)\b/i,       tags: ['gaming', 'console', 'electronics'] },
  { pattern: /\b(gaming|gamer)\b/i, tags: ['gaming', 'electronics'] },

  // ── Kitchen Appliances ────────────────────────────────────────────────────
  { pattern: /\b(coffee maker|coffee machine|espresso|nespresso)\b/i, tags: ['coffee-machine', 'kitchen', 'appliances'] },
  { pattern: /\b(air fryer)\b/i,  tags: ['air-fryer', 'kitchen', 'appliances'] },
  { pattern: /\b(microwave)\b/i,  tags: ['microwave', 'kitchen', 'appliances'] },
  { pattern: /\b(blender|mixer|food processor)\b/i, tags: ['blender', 'kitchen', 'appliances'] },
  { pattern: /\b(pressure cooker|instant pot|slow cooker)\b/i, tags: ['pressure-cooker', 'kitchen', 'appliances'] },
  { pattern: /\b(toaster|sandwich maker|waffle)\b/i, tags: ['toaster', 'kitchen', 'appliances'] },
  { pattern: /\b(juicer)\b/i,     tags: ['juicer', 'kitchen', 'appliances'] },
  { pattern: /\b(kettle|water dispenser)\b/i, tags: ['kettle', 'kitchen', 'appliances'] },

  // ── Large Home Appliances ─────────────────────────────────────────────────
  { pattern: /\b(washing machine|washer|dryer|laundry)\b/i, tags: ['washing-machine', 'appliances', 'laundry'] },
  { pattern: /\b(refrigerator|fridge|freezer)\b/i, tags: ['refrigerator', 'appliances', 'kitchen'] },
  { pattern: /\b(air conditioner|ac unit|split ac|inverter ac)\b/i, tags: ['air-conditioner', 'appliances', 'cooling'] },
  { pattern: /\b(dishwasher)\b/i, tags: ['dishwasher', 'appliances', 'kitchen'] },
  { pattern: /\b(vacuum cleaner|robot vacuum|hoover)\b/i, tags: ['vacuum-cleaner', 'appliances', 'cleaning'] },
  { pattern: /\b(iron|steam iron|garment steamer)\b/i, tags: ['iron', 'appliances', 'laundry'] },

  // ── Home & Furniture ──────────────────────────────────────────────────────
  { pattern: /\b(sofa|couch|sectional)\b/i, tags: ['sofa', 'furniture', 'home', 'living-room'] },
  { pattern: /\b(bed|mattress|bedframe)\b/i, tags: ['bed', 'furniture', 'home', 'bedroom'] },
  { pattern: /\b(dining table|coffee table|side table)\b/i, tags: ['table', 'furniture', 'home'] },
  { pattern: /\b(wardrobe|cabinet|shelf|bookcase)\b/i, tags: ['storage', 'furniture', 'home'] },
  { pattern: /\b(curtain|blinds|rug|carpet)\b/i, tags: ['home-decor', 'home'] },
  { pattern: /\b(lamp|lighting|chandelier)\b/i, tags: ['lighting', 'home-decor', 'home'] },

  // ── Personal Care ─────────────────────────────────────────────────────────
  { pattern: /\b(hair dryer|hair straightener|hair curler)\b/i, tags: ['hair-care', 'personal-care'] },
  { pattern: /\b(electric shaver|shaver|trimmer|epilator)\b/i, tags: ['grooming', 'personal-care'] },
  { pattern: /\b(electric toothbrush|oral.?b|sonicare)\b/i,    tags: ['oral-care', 'personal-care'] },
  { pattern: /\b(face mask|skincare|moisturizer|serum)\b/i,    tags: ['skincare', 'personal-care', 'beauty'] },
  { pattern: /\b(perfume|fragrance|cologne|deodorant)\b/i,     tags: ['fragrance', 'personal-care', 'beauty'] },

  // ── Fitness & Sports ──────────────────────────────────────────────────────
  { pattern: /\b(treadmill|running machine)\b/i,               tags: ['treadmill', 'fitness', 'sports'] },
  { pattern: /\b(exercise bike|stationary bike|spin bike)\b/i, tags: ['exercise-bike', 'fitness', 'sports'] },
  { pattern: /\b(yoga mat|gym mat)\b/i,                        tags: ['yoga', 'fitness', 'sports'] },
  { pattern: /\b(protein|whey|supplement|creatine)\b/i,        tags: ['supplements', 'fitness', 'nutrition'] },
  { pattern: /\b(dumbbell|weights|barbell|kettlebell)\b/i,     tags: ['weights', 'fitness', 'sports'] },
  { pattern: /\b(sports bag|gym bag|backpack)\b/i,             tags: ['bag', 'sports', 'accessories'] },

  // ── Office & Peripherals ──────────────────────────────────────────────────
  { pattern: /\b(printer|inkjet|laser jet|all-in-one printer)\b/i, tags: ['printer', 'office', 'computing'] },
  { pattern: /\b(webcam|web camera)\b/i,                       tags: ['webcam', 'office', 'computing'] },
  { pattern: /\b(external ssd|external hdd|usb drive|flash drive)\b/i, tags: ['storage', 'computing', 'portable'] },
  { pattern: /\b(usb hub|docking station|usb.?c hub)\b/i,      tags: ['hub', 'office', 'computing', 'accessories'] },
  { pattern: /\b(keyboard|mechanical keyboard)\b/i,            tags: ['keyboard', 'computing', 'accessories'] },
  { pattern: /\b(mouse|gaming mouse)\b/i,                      tags: ['mouse', 'computing', 'accessories'] },
  { pattern: /\b(monitor|gaming monitor|display)\b/i,          tags: ['monitor', 'computing', 'electronics'] },

  // ── Smart Home ────────────────────────────────────────────────────────────
  { pattern: /\b(security camera|cctv|ip camera|doorbell camera)\b/i, tags: ['security-camera', 'smart-home', 'security'] },
  { pattern: /\b(smart doorbell|video doorbell|ring doorbell)\b/i,    tags: ['doorbell', 'smart-home', 'security'] },
  { pattern: /\b(smart plug|smart switch|smart outlet)\b/i,           tags: ['smart-plug', 'smart-home'] },
  { pattern: /\b(echo|alexa|google home|nest hub|smart speaker)\b/i,  tags: ['smart-speaker', 'smart-home', 'alexa'] },
  { pattern: /\b(air purifier|hepa filter|air cleaner)\b/i,           tags: ['air-purifier', 'home', 'health'] },
  { pattern: /\b(humidifier|dehumidifier)\b/i,                        tags: ['humidifier', 'home', 'health'] },

  // ── Home & Furniture ──────────────────────────────────────────────────────
  { pattern: /\b(office chair|ergonomic chair|gaming chair)\b/i, tags: ['chair', 'furniture', 'office', 'home'] },
  { pattern: /\b(mattress|memory foam|spring mattress)\b/i,       tags: ['mattress', 'bedroom', 'furniture', 'home'] },
  { pattern: /\b(bedding|bed sheet|duvet|comforter|pillow)\b/i,   tags: ['bedding', 'bedroom', 'home', 'textiles'] },
  { pattern: /\b(curtain|blind|drape|sheer)\b/i,                  tags: ['curtains', 'home-decor', 'home', 'textiles'] },
  { pattern: /\b(led strip|rgb light|neon light|fairy light)\b/i, tags: ['lighting', 'led', 'home-decor', 'smart-home'] },
  { pattern: /\b(air freshener|scented candle|diffuser)\b/i,      tags: ['home-fragrance', 'home-decor', 'home'] },
  { pattern: /\b(storage box|organizer|basket|bin)\b/i,           tags: ['storage', 'organization', 'home'] },

  // ── Baby & Kids ───────────────────────────────────────────────────────────
  { pattern: /\b(baby monitor|baby camera)\b/i,    tags: ['baby-monitor', 'baby', 'smart-home'] },
  { pattern: /\b(stroller|pram|pushchair)\b/i,     tags: ['stroller', 'baby', 'kids'] },
  { pattern: /\b(baby carrier|baby wrap)\b/i,      tags: ['baby-carrier', 'baby', 'kids'] },
  { pattern: /\b(toy|lego|action figure|doll)\b/i, tags: ['toys', 'kids', 'entertainment'] },

  // ── Features ──────────────────────────────────────────────────────────────
  { pattern: /\b(wireless|bluetooth|wi-?fi)\b/i,             tags: ['wireless'] },
  { pattern: /\b(smart home|alexa|google home|homekit)\b/i,  tags: ['smart-home'] },
  { pattern: /\b(portable|travel size|compact)\b/i,          tags: ['portable'] },
  { pattern: /\b(energy efficient|inverter|energy star)\b/i, tags: ['energy-efficient'] },
  { pattern: /\b(waterproof|water resistant|ip\d\d)\b/i,     tags: ['waterproof'] },
  { pattern: /\b(fast charge|quick charge|magsafe)\b/i,      tags: ['fast-charging'] },
  { pattern: /\b(noise cancell?ing|anc)\b/i,                 tags: ['noise-cancelling'] },
  { pattern: /\b(rechargeable|usb.?c charging)\b/i,          tags: ['rechargeable'] },
  { pattern: /\b(voice control|voice assistant)\b/i,         tags: ['voice-control', 'smart-home'] },
];

// Price tier tags (applied based on lowestPrice in AED)
function priceTierTag(price: number | null): string | null {
  if (price === null) return null;
  if (price < 200)  return 'budget';
  if (price < 500)  return 'affordable';
  if (price < 1500) return 'mid-range';
  if (price < 5000) return 'premium';
  return 'luxury';
}

export function tagBundle(bundle: BundledProduct): string[] {
  const searchText = [bundle.name, bundle.description, bundle.category]
    .filter(Boolean)
    .join(' ');

  const tagSet = new Set<string>();

  for (const rule of TAG_RULES) {
    if (rule.pattern.test(searchText)) {
      rule.tags.forEach(t => tagSet.add(t));
    }
  }

  // Price tier
  const tier = priceTierTag(bundle.lowestPrice);
  if (tier) tagSet.add(tier);

  // Multi-retailer tag
  if (bundle.retailerCount >= 3) tagSet.add('widely-available');
  else if (bundle.retailerCount >= 2) tagSet.add('multi-retailer');

  // High-rated tag
  if (bundle.rating !== null && bundle.rating >= 4.5) tagSet.add('top-rated');
  if (bundle.reviewCount !== null && bundle.reviewCount >= 1000) tagSet.add('popular');

  return [...tagSet].sort();
}
