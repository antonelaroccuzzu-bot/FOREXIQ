# FOREXIQ

**Trade Smarter. See Further.**

FOREXIQ is an AI-assisted market research and trading workspace for forex and cryptocurrency traders. This repository contains the initial Next.js application foundation and responsive terminal dashboard.

## Current implementation

- Responsive FOREXIQ workspace and navigation
- Forex and crypto watchlist interface
- Server-side multi-asset market overview for major FX pairs, gold and silver futures proxies, energy futures, major indices and selected crypto pairs
- Searchable market watch with asset-class filters and per-instrument live/unavailable states
- Market quote refresh every 30 seconds; availability and delays depend on the upstream public data feeds
- Internal market-data provider details are not displayed in the customer-facing interface
- Searchable instrument list
- Illustrative chart and dashboard panels
- AI research and security-readiness UI states
- Clear demo-data labels; sample values are not represented as live market data

## Not yet connected

AI inference, user authentication, database persistence, broker/exchange account connectivity, order execution, deposits, withdrawals, subscriptions, historical chart streaming, executable bid/ask prices and production risk controls are not enabled. The multi-asset overview uses public indicative quote endpoints; individual instruments can be unavailable or delayed. Gold and silver currently use futures-market proxies rather than broker spot prices. This market-data layer does not enable trading.

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
