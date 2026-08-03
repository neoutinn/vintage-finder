import { getOptionalEnv } from '../env';
import type { NormalizedResult, SearchFilters } from './types';

const SEARCH_URL = 'https://openapi.etsy.com/v3/application/listings/active';

type EtsyMoney = {
  amount: number;
  divisor: number;
  currency_code: string;
};

type EtsyImage = {
  url_570xN?: string;
  url_fullxfull?: string;
};

type EtsyListing = {
  listing_id: number;
  title: string;
  price: EtsyMoney;
  url: string;
  images?: EtsyImage[];
};

type EtsySearchResponse = {
  results?: EtsyListing[];
};

export async function searchEtsy(filters: SearchFilters): Promise<NormalizedResult[]> {
  const apiKey = getOptionalEnv('ETSY_API_KEY');
  if (!apiKey) {
    throw new Error('ETSY_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    keywords: filters.query,
    limit: '24',
    includes: 'Images',
  });
  if (filters.minPrice !== undefined) {
    params.set('min_price', String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    params.set('max_price', String(filters.maxPrice));
  }

  const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: { 'x-api-key': apiKey },
  });

  if (!response.ok) {
    throw new Error(`Etsy search failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as EtsySearchResponse;

  return (data.results ?? []).map((listing) => ({
    id: String(listing.listing_id),
    source: 'etsy' as const,
    title: listing.title,
    price: listing.price.amount / listing.price.divisor,
    currency: listing.price.currency_code,
    imageUrl: listing.images?.[0]?.url_570xN ?? listing.images?.[0]?.url_fullxfull,
    itemUrl: listing.url,
  }));
}
