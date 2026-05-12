import * as cheerio from 'cheerio';
import { ProductData } from './types';

export function parseAmazon(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  const productName = $('#productTitle').text().trim() || null;

  // Amazon reinventPrice layout: .a-offscreen inside .a-price is empty;
  // actual price is in .aok-offscreen scoped to the core price display div.
  // Fall back to reconstructing from .a-price-whole + .a-price-fraction.
  const priceStr =
    $('#corePriceDisplay_desktop_feature_div .aok-offscreen, #corePrice_feature_div .aok-offscreen')
      .first().text().trim() ||
    $('.priceToPay .aok-offscreen, .apexPriceToPay .aok-offscreen')
      .first().text().trim() ||
    $('.a-price .a-offscreen').first().text().trim() ||
    null;

  let price: number | null = null;
  let currency: string | null = null;
  if (priceStr) {
    price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || null;
    currency = priceStr.replace(/[\d.,\s ]/g, '').trim() || null;
  } else {
    // Last resort: reconstruct from split price spans
    const whole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
    const frac  = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '');
    const sym   = $('.a-price-symbol').first().text().trim();
    if (whole) {
      price = parseFloat(`${whole}.${frac || '00'}`);
      currency = sym || null;
    }
  }
  const landingImg = $('#landingImage');
  const imageUrl = landingImg.attr('src') || null;
  // data-a-dynamic-image is a JSON obj mapping URL → [w, h] for all zoom images
  const dynImageData = landingImg.attr('data-a-dynamic-image') || '';
  let imageUrls: string[] = [];
  try {
    const parsed = JSON.parse(dynImageData);
    imageUrls = Object.keys(parsed).filter(u => u.startsWith('http'));
  } catch {}
  if (imageUrls.length === 0 && imageUrl) imageUrls = [imageUrl];
  const ratingsStr = $('#acrPopover').attr('title') || null;
  const ratings = ratingsStr ? parseFloat(ratingsStr.split(' ')[0]) : null;
  const reviewCountStr = $('#acrCustomerReviewText').first().text().trim() || null;
  const reviewCount = reviewCountStr ? parseInt(reviewCountStr.replace(/[^0-9,]/g, '').replace(/,/g, ''), 10) : null;
  const inStockText = $('#availability').text().toLowerCase();
  const inStock = inStockText.includes('in stock') || !inStockText.includes('currently unavailable');
  const description = $('#feature-bullets li:not(.aplus-module)')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(t => t.length > 0)
    .join(' | ') || null;

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
