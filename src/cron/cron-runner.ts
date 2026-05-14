import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { scrapeBulk, closeBrowser } from '../services/playwright.service';
import { pushToDatabase } from './push-pipeline';
import { QUERIES } from '../../scrape-master';
import { BundledProduct } from '../parsers/types';
import { acquireLock, releaseLock, shouldStop, clearStopSignal } from '../utils/stop-signal';

const STATE_FILE = path.join(process.cwd(), 'output', 'cron_state.json');

const PARALLEL_QUERIES = Math.max(1, parseInt(process.env.PARALLEL_QUERIES || '3', 10));

interface CronState {
  startedAt: string;
  completedQueries: string[];
  allBundles: BundledProduct[];
  totalRawScraped: number;
  totalErrors: number;
}


function loadCronState(): CronState {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  }
  return { startedAt: new Date().toISOString(), completedQueries: [], allBundles: [], totalRawScraped: 0, totalErrors: 0 };
}

function saveCronState(state: CronState): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function reportStatus(success: boolean, productCount: number, errorCount: number, responseTimeMs: number, error?: string): Promise<void> {
  const beUrl = process.env.PEPPY_BE_URL;
  if (!beUrl) return;

  try {
    await axios.post(`${beUrl}/api/v1/admin/scraper/status`, {
      source: 'cron',
      success,
      responseTime: responseTimeMs,
      productCount,
      ...(error ? { error } : {}),
    }, { timeout: 10000 });
    console.log(`[cron] Status reported to peppy-be (success=${success}, products=${productCount})`);
  } catch (e: any) {
    console.warn(`[cron] Failed to report status to peppy-be: ${e.message}`);
  }
}

export async function runFullPipeline(): Promise<void> {
  if (!acquireLock('full')) return;

  const pipelineStart = Date.now();
  const state = loadCronState();
  const isResume = state.completedQueries.length > 0;

  console.log(`\n[cron] ══════════════════════════════════════════════════`);
  console.log(`[cron] Pipeline started at ${new Date().toISOString()}`);
  if (isResume) {
    console.log(`[cron] Resuming — ${state.completedQueries.length}/${QUERIES.length} queries done, ${state.allBundles.length} bundles so far.`);
  } else {
    console.log(`[cron] Fresh run — ${QUERIES.length} queries planned.`);
  }
  console.log(`[cron] ══════════════════════════════════════════════════\n`);

  let fatalError: string | undefined;

  try {
    const pending = QUERIES.filter(q => !state.completedQueries.includes(q.category));
    console.log(`[cron] ${pending.length} queries to run (${PARALLEL_QUERIES} parallel)\n`);

    for (let i = 0; i < pending.length; i += PARALLEL_QUERIES) {
      if (shouldStop()) {
        clearStopSignal();
        console.log('[cron] ⛔ Stop signal received — aborting pipeline.');
        break;
      }

      const batch = pending.slice(i, i + PARALLEL_QUERIES);
      const batchNum = Math.floor(i / PARALLEL_QUERIES) + 1;
      const totalBatches = Math.ceil(pending.length / PARALLEL_QUERIES);
      console.log(`\n[cron] ── Batch ${batchNum}/${totalBatches}: ${batch.map(q => q.label).join(' | ')} ──`);

      const outcomes = await Promise.allSettled(
        batch.map(query => scrapeBulk({
          sites: query.sites,
          category: query.category,
          broadCategory: query.broadCategory,
          subCategory: query.subCategory,
          count: query.count,
        }))
      );

      for (let j = 0; j < batch.length; j++) {
        const query = batch[j];
        const outcome = outcomes[j];
        if (outcome.status === 'fulfilled') {
          const result = outcome.value;
          state.allBundles.push(...result.bundles);
          state.totalRawScraped += result.totalScraped;
          state.totalErrors += result.errors.length;
          state.completedQueries.push(query.category);
          console.log(`[cron] "${query.label}" done — ${result.bundleCount} bundles.`);
        } else {
          console.error(`[cron] "${query.label}" FAILED: ${outcome.reason?.message}`);
          state.totalErrors++;
        }
      }
      saveCronState(state);

      if (i + PARALLEL_QUERIES < pending.length && !shouldStop()) {
        const cooldown = 15000;
        console.log(`[cron] Cooling down ${cooldown / 1000}s before next batch...`);
        await new Promise(r => setTimeout(r, cooldown));
      }
    }

    console.log(`\n[cron] All queries done. Pushing ${state.allBundles.length} bundles to DB...`);
    const pushResult = await pushToDatabase(state.allBundles);
    console.log(`[cron] Push complete — MongoDB: ${pushResult.mongoInserted} new, ${pushResult.mongoUpdated} updated | ChromaDB: ${pushResult.chromaVectors}`);
    if (pushResult.errors.length > 0) {
      console.warn(`[cron] Push errors: ${pushResult.errors.join('; ')}`);
    }

    // Clear cron state on success so next run is fresh
    try { fs.unlinkSync(STATE_FILE); } catch {}

    const elapsed = Date.now() - pipelineStart;
    console.log(`\n[cron] ══════════════════════════════════════════════════`);
    console.log(`[cron] Pipeline complete in ${Math.round(elapsed / 1000)}s`);
    console.log(`[cron] Bundles: ${state.allBundles.length} | Raw: ${state.totalRawScraped} | Errors: ${state.totalErrors}`);
    console.log(`[cron] ══════════════════════════════════════════════════\n`);

    await reportStatus(true, pushResult.mongoInserted + pushResult.mongoUpdated, state.totalErrors, elapsed);
  } catch (e: any) {
    fatalError = e.message;
    console.error(`[cron] Pipeline fatal error: ${e.message}`);
    await reportStatus(false, 0, state.totalErrors, Date.now() - pipelineStart, e.message);
  } finally {
    await closeBrowser().catch(() => {});
    releaseLock();
  }

  if (fatalError) throw new Error(fatalError);
}
