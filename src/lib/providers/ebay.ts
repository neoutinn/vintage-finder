import { ensureEbayToken } from '../ebayTokenCache';
import type { NormalizedResult, SearchFilters } from './types';

const SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

// eBay condition ID for "Used" — the umbrella condition for pre-owned/vintage items.
const USED_CONDITION_ID = '3000';

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

function buildFilter(filters: SearchFilters): string | undefined {
  const parts: string[] = [];

  const min = filters.minPrice ?? '';
  const max = filters.maxPrice ?? '';
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    parts.push(`price:[${min}..${max}]`, 'priceCurrency:USD');
  }
  if (filters.usedOnly) {
    parts.push(`conditionIds:{${USED_CONDITION_ID}}`);
  }

  return parts.length > 0 ? parts.join(',') : undefined;
}

export async function searchEbay(filters: SearchFilters): Promise<NormalizedResult[]> {
  const token = await ensureEbayToken();

  const params = new URLSearchParams({ q: filters.query, limit: '24' });
  const filter = buildFilter(filters);
  if (filter) {
    params.set('filter', filter);
  }

  const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
  });

  if (!response.ok) {
    throw new Error(`eBay search failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as EbaySearchResponse;

  return (data.itemSummaries ?? []).map((item) => ({
    id: item.itemId,
    source: 'ebay' as const,
    title: item.title,
    price: item.price ? Number(item.price.value) : 0,
    currency: item.price?.currency ?? 'USD',
    imageUrl: item.image?.imageUrl,
    itemUrl: item.itemWebUrl,
    condition: item.condition,
  }));
}
