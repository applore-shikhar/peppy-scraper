import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { scrapeBulk, closeBrowser } from '../services/playwright.service';
import { pushToDatabase } from './push-pipeline';
import { BundledProduct } from '../parsers/types';
import { SiteKey } from '../config/sites';
import { acquireLock, releaseLock, shouldStop, clearStopSignal } from '../utils/stop-signal';

async function reportStatus(success: boolean, productCount: number, errorCount: number, responseTimeMs: number, error?: string): Promise<void> {
  const beUrl = process.env.PEPPY_BE_URL;
  if (!beUrl) return;
  try {
    await axios.post(`${beUrl}/api/admin/scraper/status`, {
      source: 'cron',
      success,
      responseTime: responseTimeMs,
      productCount,
      ...(error ? { error } : {}),
    }, { timeout: 10000 });
    console.log(`[demo] Status reported to peppy-be (success=${success}, products=${productCount})`);
  } catch (e: any) {
    console.warn(`[demo] Failed to report status: ${e.message}`);
  }
}

const CHECKPOINT_DIR = path.join(process.cwd(), 'output', 'checkpoints');

export const DEMO_SITES: SiteKey[] = ['amazon', 'noon', 'carrefour', 'sharafdg'];
export const DEMO_COUNT = 5;

export const DEMO_QUERIES = [
  { label: 'iPhone 16',        category: 'apple iphone 16',        broadCategory: 'Electronics', subCategory: 'Smartphones',        sites: DEMO_SITES, count: DEMO_COUNT },
  { label: 'Samsung Galaxy S25', category: 'samsung galaxy s25',   broadCategory: 'Electronics', subCategory: 'Smartphones',        sites: DEMO_SITES, count: DEMO_COUNT },
  { label: 'MacBook Air M3',   category: 'apple macbook air m3',   broadCategory: 'Electronics', subCategory: 'Laptops',            sites: DEMO_SITES, count: DEMO_COUNT },
  { label: 'AirPods Pro',      category: 'apple airpods pro',      broadCategory: 'Electronics', subCategory: 'Audio & Headphones', sites: DEMO_SITES, count: DEMO_COUNT },
  { label: 'PlayStation 5',    category: 'playstation 5 ps5',      broadCategory: 'Electronics', subCategory: 'Gaming',             sites: DEMO_SITES, count: DEMO_COUNT },
];

function clearDemoCheckpoints(): void {
  if (!fs.existsSync(CHECKPOINT_DIR)) return;
  let cleared = 0;
  for (const file of fs.readdirSync(CHECKPOINT_DIR)) {
    const isMine = DEMO_QUERIES.some(q =>
      file.includes(q.category.replace(/[^a-z0-9]/gi, '_'))
      || file.includes(q.category.replace(/\s+/g, '-'))
    );
    if (isMine) {
      try { fs.unlinkSync(path.join(CHECKPOINT_DIR, file)); cleared++; } catch {}
    }
  }
  if (cleared > 0) console.log(`[demo] Cleared ${cleared} stale checkpoint(s).`);
}

export async function runDemoPipeline(): Promise<void> {
  if (!acquireLock('demo')) return;

  const start = Date.now();
  let totalErrors = 0;
  console.log('\n[demo] ══════════════════════════════════════════════════');
  console.log(`[demo] Demo pipeline started at ${new Date().toISOString()}`);
  console.log(`[demo] ${DEMO_QUERIES.length} queries × ${DEMO_SITES.length} sites × ${DEMO_COUNT} products/site`);
  console.log('[demo] ══════════════════════════════════════════════════\n');

  try {
    clearDemoCheckpoints();

    if (shouldStop()) {
      clearStopSignal();
      console.log('[demo] Stop signal detected before start — aborting.');
      return;
    }

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

    const allBundles: BundledProduct[] = [];
    let totalRaw = 0;

    for (let i = 0; i < DEMO_QUERIES.length; i++) {
      const q = DEMO_QUERIES[i];
      const outcome = outcomes[i];
      if (outcome.status === 'fulfilled') {
        const r = outcome.value;
        allBundles.push(...r.bundles);
        totalRaw += r.totalScraped;
        totalErrors += r.errors.length;
        console.log(`[demo] ✓ "${q.label}" — ${r.bundleCount} bundles (${r.totalScraped} raw)`);
      } else {
        totalErrors++;
        console.error(`[demo] ✗ "${q.label}" FAILED: ${outcome.reason?.message}`);
      }
    }

    console.log(`\n[demo] Scraped: ${totalRaw} raw → ${allBundles.length} bundles | Errors: ${totalErrors}`);

    if (allBundles.length === 0) {
      console.error('[demo] No bundles produced — skipping push.');
      return;
    }

    // Save local backup
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(process.cwd(), 'output', `demo_${ts}.json`);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify({ generatedAt: new Date().toISOString(), totalBundles: allBundles.length, bundles: allBundles }, null, 2));
    console.log(`[demo] Backup → ${backupPath}`);

    console.log(`\n[demo] Pushing ${allBundles.length} bundles to MongoDB...`);
    const pushResult = await pushToDatabase(allBundles);

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log('\n[demo] ══════════════════════════════════════════════════');
    console.log(`[demo] Demo complete in ${elapsed}s`);
    console.log(`[demo] MongoDB: ${pushResult.mongoInserted} new, ${pushResult.mongoUpdated} updated`);
    console.log(`[demo] ChromaDB: ${pushResult.chromaVectors} vectors`);
    console.log('[demo] ══════════════════════════════════════════════════\n');

    await reportStatus(true, pushResult.mongoInserted + pushResult.mongoUpdated, totalErrors, elapsed * 1000);
  } catch (e: any) {
    console.error(`[demo] Fatal error: ${e.message}`);
    await reportStatus(false, 0, 0, Date.now() - start, e.message);
  } finally {
    await closeBrowser().catch(() => {});
    releaseLock();
  }
}
