import * as crypto from 'crypto';
import { ProductData, RetailerOffer, BundledProduct } from '../parsers/types';
import { SiteKey } from '../config/sites';
import { tagBundleWithVectors, getBundleEmbedding } from './vector-tagger.service';
import { isChromaAvailable, upsertProductsBatch, ChromaProductDoc } from './chroma.service';

const RETAILER_DISPLAY_NAMES: Record<SiteKey, string> = {
  amazon:     'Amazon',
  noon:       'Noon',
  carrefour:  'Carrefour',
  sharafdg:   'Sharaf DG',
  jumbo:      'Jumbo',
  mumzworld:  'Mumzworld',
  namshi:     'Namshi',
  letstango:  'Letstango',
};

const SIMILARITY_THRESHOLD = 0.45;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'in', 'of', 'to', 'at', 'by', 'with',
  'from', 'on', 'is', 'it', 'its', 'this', 'that', 'new', 'buy', 'online',
  'version', 'edition', 'series', 'model', 'international', 'middle', 'east',
]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(name: string): Set<string> {
  return new Set(
    normalize(name)
      .split(' ')
      .filter(t => t.length > 1 && !STOPWORDS.has(t))
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = getTokens(a);
  const tb = getTokens(b);
  let intersection = 0;
  ta.forEach(t => { if (tb.has(t)) intersection++; });
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

function nameHash(name: string): string {
  return crypto.createHash('sha256').update(normalize(name)).digest('hex').slice(0, 24);
}

export async function bundleProducts(
  items: Array<{ site: SiteKey; data: ProductData }>,
  category: string,
  broadCategory: string,
  subCategory: string,
): Promise<BundledProduct[]> {
  const bundles: BundledProduct[] = [];

  for (const { site, data } of items) {
    if (!data.productName) continue;

    const offer: RetailerOffer = {
      retailerId: site,
      retailerName: RETAILER_DISPLAY_NAMES[site],
      price: data.price,
      currency: data.currency || 'AED',
      inStock: data.inStock,
      productUrl: data.productUrl,
      imageUrl: data.imageUrl,
      ratings: data.ratings,
      reviewCount: data.reviewCount,
    };

    let bestMatch: BundledProduct | null = null;
    let bestSim = 0;

    for (const bundle of bundles) {
      if (!bundle.name) continue;
      const sim = jaccardSimilarity(data.productName, bundle.name);
      if (sim >= SIMILARITY_THRESHOLD && sim > bestSim) {
        const alreadyHasRetailer = bundle.retailers.some(r => r.retailerId === site);
        if (!alreadyHasRetailer) {
          bestMatch = bundle;
          bestSim = sim;
        }
      }
    }

    const incomingImages = data.imageUrls?.length ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);

    if (bestMatch) {
      bestMatch.retailers.push(offer);
      // Keep whichever retailer has the most images (more angles = better gallery)
      if (incomingImages.length > bestMatch.images.length) {
        bestMatch.images = incomingImages;
      }
      if (!bestMatch.description && data.description) {
        bestMatch.description = data.description;
      }
      if (data.productName.length > (bestMatch.name?.length ?? 0)) {
        bestMatch.name = data.productName;
      }
    } else {
      bundles.push({
        name: data.productName,
        description: data.description,
        category,
        broadCategory,
        subCategory,
        tags: [],
        images: incomingImages,
        lowestPrice: null,
        highestPrice: null,
        rating: null,
        reviewCount: null,
        retailerCount: 0,
        retailers: [offer],
      });
    }
  }

  // Aggregate prices and ratings
  for (const bundle of bundles) {
    const prices = bundle.retailers
      .map(r => r.price)
      .filter((p): p is number => p !== null);

    bundle.lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
    bundle.highestPrice = prices.length > 0 ? Math.max(...prices) : null;
    bundle.retailerCount = bundle.retailers.length;

    let bestReviewCount = -1;
    for (const r of bundle.retailers) {
      if (r.reviewCount !== null && r.reviewCount > bestReviewCount) {
        bestReviewCount = r.reviewCount;
        bundle.rating = r.ratings;
        bundle.reviewCount = r.reviewCount;
      }
    }
    if (bundle.reviewCount === null) {
      for (const r of bundle.retailers) {
        if (r.ratings !== null) { bundle.rating = r.ratings; break; }
      }
    }
  }

  // Vector tagging — sequential to respect API rate limits
  console.log(`[bundler] Tagging ${bundles.length} bundles with vector tagger...`);
  for (const bundle of bundles) {
    bundle.tags = await tagBundleWithVectors(bundle, broadCategory, subCategory);
  }

  // Generate bundle embeddings + store in ChromaDB
  const chromaEnabled = isChromaAvailable();
  const chromaDocs: ChromaProductDoc[] = [];

  for (const bundle of bundles) {
    const embedding = await getBundleEmbedding(bundle);
    if (embedding) {
      bundle.embedding = embedding;
      if (chromaEnabled && bundle.name) {
        chromaDocs.push({
          id:            nameHash(bundle.name),
          name:          bundle.name,
          broadCategory,
          subCategory,
          tags:          bundle.tags,
          lowestPrice:   bundle.lowestPrice,
          highestPrice:  bundle.highestPrice,
          retailerCount: bundle.retailerCount,
          embedding,
        });
      }
    }
  }

  if (chromaDocs.length > 0) {
    try {
      await upsertProductsBatch(chromaDocs);
    } catch (e: any) {
      console.warn(`[bundler] ChromaDB upsert failed: ${e.message}`);
    }
  }

  // Sort: most retailers first, then lowest price
  bundles.sort((a, b) => {
    if (b.retailerCount !== a.retailerCount) return b.retailerCount - a.retailerCount;
    return (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity);
  });

  return bundles;
}
