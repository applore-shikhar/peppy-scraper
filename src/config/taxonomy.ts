export interface CategoryDef {
  broadCategory: string;
  subCategory: string;
  baseTags: string[]; // always applied regardless of vector score
}

// Canonical category hierarchy — broadCategory → subCategory → base tags
export const TAXONOMY_BASE_TAGS: Record<string, Record<string, string[]>> = {
  Electronics: {
    Smartphones:           ['electronics', 'mobile', 'smartphone'],
    Laptops:               ['electronics', 'computing', 'laptop'],
    Tablets:               ['electronics', 'tablet'],
    'Audio & Headphones':  ['electronics', 'audio'],
    Televisions:           ['electronics', 'television'],
    Cameras:               ['electronics', 'camera', 'photography'],
    Wearables:             ['electronics', 'wearables'],
    Gaming:                ['electronics', 'gaming'],
    Monitors:              ['electronics', 'computing', 'monitor'],
    'Computer Accessories':['electronics', 'computing'],
    'Smart Home':          ['electronics', 'smart-home'],
  },
  'Home & Kitchen': {
    'Kitchen Appliances':  ['kitchen', 'appliances'],
    'Large Appliances':    ['appliances'],
    'Home Decor':          ['home', 'home-decor'],
    'Furniture & Bedding': ['home', 'furniture'],
    'Cleaning Appliances': ['appliances', 'cleaning'],
    'Air Treatment':       ['appliances', 'home'],
  },
  'Personal Care': {
    'Hair Care':           ['personal-care', 'hair-care'],
    Grooming:              ['personal-care', 'grooming'],
    'Oral Care':           ['personal-care', 'oral-care'],
    'Skin & Beauty':       ['personal-care', 'beauty', 'skincare'],
    Fragrance:             ['personal-care', 'beauty', 'fragrance'],
  },
  'Fitness & Sports': {
    'Cardio Equipment':    ['fitness', 'sports'],
    'Strength Training':   ['fitness', 'sports', 'weights'],
    Yoga:                  ['fitness', 'sports', 'yoga'],
    'Supplements & Nutrition': ['fitness', 'sports', 'supplements'],
    'Sports Accessories':  ['fitness', 'sports'],
  },
  Office: {
    Printers:              ['office', 'computing', 'printer'],
    'Storage Devices':     ['office', 'computing', 'storage'],
    Peripherals:           ['office', 'computing'],
    Webcams:               ['office', 'computing', 'webcam'],
    Hubs:                  ['office', 'computing', 'hub'],
  },
  'Baby & Kids': {
    'Baby Essentials':     ['baby', 'kids'],
    Toys:                  ['kids', 'toys', 'entertainment'],
  },
};

export function getBroadCategoryBaseTags(broadCategory: string, subCategory: string): string[] {
  return TAXONOMY_BASE_TAGS[broadCategory]?.[subCategory] ?? [];
}
