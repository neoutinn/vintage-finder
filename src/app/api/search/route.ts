import { NextRequest, NextResponse } from 'next/server';
import { searchEbay } from '@/lib/providers/ebay';
import type { NormalizedResult, ProviderError, SearchFilters } from '@/lib/providers/types';

export const dynamic = 'force-dynamic';

function parseFilters(searchParams: URLSearchParams): SearchFilters | null {
  const query = searchParams.get('q')?.trim();
  if (!query) {
    return null;
  }

  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');

  return {
    query,
    minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
    usedOnly: searchParams.get('usedOnly') === 'true',
  };
}

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);
  if (!filters) {
    return NextResponse.json({ error: 'Missing required "q" query parameter' }, { status: 400 });
  }

  const results: NormalizedResult[] = [];
  const errors: ProviderError[] = [];

  try {
    results.push(...(await searchEbay(filters)));
  } catch (err) {
    errors.push({ source: 'ebay', message: err instanceof Error ? err.message : 'eBay search failed' });
  }

  results.sort((a, b) => a.price - b.price);

  return NextResponse.json({ results, errors });
}
