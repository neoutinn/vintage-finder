# Vintage Finder

An early-computer-terminal styled desktop app for finding vintage clothing — one query
box searches **eBay** live via its official Browse API. The UI chrome is black-and-white
retro terminal; result preview images stay in full color.

Each result card also shows a **size badge** when eBay has it: the search API doesn't
expose size on its own, so the app makes one extra `getItem` call per result to pull it
from that listing's item specifics. A listing with no Size aspect on file just shows no
badge. This means a single search burns roughly (1 + number of results shown) calls
against your daily quota instead of just 1 — still nowhere near the free tier's
5,000 calls/day for personal use, but worth knowing if you ever raise the result limit.

Packaged as a personal Windows desktop app (Electron), not a hosted website — everything
runs locally on your machine.

## Stack

Next.js 14 (App Router) + TypeScript for the app itself, wrapped in Electron for desktop
packaging.

## 1. Get an eBay API key

1. Create a free account at [developer.ebay.com](https://developer.ebay.com).
2. Create a **Production** keyset for your application — this gives you a Client ID
   (App ID) and Client Secret (Cert ID).
3. No further approval is generally needed for the Browse API's client-credentials
   (application-level) access, which is all this app uses — it never touches a real
   eBay user's account.

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from step 1:

```bash
cp .env.local.example .env.local
```

```
EBAY_CLIENT_ID=...
EBAY_CLIENT_SECRET=...
```

The app degrades gracefully if the key is missing — the search just returns an error
banner instead of failing outright.

## 3. Install

Requires Node.js 18.18+ (or 20+) and npm.

```bash
npm install
```

## 4. Run it

**As a desktop app (recommended — what it's actually built for):**

```bash
npm run electron:dev
```

This compiles the Electron shell, launches it, and it spawns the Next.js dev server
itself under the hood — no need to run `npm run dev` separately.

**As a plain local web app instead** (e.g. to debug in browser DevTools):

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## 5. Package a standalone .exe

```bash
npm run dist
```

Builds the Next.js app, compiles the Electron shell, and runs `electron-builder` to
produce a Windows installer under `release/`. No custom app icon is set up yet — add one
at `build/icon.ico` and uncomment the `icon:` line in `electron-builder.yml` if you want
one.

## Project structure

```
src/app/page.tsx                 # search UI, results grid
src/app/api/search/route.ts      # eBay Browse API search
src/lib/providers/ebay.ts        # eBay Browse API client (search + per-item size lookup)
src/lib/ebayTokenCache.ts        # caches the eBay OAuth token between requests
src/components/                  # SearchBar, ResultCard, ProviderErrorBanner, etc.
electron/main.ts                 # spawns the Next.js server, owns the app window
electron-builder.yml             # Windows packaging config
```
