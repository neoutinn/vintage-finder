'use client';

import { useEffect, useState } from 'react';
import SearchBar, { SearchSubmitValues } from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';
import DeepLinkButtons from '@/components/DeepLinkButtons';
import ProviderErrorBanner from '@/components/ProviderErrorBanner';
import ConnectAccountButton from '@/components/ConnectAccountButton';
import type { NormalizedResult, ProviderError } from '@/lib/providers/types';
import styles from './page.module.css';

type SearchResponse = {
  results: NormalizedResult[];
  errors: ProviderError[];
};

type MarketplaceResponse = {
  results: NormalizedResult[];
  error: string | null;
};

type MarketplaceStatus = { depop: boolean; facebook: boolean };

async function fetchMarketplace(
  platform: 'depop' | 'facebook',
  query: string,
): Promise<{ results: NormalizedResult[]; error: ProviderError | null }> {
  try {
    const response = await fetch(`/api/marketplace?platform=${platform}&q=${encodeURIComponent(query)}`);
    const data = (await response.json()) as MarketplaceResponse;
    return {
      results: data.results,
      error: data.error ? { source: platform, message: data.error } : null,
    };
  } catch (err) {
    return {
      results: [],
      error: { source: platform, message: err instanceof Error ? err.message : `${platform} search failed` },
    };
  }
}

export default function Home() {
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [errors, setErrors] = useState<ProviderError[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [connected, setConnected] = useState<MarketplaceStatus>({ depop: false, facebook: false });

  async function refreshStatus() {
    try {
      const response = await fetch('/api/marketplace/status');
      const data = (await response.json()) as MarketplaceStatus;
      setConnected(data);
    } catch {
      // status check failing just means connect buttons show their default state
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function handleSearch(values: SearchSubmitValues) {
    setIsSearching(true);
    setFetchError(null);
    setLastQuery(values.query);

    const params = new URLSearchParams({ q: values.query, usedOnly: String(values.usedOnly) });
    if (values.minPrice !== undefined) params.set('minPrice', String(values.minPrice));
    if (values.maxPrice !== undefined) params.set('maxPrice', String(values.maxPrice));

    try {
      const mainPromise = fetch(`/api/search?${params.toString()}`).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`);
        }
        return (await response.json()) as SearchResponse;
      });

      const marketplacePromises = [
        ...(connected.depop ? [fetchMarketplace('depop', values.query)] : []),
        ...(connected.facebook ? [fetchMarketplace('facebook', values.query)] : []),
      ];

      const [mainResponse, marketplaceResults] = await Promise.all([
        mainPromise,
        Promise.all(marketplacePromises),
      ]);

      const combinedResults = [...mainResponse.results];
      const combinedErrors = [...mainResponse.errors];
      for (const marketplace of marketplaceResults) {
        combinedResults.push(...marketplace.results);
        if (marketplace.error) combinedErrors.push(marketplace.error);
      }
      combinedResults.sort((a, b) => a.price - b.price);

      setResults(combinedResults);
      setErrors(combinedErrors);
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
        VINTAGE FINDER <span className={styles.version}>v2.0</span>
      </h1>
      <p className={styles.subheading}>MULTI-PLATFORM SEARCH TERMINAL</p>

      <SearchBar onSubmit={handleSearch} isSearching={isSearching} />

      <div className="terminal-box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <ConnectAccountButton
          platform="depop"
          label="DEPOP"
          connected={connected.depop}
          onConnected={refreshStatus}
        />
        <ConnectAccountButton
          platform="facebook"
          label="FB MARKETPLACE"
          connected={connected.facebook}
          onConnected={refreshStatus}
        />
      </div>

      {fetchError && <div className="terminal-box">[!] {fetchError}</div>}

      <ProviderErrorBanner errors={errors} />

      {lastQuery && <DeepLinkButtons query={lastQuery} connected={connected} />}

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
