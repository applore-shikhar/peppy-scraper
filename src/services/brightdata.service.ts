import axios from 'axios';
import { chromium, Browser } from 'playwright';
import { parseNoon } from '../parsers/noon.parser';
import { parseCarrefour } from '../parsers/carrefour.parser';
import { parseSharafDG } from '../parsers/sharafdg.parser';
import { parseAmazon } from '../parsers/amazon.parser';
import { parseJumbo } from '../parsers/jumbo.parser';
import { parseMumzworld } from '../parsers/mumzworld.parser';
import { parseNamshi } from '../parsers/namshi.parser';
import { ProductData } from '../parsers/types';
import { Semaphore } from '../utils/semaphore';

// ─── Config ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.BRIGHT_DATA_API_KEY;
  if (!key) throw new Error('BRIGHT_DATA_API_KEY is not set');
  return key;
}

function getBrowserEndpoint(): string {
  const auth = process.env.BRIGHT_DATA_BROWSER_AUTH;
  if (!auth) throw new Error('BRIGHT_DATA_BROWSER_AUTH is not set');
  return `wss://${auth}@brd.superproxy.io:9222`;
}

const UNLOCKER_ZONE = () => process.env.BRIGHT_DATA_UNLOCKER_ZONE || 'web_unlocker1';

// Concurrency caps — tunable via env vars
const BROWSER_MAX_PAGES = parseInt(process.env.BD_BROWSER_CONCURRENCY || '8', 10);
const UNLOCKER_MAX_CONCURRENT = parseInt(process.env.BD_UNLOCKER_CONCURRENCY || '20', 10);

// ─── Singleton browser pool ───────────────────────────────────────────────────

const pageSemaphore = new Semaphore(BROWSER_MAX_PAGES);
const unlockSemaphore = new Semaphore(UNLOCKER_MAX_CONCURRENT);

let _browser: Browser | null = null;
let _connecting = false;
let _connectQueue: Array<(b: Browser) => void> = [];

async function getSharedBrowser(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser;

  if (_connecting) {
    return new Promise(resolve => _connectQueue.push(resolve));
  }

  _connecting = true;
  try {
    console.log('[BD Browser] Connecting to Scraping Browser...');
    _browser = await chromium.connectOverCDP(getBrowserEndpoint());
    _browser.on('disconnected', () => {
      console.warn('[BD Browser] Session disconnected — will reconnect on next request');
      _browser = null;
    });
    console.log('[BD Browser] Connected.');
    _connectQueue.forEach(resolve => resolve(_browser!));
    _connectQueue = [];
    return _browser;
  } finally {
    _connecting = false;
  }
}

export async function closeBrowserPool(): Promise<void> {
  await _browser?.close().catch(() => {});
  _browser = null;
}

export function resetBrowser(): void {
  _browser = null;
}

// ─── Unlocker API ─────────────────────────────────────────────────────────────

export async function fetchHTMLViaUnlocker(targetUrl: string): Promise<string> {
  return unlockSemaphore.wrap(async () => {
    const response = await axios.post(
      'https://api.brightdata.com/request',
      { zone: UNLOCKER_ZONE(), url: targetUrl, format: 'raw' },
      {
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000,
        responseType: 'text',
        validateStatus: () => true,
      }
    );

    if (response.status !== 200) {
      throw new Error(`Unlocker API ${response.status}: ${String(response.data).slice(0, 200)}`);
    }

    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  });
}

// ─── Scraping Browser ─────────────────────────────────────────────────────────

export async function fetchHTMLViaBrowser(
  targetUrl: string,
  waitSelector?: string,
  waitMs = 10000
): Promise<string> {
  return pageSemaphore.wrap(async () => {
    const browser = await getSharedBrowser();
    // Isolated context per request: prevents cookies/cache leaking between concurrent scrapes
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      if (waitSelector) {
        await page.waitForSelector(waitSelector, { timeout: waitMs }).catch(() => {});
      } else {
        await page.waitForTimeout(waitMs);
      }

      return await page.content();
    } finally {
      await context.close().catch(() => {});
    }
  });
}

// Returns HTML + JS-evaluated structured data for sites that need it
export async function fetchHTMLWithEval<T>(
  targetUrl: string,
  evaluator: (page: import('playwright').Page) => Promise<T>,
  waitSelector?: string,
  waitMs = 10000
): Promise<{ html: string; evaluated: T }> {
  return pageSemaphore.wrap(async () => {
    const browser = await getSharedBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      if (waitSelector) {
        await page.waitForSelector(waitSelector, { timeout: waitMs }).catch(() => {});
      } else {
        await page.waitForTimeout(waitMs);
      }

      const [html, evaluated] = await Promise.all([
        page.content(),
        evaluator(page),
      ]);
      return { html, evaluated };
    } finally {
      await context.close().catch(() => {});
    }
  });
}

