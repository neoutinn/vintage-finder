import { getOptionalEnv } from './env';

const TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const SCOPE = 'https://api.ebay.com/oauth/api_scope';

// Module-scope cache. Reused across warm serverless invocations on the same
// instance; NOT shared across cold starts or other instances, so callers must
// always check expiresAt rather than assume the cached token is still valid.
let cachedToken: { token: string; expiresAt: number } | null = null;
let inFlightRequest: Promise<string> | null = null;

/**
 * Returns a valid eBay Browse API bearer token, minting a new one via the
 * client-credentials grant if the cached token is missing or within 60s of expiry.
 * Throws if EBAY_CLIENT_ID/EBAY_CLIENT_SECRET aren't configured — callers should
 * catch this and skip the eBay provider rather than fail the whole search.
 */
export async function ensureEbayToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.token;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const clientId = getOptionalEnv('EBAY_CLIENT_ID');
  const clientSecret = getOptionalEnv('EBAY_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are not configured');
  }

  inFlightRequest = (async () => {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: SCOPE,
      }),
    });

    if (!response.ok) {
      throw new Error(`eBay token request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return cachedToken.token;
  })();

  try {
    return await inFlightRequest;
  } finally {
    inFlightRequest = null;
  }
}
