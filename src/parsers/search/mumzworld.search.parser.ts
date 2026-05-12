import * as cheerio from 'cheerio';

const MUMZWORLD_CATEGORY_SLUGS = new Set([
  'sign-in', 'collections', 'nursery-bedroom', 'feeding-and-nursing',
  'toys-learning', 'bath-and-skin-care', 'health-safety', 'baby-clothing-shoes',
  'back-to-school', 'household-supplies', 'party-supplies', 'wishlist',
  'privacy-policy', 'terms', 'contact', 'about', 'faq', 'help',
  'shipping', 'return', 'yalla', 'app',
]);

export function parseMumzworldSearch(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  const base = 'https://www.mumzworld.com';

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href.includes('/en/')) return;

    const full = href.startsWith('http') ? href : `${base}${href.startsWith('/') ? href : '/' + href}`;
    if (!full.includes('mumzworld.com')) return;

    // Strip query params
    const cleanUrl = full.split('?')[0];

    // Get the path segment after /en/
    const enMatch = cleanUrl.match(/\/en\/([^\/]+)\/?$/);
    if (!enMatch) return;

    const slug = enMatch[1];
    // Product slugs are long (brand + name + SKU); category slugs are short
    if (slug.length < 20) return;
    if (MUMZWORLD_CATEGORY_SLUGS.has(slug)) return;

    links.add(cleanUrl);
  });

  return Array.from(links);
}
