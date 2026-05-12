export interface TagAnchor {
  tag: string;
  threshold: number; // cosine similarity threshold — higher = stricter
  examples: string[];
}

// Per-tag example sentences. Averaged into a single anchor vector at init time.
// Covers vocabulary actually found in UAE e-commerce product listings.
export const TAG_ANCHORS: TagAnchor[] = [

  // ─── Brands ───────────────────────────────────────────────────────────────

  { tag: 'brand-apple', threshold: 0.82, examples: [
    'Apple iPhone 16 Pro Max 256GB smartphone',
    'Apple MacBook Air M3 chip laptop',
    'Apple iPad Pro 12.9 inch tablet',
    'Apple Watch Series 10 smartwatch',
    'Apple AirPods Pro 2nd generation earbuds',
  ]},
  { tag: 'brand-samsung', threshold: 0.82, examples: [
    'Samsung Galaxy S25 Ultra flagship smartphone',
    'Samsung QLED 55 inch 4K smart television',
    'Samsung French Door refrigerator with ice maker',
    'Samsung Galaxy Watch 7 smartwatch',
    'Samsung Galaxy Tab S9 FE tablet',
  ]},
  { tag: 'brand-lg', threshold: 0.82, examples: [
    'LG OLED evo 65 inch television',
    'LG ThinQ washing machine front load',
    'LG refrigerator InverterLinear compressor',
    'LG gram laptop ultralight',
    'LG PuriCare air purifier',
  ]},
  { tag: 'brand-sony', threshold: 0.82, examples: [
    'Sony WH-1000XM5 noise cancelling headphones',
    'Sony Bravia OLED television 4K HDR',
    'Sony Alpha mirrorless camera ZV-E10',
    'Sony PlayStation 5 gaming console',
    'Sony LinkBuds wireless earbuds',
  ]},
  { tag: 'brand-dyson', threshold: 0.82, examples: [
    'Dyson V15 Detect cordless vacuum cleaner',
    'Dyson Supersonic hair dryer',
    'Dyson Airwrap multi-styler hair tool',
    'Dyson Hot+Cool purifier fan heater',
    'Dyson V12 slim vacuum cleaner',
  ]},
  { tag: 'brand-philips', threshold: 0.82, examples: [
    'Philips Air Fryer XXL 7.3L',
    'Philips Series 9000 electric shaver',
    'Philips Sonicare electric toothbrush',
    'Philips Hue smart lighting LED bulb',
    'Philips OneBlade face and body trimmer',
  ]},
  { tag: 'brand-xiaomi', threshold: 0.82, examples: [
    'Xiaomi Redmi Note 14 Pro smartphone',
    'Xiaomi 14T Pro 5G Android phone',
    'Xiaomi robot vacuum cleaner S20+',
    'Xiaomi Mi True Wireless Earbuds',
    'Xiaomi Poco X6 Pro gaming phone',
  ]},
  { tag: 'brand-huawei', threshold: 0.82, examples: [
    'Huawei Pura 70 Pro smartphone camera',
    'Huawei MatePad 11.5 tablet',
    'Huawei MateBook D16 laptop',
    'Huawei Watch GT 4 smartwatch',
    'Huawei FreeBuds Pro 3 earbuds',
  ]},
  { tag: 'brand-dell', threshold: 0.82, examples: [
    'Dell XPS 15 laptop Intel Core i9',
    'Dell Inspiron 15 3000 series notebook',
    'Dell Alienware gaming laptop RTX',
    'Dell UltraSharp monitor 27 inch',
    'Dell G15 gaming laptop AMD Ryzen',
  ]},
  { tag: 'brand-hp', threshold: 0.82, examples: [
    'HP Pavilion laptop 15 inch AMD',
    'HP Envy x360 convertible 2-in-1 laptop',
    'HP LaserJet printer wireless',
    'HP EliteBook business laptop',
    'HP OMEN gaming laptop RTX 4060',
  ]},
  { tag: 'brand-lenovo', threshold: 0.82, examples: [
    'Lenovo ThinkPad X1 Carbon business laptop',
    'Lenovo IdeaPad 5 laptop AMD Ryzen',
    'Lenovo Legion 5 gaming laptop',
    'Lenovo Tab P12 Pro tablet',
    'Lenovo Yoga 9i 2-in-1 convertible laptop',
  ]},
  { tag: 'brand-nespresso', threshold: 0.82, examples: [
    'Nespresso Vertuo Pop coffee machine',
    'Nespresso Essenza Mini espresso maker',
    'Nespresso Citiz milk frother bundle',
    'Nespresso OriginalLine coffee capsule machine',
    'Nespresso Lattissima One barista style',
  ]},
  { tag: 'brand-bosch', threshold: 0.82, examples: [
    'Bosch Serie 4 front load washing machine',
    'Bosch dishwasher built-in 60cm',
    'Bosch food processor MultiTalent',
    'Bosch electric kettle 1.7L stainless',
    'Bosch Serie 6 refrigerator',
  ]},
  { tag: 'brand-anker', threshold: 0.82, examples: [
    'Anker PowerCore 26800 portable charger',
    'Anker 737 GaNPrime charger 120W',
    'Anker USB-C hub 7-in-1',
    'Anker Soundcore earbuds ANC',
    'Anker Eufy robot vacuum RoboVac',
  ]},
  { tag: 'brand-google', threshold: 0.82, examples: [
    'Google Pixel 9 Pro smartphone',
    'Google Nest Hub smart display',
    'Google Chromecast streaming device',
    'Google Pixel Watch 3',
    'Google Pixel Buds Pro 2',
  ]},
  { tag: 'brand-jbl', threshold: 0.82, examples: [
    'JBL Flip 7 portable Bluetooth speaker',
    'JBL Charge 5 waterproof speaker',
    'JBL Tune 770NC noise cancelling headphones',
    'JBL Xtreme 3 outdoor speaker',
    'JBL Quantum gaming headset',
  ]},
  { tag: 'brand-bose', threshold: 0.82, examples: [
    'Bose QuietComfort Ultra headphones ANC',
    'Bose SoundLink Flex Bluetooth speaker',
    'Bose Sport earbuds wireless',
    'Bose 900 soundbar with Dolby Atmos',
    'Bose Frames audio sunglasses',
  ]},

  // ─── Smartphones ──────────────────────────────────────────────────────────

  { tag: 'smartphone', threshold: 0.70, examples: [
    'Samsung Galaxy S25 smartphone 6.7 inch display Android',
    'Apple iPhone 16 Pro mobile phone 256GB storage',
    'flagship smartphone 5G triple camera 120Hz OLED',
    'budget Android mobile phone with fingerprint sensor',
    'foldable smartphone with expandable display',
  ]},
  { tag: 'mobile', threshold: 0.68, examples: [
    'mobile phone with dual SIM 4G LTE',
    'smartphone mobile device touchscreen',
    'Android mobile with 5000mAh battery',
    'unlocked mobile phone international version',
    'mid-range mobile phone 128GB RAM 8GB',
  ]},
  { tag: '5g', threshold: 0.72, examples: [
    '5G smartphone sub-6GHz mmWave connectivity',
    'mobile phone with 5G network support',
    '5G enabled tablet WiFi cellular',
    'flagship 5G processor Snapdragon',
    '5G Android phone with fast download speeds',
  ]},
  { tag: 'foldable', threshold: 0.75, examples: [
    'foldable smartphone with flip design',
    'Samsung Galaxy Z Fold folding phone',
    'Z Flip clamshell foldable display',
    'folding screen smartphone book-style form factor',
    'dual screen foldable OLED phone',
  ]},

  // ─── Laptops & Computers ──────────────────────────────────────────────────

  { tag: 'laptop', threshold: 0.70, examples: [
    'Dell XPS 15 laptop Intel Core i9 16GB RAM',
    'portable laptop computer for students and professionals',
    'ultrabook notebook thin light laptop 14 inch',
    'laptop with backlit keyboard and fingerprint reader',
    'business laptop long battery life 12 hours',
  ]},
  { tag: 'computing', threshold: 0.68, examples: [
    'computer laptop desktop workstation processor',
    'Intel Core AMD Ryzen CPU computing device',
    'RAM SSD storage computing performance',
    'Windows 11 macOS computing operating system',
    'home office computing setup monitor keyboard',
  ]},
  { tag: 'desktop', threshold: 0.72, examples: [
    'desktop all-in-one computer iMac Windows PC',
    'gaming PC desktop tower RTX GPU',
    'mini PC desktop small form factor',
    'all-in-one desktop with built-in display',
    'desktop workstation for video editing',
  ]},

  // ─── Tablets ──────────────────────────────────────────────────────────────

  { tag: 'tablet', threshold: 0.70, examples: [
    'Apple iPad Pro 12.9 inch M2 chip tablet',
    'Android tablet 10 inch FHD display stylus pen',
    'Samsung Galaxy Tab S9 AMOLED tablet',
    'drawing tablet for artists digital pen',
    'kids tablet with parental controls',
  ]},

  // ─── Audio ────────────────────────────────────────────────────────────────

  { tag: 'headphones', threshold: 0.70, examples: [
    'over-ear headphones Sony WH noise cancelling',
    'wireless headphones Bluetooth 5.3 30hr battery',
    'audiophile headphones hi-fi sound quality',
    'on-ear headphones foldable travel',
    'professional studio monitoring headphones',
  ]},
  { tag: 'earbuds', threshold: 0.70, examples: [
    'true wireless earbuds TWS Bluetooth ANC',
    'in-ear earphones with charging case',
    'Apple AirPods Pro earbuds active noise cancellation',
    'sports earbuds IPX5 waterproof sweat resistant',
    'earbuds with transparency mode ambient sound',
  ]},
  { tag: 'audio', threshold: 0.67, examples: [
    'audio equipment speaker headphones sound',
    'hi-fi audio stereo system',
    'audio accessories earphones cables',
    'premium audio brand Bose Sony',
    'surround sound audio setup home cinema',
  ]},
  { tag: 'speaker', threshold: 0.70, examples: [
    'portable Bluetooth speaker 360 sound outdoor waterproof',
    'JBL Flip speaker 30W output',
    'smart speaker Amazon Echo Alexa Google Home',
    'bookshelf speaker hi-fi stereo pair',
    'party speaker with light show RGB',
  ]},
  { tag: 'soundbar', threshold: 0.73, examples: [
    'Samsung HW soundbar Dolby Atmos',
    'TV soundbar with wireless subwoofer',
    'Sonos soundbar home cinema',
    '3.1 soundbar surround sound system',
    'soundbar for 55 65 inch television',
  ]},
  { tag: 'noise-cancelling', threshold: 0.72, examples: [
    'active noise cancellation ANC headphones',
    'noise cancelling earbuds block ambient sound',
    'ANC wireless headphones office travel',
    'hybrid noise cancelling technology',
    'adaptive noise cancellation transparency mode',
  ]},
  { tag: 'wireless', threshold: 0.68, examples: [
    'wireless Bluetooth connection 5.3',
    'WiFi wireless connectivity',
    'cordless wireless product no cables',
    'wireless charging Qi MagSafe',
    'wireless earbuds speaker headphones',
  ]},

  // ─── Televisions ──────────────────────────────────────────────────────────

  { tag: 'television', threshold: 0.70, examples: [
    'Samsung QLED 55 inch 4K smart TV',
    'LG OLED television HDR10 120Hz',
    'smart TV Android Google TV streaming Netflix',
    'QLED Neo QLED television panel',
    'flat screen TV 65 75 85 inch',
  ]},
  { tag: 'smart-tv', threshold: 0.72, examples: [
    'smart TV with built-in streaming apps',
    'Google TV Android TV operating system',
    'smart television Netflix Disney Prime',
    'voice control smart TV Alexa Google',
    'smart TV WiFi HDMI 4K',
  ]},
  { tag: '4k', threshold: 0.70, examples: [
    '4K Ultra HD resolution 3840x2160',
    '4K UHD television monitor display',
    '4K HDR10 Dolby Vision content',
    '4K camera video recording',
    '4K streaming Netflix 4K',
  ]},
  { tag: 'high-resolution', threshold: 0.70, examples: [
    '8K resolution ultra high definition',
    'QHD 2K 1440p display panel',
    'high resolution display 2560x1440',
    'retina display high pixel density',
    'full HD 1080p high resolution screen',
  ]},

  // ─── Cameras ──────────────────────────────────────────────────────────────

  { tag: 'camera', threshold: 0.70, examples: [
    'Sony Alpha mirrorless camera interchangeable lens',
    'Canon EOS DSLR camera 24 megapixel',
    'action camera GoPro waterproof 4K',
    'compact digital camera point and shoot',
    'instant camera Polaroid Fujifilm',
  ]},
  { tag: 'photography', threshold: 0.70, examples: [
    'photography equipment camera lens tripod',
    'professional photography camera DSLR mirrorless',
    'camera for street photography travel',
    'photography accessories flash filter',
    'beginner photography camera kit',
  ]},

  // ─── Wearables ────────────────────────────────────────────────────────────

  { tag: 'smartwatch', threshold: 0.70, examples: [
    'Apple Watch Series 10 GPS smartwatch',
    'Samsung Galaxy Watch 7 health tracking',
    'smartwatch ECG blood oxygen heart rate',
    'Garmin Fenix smartwatch GPS sports',
    'smart watch notifications calls music control',
  ]},
  { tag: 'wearables', threshold: 0.68, examples: [
    'wearable technology device fitness tracker smartwatch',
    'wearable health monitor body sensor',
    'smart wearable ring fitness band',
    'wearable electronics tracker sensor',
    'wearable device for sports fitness',
  ]},
  { tag: 'fitness-tracker', threshold: 0.72, examples: [
    'Fitbit fitness tracker step counter calorie',
    'activity tracker wristband sleep monitoring',
    'fitness band heart rate monitor GPS',
    'sport band pedometer step tracker',
    'health fitness wristband Xiaomi Mi Band',
  ]},

  // ─── Gaming ───────────────────────────────────────────────────────────────

  { tag: 'gaming', threshold: 0.70, examples: [
    'gaming laptop RTX 4060 144Hz high refresh rate',
    'gaming accessories controller headset keyboard mouse',
    'gaming monitor 240Hz 1ms response time',
    'gaming chair ergonomic RGB setup',
    'PC gaming graphics card GPU',
  ]},
  { tag: 'console', threshold: 0.72, examples: [
    'PlayStation 5 PS5 gaming console',
    'Xbox Series X gaming console 4K',
    'Nintendo Switch portable gaming console',
    'video game console disc drive',
    'next-gen gaming console controller bundle',
  ]},

  // ─── Kitchen Appliances ───────────────────────────────────────────────────

  { tag: 'coffee-machine', threshold: 0.72, examples: [
    'Nespresso coffee machine capsule espresso',
    'automatic espresso machine barista',
    'drip coffee maker 12 cup programmable',
    'bean-to-cup coffee machine grinder',
    'French press cafetiere coffee maker',
  ]},
  { tag: 'air-fryer', threshold: 0.75, examples: [
    'Philips air fryer XXL 7.3L no oil frying',
    'digital air fryer oven 6L touch screen',
    'air fryer with grill roast dehydrate',
    'compact air fryer 2L for one two person',
    'air fryer basket non-stick easy clean',
  ]},
  { tag: 'microwave', threshold: 0.75, examples: [
    'Samsung microwave oven 28L grill convection',
    'solo microwave oven 20L 800W',
    'built-in microwave oven stainless steel',
    'countertop microwave digital display',
    'inverter microwave oven defrost',
  ]},
  { tag: 'blender', threshold: 0.72, examples: [
    'Vitamix blender high performance smoothie maker',
    'Nutribullet blender personal bullet',
    'food processor blender combo 1000W',
    'countertop blender glass jug 2L',
    'immersion hand blender stick mixer',
  ]},
  { tag: 'pressure-cooker', threshold: 0.73, examples: [
    'Instant Pot Duo pressure cooker 7-in-1',
    'electric pressure cooker slow cooker rice',
    'stainless steel pressure cooker 6L stovetop',
    'multicooker pressure steam yogurt',
    'digital pressure cooker programmable',
  ]},
  { tag: 'toaster', threshold: 0.73, examples: [
    'toaster oven 25L convection bake grill',
    '2-slice 4-slice pop-up toaster',
    'sandwich maker toastie press',
    'waffle maker Belgian waffle iron',
    'mini oven toaster countertop',
  ]},
  { tag: 'juicer', threshold: 0.75, examples: [
    'slow juicer cold press masticating',
    'centrifugal juicer citrus orange extractor',
    'juicer blender combo fruit vegetables',
    'citrus press juicer electric',
    'slow masticating juicer nutrient',
  ]},
  { tag: 'kettle', threshold: 0.73, examples: [
    'electric kettle 1.7L stainless steel rapid boil',
    'temperature control kettle gooseneck pour over',
    'smart kettle WiFi Alexa control',
    'glass electric kettle LED light',
    'travel kettle compact portable',
  ]},
  { tag: 'stand-mixer', threshold: 0.74, examples: [
    'KitchenAid stand mixer 5.7L tilt-head',
    'stand mixer dough hook beater whisk',
    'planetary mixer bread dough baking',
    'electric stand mixer 1000W 6.5L',
    'Kenwood Chef stand mixer attachments',
  ]},
  { tag: 'kitchen', threshold: 0.67, examples: [
    'kitchen appliance cooking food preparation',
    'kitchen gadget blender kettle toaster',
    'kitchen equipment cooking baking',
    'small kitchen appliance countertop',
    'kitchen tools accessories cookware',
  ]},
  { tag: 'appliances', threshold: 0.66, examples: [
    'home appliance electrical device household',
    'kitchen home appliance large small',
    'electrical appliance energy efficient',
    'domestic appliance for home use',
    'smart appliance connected WiFi',
  ]},

  // ─── Large Home Appliances ────────────────────────────────────────────────

  { tag: 'washing-machine', threshold: 0.73, examples: [
    'Samsung front load washing machine 8kg inverter',
    'top load washing machine fully automatic',
    'washer dryer combo front loader',
    'washing machine 1400 RPM spin speed',
    'LG ThinQ washing machine steam',
  ]},
  { tag: 'refrigerator', threshold: 0.72, examples: [
    'Samsung French Door refrigerator 600L',
    'double door refrigerator frost free',
    'side by side refrigerator ice water dispenser',
    'mini fridge compact single door',
    'LG refrigerator InverterLinear smart diagnosis',
  ]},
  { tag: 'air-conditioner', threshold: 0.73, examples: [
    'split air conditioner 1.5 ton inverter',
    'window AC 12000 BTU cooling heating',
    'portable air conditioner 10000 BTU',
    'inverter split AC energy efficient R32 refrigerant',
    'smart AC WiFi control Google Alexa',
  ]},
  { tag: 'dishwasher', threshold: 0.75, examples: [
    'built-in dishwasher 60cm 14 place settings',
    'freestanding dishwasher stainless steel',
    'tabletop countertop dishwasher 6 settings',
    'dishwasher A+++ energy class',
    'dishwasher with half load option',
  ]},
  { tag: 'vacuum-cleaner', threshold: 0.72, examples: [
    'Dyson V15 cordless vacuum cleaner',
    'robot vacuum cleaner mapping LIDAR',
    'upright vacuum cleaner HEPA filter',
    'wet dry vacuum cleaner workshop',
    'handheld vacuum cleaner car portable',
  ]},
  { tag: 'iron', threshold: 0.72, examples: [
    'steam iron 2400W ceramic soleplate',
    'steam generator iron press clothes',
    'garment steamer vertical travel',
    'cordless steam iron',
    'steam iron anti-drip anti-calc',
  ]},
  { tag: 'clothes-dryer', threshold: 0.74, examples: [
    'heat pump dryer 9kg condenser',
    'vented tumble dryer 8kg sensor dry',
    'washer dryer combination 1400rpm',
    'condenser dryer reverse tumble',
    'clothes dryer with steam refresh',
  ]},
  { tag: 'cleaning', threshold: 0.67, examples: [
    'cleaning appliance vacuum mop robot',
    'home cleaning device electric',
    'floor cleaning robot automatic',
    'cleaning tools vacuum sweeper',
    'cleaning solution home hygiene',
  ]},

  // ─── Home & Furniture ─────────────────────────────────────────────────────

  { tag: 'sofa', threshold: 0.72, examples: [
    'L-shaped sectional sofa 3-seater living room',
    'fabric sofa set couch with chaise',
    'recliner sofa electric motorized',
    'corner sofa velvet upholstery',
    'modular sofa set convertible',
  ]},
  { tag: 'bed', threshold: 0.72, examples: [
    'king queen size bed frame upholstered',
    'storage bed ottoman with gas lift',
    'divan bed base headboard',
    'bunk bed children kids room',
    'platform bed solid wood frame',
  ]},
  { tag: 'mattress', threshold: 0.73, examples: [
    'memory foam mattress king size medium firm',
    'pocket spring mattress 2000 springs',
    'hybrid mattress foam springs 30cm deep',
    'orthopaedic mattress back support',
    'cooling gel mattress temperature regulation',
  ]},
  { tag: 'furniture', threshold: 0.66, examples: [
    'home furniture sofa bed wardrobe table',
    'office furniture desk chair shelf',
    'living room furniture set',
    'bedroom furniture bed wardrobe dresser',
    'furniture assembly flat pack',
  ]},
  { tag: 'home-decor', threshold: 0.67, examples: [
    'home decor accessories wall art',
    'decorative items for living room bedroom',
    'interior decoration curtains rugs cushions',
    'scented candle diffuser home fragrance',
    'photo frame vase decorative ornament',
  ]},
  { tag: 'curtains', threshold: 0.74, examples: [
    'blackout curtains bedroom thermal insulated',
    'eyelet curtains linen sheer voile',
    'roller blind motorised window',
    'room darkening curtains 140x260cm',
    'curtain panels ready made',
  ]},
  { tag: 'lighting', threshold: 0.70, examples: [
    'LED strip lights RGB smart color changing',
    'ceiling light pendant chandelier modern',
    'smart bulb Philips Hue color changing',
    'floor lamp reading light bedroom',
    'outdoor garden solar LED lights',
  ]},
  { tag: 'storage', threshold: 0.68, examples: [
    'wardrobe storage cabinet shelving',
    'storage box organizer under bed',
    'bookcase shelf wall mounted',
    'storage ottoman with lid basket',
    'drawer chest of drawers organizer',
  ]},
  { tag: 'home', threshold: 0.63, examples: [
    'home product household item',
    'home use domestic appliance accessory',
    'home improvement living room bedroom',
    'house product daily use',
    'home essentials furniture decor',
  ]},

  // ─── Personal Care ────────────────────────────────────────────────────────

  { tag: 'hair-care', threshold: 0.72, examples: [
    'Dyson Supersonic hair dryer 1600W',
    'hair straightener ceramic flat iron',
    'hair curler waving tong automatic',
    'hair dryer diffuser attachment salon',
    'hair styling tool ionic frizz control',
  ]},
  { tag: 'grooming', threshold: 0.71, examples: [
    'Philips electric shaver Series 9000',
    'beard trimmer cordless rechargeable',
    'body groomer hair removal men',
    'nose ear trimmer waterproof',
    'foil rotary shaver men electric',
  ]},
  { tag: 'oral-care', threshold: 0.73, examples: [
    'Oral-B electric toothbrush Bluetooth',
    'Philips Sonicare electric toothbrush',
    'water flosser cordless oral irrigator',
    'sonic toothbrush replacement head',
    'whitening electric toothbrush UV',
  ]},
  { tag: 'skincare', threshold: 0.70, examples: [
    'face moisturizer SPF 50 serum cream',
    'skincare set cleanser toner moisturizer',
    'vitamin C serum anti-aging face',
    'retinol night cream skin renewal',
    'sunscreen SPF 50+ UVA UVB',
  ]},
  { tag: 'fragrance', threshold: 0.72, examples: [
    'perfume Eau de Parfum 100ml spray',
    'cologne fragrance men woody citrus',
    'deodorant roll-on antiperspirant 48hr',
    'body spray mist fragrance women',
    'oud perfume Arabic oriental fragrance',
  ]},
  { tag: 'personal-care', threshold: 0.65, examples: [
    'personal care product hygiene grooming',
    'personal hygiene electric device',
    'beauty personal care accessories',
    'daily personal care routine product',
    'personal care tools hair skin body',
  ]},
  { tag: 'beauty', threshold: 0.66, examples: [
    'beauty product makeup skincare cosmetics',
    'beauty tools accessories brush applicator',
    'beauty care routine face body',
    'beauty brand cosmetics skincare',
    'beauty gift set collection',
  ]},
  { tag: 'epilator', threshold: 0.76, examples: [
    'Braun Silk-epil epilator legs arms',
    'electric epilator hair removal women',
    'wet dry epilator cordless waterproof',
    'epilator tweezers 40 head epilation',
    'IPL laser hair removal at home device',
  ]},

  // ─── Fitness & Sports ─────────────────────────────────────────────────────

  { tag: 'treadmill', threshold: 0.76, examples: [
    'electric treadmill home gym 12km/h',
    'folding treadmill motorized incline',
    'commercial treadmill running machine',
    'walking pad treadmill under desk',
    'treadmill 3HP motor 120kg capacity',
  ]},
  { tag: 'exercise-bike', threshold: 0.75, examples: [
    'stationary exercise bike spin indoor cycling',
    'recumbent exercise bike magnetic resistance',
    'upright bike cardio fitness home',
    'smart exercise bike app connectivity',
    'folding exercise bike compact',
  ]},
  { tag: 'yoga', threshold: 0.73, examples: [
    'yoga mat non-slip thick 6mm TPE',
    'yoga block foam brick pair',
    'yoga strap stretch band resistance',
    'yoga mat bag carry strap',
    'workout exercise yoga pilates mat',
  ]},
  { tag: 'weights', threshold: 0.71, examples: [
    'dumbbell set adjustable 20kg pair',
    'barbell set weight plate Olympic',
    'kettlebell cast iron 16kg',
    'resistance bands set loop fabric',
    'weight bench adjustable flat incline',
  ]},
  { tag: 'supplements', threshold: 0.72, examples: [
    'whey protein powder 2kg chocolate',
    'creatine monohydrate 500g unflavored',
    'BCAA amino acid supplement',
    'pre-workout energy supplement',
    'mass gainer weight protein shake',
  ]},
  { tag: 'fitness', threshold: 0.67, examples: [
    'fitness equipment gym home workout',
    'fitness tracker activity monitor',
    'fitness accessories sports gear',
    'fitness machine cardio strength',
    'fitness band resistance training',
  ]},
  { tag: 'sports', threshold: 0.65, examples: [
    'sports equipment outdoor activity',
    'sports accessories bag water bottle',
    'sports shoe sneaker performance',
    'sports nutrition supplement protein',
    'sports fitness training gear',
  ]},

  // ─── Office & Peripherals ─────────────────────────────────────────────────

  { tag: 'printer', threshold: 0.73, examples: [
    'HP LaserJet Pro printer wireless monochrome',
    'Canon PIXMA inkjet printer color',
    'all-in-one printer scanner copier',
    'A4 laser printer duplex automatic',
    'photo printer 4x6 portable Bluetooth',
  ]},
  { tag: 'monitor', threshold: 0.72, examples: [
    'Dell 27 inch IPS monitor 4K USB-C',
    'gaming monitor 144Hz 1ms FreeSync',
    'ultrawide curved monitor 34 inch',
    'portable monitor 15.6 inch 1080p',
    'dual monitor setup 24 inch FHD',
  ]},
  { tag: 'keyboard', threshold: 0.72, examples: [
    'mechanical keyboard Cherry MX RGB',
    'wireless keyboard Bluetooth slim',
    'gaming keyboard tenkeyless 60%',
    'ergonomic keyboard split wrist rest',
    'compact keyboard USB-C rechargeable',
  ]},
  { tag: 'mouse', threshold: 0.72, examples: [
    'wireless mouse Bluetooth 3-device multi',
    'gaming mouse 25600 DPI programmable',
    'ergonomic vertical mouse reduce strain',
    'compact travel mouse USB receiver',
    'silent click mouse office use',
  ]},
  { tag: 'webcam', threshold: 0.74, examples: [
    'Logitech C920 webcam 1080p 30fps',
    '4K webcam with built-in microphone',
    'streaming webcam autofocus ring light',
    'USB webcam for video conferencing',
    'business webcam privacy shutter',
  ]},
  { tag: 'hub', threshold: 0.73, examples: [
    'USB-C hub 7-in-1 HDMI 4K USB 3.0',
    'docking station laptop dual monitor',
    'multiport USB hub adapter',
    'Thunderbolt hub 100W charging',
    'USB A hub 4 port powered',
  ]},
  { tag: 'external-storage', threshold: 0.73, examples: [
    'Samsung T7 portable SSD 1TB USB-C',
    'external hard drive 2TB USB 3.0',
    'flash drive USB 3.2 256GB',
    'NAS network attached storage home',
    'external SSD 2TB fast 1000MB/s',
  ]},
  { tag: 'office', threshold: 0.64, examples: [
    'office equipment desk workplace',
    'office accessories printer scanner',
    'office chair desk monitor keyboard',
    'home office setup productivity',
    'office supply stationery document',
  ]},

  // ─── Smart Home ───────────────────────────────────────────────────────────

  { tag: 'security-camera', threshold: 0.73, examples: [
    'outdoor security camera 4K night vision',
    'indoor WiFi IP camera 360 rotation',
    'CCTV security camera system NVR',
    'doorbell camera two-way audio',
    'solar security camera wireless no wiring',
  ]},
  { tag: 'smart-doorbell', threshold: 0.75, examples: [
    'Ring video doorbell motion detection',
    'smart doorbell camera two-way audio WiFi',
    'wireless video doorbell 1080p',
    'smart doorbell Google Alexa compatible',
    'video doorbell with chime night vision',
  ]},
  { tag: 'smart-plug', threshold: 0.75, examples: [
    'smart plug WiFi energy monitoring Alexa',
    'smart socket timer schedule control',
    'smart outlet Google Home compatible',
    'plug-in smart home switch voice control',
    'mini smart plug USB charging port',
  ]},
  { tag: 'smart-speaker', threshold: 0.73, examples: [
    'Amazon Echo Dot Alexa smart speaker',
    'Google Nest Mini Home Hub smart display',
    'smart speaker voice assistant WiFi',
    'Apple HomePod mini speaker',
    'smart speaker Bluetooth multi-room audio',
  ]},
  { tag: 'air-purifier', threshold: 0.74, examples: [
    'HEPA air purifier for large rooms 500sqft',
    'air purifier CADR 400 True HEPA H13',
    'smart air purifier PM2.5 sensor app',
    'air cleaner pollen allergy dust',
    'portable air purifier desktop bedroom',
  ]},
  { tag: 'humidifier', threshold: 0.74, examples: [
    'cool mist ultrasonic humidifier 4L',
    'warm mist humidifier for baby room',
    'smart humidifier humidity sensor auto',
    'large room humidifier 6L 50hr',
    'essential oil diffuser humidifier aromatherapy',
  ]},
  { tag: 'smart-home', threshold: 0.66, examples: [
    'smart home device Alexa Google Home compatible',
    'IoT smart home automation connected',
    'smart home hub controller bridge',
    'WiFi smart home product voice control',
    'smart home ecosystem Matter protocol',
  ]},

  // ─── Baby & Kids ──────────────────────────────────────────────────────────

  { tag: 'baby-monitor', threshold: 0.76, examples: [
    'baby monitor 1080p two-way audio night vision',
    'video baby monitor split screen',
    'smart baby camera cry detection',
    'WiFi baby monitor app remote view',
    'audio only baby monitor DECT',
  ]},
  { tag: 'stroller', threshold: 0.75, examples: [
    'baby stroller pram travel system',
    'lightweight folding stroller compact',
    'jogging stroller all terrain wheels',
    'double pram twin stroller',
    'stroller with car seat adapter',
  ]},
  { tag: 'toys', threshold: 0.70, examples: [
    'LEGO building blocks set kids',
    'educational toy for toddler age 3+',
    'remote control toy car RC',
    'action figure collectible toy',
    'board game family strategy toy',
  ]},
  { tag: 'baby', threshold: 0.68, examples: [
    'baby product infant newborn',
    'baby care essentials feeding bathing',
    'baby nursery crib bedding',
    'newborn baby gift set',
    'baby safety protection product',
  ]},
  { tag: 'kids', threshold: 0.66, examples: [
    'children kids product age 3-12',
    'kids toy educational learning',
    'kids bedroom furniture playroom',
    'children clothing accessories',
    'kids sports outdoor activity',
  ]},

  // ─── Features ─────────────────────────────────────────────────────────────

  { tag: 'portable', threshold: 0.68, examples: [
    'portable compact lightweight travel size',
    'portable charger power bank on the go',
    'portable speaker carry handle strap',
    'compact portable design easy carry',
    'travel portable mini device',
  ]},
  { tag: 'energy-efficient', threshold: 0.70, examples: [
    'A+++ energy rating inverter technology',
    'energy efficient low power consumption',
    'Energy Star certified appliance',
    'inverter compressor energy saving',
    'eco mode low energy standby',
  ]},
  { tag: 'waterproof', threshold: 0.70, examples: [
    'IPX7 waterproof 1m 30 minutes submersion',
    'IP68 water dust resistant rating',
    'waterproof outdoor speaker rain splash',
    'waterproof smartwatch swimming pool',
    'water resistant IPX5 sweat proof',
  ]},
  { tag: 'fast-charging', threshold: 0.70, examples: [
    '65W 100W fast charging USB-C GaN',
    'Quick Charge 5.0 Qualcomm fast charge',
    'MagSafe 15W wireless fast charging',
    'super VOOC 80W flash charge',
    'fast charge adapter 45W USB PD',
  ]},
  { tag: 'rechargeable', threshold: 0.69, examples: [
    'rechargeable battery USB-C charging',
    'built-in rechargeable lithium battery',
    'USB rechargeable wireless device',
    'rechargeable cordless product',
    'rechargeable via magnetic dock cable',
  ]},
  { tag: 'voice-control', threshold: 0.72, examples: [
    'Alexa voice control compatible',
    'Google Assistant voice command',
    'Siri voice control Apple',
    'voice activated smart device',
    'hands-free voice control operation',
  ]},

  // ─── Price tiers — embedded for fallback tag inference only ───────────────

  { tag: 'budget', threshold: 0.75, examples: [
    'budget affordable cheap low cost product',
    'entry level basic budget smartphone',
    'value for money economical choice',
    'affordable budget friendly price',
    'low budget cheap option',
  ]},
  { tag: 'premium', threshold: 0.74, examples: [
    'premium flagship high-end luxury product',
    'premium build quality metal glass',
    'top of the line premium model',
    'premium features professional grade',
    'luxury premium brand product',
  ]},

  // ─── Electronics (broad) ─────────────────────────────────────────────────

  { tag: 'electronics', threshold: 0.63, examples: [
    'consumer electronics device gadget',
    'electronic product smartphone laptop TV',
    'electronics accessories cables adapters',
    'electronic device battery powered',
    'digital electronics technology product',
  ]},
];
