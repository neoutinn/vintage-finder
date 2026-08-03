import type { NormalizedResult, Source } from '@/lib/providers/types';

/**
 * Shared, deliberately loose field-matching used by both scrapers/depop.ts and
 * scrapers/facebookMarketplace.ts to pull listing-shaped objects out of an
 * intercepted JSON response whose exact schema hasn't been confirmed against a
 * live session (see the unverified-schema comment atop each scraper file).
 */

export type RawListing = Record<string, unknown>;

export function firstString(obj: RawListing, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

export function firstNumber(obj: RawListing, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !Number.isNaN(Number(value))) return Number(value);
  }
  return undefined;
}

export function findListingArray(body: unknown): RawListing[] {
  if (Array.isArray(body)) {
    return body.filter((item): item is RawListing => typeof item === 'object' && item !== null);
  }
  if (body && typeof body === 'object') {
    for (const value of Object.values(body as Record<string, unknown>)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        return value as RawListing[];
      }
      if (value && typeof value === 'object') {
        const nested = findListingArray(value);
        if (nested.length > 0) return nested;
      }
    }
  }
  return [];
}

export function extractListings(
  body: unknown,
  source: Source,
  baseUrl: string,
  idPrefix: string,
): NormalizedResult[] {
  const listings = findListingArray(body);

  return listings
    .map((item): NormalizedResult | null => {
      const title = firstString(item, ['title', 'description', 'name', 'marketplace_listing_title']);
      const price = firstNumber(item, ['price', 'priceAmount', 'amount', 'listing_price']);
      const itemUrl = firstString(item, ['url', 'slug', 'link', 'permalink']);
      const imageUrl = firstString(item, [
        'imageUrl',
        'thumbnail',
        'previewImage',
        'picture',
        'primary_listing_photo',
      ]);
      const id = firstString(item, ['id', 'itemId', 'slug', 'listing_id']) ?? title;

      if (!title || price === undefined || !id) {
        return null;
      }

      return {
        id: `${idPrefix}-${id}`,
        source,
        title,
        price,
        currency: 'USD',
        imageUrl,
        itemUrl: itemUrl?.startsWith('http') ? itemUrl : `${baseUrl}${itemUrl ?? ''}`,
      };
    })
    .filter((result): result is NormalizedResult => result !== null);
}
