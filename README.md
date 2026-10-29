# FOREXIQ

**Trade Smarter. See Further.**

FOREXIQ is an AI-assisted market research and trading workspace for forex and cryptocurrency traders. This repository contains the initial Next.js application foundation and responsive terminal dashboard.

## Current implementation

- Responsive FOREXIQ workspace and navigation
- Forex and crypto watchlist interface
- Server-side multi-asset market overview for major FX pairs, spot gold and silver, energy futures, major indices and selected crypto pairs
- Searchable market watch with asset-class filters and per-instrument live/unavailable states
- All five asset classes are requested concurrently in one dashboard API response; refresh every 30 seconds. Quotes are labelled live, delayed or unavailable based on their feed
- Internal market-data provider details are not displayed in the customer-facing interface
- Searchable instrument list
- Selectable historical market chart with 1D, 1W, 1M and 1Y ranges; refreshes every 15 seconds
- Crypto chart candles from the live public market feed; forex, metals, energy and indices use reference chart history and may be delayed
- AI research and security-readiness UI states
- Clear demo-data labels; sample values are not represented as live market data

## Not yet connected

AI inference, user authentication, database persistence, broker/exchange account connectivity, order execution, deposits, withdrawals, subscriptions, broker-grade tick streaming, executable bid/ask prices and production risk controls are not enabled. The multi-asset overview combines public reference feeds for FX, metals and crypto with a fallback-capable quote request for energy and indices. FX reference rates and some index/energy quotes may be delayed; the interface distinguishes delayed from live data. Gold and silver use spot reference prices. A provider outage can still make an instrument unavailable; prices are never fabricated. This market-data layer does not enable trading.

## Run locally

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` when provider credentials are configured.
4. Run `npm run dev` and open http://localhost:3000.

## Deploy

Import this GitHub repository into Vercel. The project uses Next.js and requires no environment variables for the initial preview interface.

## Security

Keep API keys and provider secrets in server-side environment variables. Never commit secrets or expose them through `NEXT_PUBLIC_` variables. Do not enable live trading until exchange permissions, authentication, order validation, limits, logging and emergency controls have been implemented and independently tested.

## Risk notice

Forex and cryptocurrency trading involve substantial risk. AI-generated research is informational and does not guarantee profits or prevent losses.
