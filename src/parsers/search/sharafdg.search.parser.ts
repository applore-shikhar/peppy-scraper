import * as cheerio from 'cheerio';

export function parseSharafDGSearch(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  // Product pages: href starts with /product/ or full URL with /product/
  // Do NOT require data-pjax — that attribute is on nav links, not product cards
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href.includes('/product/')) return;

    try {
      const url = new URL(href, 'https://uae.sharafdg.com');
      if (!url.hostname.includes('sharafdg.com')) return;

      const parts = url.pathname.split('/').filter(Boolean);
      // Must be /product/<slug> — exactly two segments, first is "product"
      if (parts.length < 2 || parts[0] !== 'product') return;

      links.add(`${url.protocol}//${url.hostname}/${parts[0]}/${parts[1]}/`);
    } catch {
      // ignore malformed hrefs
    }
  });

  return Array.from(links);
}
