import * as cheerio from 'cheerio';
import { ProductData } from './types';

export function parseJumbo(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // ── JSON-LD (primary — jumbo embeds complete Product schema) ─────────────
  let jldProduct: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      const data = Array.isArray(json) ? json.find((j: any) => j['@type'] === 'Product') : json;
      if (data?.['@type'] === 'Product') jldProduct = data;
    } catch {}
  });

  if (jldProduct) {
    const name: string | null = jldProduct.name || null;
    const price: number | null = jldProduct.offers?.price != null
      ? parseFloat(String(jldProduct.offers.price))
      : null;
    const currency: string = jldProduct.offers?.priceCurrency || 'AED';
    const inStock: boolean | null = jldProduct.offers?.availability
      ? /InStock/i.test(jldProduct.offers.availability)
      : null;
    const description: string | null = (jldProduct.description || '').slice(0, 500) || null;
    const images: string[] = Array.isArray(jldProduct.image)
      ? jldProduct.image
      : jldProduct.image
        ? [jldProduct.image]
        : [];
    const imageUrl: string | null = images[0] || null;
    const ratings: number | null = jldProduct.aggregateRating?.ratingValue
      ? parseFloat(jldProduct.aggregateRating.ratingValue)
      : null;
    const reviewCount: number | null = jldProduct.aggregateRating?.reviewCount
      ? parseInt(String(jldProduct.aggregateRating.reviewCount), 10)
      : null;

    if (name && price && price > 0) {
      return {
        productName: name,
        productUrl: url,
        imageUrl,
        imageUrls: images,
        price,
        currency,
        ratings: ratings && ratings > 0 ? ratings : null,
        reviewCount: reviewCount && reviewCount > 0 ? reviewCount : null,
        description,
        inStock,
        category: null,
      };
    }
  }

  // ── DOM fallback ─────────────────────────────────────────────────────────
  const name =
    $('meta[property="og:title"]').attr('content')?.replace(/^Buy\s+/i, '').replace(/\s+Online in UAE.*$/i, '').trim() ||
    $('h1').first().text().trim() ||
    null;

  const priceText =
    $('[class*="price"]').first().text() ||
    $('meta[property="product:price:amount"]').attr('content') || '';
  const priceMatch = priceText.match(/[\d,]+\.?\d*/);
  const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;

  const fallbackImage =
    $('meta[property="og:image"]').attr('content') ||
    $('img[src*="catalog/product"]').first().attr('src') ||
    null;

  return {
    productName: name,
    productUrl: url,
    imageUrl: fallbackImage,
    imageUrls: fallbackImage ? [fallbackImage] : [],
    price: price && price > 0 ? price : null,
    currency: 'AED',
    ratings: null,
    reviewCount: null,
    description: $('meta[property="og:description"]').attr('content')?.slice(0, 500) || null,
    inStock: null,
    category: null,
  };
}
