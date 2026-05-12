import * as cheerio from 'cheerio';
import { ProductData } from './types';

function extractNextData(html: string): any | null {
  const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function safePrice(val: any): number | null {
  const n = parseFloat(String(val).replace(/[^\d.]/g, ''));
  return isNaN(n) || n <= 0 ? null : n;
}

export function parseNamshi(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // ── Try __NEXT_DATA__ first (Next.js SSR data blob) ──────────────────────
  const nextData = extractNextData(html);
  if (nextData) {
    try {
      // Namshi embeds product in props.pageProps.product or similar path
      const pages = nextData?.props?.pageProps;
      const product = pages?.product || pages?.productDetails || pages?.data?.product;
      if (product) {
        const name = product.name || product.productName || null;
        const price = safePrice(product.price || product.salePrice || product.currentPrice);
        const imageUrl = product.image || product.imageUrl || product.images?.[0] || null;
        const inStock = product.inStock ?? product.available ?? null;
        const description = (product.description || product.shortDescription || '').slice(0, 500) || null;
        const ratings = product.rating ? parseFloat(product.rating) : null;
        const reviewCount = product.reviewCount ? parseInt(product.reviewCount, 10) : null;

        const imageUrls: string[] = Array.isArray(product.images) ? product.images.filter(Boolean) : (imageUrl ? [imageUrl] : []);
        if (name && price) {
          return { productName: name, productUrl: url, imageUrl, imageUrls, price, currency: 'AED', ratings, reviewCount, description, inStock, category: null };
        }
      }
    } catch {}
  }

  // ── JSON-LD fallback ──────────────────────────────────────────────────────
  let jldName: string | null = null;
  let jldPrice: number | null = null;
  let jldImage: string | null = null;
  let jldRating: number | null = null;
  let jldReviews: number | null = null;
  let jldDesc: string | null = null;
  let jldStock: boolean | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      const data = Array.isArray(json) ? json.find(j => j['@type'] === 'Product') : json;
      if (data?.['@type'] === 'Product') {
        jldName = data.name || null;
        jldPrice = safePrice(data.offers?.price || data.offers?.lowPrice);
        jldImage = Array.isArray(data.image) ? data.image[0] : (data.image || null);
        jldRating = data.aggregateRating?.ratingValue ? parseFloat(data.aggregateRating.ratingValue) : null;
        jldReviews = data.aggregateRating?.reviewCount ? parseInt(data.aggregateRating.reviewCount, 10) : null;
        jldDesc = (data.description || '').slice(0, 500) || null;
        jldStock = data.offers?.availability ? /InStock/i.test(data.offers.availability) : null;
      }
    } catch {}
  });

  // ── CSS selectors ─────────────────────────────────────────────────────────
  const rawName =
    jldName ||
    $('h1[class*="product"]').first().text().trim() ||
    $('[class*="ProductName"]').first().text().trim() ||
    $('[data-testid="product-name"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    null;
  // Strip SEO suffixes like "| Best Price UAE", "| Namshi UAE", etc.
  const productName = rawName ? rawName.replace(/\s*\|.*$/, '').trim() || rawName : null;

  let price: number | null = jldPrice;
  if (!price) {
    const priceText =
      $('[class*="product-price"]').first().text() ||
      $('[class*="ProductPrice"]').first().text() ||
      $('[data-testid="product-price"]').first().text() ||
      $('[class*="price"]').first().text();
    price = safePrice(priceText);
  }

  const imageUrl =
    jldImage ||
    $('img[class*="product"]').first().attr('src') ||
    $('[class*="ProductImage"] img').first().attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    null;

  // Extract all nooncdn product images from embedded JSON (Namshi uses noon CDN)
  const noonImgMatches = [...html.matchAll(/"(?:imageUrl|image_url|src)"\s*:\s*"(https?:\/\/f\.nooncdn\.com\/p[^"]+)"/g)];
  const imageUrls: string[] = noonImgMatches
    .map(m => m[1])
    .filter((v, i, a) => a.indexOf(v) === i);
  if (imageUrls.length === 0 && imageUrl) imageUrls.push(imageUrl);

  const ratings = jldRating || null;
  const reviewCount = jldReviews || null;
  const description = jldDesc || $('[class*="description"]').first().text().trim().slice(0, 500) || null;
  const inStock = jldStock;

  return {
    productName,
    productUrl: url,
    imageUrl,
    imageUrls,
    price,
    currency: 'AED',
    ratings,
    reviewCount,
    description,
    inStock,
    category: null,
  };
}
