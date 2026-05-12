import * as cheerio from 'cheerio';
import { ProductData } from './types';

export function parseCarrefour(html: string, url: string): ProductData {
  const $ = cheerio.load(html);
  const safeHtml = typeof html === 'string' ? html : '';

  // --- JSON-LD Product — use for name, image, inStock; NOT price (JSON-LD has discountValue, not finalPrice) ---
  let jsonLd: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (jsonLd) return;
    try {
      const parsed = JSON.parse($(el).html() || '{}');
      if (parsed['@type'] === 'Product') jsonLd = parsed;
    } catch {}
  });

  const offers = jsonLd?.offers;
  const currency = offers?.priceCurrency || 'AED';
  const inStock = offers?.availability
    ? offers.availability.includes('InStock')
    : !safeHtml.toLowerCase().includes('out of stock');

  const imageRaw = jsonLd?.image;
  const imageUrls: string[] = Array.isArray(imageRaw) ? imageRaw.filter(Boolean) : (imageRaw ? [imageRaw] : []);
  const imageUrl: string | null = imageUrls[0] || null;
  const productName = jsonLd?.name || $('h1').first().text().trim() || null;

  // --- Price: extract finalPrice from embedded pdpResponse JSON (JSON-LD has discountValue, not actual price) ---
  // Pattern matches both escaped (\\") and unescaped (") variants in Next.js flight data
  const finalPriceMatch = safeHtml.match(/finalPrice\\*":\\*"([\d.]+)/);
  const price = finalPriceMatch ? parseFloat(finalPriceMatch[1]) : null;

  // --- Ratings & review count from pdpResponse ---
  const ratingMatch = safeHtml.match(/averageRating\\*":\\*"([\d.]+)/);
  const ratings = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  const reviewTextMatch = safeHtml.match(/totalReviewsText\\*":\\*"[^"\\]*\(+__?(\d+)[^"\\]*/);
  const reviewCount = reviewTextMatch ? parseInt(reviewTextMatch[1], 10) : null;

  // --- Description — collect product <p> elements, skip cookie/legal boilerplate ---
  const descParagraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (
      text.length > 80 &&
      !text.toLowerCase().includes('cookie') &&
      !text.toLowerCase().includes('privacy policy') &&
      !text.toLowerCase().includes('by clicking')
    ) {
      descParagraphs.push(text);
    }
  });
  const description = descParagraphs.length > 0
    ? descParagraphs.slice(0, 3).join(' | ')
    : null;

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
