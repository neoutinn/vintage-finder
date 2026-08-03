// Depop, Poshmark, and Facebook Marketplace have no public search API, so these
// build a pre-filled search URL for the user to open in a new tab instead of
// returning inline results.

export function buildDepopUrl(query: string): string {
  return `https://www.depop.com/search/?q=${encodeURIComponent(query)}`;
}

export function buildPoshmarkUrl(query: string): string {
  return `https://poshmark.com/search?query=${encodeURIComponent(query)}&type=listings&src=dir`;
}

export function buildFacebookMarketplaceUrl(query: string): string {
  return `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`;
}

export type DeepLink = { label: string; url: string };

export function buildDeepLinks(query: string): DeepLink[] {
  return [
    { label: 'DEPOP', url: buildDepopUrl(query) },
    { label: 'POSHMARK', url: buildPoshmarkUrl(query) },
    { label: 'FB MARKETPLACE', url: buildFacebookMarketplaceUrl(query) },
  ];
}
