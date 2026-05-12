import * as cheerio from 'cheerio';

export function parseAmazonSearch(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  // This universal selector finds product links on ANY Amazon page (Search, Category, Deals, Best Sellers)
  $('a[href*="/dp/"], a[href*="/gp/product/"]').each((i, el) => {
    let href = $(el).attr('href');
    // Filter out review links or irrelevant anchors
    if (href && !href.includes('customer-reviews') && !href.includes('#customerReviews') && !href.includes('/slredirect/')) {
      if (href.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        href = `${urlObj.protocol}//${urlObj.hostname}${href}`;
      }
      
      // Extract clean DP URL to avoid duplicates with different tracking parameters
      try {
         const url = new URL(href);
         const pathParts = url.pathname.split('/');
         const dpIndex = pathParts.indexOf('dp');
         const gpIndex = pathParts.indexOf('product');
         
         let cleanPath = url.pathname;
         if (dpIndex !== -1 && pathParts.length > dpIndex + 1) {
             const asin = pathParts[dpIndex + 1];
             cleanPath = `/dp/${asin}`;
         } else if (gpIndex !== -1 && pathParts.length > gpIndex + 1) {
             const asin = pathParts[gpIndex + 1];
             cleanPath = `/dp/${asin}`; // normalize to dp
         }
         
         // Skip ad/affiliate redirect subdomains (aax-eu.amazon.ae etc.) — no product content
         if (url.hostname !== 'www.amazon.ae' && url.hostname !== 'amazon.ae') {
           return;
         }
         const cleanUrl = `https://www.amazon.ae${cleanPath}`;
         if (!links.includes(cleanUrl)) {
             links.push(cleanUrl);
         }
      } catch (e) {
         // Fallback if URL parsing fails
         if (!links.includes(href)) {
             links.push(href);
         }
      }
    }
  });

  return links;
}
