/**
 * Reads an env var without throwing. Missing keys should cause a provider to be
 * skipped (see providers/*.ts), never crash the whole /api/search request.
 */
export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}
