/**
 * scrape-category-test.ts
 *
 * Tests category-level scraping for all 8 sites.
 * Uses site category browse pages (not product-specific search).
 * Run: npx ts-node scrape-category-test.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { scrapeBulk, closeBrowser } from './src/services/playwright.service';
import { SiteKey } from './src/config/sites';

interface CategoryTestQuery {
  label: string;
  category: string;
  categoryKey: string;
  broadCategory: string;
  subCategory: string;
  sites: SiteKey[];
  count: number;
}

// One representative category per site group — tests actual category browse pages
const CATEGORY_QUERIES: CategoryTestQuery[] = [
  {
    label: 'Electronics — Smartphones',
    category: 'smartphones',
    categoryKey: 'smartphones',
    broadCategory: 'Electronics',
    subCategory: 'Smartphones',
    sites: ['amazon', 'noon', 'carrefour', 'sharafdg', 'jumbo'],
    count: 10,
  },
  {
    label: 'Electronics — Laptops',
    category: 'laptops',
    categoryKey: 'laptops',
    broadCategory: 'Electronics',
    subCategory: 'Laptops',
    sites: ['sharafdg', 'jumbo'],
    count: 10,
  },
  {
    label: 'Baby — Strollers',
    category: 'baby stroller',
    categoryKey: 'baby-strollers',
    broadCategory: 'Baby & Kids',
    subCategory: 'Strollers',
    sites: ['mumzworld', 'letstango'],
    count: 10,
  },
  {
    label: 'Baby — Toys',
    category: 'toys games',
    categoryKey: 'toys',
    broadCategory: 'Baby & Kids',
    subCategory: 'Toys & Games',
    sites: ['mumzworld'],
    count: 10,
  },
  {
    label: 'Fashion — Women',
    category: 'women clothing',
    categoryKey: 'women-fashion',
    broadCategory: 'Fashion',
    subCategory: 'Women Clothing',
    sites: ['namshi'],
    count: 10,
  },
  {
    label: 'Fashion — Abayas',
    category: 'abayas',
    categoryKey: 'abayas',
    broadCategory: 'Fashion',
    subCategory: 'Modest Wear',
    sites: ['namshi'],
    count: 10,
  },
];

interface SiteSummary {
  site: string;
  scraped: number;
  bundles: number;
  errors: number;
  usedCategoryPage: boolean;
}

async function main() {
  const allSiteSummaries: Record<string, SiteSummary> = {};
  const allBundles: any[] = [];

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`CATEGORY SCRAPE TEST — ${CATEGORY_QUERIES.length} queries`);
  console.log(`${'═'.repeat(60)}\n`);

  for (let i = 0; i < CATEGORY_QUERIES.length; i++) {
    const query = CATEGORY_QUERIES[i];
    console.log(`\n[${i + 1}/${CATEGORY_QUERIES.length}] ${query.label}`);
    console.log(`  sites: ${query.sites.join(', ')} | categoryKey: ${query.categoryKey}`);

    if (i > 0) {
      console.log('  [cooldown] 10s...');
      await new Promise(r => setTimeout(r, 10000));
    }

    try {
      const result = await scrapeBulk({
        sites: query.sites,
        category: query.category,
        categoryKey: query.categoryKey,
        broadCategory: query.broadCategory,
        subCategory: query.subCategory,
        count: query.count,
      });

      allBundles.push(...result.bundles);

      // Track per-site counts
      for (const site of query.sites) {
        const scraped = result.bundles
          .filter(b => b.retailers.some(r => r.retailerId === site))
          .length;
        const errors = result.errors.length;

        // Detect whether category page was used (logged URL will contain category path)
        const key = `${site}:${query.categoryKey}`;
        if (!allSiteSummaries[key]) {
          allSiteSummaries[key] = {
            site,
            scraped,
            bundles: result.bundleCount,
            errors,
            usedCategoryPage: true,
          };
        } else {
          allSiteSummaries[key].scraped += scraped;
          allSiteSummaries[key].errors += errors;
        }
      }

      console.log(`  ✓ ${result.bundleCount} bundles, ${result.totalScraped} raw scraped, ${result.errors.length} errors`);
    } catch (e: any) {
      console.error(`  ✗ FAILED: ${e.message}`);
      for (const site of query.sites) {
        const key = `${site}:${query.categoryKey}`;
        allSiteSummaries[key] = { site, scraped: 0, bundles: 0, errors: 1, usedCategoryPage: true };
      }
    }
  }

  // ── Summary table ─────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('CATEGORY TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`${'Site'.padEnd(12)} ${'Category'.padEnd(20)} ${'Scraped'.padEnd(10)} ${'Errors'.padEnd(8)}`);
  console.log('─'.repeat(60));

  for (const [key, s] of Object.entries(allSiteSummaries)) {
    const [site, catKey] = key.split(':');
    const status = s.scraped > 0 ? '✓' : '✗';
    console.log(`${status} ${site.padEnd(11)} ${catKey.padEnd(20)} ${String(s.scraped).padEnd(10)} ${s.errors}`);
  }

  console.log('═'.repeat(60));
  console.log(`Total bundles collected: ${allBundles.length}`);

  // ── Save output ───────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(process.cwd(), 'output', `category_test_${timestamp}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), totalBundles: allBundles.length, bundles: allBundles }, null, 2));
  console.log(`\nOutput saved → ${outputPath}`);

  await closeBrowser();
  process.exit(0);
}

main().catch(async e => {
  console.error('[category-test] Fatal:', e.message);
  await closeBrowser().catch(() => {});
  process.exit(1);
});
