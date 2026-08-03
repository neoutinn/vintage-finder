# Vintage Finder

A black-and-white, early-computer-terminal styled search tool for vintage clothing. One
query box searches **eBay** and **Etsy** live (via their official public APIs) and shows
results inline; **Depop**, **Poshmark**, and **Facebook Marketplace** don't have public
search APIs, so those show up as "open a pre-filled search in a new tab" buttons instead.

## Stack

Next.js 14 (App Router) + TypeScript, deployed as a normal Next.js app (e.g. on Vercel).
The eBay/Etsy calls happen server-side in `/api/search` so your API keys never reach the
browser.

## 1. Get API keys

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

### Depop / Poshmark / Facebook Marketplace

Nothing to configure — these platforms don't offer a public search API, so the app
just builds a search URL for each and opens it in a new tab when you search.

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

The app degrades gracefully if a key is missing — that provider's results are skipped
and a banner explains why, instead of the whole search failing.

## 3. Run locally

Requires Node.js 18.18+ (or 20+) and npm. This repo was scaffolded without running
`npm install` locally, so run it yourself the first time:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## 4. Deploy

Push this repo to GitHub (already done if you're reading this from the repo) and import
it into [Vercel](https://vercel.com/new) — it auto-detects Next.js. Add the three
environment variables from step 2 in the Vercel project's **Settings → Environment
Variables**, then deploy.

## Project structure

```
src/app/page.tsx                 # search UI
src/app/api/search/route.ts      # server-side route: calls eBay + Etsy in parallel
src/lib/providers/ebay.ts        # eBay Browse API client
src/lib/providers/etsy.ts        # Etsy Open API v3 client
src/lib/ebayTokenCache.ts        # caches the eBay OAuth token between requests
src/lib/deepLinks.ts             # search URL builders for Depop/Poshmark/FB Marketplace
src/components/                  # SearchBar, ResultCard, DeepLinkButtons, error banner
```
