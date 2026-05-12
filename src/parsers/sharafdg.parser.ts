import * as cheerio from 'cheerio';
import { ProductData } from './types';

export function parseSharafDG(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  const productName = $('h1').first().text().trim() || null;

  // Price and currency via microdata (itemprop on product-price__wrapper)
  const priceContent = $('meta[itemprop="price"]').attr('content');
  const price = priceContent ? parseFloat(priceContent) : null;
  const currencyContent = $('meta[itemprop="priceCurrency"]').attr('content');
  const currency = currencyContent ? currencyContent.trim() : null;

  // All product images (pimcdn CDN — multiple angles)
  const imageUrls: string[] = [];
  $('img[src*="pimcdn.sharafdg.com"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src && !imageUrls.includes(src)) imageUrls.push(src);
  });
  const imageUrl: string | null = imageUrls[0] || null;

  // Key Information list in the product summary section
  const keyInfoText = $('.product-summary ul').first().text().trim();
  const description = keyInfoText.length > 0 ? keyInfoText.replace(/\s+/g, ' ').trim() : null;

  // Ratings and review count via microdata
  const ratingText = $('[itemprop="ratingValue"]').first().text().trim();
  const ratings = ratingText ? parseFloat(ratingText) : null;
  const reviewText = $('[itemprop="reviewCount"]').first().text().trim();
  const reviewCount = reviewText ? parseInt(reviewText, 10) : null;

  // Stock via microdata availability link
  const availabilityHref = $('[itemprop="availability"]').attr('href') || '';
  const safeHtml = typeof html === 'string' ? html : '';
  const inStock = availabilityHref.includes('InStock') ? true
    : availabilityHref.includes('OutOfStock') ? false
    : !safeHtml.toLowerCase().includes('out of stock');

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
    category: null
  };
}