// ─── Retry wrapper ────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastErr: Error = new Error('unknown');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      // Routing/tunnel failures and navigation timeouts — retrying won't help
      const isRoutingErr = /no_peer|probe_timeout|a2a_tun_open|a2a_exception|ERR_TUNNEL_CONNECTION_FAILED|Timeout \d+ms exceeded/i.test(e.message);
      if (isRoutingErr) {
        throw e;
      }
      const isConnErr = /ENOTFOUND|ECONNRESET|ECONNREFUSED|WebSocket|disconnected|domain limit/i.test(e.message);
      if (isConnErr) {
        _browser = null;
      }
      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[BD] Attempt ${attempt + 1} failed (${e.message}) — retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

// ─── Site selectors for product pages ────────────────────────────────────────

const PRODUCT_WAIT: Record<string, string> = {
  'noon.com':          'h1',
  'carrefouruae.com':  'h1',
  'sharafdg.com':      'h1, meta[itemprop="price"]',
  'jumbo.ae':          'h1, meta[itemprop="price"]',
  'mumzworld.com':     'h1, meta[itemprop="price"]',
  'namshi.com':        'h1',
};

// ─── Public scraping entry point ──────────────────────────────────────────────

export async function scrapeProductBD(url: string): Promise<ProductData> {
  const hostname = new URL(url).hostname;

  // Amazon: server-rendered, Unlocker works great
  if (hostname.includes('amazon.ae')) {
    return withRetry(async () => {
      const html = await fetchHTMLViaUnlocker(url);
      return parseAmazon(html, url);
    });
  }

  // JS-heavy sites: need Scraping Browser
  const waitSel = Object.entries(PRODUCT_WAIT).find(([h]) => hostname.includes(h))?.[1];

  return withRetry(async () => {
    if (hostname.includes('carrefouruae.com')) {
      // Carrefour: some products don't embed price in RSC payload.
      // Use page.evaluate() to read price from the rendered DOM.
      const { html, evaluated } = await fetchHTMLWithEval(
        url,
        (page) => page.evaluate(() => {
          // Get the rendered HTML and find the first AED price before any related-products section.
          // Carrefour renders a product details block first, then related/recommended products.
          const html = document.body.innerHTML;
          const stopMarkers = [
            'Related Products', 'You Might Also Like',
            'Customers Also Bought', 'Recently Viewed',
            'Frequently Bought', 'Sponsored', 'See all',
          ];
          let cutoff = html.length;
          for (const marker of stopMarkers) {
            const idx = html.indexOf(marker);
            if (idx > 0 && idx < cutoff) cutoff = idx;
          }
          const productSection = html.slice(0, cutoff);
          // Find all "AED NNN" patterns in the product section
          const matches = [...productSection.matchAll(/AED[^<\d]{0,3}([\d,]+\.?\d*)/g)];
          if (!matches.length) return null;
          // The first price in the product section is the current product price
          const firstPrice = matches[0][1].replace(/,/g, '');
          const num = parseFloat(firstPrice);
          // Sanity check: price must be between 1 and 100000 AED
          if (isNaN(num) || num < 1 || num > 100000) return null;
          return String(num);
        }),
        waitSel,
        12000
      );
      const product = parseCarrefour(html, url);
      if (product.price === null && evaluated) {
        product.price = parseFloat(evaluated);
        product.currency = 'AED';
      }
      return product;
    }

    // mumzworld: Magento — Unlocker is cheaper/faster; browser only if Unlocker fails
    if (hostname.includes('mumzworld.com')) {
      const html = await fetchHTMLViaUnlocker(url);
      return parseMumzworld(html, url);
    }

    // SharafDG: try Unlocker first (server-renders key fields), browser as fallback
    if (hostname.includes('sharafdg.com')) {
      try {
        const html = await fetchHTMLViaUnlocker(url);
        const product = parseSharafDG(html, url);
        if (product.price !== null) return product;
        throw new Error('Unlocker: price missing — falling back to browser');
      } catch (unlockerErr: any) {
        console.warn(`[sharafdg] Unlocker failed (${unlockerErr.message}) — trying browser`);
        const html = await fetchHTMLViaBrowser(url, waitSel, 10000);
        return parseSharafDG(html, url);
      }
    }

    const html = await fetchHTMLViaBrowser(url, waitSel, 10000);

    if (hostname.includes('noon.com')) return parseNoon(html, url);
    if (hostname.includes('jumbo.ae')) return parseJumbo(html, url);
    if (hostname.includes('namshi.com')) return parseNamshi(html, url);

    throw new Error(`Unsupported site: ${hostname}`);
  });
}
