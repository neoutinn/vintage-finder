# Vintage Finder

A black-and-white, early-computer-terminal styled desktop app for finding vintage clothing.
One query box searches **eBay** and **Etsy** live (via their official public APIs), plus
**Depop** and **Facebook Marketplace** (no public API for either — see the risk section
below) using your own logged-in browser session. **Poshmark** stays a deep-link button
("open a pre-filled search in a new tab") since it's out of scope here.

Packaged as a personal Windows desktop app (Electron), not a hosted website — everything
runs locally on your machine.

## ⚠️ Read before connecting Depop/Facebook

This app is personal-use only. Automating Depop and Facebook Marketplace searches with
your own account:

- **Violates both platforms' Terms of Service.** There is no official API for either.
- **Can get your account flagged or locked**, especially on Facebook, which actively
  detects and blocks automated browser sessions. That's a real cost to *your own*
  personal account, not a hypothetical.
- **Is inherently fragile.** It intercepts each site's internal, undocumented API
  responses. Whenever either site changes its frontend, the scraper can silently start
  returning nothing until updated (see the `IMPORTANT` comments at the top of
  `scrapers/depop.ts` and `scrapers/facebookMarketplace.ts` — the exact response
  shape each expects has **not** been verified against a real logged-in session and will
  likely need adjusting the first time you actually run it).
- Expect **periodic re-login prompts** on Facebook in particular — that's Facebook's bot
  detection doing its normal job, not a bug.

If that's not an acceptable trade for you, just don't click "Connect" for those two —
eBay, Etsy, and the Poshmark deep-link all work with zero risk.

## Stack

Next.js 14 (App Router) + TypeScript for the app itself, wrapped in Electron for desktop
packaging. Playwright (Depop) and Patchright (Facebook — a maintained, anti-detection
Playwright fork) drive real Chromium windows locally for the scraped platforms.

## 1. Get eBay/Etsy API keys

### eBay (Browse API)

1. Create a free account at [developer.ebay.com](https://developer.ebay.com).
2. Create a **Production** keyset for your application — this gives you a Client ID
   (App ID) and Client Secret (Cert ID).
3. No further approval is generally needed for the Browse API's client-credentials
   (application-level) access, which is all this app uses — it never touches a real
   eBay user's account.

### Etsy (Open API v3)

1. Create a free account at [etsy.com/developers](https://www.etsy.com/developers).
2. Create a new app — you'll get an API key (keystring) immediately for read-only
   endpoints like listing search. Default limit is 10,000 requests/day, 10/second.

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from step 1:

```bash
cp .env.local.example .env.local
```

```
EBAY_CLIENT_ID=...
EBAY_CLIENT_SECRET=...
ETSY_API_KEY=...
```

The app degrades gracefully if a key is missing, or if Depop/Facebook aren't connected —
that provider's results are skipped with a banner explaining why, instead of the whole
search failing.

## 3. Install

Requires Node.js 18.18+ (or 20+) and npm. This repo was scaffolded without running
`npm install` locally (no Node.js in that environment), so this is genuinely the first
install:

```bash
npm install
```

`postinstall` runs `playwright install chromium` automatically to download the browser
Depop's scraper drives. Facebook's scraper uses Patchright, which manages its own browser
binary — if `npm install` doesn't pull it in automatically, run:

```bash
npx patchright install chromium
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

## 5. Connect Depop / Facebook Marketplace (optional, read the risk section first)

Click "CONNECT DEPOP" or "CONNECT FB MARKETPLACE" in the app. A real, visible browser
window opens to that site's login page — log in normally, then **close that window
yourself** once you're done (there's no "log in successful" detection; closing the window
is how the app knows you're finished). Your session is saved locally and reused
headlessly for searches from then on. Re-run "Connect" any time a search starts failing
with a re-connect error.

## 6. Package a standalone .exe

```bash
npm run dist
```

Builds the Next.js app, compiles the Electron shell, and runs `electron-builder` to
produce a Windows installer under `release/`. No custom app icon is set up yet — add one
at `build/icon.ico` and uncomment the `icon:` line in `electron-builder.yml` if you want
one.

## Project structure

```
src/app/page.tsx                       # search UI, connect buttons, results grid
src/app/api/search/route.ts            # eBay + Etsy, in parallel
src/app/api/marketplace/route.ts       # Depop/Facebook: GET searches, POST connects
src/app/api/marketplace/status/route.ts # which platforms have a saved session
src/lib/providers/ebay.ts              # eBay Browse API client
src/lib/providers/etsy.ts              # Etsy Open API v3 client
src/lib/ebayTokenCache.ts              # caches the eBay OAuth token between requests
src/lib/deepLinks.ts                   # Poshmark (always) + Depop/FB (fallback) deep-links
src/components/                        # SearchBar, ResultCard, ConnectAccountButton, etc.
scrapers/session-manager.ts            # persistent-login browser profile lifecycle
scrapers/depop.ts                      # Depop scraper (Playwright) — unverified, see file
scrapers/facebookMarketplace.ts        # Facebook scraper (Patchright) — unverified, see file
scrapers/listingHeuristics.ts          # shared best-guess JSON field extraction
electron/main.ts                       # spawns the Next.js server, owns the app window
electron-builder.yml                   # Windows packaging config
```
