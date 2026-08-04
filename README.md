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

Two ways to run it: as a Windows desktop app (Electron, fully local) or as a hosted
website at **https://vintage-finder.vercel.app** — works from any browser, phone
included. The hosted version is behind a Basic Auth password prompt (ask the project
owner for it) since it's reachable from the open internet; the desktop app never
prompts for one, since it never leaves your machine (see `src/middleware.ts`).

## Stack

Next.js 14 (App Router) + TypeScript for the app itself. Runs either wrapped in
Electron for desktop packaging, or deployed to Vercel as a normal website.

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

## 6. Hosted deployment (Vercel)

The project is linked to Vercel project `neo-28aa/vintage-finder` and connected to this
GitHub repo, so **every push to `main` auto-deploys** to
[vintage-finder.vercel.app](https://vintage-finder.vercel.app). To deploy manually:

```bash
npx vercel --prod
```

Production environment variables (`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`,
`SITE_PASSWORD`) are set on Vercel directly, not from `.env.local` — see/update them
with `npx vercel env ls` / `npx vercel env add <NAME> production`. `SITE_PASSWORD` is
read by `src/middleware.ts`, which Basic-Auth-gates every route (page and API) on that
deployment only; any username works, only the password is checked.

## Project structure

```
src/app/page.tsx                 # search UI, results grid
src/app/api/search/route.ts      # eBay Browse API search
src/lib/providers/ebay.ts        # eBay Browse API client (search + per-item size lookup)
src/lib/ebayTokenCache.ts        # caches the eBay OAuth token between requests
src/middleware.ts                # Basic Auth gate for the hosted deployment only
src/components/                  # SearchBar, ResultCard, ProviderErrorBanner, etc.
electron/main.ts                 # spawns the Next.js server, owns the app window
electron-builder.yml             # Windows packaging config
```
