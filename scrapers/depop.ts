import { chromium } from 'playwright';
import { connectAccount, withSession } from './session-manager';
import { extractListings } from './listingHeuristics';
import type { NormalizedResult } from '@/lib/providers/types';

/**
 * IMPORTANT — unverified against a live session: this file was written without
 * access to an authenticated Depop session or real network traffic to inspect
 * (this scraper only works against a real logged-in account, which didn't
 * exist while writing this). Depop's internal search API's exact URL pattern
 * and JSON field names are NOT confirmed here - `extractListings` (shared in
 * listingHeuristics.ts) uses best-guess heuristics instead of a confirmed
 * schema.
 *
 * Before trusting results: open Depop in a normal browser, open DevTools ->
 * Network -> filter to Fetch/XHR, search for an item, and find the request
 * that actually returns the listing JSON. Update SEARCH_URL_PATTERN and, if
 * needed, the field lookups in listingHeuristics.ts to match what you
 * actually see. Until then, expect this to need adjustment on first real run,
 * not to work out of the box.
 */
const SEARCH_URL_PATTERN = /depop\.com\/api\/v\d+\/(search|products)/i;

export async function connectDepop(): Promise<void> {
  return connectAccount('depop', chromium, 'https://www.depop.com/login/');
}

export async function searchDepop(query: string): Promise<NormalizedResult[]> {
  return withSession('depop', chromium, async (context) => {
    const page = await context.newPage();
    let captured: NormalizedResult[] | null = null;

    page.on('response', async (response) => {
      if (captured || !SEARCH_URL_PATTERN.test(response.url())) {
        return;
      }
      const contentType = response.headers()['content-type'] ?? '';
      if (!contentType.includes('application/json')) {
        return;
      }
      try {
        const body = await response.json();
        const listings = extractListings(body, 'depop', 'https://www.depop.com', 'depop');
        if (listings.length > 0) {
          captured = listings;
        }
      } catch {
        // not the response we're looking for, keep waiting
      }
    });

    await page.goto(`https://www.depop.com/search/?q=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle',
    });

    if (!captured) {
      throw new Error(
        'No Depop search response matched the expected pattern - see the comment at the top of scrapers/depop.ts',
      );
    }

    return captured;
  });
}
