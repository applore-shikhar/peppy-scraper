/**
 * push-pipeline.ts
 *
 * Callable version of push-to-mongodb logic.
 * Used by both cron-runner and the standalone push-to-mongodb.ts script.
 */

import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { BundledProduct } from '../parsers/types';
import { embedBatch, isEmbeddingAvailable } from '../services/embedding.service';
import { connectChroma, upsertProductsBatch, isChromaAvailable } from '../services/chroma.service';

// ── Category inference ────────────────────────────────────────────────────────
const QUERY_TO_TAXONOMY: Array<{ pattern: RegExp; broadCategory: string; subCategory: string }> = [
  { pattern: /iphone|apple.*phone/i,                          broadCategory: 'Electronics', subCategory: 'Smartphones' },
  { pattern: /galaxy\s*s\d|galaxy\s*a\d|galaxy\s*z|samsung.*phone/i, broadCategory: 'Electronics', subCategory: 'Smartphones' },
  { pattern: /xiaomi|oneplus|huawei.*phone|google.*pixel|oppo|realme/i, broadCategory: 'Electronics', subCategory: 'Smartphones' },
  { pattern: /smartphone|mobile phone/i,                      broadCategory: 'Electronics', subCategory: 'Smartphones' },
  { pattern: /macbook|laptop|notebook|thinkpad|inspiron|pavilion|surface laptop|gaming laptop/i, broadCategory: 'Electronics', subCategory: 'Laptops' },
  { pattern: /ipad|galaxy tab|tablet/i,                      broadCategory: 'Electronics', subCategory: 'Tablets' },
  { pattern: /airpods|headphones|earbuds|speaker|soundbar|earphones/i, broadCategory: 'Electronics', subCategory: 'Audio & Headphones' },
  { pattern: /\b(oled|qled|neo qled|bravia|smart tv|television|tcl tv)\b/i, broadCategory: 'Electronics', subCategory: 'Televisions' },
  { pattern: /monitor|curved monitor/i,                       broadCategory: 'Electronics', subCategory: 'Monitors' },
  { pattern: /apple watch|galaxy watch|fitbit|garmin.*watch|smartwatch/i, broadCategory: 'Electronics', subCategory: 'Wearables' },
  { pattern: /ps5|playstation|xbox|gaming controller|gaming headset/i, broadCategory: 'Electronics', subCategory: 'Gaming' },
  { pattern: /mirrorless camera|dslr|gopro|action camera/i,   broadCategory: 'Electronics', subCategory: 'Cameras' },
  { pattern: /security camera|doorbell|smart plug|alexa|echo|smart speaker/i, broadCategory: 'Electronics', subCategory: 'Smart Home' },
  { pattern: /coffee machine|air fryer|pressure cooker|stand mixer|blender|microwave|kettle|toaster/i, broadCategory: 'Home & Kitchen', subCategory: 'Kitchen Appliances' },
  { pattern: /washing machine|washer|refrigerator|fridge|dishwasher|clothes dryer/i, broadCategory: 'Home & Kitchen', subCategory: 'Large Appliances' },
  { pattern: /vacuum cleaner|robot vacuum/i,                  broadCategory: 'Home & Kitchen', subCategory: 'Cleaning Appliances' },
  { pattern: /air conditioner|air purifier|humidifier/i,      broadCategory: 'Home & Kitchen', subCategory: 'Air Treatment' },
  { pattern: /hair dryer|hair straightener|shaver|epilator|toothbrush/i, broadCategory: 'Personal Care', subCategory: 'Grooming' },
  { pattern: /treadmill|exercise bike|yoga mat|protein|whey/i, broadCategory: 'Fitness & Sports', subCategory: 'Cardio Equipment' },
  { pattern: /sofa|office chair|mattress|bedding|curtains|led strip/i, broadCategory: 'Home & Kitchen', subCategory: 'Furniture & Bedding' },
  { pattern: /printer|ssd|usb.*hub|webcam/i,                  broadCategory: 'Office', subCategory: 'Peripherals' },
  { pattern: /baby stroller|pram|baby monitor|diaper|baby food|baby formula/i, broadCategory: 'Baby & Kids', subCategory: 'Baby Essentials' },
  { pattern: /baby carrier|baby seat|crib|bassinet|baby bath/i, broadCategory: 'Baby & Kids', subCategory: 'Baby Gear' },
  { pattern: /toy|lego|board game|puzzle/i,                   broadCategory: 'Baby & Kids', subCategory: 'Toys & Games' },
  { pattern: /dress|abaya|hijab|women.*fashion|men.*fashion|shirt|jeans|sneaker/i, broadCategory: 'Fashion', subCategory: 'Clothing' },
  { pattern: /perfume|fragrance|deodorant/i,                  broadCategory: 'Personal Care', subCategory: 'Fragrance' },
  { pattern: /skincare|moisturizer|serum|sunscreen|face wash/i, broadCategory: 'Personal Care', subCategory: 'Skincare' },
  { pattern: /makeup|lipstick|foundation|mascara|eyeshadow/i, broadCategory: 'Personal Care', subCategory: 'Makeup' },
];

