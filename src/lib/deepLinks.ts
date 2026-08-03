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

/**
 * Poshmark always shows as a deep-link (out of scope for live scraping).
 * Depop/FB Marketplace only show as deep-links when NOT connected - once
 * connected, live results replace them (see ConnectAccountButton/page.tsx).
 */
export function buildDeepLinks(
  query: string,
  connected: { depop: boolean; facebook: boolean },
): DeepLink[] {
  const links: DeepLink[] = [{ label: 'POSHMARK', url: buildPoshmarkUrl(query) }];
  if (!connected.depop) {
    links.unshift({ label: 'DEPOP', url: buildDepopUrl(query) });
  }
  if (!connected.facebook) {
    links.push({ label: 'FB MARKETPLACE', url: buildFacebookMarketplaceUrl(query) });
  }
  return links;
}
