// Poshmark has no public search API, so this builds a pre-filled search URL
// for the user to open in a new tab instead of returning inline results.

export function buildPoshmarkUrl(query: string): string {
  return `https://poshmark.com/search?query=${encodeURIComponent(query)}&type=listings&src=dir`;
}

export type DeepLink = { label: string; url: string };

export function buildDeepLinks(query: string): DeepLink[] {
  return [{ label: 'POSHMARK', url: buildPoshmarkUrl(query) }];
}
