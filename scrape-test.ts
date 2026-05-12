/**
 * scrape-test.ts
 *
 * Smoke-tests every site parser with 10 products each.
 * Groups sites into multi-site queries to exercise bundling.
 *
 * Usage: npx ts-node scrape-test.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { scrapeBulk } from './src/services/playwright.service';
import { closeBrowser } from './src/services/playwright.service';
import { BundledProduct } from './src/parsers/types';
import { SiteKey } from './src/config/sites';

interface TestQuery {
  label: string;
  category: string;
  broadCategory: string;
  subCategory: string;
  sites: SiteKey[];
  count: number;
}

// One query per "site group" — exercises every site + cross-site bundling
const TEST_QUERIES: TestQuery[] = [
  {
    label: 'Electronics — all 5 sites (amazon, noon, carrefour, sharafdg, jumbo)',
    category: 'samsung galaxy s24',
    broadCategory: 'Electronics',
    subCategory: 'Smartphones',
    sites: ['amazon', 'noon', 'carrefour', 'sharafdg', 'jumbo'],
    count: 10,
  },
  {
    label: 'Baby & Kids — mumzworld + letstango',
    category: 'baby stroller pram',
    broadCategory: 'Baby & Kids',
    subCategory: 'Strollers',
    sites: ['mumzworld', 'letstango'],
    count: 10,
  },
  {
    label: 'Fashion — namshi',
    category: 'women dress maxi',
    broadCategory: 'Fashion',
    subCategory: 'Women Clothing',
    sites: ['namshi'],
    count: 10,
  },
];

// ─── Summary ──────────────────────────────────────────────────────────────────

interface QueryResult {
  label: string;
  sites: string[];
  totalScraped: number;
  bundleCount: number;
  errorCount: number;
  siteBreakdown: Record<string, number>;
  errors: Array<{ url: string; message: string }>;
}

function printSummary(results: QueryResult[]) {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(70));

  const allSitesSeen = new Set<string>();
  let totalScraped = 0;
  let totalBundles = 0;
  let totalErrors = 0;

  for (const r of results) {
    const status = r.totalScraped > 0 ? '✓' : '✗';
    console.log(`\n${status} ${r.label}`);
    console.log(`  Scraped : ${r.totalScraped} products`);
    console.log(`  Bundles : ${r.bundleCount}`);
    console.log(`  Errors  : ${r.errorCount}`);
    console.log('  Per site:');
    for (const [site, count] of Object.entries(r.siteBreakdown)) {
      const siteStatus = count > 0 ? '  ✓' : '  ✗';
      console.log(`    ${siteStatus} ${site.padEnd(12)} ${count} products`);
      allSitesSeen.add(site);
    }
    if (r.errors.length > 0) {
      console.log('  Sample errors:');
      r.errors.slice(0, 3).forEach(e => console.log(`    - ${e.url.slice(0, 60)}: ${e.message.slice(0, 80)}`));
    }
    totalScraped += r.totalScraped;
    totalBundles += r.bundleCount;
    totalErrors += r.errorCount;
  }

  console.log('\n' + '─'.repeat(70));
  console.log(`TOTAL  scraped=${totalScraped}  bundles=${totalBundles}  errors=${totalErrors}`);
  console.log(`Sites tested: ${[...allSitesSeen].join(', ')}`);
  console.log('═'.repeat(70) + '\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[test] ══ Scraper smoke test ══');
  console.log(`[test] Queries: ${TEST_QUERIES.length} | Sites: amazon, noon, carrefour, sharafdg, jumbo, mumzworld, letstango, namshi`);
  console.log('[test] Count: 10 products per site\n');

  const results: QueryResult[] = [];
  const allBundles: BundledProduct[] = [];

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const q = TEST_QUERIES[i];
    console.log(`\n[test] ── Query ${i + 1}/${TEST_QUERIES.length}: ${q.label} ──`);

    if (i > 0) {
      console.log('[test] Cooling down 10s...');
      await new Promise(r => setTimeout(r, 10000));
    }

    try {
      const result = await scrapeBulk({
        sites: q.sites,
        category: q.category,
        broadCategory: q.broadCategory,
        subCategory: q.subCategory,
        count: q.count,
      });

      // Count per site from bundles' retailer data
      const siteBreakdown: Record<string, number> = {};
      for (const site of q.sites) siteBreakdown[site] = 0;
      for (const bundle of result.bundles) {
        for (const retailer of bundle.retailers) {
          if (retailer.retailerId in siteBreakdown) {
            siteBreakdown[retailer.retailerId]++;
          }
        }
      }

      results.push({
        label: q.label,
        sites: q.sites,
        totalScraped: result.totalScraped,
        bundleCount: result.bundleCount,
        errorCount: result.errors.length,
        siteBreakdown,
        errors: result.errors,
      });

      allBundles.push(...result.bundles);
      console.log(`[test] Done — ${result.totalScraped} scraped, ${result.bundleCount} bundles, ${result.errors.length} errors`);
    } catch (e: any) {
      console.error(`[test] FAILED: ${e.message}`);
      const siteBreakdown: Record<string, number> = {};
      for (const site of q.sites) siteBreakdown[site] = 0;
      results.push({ label: q.label, sites: q.sites, totalScraped: 0, bundleCount: 0, errorCount: 1, siteBreakdown, errors: [{ url: 'N/A', message: e.message }] });
    }
  }

  printSummary(results);

  // Save test output
  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `test_run_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(outputPath, JSON.stringify({ results, bundles: allBundles }, null, 2));
  console.log(`[test] Output saved → ${outputPath}`);

  await closeBrowser();
  process.exit(0);
}

main().catch(async e => {
  console.error('[test] Fatal:', e.message);
  await closeBrowser().catch(() => {});
  process.exit(1);
});