export function inferTaxonomy(category: string): { broadCategory: string; subCategory: string } {
  for (const rule of QUERY_TO_TAXONOMY) {
    if (rule.pattern.test(category)) {
      return { broadCategory: rule.broadCategory, subCategory: rule.subCategory };
    }
  }
  return { broadCategory: 'Electronics', subCategory: 'General' };
}

// ── Brand extraction ──────────────────────────────────────────────────────────
const BRAND_TAG_MAP: Record<string, string> = {
  'brand-apple': 'Apple', 'brand-samsung': 'Samsung', 'brand-lg': 'LG',
  'brand-sony': 'Sony', 'brand-dyson': 'Dyson', 'brand-philips': 'Philips',
  'brand-xiaomi': 'Xiaomi', 'brand-huawei': 'Huawei', 'brand-dell': 'Dell',
  'brand-hp': 'HP', 'brand-lenovo': 'Lenovo', 'brand-nespresso': 'Nespresso',
  'brand-bosch': 'Bosch', 'brand-anker': 'Anker', 'brand-google': 'Google',
  'brand-jbl': 'JBL', 'brand-bose': 'Bose',
};

function extractBrand(tags: string[]): string | undefined {
  for (const tag of tags) {
    if (BRAND_TAG_MAP[tag]) return BRAND_TAG_MAP[tag];
  }
  return undefined;
}

// ── Map BundledProduct → MongoDB schema ───────────────────────────────────────
function toMongoProduct(bundle: BundledProduct) {
  const { broadCategory, subCategory } = (bundle as any).broadCategory
    ? { broadCategory: (bundle as any).broadCategory, subCategory: (bundle as any).subCategory }
    : inferTaxonomy(bundle.category);

  const retailers = bundle.retailers
    .filter(r => r.price !== null && r.price > 0)
    .map(r => ({
      retailerId:   r.retailerId,
      retailerName: r.retailerName,
      price:        r.price!,
      currency:     r.currency || 'AED',
      inStock:      r.inStock ?? true,
      productUrl:   r.productUrl ?? undefined,
      imageUrl:     r.imageUrl ?? undefined,
    }));

  if (retailers.length === 0) return null;
  if (bundle.images.filter(Boolean).length === 0) return null; // reject no-image products

  const prices = retailers.map(r => r.price);
  const lowestPrice  = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  return {
    name:         bundle.name,
    description:  bundle.description ?? undefined,
    brand:        extractBrand(bundle.tags),
    category:     broadCategory,
    subcategory:  subCategory,
    images:       bundle.images.filter(Boolean),
    rating:       bundle.rating ?? undefined,
    reviewCount:  bundle.reviewCount ?? undefined,
    tags:         bundle.tags,
    retailers,
    lowestPrice,
    highestPrice,
    isTrending:   bundle.retailerCount >= 2,
    isTopRated:   (bundle.rating ?? 0) >= 4.5 && (bundle.reviewCount ?? 0) >= 100,
  };
}

