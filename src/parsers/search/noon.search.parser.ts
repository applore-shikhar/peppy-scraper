import * as cheerio from 'cheerio';

export function parseNoonSearch(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $('a[href*="/p/"]').each((_, el) => {
    let href = $(el).attr('href');
    if (href) {
      if (href.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        href = `${urlObj.protocol}//${urlObj.hostname}${href}`;
      }
      try {
        const url = new URL(href);
        // Strip tracking params (?o=...) — keep only the clean product path
        const cleanUrl = `${url.protocol}//${url.hostname}${url.pathname}`;
        if (!links.includes(cleanUrl)) {
          links.push(cleanUrl);
        }
      } catch {
        if (!links.includes(href)) links.push(href);
      }
    }
  });

  return links;
}
