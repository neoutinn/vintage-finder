import path from 'node:path';
import fs from 'node:fs';

export type Platform = 'depop' | 'facebook';

// Minimal structural shape both playwright's and patchright's chromium
// launcher satisfy, so this module stays decoupled from either package.
export type PersistentContext = {
  pages(): { goto(url: string): Promise<unknown> }[];
  newPage(): Promise<{ goto(url: string): Promise<unknown> }>;
  on(event: 'close', listener: () => void): unknown;
  close(): Promise<void>;
};

export type ChromiumLauncher = {
  launchPersistentContext(userDataDir: string, options?: Record<string, unknown>): Promise<PersistentContext>;
};

/**
 * Base directory for all locally-persisted state (browser profiles). Electron's
 * main process resolves app.getPath('userData') and passes it down via this env
 * var when spawning the Next.js server, since that Electron API isn't available
 * inside the spawned child process. Falls back to a project-local folder so the
 * scrapers remain runnable/testable outside Electron too.
 */
export function getDataDir(): string {
  return process.env.VINTAGE_FINDER_DATA_DIR ?? path.join(process.cwd(), '.vintage-finder-data');
}

export function getProfileDir(platform: Platform): string {
  return path.join(getDataDir(), 'browser-profiles', platform);
}

export function hasSession(platform: Platform): boolean {
  return fs.existsSync(getProfileDir(platform));
}

/**
 * Opens a real, visible browser window against the profile directory for
 * `platform` and lets the user log in by hand. Resolves once the user closes
 * that window themselves - deliberately no "did login succeed" heuristic,
 * since login flows (2FA, checkpoints) vary and the user is the one who knows
 * when they're done.
 */
export async function connectAccount(
  platform: Platform,
  chromium: ChromiumLauncher,
  loginUrl: string,
): Promise<void> {
  const context = await chromium.launchPersistentContext(getProfileDir(platform), {
    headless: false,
  });

  const [firstPage] = context.pages();
  const page = firstPage ?? (await context.newPage());
  await page.goto(loginUrl);

  await new Promise<void>((resolve) => {
    context.on('close', () => resolve());
  });
}

/**
 * Reuses a previously-connected session headlessly for a search. Throws if
 * the platform has never been connected - callers should surface that as a
 * "connect the account first" provider error rather than an unhandled crash.
 */
export async function withSession<T>(
  platform: Platform,
  chromium: ChromiumLauncher,
  fn: (context: PersistentContext) => Promise<T>,
): Promise<T> {
  if (!hasSession(platform)) {
    throw new Error(`${platform} is not connected yet - click "Connect" first`);
  }

  const context = await chromium.launchPersistentContext(getProfileDir(platform), {
    headless: true,
  });
  try {
    return await fn(context);
  } finally {
    await context.close();
  }
}
