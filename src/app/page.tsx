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
};

export default function Home() {
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [errors, setErrors] = useState<ProviderError[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function handleSearch(values: SearchSubmitValues) {
    setIsSearching(true);
    setFetchError(null);
    setLastQuery(values.query);

    const params = new URLSearchParams({ q: values.query, usedOnly: String(values.usedOnly) });
    if (values.minPrice !== undefined) params.set('minPrice', String(values.minPrice));
    if (values.maxPrice !== undefined) params.set('maxPrice', String(values.maxPrice));

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }
      const data = (await response.json()) as SearchResponse;

      setResults(data.results);
      setErrors(data.errors);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Search request failed');
      setResults([]);
      setErrors([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={`${styles.heading} glow`}>
        VINTAGE FINDER <span className={styles.version}>v3.1</span>
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
    </main>
  );
}
