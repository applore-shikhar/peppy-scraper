import * as cheerio from 'cheerio';

export function parseSharafDGSearch(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $('a[data-pjax][href*="/product/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        const url = new URL(href, 'https://uae.sharafdg.com');
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