// ── Main callable function ────────────────────────────────────────────────────

export interface PushResult {
  mongoInserted: number;
  mongoUpdated: number;
  chromaVectors: number;
  errors: string[];
}

export async function pushToDatabase(
  bundles: BundledProduct[],
): Promise<PushResult> {
  const errors: string[] = [];

  const products = bundles.map(toMongoProduct).filter(Boolean) as ReturnType<typeof toMongoProduct>[];
  console.log(`[push] ${bundles.length} bundles → ${products.length} valid products`);

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('peppy');
  const col = db.collection('products_clean');

  const now = new Date();
  const ops = products.map(p => ({
    updateOne: {
      filter: { name: p!.name },
      update: {
        $set: { ...p, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  }));

  const bulkResult = await col.bulkWrite(ops as any[], { ordered: false });
  const mongoInserted = bulkResult.upsertedCount;
  const mongoUpdated = bulkResult.modifiedCount;
  console.log(`[push] Upserted: ${mongoInserted} new, ${mongoUpdated} updated`);

  await col.createIndex({ name: 'text', description: 'text', brand: 'text' }, { background: true });
  await col.createIndex({ category: 1, lowestPrice: 1 }, { background: true });
  await col.createIndex({ isTrending: 1 }, { background: true });
  await col.createIndex({ isTopRated: 1 }, { background: true });
  await col.createIndex({ tags: 1 }, { background: true });
  await col.createIndex({ name: 1 }, { unique: true, background: true });

  await client.close();

  let chromaVectors = 0;

  if (!isEmbeddingAvailable()) {
    console.warn('[push] OPENAI_API_KEY not set — skipping ChromaDB');
    return { mongoInserted, mongoUpdated, chromaVectors, errors };
  }
  if (!isChromaAvailable()) {
    console.warn('[push] ChromaDB not configured — skipping');
    return { mongoInserted, mongoUpdated, chromaVectors, errors };
  }

  try {
    console.log('[push] Generating embeddings...');
    const texts = bundles.map(b =>
      [b.name, b.description?.slice(0, 200), ...(b.tags ?? []).slice(0, 15)]
        .filter(Boolean).join(' ').slice(0, 800)
    );

    const embeddings = await embedBatch(texts);

    const chromaDocs = bundles.map((bundle, i) => {
      const taxonomy = (bundle as any).broadCategory
        ? { broadCategory: (bundle as any).broadCategory, subCategory: (bundle as any).subCategory }
        : inferTaxonomy(bundle.category);
      return {
        id:            crypto.createHash('sha256').update((bundle.name ?? '').toLowerCase().trim()).digest('hex').slice(0, 24),
        name:          bundle.name ?? 'Unknown',
        embedding:     embeddings[i],
        broadCategory: taxonomy.broadCategory,
        subCategory:   taxonomy.subCategory,
        tags:          bundle.tags ?? [],
        lowestPrice:   bundle.lowestPrice,
        highestPrice:  bundle.highestPrice,
        retailerCount: bundle.retailerCount,
      };
    });

    await connectChroma();
    await upsertProductsBatch(chromaDocs);
    chromaVectors = chromaDocs.length;
    console.log(`[push] ChromaDB: ${chromaVectors} vectors upserted`);
  } catch (e: any) {
    const msg = `ChromaDB push failed: ${e.message}`;
    console.error(`[push] ${msg}`);
    errors.push(msg);
  }

  return { mongoInserted, mongoUpdated, chromaVectors, errors };
}

// ── Load bundles from JSON file ───────────────────────────────────────────────
export function loadBundlesFromJson(jsonPath: string): BundledProduct[] {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  return raw.bundles ?? [];
}
