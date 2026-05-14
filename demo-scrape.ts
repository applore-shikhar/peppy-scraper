/**
 * demo-scrape.ts
 *
 * Scrapes 5 representative queries (5 products/site each) and pushes to MongoDB.
 * Designed for client demos — fast, diverse, shows multi-retailer price comparison.
 *
 * Usage: npx ts-node demo-scrape.ts
 * Approx runtime: 15–25 minutes depending on Bright Data latency.
 */

import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { scrapeBulk, closeBrowser } from './src/services/playwright.service';
import { pushToDatabase } from './src/cron/push-pipeline';
import { BundledProduct } from './src/parsers/types';
import { SiteKey } from './src/config/sites';

// ─── Demo query plan ──────────────────────────────────────────────────────────
// 5 queries × 4 sites × 5 products = ~100 raw → target ~30–60 bundles
// Chosen for name recognition and strong multi-retailer overlap in UAE

const DEMO_SITES: SiteKey[] = ['amazon', 'noon', 'carrefour', 'sharafdg'];
const DEMO_COUNT = 5; // products per site per query

const DEMO_QUERIES = [
  {
    label: 'iPhone 16',
    category: 'apple iphone 16',
    broadCategory: 'Electronics',
    subCategory: 'Smartphones',
    sites: DEMO_SITES,
    count: DEMO_COUNT,
  },
  {
    label: 'Samsung Galaxy S25',
    category: 'samsung galaxy s25',
    broadCategory: 'Electronics',
    subCategory: 'Smartphones',
    sites: DEMO_SITES,
    count: DEMO_COUNT,
  },
  {
    label: 'MacBook Air M3',
    category: 'apple macbook air m3',
    broadCategory: 'Electronics',
    subCategory: 'Laptops',
    sites: DEMO_SITES,
    count: DEMO_COUNT,
  },
  {
    label: 'AirPods Pro',
    category: 'apple airpods pro',
    broadCategory: 'Electronics',
    subCategory: 'Audio & Headphones',
    sites: DEMO_SITES,
    count: DEMO_COUNT,
  },
  {
    label: 'PlayStation 5',
    category: 'playstation 5 ps5',
    broadCategory: 'Electronics',
    subCategory: 'Gaming',
    sites: DEMO_SITES,
    count: DEMO_COUNT,
  },
];

// ─── Checkpoint cleanup ───────────────────────────────────────────────────────
// Clear stale checkpoints so we always start fresh for the demo

function clearDemoCheckpoints(): void {
  const checkpointDir = path.join(process.cwd(), 'output', 'checkpoints');
  if (!fs.existsSync(checkpointDir)) return;
  let cleared = 0;
  for (const file of fs.readdirSync(checkpointDir)) {
    const isMine = DEMO_QUERIES.some(q =>
      file.includes(q.category.replace(/[^a-z0-9]/gi, '_'))
      || file.includes(q.category.replace(/\s+/g, '-'))
    );
    if (isMine) {
      fs.unlinkSync(path.join(checkpointDir, file));
      cleared++;
    }
  }
  if (cleared > 0) console.log(`[demo] Cleared ${cleared} stale checkpoint(s).`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  PEPPY DEMO SCRAPE');
  console.log(`  ${DEMO_QUERIES.length} queries × ${DEMO_SITES.length} sites × ${DEMO_COUNT} products`);
  console.log(`  Sites: ${DEMO_SITES.join(', ')}`);
  console.log('═'.repeat(60) + '\n');

  clearDemoCheckpoints();

  const allBundles: BundledProduct[] = [];
  let totalRaw = 0;
  let totalErrors = 0;

  // Run all 5 queries in parallel — BD semaphores cap concurrency automatically
  console.log('[demo] Running all queries in parallel...\n');

  const outcomes = await Promise.allSettled(
    DEMO_QUERIES.map(q =>
      scrapeBulk({
        sites: q.sites,
        category: q.category,
        broadCategory: q.broadCategory,
        subCategory: q.subCategory,
        count: q.count,
      })
    )
  );

  for (let i = 0; i < DEMO_QUERIES.length; i++) {
    const q = DEMO_QUERIES[i];
    const outcome = outcomes[i];
    if (outcome.status === 'fulfilled') {
      const r = outcome.value;
      allBundles.push(...r.bundles);
      totalRaw += r.totalScraped;
      totalErrors += r.errors.length;
      console.log(`[demo] ✓ "${q.label}" — ${r.bundleCount} bundles (${r.totalScraped} raw, ${r.errors.length} errors)`);
    } else {
      totalErrors++;
      console.error(`[demo] ✗ "${q.label}" FAILED: ${outcome.reason?.message}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`[demo] Scraped: ${totalRaw} raw products → ${allBundles.length} bundles | Errors: ${totalErrors}`);
  console.log('─'.repeat(60));

  if (allBundles.length === 0) {
    console.error('[demo] No bundles produced — nothing to push. Check BD credentials and site availability.');
    process.exit(1);
  }

  // ── Save local JSON backup ────────────────────────────────────────────────────
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(process.cwd(), 'output', `demo_${ts}.json`);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify({ generatedAt: new Date().toISOString(), totalBundles: allBundles.length, bundles: allBundles }, null, 2));
  console.log(`[demo] Backup saved → ${backupPath}`);

  // ── Push to MongoDB ────────────────────────────────────────────────────────────
  console.log(`\n[demo] Pushing ${allBundles.length} bundles to MongoDB...`);
  try {
    const pushResult = await pushToDatabase(allBundles);
    console.log('\n' + '═'.repeat(60));
    console.log('  DEMO READY ✓');
    console.log(`  MongoDB: ${pushResult.mongoInserted} new, ${pushResult.mongoUpdated} updated`);
    console.log(`  ChromaDB: ${pushResult.chromaVectors} vectors`);
    if (pushResult.errors.length > 0) {
      console.warn(`  Push warnings: ${pushResult.errors.join('; ')}`);
    }
    console.log('═'.repeat(60) + '\n');
  } catch (e: any) {
    console.error(`[demo] Push failed: ${e.message}`);
    console.log('[demo] Bundle backup is still available at:', backupPath);
    console.log('[demo] Run `npx ts-node push-to-mongodb.ts ' + backupPath + '` to retry the push.');
    process.exit(1);
  }
}

main()
  .catch(async (e) => {
    console.error('[demo] Fatal:', e.message);
    await closeBrowser().catch(() => {});
    process.exit(1);
  })
  .finally(() => closeBrowser().catch(() => {}));
