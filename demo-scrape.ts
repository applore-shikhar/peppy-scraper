/**
 * demo-scrape.ts — standalone entry point for the demo pipeline.
 * Logic lives in src/cron/demo-runner.ts.
 *
 * Usage: npx ts-node demo-scrape.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { runDemoPipeline } from './src/cron/demo-runner';
import { closeBrowser } from './src/services/playwright.service';

if (require.main === module) {
  runDemoPipeline()
    .catch(async (e) => {
      console.error('[demo] Fatal:', e.message);
      await closeBrowser().catch(() => {});
      process.exit(1);
    })
    .finally(() => closeBrowser().catch(() => {}));
}
