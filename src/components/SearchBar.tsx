'use client';

import { FormEvent, useState } from 'react';
import styles from './SearchBar.module.css';

export type SearchSubmitValues = {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  usedOnly: boolean;
};

type Props = {
  onSubmit: (values: SearchSubmitValues) => void;
  isSearching: boolean;
};

export default function SearchBar({ onSubmit, isSearching }: Props) {
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [usedOnly, setUsedOnly] = useState(true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    onSubmit({
      query: query.trim(),
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      usedOnly,
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="query">
        SEARCH_QUERY:
      </label>
      <input
        id="query"
        className={styles.queryInput}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="levis trucker jacket"
        autoComplete="off"
      />

      <div className={styles.row}>
        <label className={styles.label} htmlFor="minPrice">
          MIN $
        </label>
        <input
          id="minPrice"
          className={styles.numberInput}
          type="number"
          min="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />

        <label className={styles.label} htmlFor="maxPrice">
          MAX $
        </label>
        <input
          id="maxPrice"
          className={styles.numberInput}
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      <label className={styles.checkboxRow} htmlFor="usedOnly">
        <input
          id="usedOnly"
          type="checkbox"
          checked={usedOnly}
          onChange={(e) => setUsedOnly(e.target.checked)}
        />
        USED / VINTAGE ONLY
      </label>

      <button type="submit" disabled={isSearching}>
        {isSearching ? 'SEARCHING...' : 'EXECUTE SEARCH'}
      </button>
    </form>
  );
}
