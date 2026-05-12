import * as cheerio from 'cheerio';

export function parseJumboSearch(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  const base = 'https://www.jumbo.ae';

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const full = href.startsWith('http') ? href : `${base}${href.startsWith('/') ? href : '/' + href}`;

    const clean = full.split('?')[0];
    if (!full.includes('jumbo.ae') || !clean.endsWith('.html')) return;
    // Product pages: exactly one path segment — /product-slug.html
    // Category pages: /personal-computers/laptops.html (multiple segments) — exclude
    const segments = new URL(clean).pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      links.add(clean);
    }
  });

  return Array.from(links);
}
