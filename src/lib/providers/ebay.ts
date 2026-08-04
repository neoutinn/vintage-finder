import { ensureEbayToken } from '../ebayTokenCache';
import type { NormalizedResult, SearchFilters } from './types';

const SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const ITEM_URL = 'https://api.ebay.com/buy/browse/v1/item';

// eBay condition ID for "Used" — the umbrella condition for pre-owned/vintage items.
const USED_CONDITION_ID = '3000';

// Canadian marketplace — localizes results, currency (CAD), and item URLs to eBay.ca.
const MARKETPLACE_ID = 'EBAY_CA';
const PRICE_CURRENCY = 'CAD';

// Item specifics that commonly carry the size on clothing/shoe listings, in
// priority order — sellers use whichever their category template offers.
const SIZE_ASPECT_NAMES = ['Size', 'Size Type', 'US Shoe Size', 'Shoe Size', 'UK Size', 'EU Size'];

type EbayItemSummary = {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  itemWebUrl: string;
  condition?: string;
};

type EbaySearchResponse = {
  itemSummaries?: EbayItemSummary[];
};

type EbayAspect = { name?: string; value?: string };

type EbayItemDetail = {
  localizedAspects?: EbayAspect[];
};

// Loose match so "32x34" / "32 X 34" / "32X34" (or "M" / "m") count as the
// same size — eBay sellers don't agree on casing or spacing.
function normalizeSize(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

// Matches a fetched item size against one requested size. Waist-only picks
// ("32") also match "32x34"-style waist-by-inseam listings, since bottoms
// only offer a waist checkbox — but only for purely numeric sizes, so this
// never loosely matches letter sizes like "M".
function sizeMatches(itemSize: string, wanted: string): boolean {
  const itemNorm = normalizeSize(itemSize);
  const wantedNorm = normalizeSize(wanted);
  if (itemNorm === wantedNorm) {
    return true;
  }
  return /^\d+$/.test(wantedNorm) && itemNorm.startsWith(`${wantedNorm}X`);
}

function buildFilter(filters: SearchFilters): string | undefined {
  const parts: string[] = [];

  const min = filters.minPrice ?? '';
  const max = filters.maxPrice ?? '';
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    parts.push(`price:[${min}..${max}]`, `priceCurrency:${PRICE_CURRENCY}`);
  }
  if (filters.usedOnly) {
    parts.push(`conditionIds:{${USED_CONDITION_ID}}`);
  }

  return parts.length > 0 ? parts.join(',') : undefined;
}

/**
 * The search endpoint's ItemSummary has no Size field — only the per-item
 * getItem endpoint's `localizedAspects` does. One extra call per result
 * shown, fetched in parallel; a failure here just means that card shows no
 * size badge, it never fails the overall search.
 */
async function fetchItemSize(itemId: string, token: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${ITEM_URL}/${encodeURIComponent(itemId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': MARKETPLACE_ID,
      },
    });
    if (!response.ok) {
      return undefined;
    }
    const data = (await response.json()) as EbayItemDetail;
    for (const name of SIZE_ASPECT_NAMES) {
      const match = data.localizedAspects?.find((aspect) => aspect.name === name);
      if (match?.value) {
        return match.value;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function searchEbay(filters: SearchFilters): Promise<NormalizedResult[]> {
  const token = await ensureEbayToken();

  // eBay's search endpoint has no Size field/filter to query against (see
  // fetchItemSize below), so a single requested size is folded into the
  // free-text query instead — sellers of shoes/shirts/pants/etc. almost
  // always put the size in the title, so this biases eBay's own relevance
  // ranking toward matching listings before the hard filter below narrows
  // to real matches. With multiple sizes selected, appending every one of
  // them as extra keywords would bias search toward listings that mention
  // ALL of them (nonsensical), so the query is left alone and the fetch
  // limit is raised instead to widen the pre-filter candidate pool.
  const singleSize = filters.sizes?.length === 1 ? filters.sizes[0] : undefined;
  const query = singleSize ? `${filters.query} ${singleSize}` : filters.query;
  const limit = filters.sizes && filters.sizes.length > 1 ? '48' : '24';
  const params = new URLSearchParams({ q: query, limit });
  const filter = buildFilter(filters);
  if (filter) {
    params.set('filter', filter);
  }

  const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': MARKETPLACE_ID,
    },
  });

  if (!response.ok) {
    throw new Error(`eBay search failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as EbaySearchResponse;
  const items = data.itemSummaries ?? [];
  const sizes = await Promise.all(items.map((item) => fetchItemSize(item.itemId, token)));

  const results = items.map((item, i) => ({
    id: item.itemId,
    source: 'ebay' as const,
    title: item.title,
    price: item.price ? Number(item.price.value) : 0,
    currency: item.price?.currency ?? PRICE_CURRENCY,
    imageUrl: item.image?.imageUrl,
    itemUrl: item.itemWebUrl,
    condition: item.condition,
    size: sizes[i],
  }));

  if (!filters.sizes || filters.sizes.length === 0) {
    return results;
  }

  // Hard filter down to confirmed matches using the real per-item Size
  // aspect fetched above, now that the text bias (single size) or wider
  // fetch limit (multiple sizes) has surfaced candidates. A listing with no
  // Size aspect on file can't be confirmed, so it's dropped here rather
  // than shown as a maybe-match. Any one of the selected sizes counts.
  const wanted = filters.sizes;
  return results.filter((result) => result.size && wanted.some((size) => sizeMatches(result.size!, size)));
}
