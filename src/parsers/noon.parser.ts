import * as cheerio from 'cheerio';
import { ProductData } from './types';

export function parseNoon(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // Title
  const productName = $('h1').first().text().trim() || null;

  // Price — data-qa="div-price-now" contains clean current price e.g. "3899.00"
  const priceStr = $('[data-qa="div-price-now"]').first().text().trim() || null;
  const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) : null;
  // Noon UAE always transacts in AED
  const currency = price !== null ? 'AED' : null;

  // Images — collect all Noon CDN product images (multiple angles)
  const imageUrls: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if ((src.includes('/p/pnsku/') || src.includes('nooncdn.com/p/')) && !src.includes('placeholder')) {
      if (!imageUrls.includes(src)) imageUrls.push(src);
    }
  });
  const imageUrl: string | null = imageUrls[0] || null;

  // Rating + review count — text like "4.62422 Ratings" (rating=4.6, count=2422)
  const ratingText = $('[class*="ratingCtr"]').first().text().trim();
  const ratingMatch = ratingText.match(/^(\d+\.\d)(\d+)\s*Rating/i);
  const ratings = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  const reviewCount = ratingMatch ? parseInt(ratingMatch[2], 10) : null;

  // In stock — Add to Cart button present and not disabled
  const addToCartText = $('[data-qa="pdp-add-to-cart-revamp"]').text().trim().toLowerCase();
  const inStock = addToCartText.includes('add to cart') || !html.toLowerCase().includes('out of stock');

  // Description — highlights section
  let description: string | null = null;
  const highlights = $('[class*="highlightsCtr"]').first().text().trim();
  if (highlights) {
    description = highlights.replace(/^Highlights\s*/i, '').trim() || null;
  }

  return {
    productName,
    productUrl: url,
    imageUrl,
    imageUrls,
    price,
    currency,
    ratings,
    reviewCount,
    description,
    inStock,
    category: null,
  };
}
