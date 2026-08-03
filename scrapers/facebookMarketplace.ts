import { chromium } from 'patchright';
import { connectAccount, withSession } from './session-manager';
import { extractListings } from './listingHeuristics';
import type { NormalizedResult } from '@/lib/providers/types';

/**
 * IMPORTANT — unverified against a live session, and the riskiest scraper in
 * this app: written without access to an authenticated Facebook session or
 * real network traffic to inspect. Facebook Marketplace is a heavy GraphQL
 * app - the exact request shape and field names below are NOT confirmed.
 * Facebook also runs real bot detection and will periodically force a
 * checkpoint/re-auth challenge; that's expected steady-state behavior for
 * this kind of automation, not a bug to eliminate. Uses Patchright (a
 * maintained, API-compatible Playwright fork with anti-detection patches)
 * instead of stock Playwright specifically because of that detection.
 *
 * Before trusting results: log in, open DevTools -> Network -> filter to
 * Fetch/XHR, search Marketplace, and find the `/api/graphql/` request that
 * actually returns listings. Facebook's GraphQL responses are historically
 * prefixed with `for (;;);` (an anti-JSON-hijacking guard) before the JSON
 * body - `stripJsonHijackingPrefix` below handles that, but the field lookups
 * in listingHeuristics.ts may still need adjusting to match the real payload.
 */
const GRAPHQL_URL_PATTERN = /facebook\.com\/api\/graphql/i;
const CHECKPOINT_URL_PATTERN = /facebook\.com\/(checkpoint|login)/i;

function stripJsonHijackingPrefix(text: string): string {
  return text.replace(/^for\s*\(\s*;;\s*\)\s*;/, '');
}

export async function connectFacebook(): Promise<void> {
  return connectAccount('facebook', chromium, 'https://www.facebook.com/login/');
}

export async function searchFacebookMarketplace(query: string): Promise<NormalizedResult[]> {
  return withSession('facebook', chromium, async (context) => {
    const page = await context.newPage();
    let captured: NormalizedResult[] | null = null;

    page.on('response', async (response) => {
      if (captured || !GRAPHQL_URL_PATTERN.test(response.url())) {
        return;
      }
      try {
        const text = stripJsonHijackingPrefix(await response.text());
        const body = JSON.parse(text);
        const listings = extractListings(body, 'facebook', 'https://www.facebook.com', 'fb');
        if (listings.length > 0) {
          captured = listings;
        }
      } catch {
        // not the response we're looking for, keep waiting
      }
    });

    const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
    const response = await page.goto(searchUrl, { waitUntil: 'networkidle' });

    if (response && CHECKPOINT_URL_PATTERN.test(response.url())) {
      throw new Error('Facebook needs you to re-connect - click "Connect FB Marketplace" and log in again');
    }

    if (!captured) {
      throw new Error(
        'No Facebook Marketplace response matched the expected pattern - see the comment at the top of scrapers/facebookMarketplace.ts',
      );
    }

    return captured;
  });
}
