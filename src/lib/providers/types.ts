export type NormalizedResult = {
  id: string;
  source: 'ebay' | 'etsy';
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  itemUrl: string;
  condition?: string;
};

export type SearchFilters = {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  usedOnly?: boolean;
};

export type ProviderError = {
  source: 'ebay' | 'etsy';
  message: string;
};
