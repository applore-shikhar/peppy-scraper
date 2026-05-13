import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { scrapeBulk, closeBrowser } from '../services/playwright.service';
import { pushToDatabase } from './push-pipeline';
import { QUERIES } from '../../scrape-master';
import { BundledProduct } from '../parsers/types';

const LOCK_FILE = path.join(process.cwd(), 'output', 'cron.lock');
const STATE_FILE = path.join(process.cwd(), 'output', 'cron_state.json');

interface CronState {
  startedAt: string;
  completedQueries: string[];
  allBundles: BundledProduct[];
  totalRawScraped: number;
  totalErrors: number;
}

function acquireLock(): boolean {
  try {
    fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
    if (fs.existsSync(LOCK_FILE)) {
      const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      // Check if the locking process is still alive
      try {
        process.kill(lock.pid, 0);
        console.warn(`[cron] Pipeline already running (PID ${lock.pid}, started ${lock.startedAt}). Skipping.`);
        return false;
      } catch {
        console.warn('[cron] Stale lock found — previous run exited without cleanup. Proceeding.');
      }
    }
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    return true;
  } catch (e: any) {
    console.error(`[cron] Failed to acquire lock: ${e.message}`);
    return false;
  }
}

function releaseLock(): void {
  try { fs.unlinkSync(LOCK_FILE); } catch {}
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
    await axios.post(`${beUrl}/api/admin/scraper/status`, {
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
  if (!acquireLock()) return;

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
    for (let i = 0; i < QUERIES.length; i++) {
      const query = QUERIES[i];

      if (state.completedQueries.includes(query.category)) {
        console.log(`[cron] Skipping "${query.label}" — already done.`);
        continue;
      }

      console.log(`\n[cron] ── Query ${i + 1}/${QUERIES.length}: ${query.label} ──`);

      if (i > 0 && !state.completedQueries.includes(QUERIES[i - 1]?.category ?? '')) {
        const cooldown = 15000;
        console.log(`[cron] Cooling down ${cooldown / 1000}s...`);
        await new Promise(r => setTimeout(r, cooldown));
      }

      try {
        const result = await scrapeBulk({
          sites: query.sites,
          category: query.category,
          broadCategory: query.broadCategory,
          subCategory: query.subCategory,
          count: query.count,
        });

        state.allBundles.push(...result.bundles);
        state.totalRawScraped += result.totalScraped;
        state.totalErrors += result.errors.length;
        state.completedQueries.push(query.category);
        saveCronState(state);
        console.log(`[cron] "${query.label}" done — ${result.bundleCount} bundles.`);
      } catch (e: any) {
        console.error(`[cron] "${query.label}" FAILED: ${e.message}`);
        state.totalErrors++;
        saveCronState(state);
      }
    }

    console.log(`\n[cron] All queries done. Pushing ${state.allBundles.length} bundles to DB...`);
    const pushResult = await pushToDatabase(state.allBundles);
    console.log(`[cron] Push complete — MongoDB: ${pushResult.mongoInserted}, ChromaDB: ${pushResult.chromaVectors}`);
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

    await reportStatus(true, pushResult.mongoInserted, state.totalErrors, elapsed);
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
