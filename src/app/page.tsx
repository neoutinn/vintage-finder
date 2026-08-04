'use client';

import { useState } from 'react';
import SearchBar, { SearchSubmitValues } from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';
import ProviderErrorBanner from '@/components/ProviderErrorBanner';
import type { NormalizedResult, ProviderError } from '@/lib/providers/types';
import styles from './page.module.css';

type SearchResponse = {
  results: NormalizedResult[];
  errors: ProviderError[];
  hasMore: boolean;
};

export default function Home() {
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastValues, setLastValues] = useState<SearchSubmitValues | null>(null);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [errors, setErrors] = useState<ProviderError[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  function buildParams(values: SearchSubmitValues, offset: number) {
    const params = new URLSearchParams({ q: values.query, usedOnly: String(values.usedOnly) });
    if (values.minPrice !== undefined) params.set('minPrice', String(values.minPrice));
    if (values.maxPrice !== undefined) params.set('maxPrice', String(values.maxPrice));
    if (offset > 0) params.set('offset', String(offset));
    for (const size of values.sizes ?? []) params.append('size', size);
    return params;
  }

  async function handleSearch(values: SearchSubmitValues) {
    setIsSearching(true);
    setFetchError(null);
    setLastQuery(values.query);
    setLastValues(values);

    try {
      const response = await fetch(`/api/search?${buildParams(values, 0).toString()}`);
      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }
      const data = (await response.json()) as SearchResponse;

      setResults(data.results);
      setErrors(data.errors);
      setHasMore(data.hasMore);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Search request failed');
      setResults([]);
      setErrors([]);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  }

  // "Load more" pages through eBay's own result set via offset rather than
  // requesting everything in one huge, slow, quota-hungry call — see
  // PAGE_SIZE in ebay.ts. Click it as many times as eBay actually has more.
  async function handleLoadMore() {
    if (!lastValues) return;
    setIsLoadingMore(true);
    setFetchError(null);

    try {
      const response = await fetch(`/api/search?${buildParams(lastValues, results.length).toString()}`);
      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }
      const data = (await response.json()) as SearchResponse;

      setResults((prev) => [...prev, ...data.results].sort((a, b) => a.price - b.price));
      setErrors(data.errors);
      setHasMore(data.hasMore);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Load more request failed');
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={`${styles.heading} glow`}>
        VINTAGE FINDER <span className={styles.version}>v3.2</span>
      </h1>
      <p className={styles.subheading}>EBAY LIVE SEARCH TERMINAL</p>

      <SearchBar onSubmit={handleSearch} isSearching={isSearching} />

      {fetchError && <div className="terminal-box">[!] {fetchError}</div>}

      <ProviderErrorBanner errors={errors} />

      {isSearching && <div className={`${styles.status} cursor`}>SEARCHING</div>}

      {!isSearching && lastQuery && results.length === 0 && !fetchError && (
        <div className={styles.status}>NO RESULTS FOUND FOR &quot;{lastQuery}&quot;</div>
      )}

      {results.length > 0 && (
        <div className={styles.grid}>
          {results.map((result) => (
            <ResultCard key={`${result.source}-${result.id}`} result={result} />
          ))}
        </div>
      )}

      {!isSearching && hasMore && (
        <button type="button" className={styles.loadMore} onClick={handleLoadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'LOADING...' : 'LOAD MORE'}
        </button>
      )}
    </main>
  );
}
