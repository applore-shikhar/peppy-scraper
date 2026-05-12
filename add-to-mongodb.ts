/**
 * add-to-mongodb.ts
 *
 * Upserts products from a JSON file into products_clean WITHOUT flushing.
 * Existing products are preserved; new ones are added; name-matched ones are updated.
 *
 * Usage: npx ts-node add-to-mongodb.ts <path-to-json>
 */

import dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import { MongoClient } from 'mongodb';
import { loadBundlesFromJson, inferTaxonomy } from './src/cron/push-pipeline';

const BRAND_TAG_MAP: Record<string, string> = {
  'brand-apple': 'Apple', 'brand-samsung': 'Samsung', 'brand-lg': 'LG',
  'brand-sony': 'Sony', 'brand-dyson': 'Dyson', 'brand-philips': 'Philips',
  'brand-xiaomi': 'Xiaomi', 'brand-huawei': 'Huawei', 'brand-dell': 'Dell',
  'brand-hp': 'HP', 'brand-lenovo': 'Lenovo', 'brand-nespresso': 'Nespresso',
  'brand-bosch': 'Bosch', 'brand-anker': 'Anker', 'brand-google': 'Google',
  'brand-jbl': 'JBL', 'brand-bose': 'Bose',
};

function extractBrand(tags: string[]): string | undefined {
  for (const tag of tags) if (BRAND_TAG_MAP[tag]) return BRAND_TAG_MAP[tag];
  return undefined;
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: npx ts-node add-to-mongodb.ts <path-to-json>');
    process.exit(1);
  }

  const bundles = loadBundlesFromJson(path.resolve(jsonPath));
  console.log(`[add] ${bundles.length} bundles loaded from ${path.basename(jsonPath)}`);

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const col = client.db('peppy').collection('products_clean');

  let upserted = 0;
  let skipped = 0;

  for (const bundle of bundles) {
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

    if (retailers.length === 0) { skipped++; continue; }

    const prices = retailers.map(r => r.price);
    const doc = {
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
      lowestPrice:  Math.min(...prices),
      highestPrice: Math.max(...prices),
      isTrending:   bundle.retailerCount >= 2,
      isTopRated:   (bundle.rating ?? 0) >= 4.5 && (bundle.reviewCount ?? 0) >= 100,
    };

    await col.updateOne(
      { name: bundle.name },
      { $set: doc },
      { upsert: true }
    );
    upserted++;
  }

  console.log(`[add] Done — ${upserted} upserted, ${skipped} skipped (no valid price)`);
  await client.close();
}

main().catch(e => { console.error('[add] Fatal:', e.message); process.exit(1); });
