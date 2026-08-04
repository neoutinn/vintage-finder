export type Source = 'ebay';

export type NormalizedResult = {
  id: string;
  source: Source;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  itemUrl: string;
  condition?: string;
  size?: string;
};

export type SearchFilters = {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  usedOnly?: boolean;
  sizes?: string[];
  offset?: number;
};

export type SearchPage = {
  results: NormalizedResult[];
  total: number;
  hasMore: boolean;
};

export type ProviderError = {
  source: Source;
  message: string;
};
