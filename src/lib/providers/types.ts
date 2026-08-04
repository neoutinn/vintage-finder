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
};

export type ProviderError = {
  source: Source;
  message: string;
};
