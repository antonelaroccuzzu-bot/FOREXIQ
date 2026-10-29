import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MarketGroup = "FOREX" | "METALS" | "ENERGY" | "INDICES" | "CRYPTO";
type Instrument = { symbol: string; name: string; group: MarketGroup; yahoo?: string; crypto?: string; decimals?: number };

const INSTRUMENTS: Instrument[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", group: "FOREX", yahoo: "EURUSD=X", decimals: 5 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", group: "FOREX", yahoo: "GBPUSD=X", decimals: 5 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", group: "FOREX", yahoo: "JPY=X", decimals: 3 },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", group: "FOREX", yahoo: "AUDUSD=X", decimals: 5 },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", group: "FOREX", yahoo: "CAD=X", decimals: 5 },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", group: "FOREX", yahoo: "CHF=X", decimals: 5 },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", group: "FOREX", yahoo: "NZDUSD=X", decimals: 5 },
  { symbol: "XAU/USD", name: "Gold Spot (front-month futures proxy)", group: "METALS", yahoo: "GC=F", decimals: 2 },
  { symbol: "XAG/USD", name: "Silver (front-month futures proxy)", group: "METALS", yahoo: "SI=F", decimals: 3 },
  { symbol: "WTI", name: "WTI Crude Oil", group: "ENERGY", yahoo: "CL=F", decimals: 2 },
  { symbol: "NATGAS", name: "Natural Gas", group: "ENERGY", yahoo: "NG=F", decimals: 3 },
  { symbol: "S&P 500", name: "S&P 500 Index", group: "INDICES", yahoo: "^GSPC", decimals: 2 },
  { symbol: "NASDAQ", name: "Nasdaq Composite", group: "INDICES", yahoo: "^IXIC", decimals: 2 },
  { symbol: "DOW", name: "Dow Jones Industrial Average", group: "INDICES", yahoo: "^DJI", decimals: 2 },
  { symbol: "FTSE 100", name: "FTSE 100 Index", group: "INDICES", yahoo: "^FTSE", decimals: 2 },
  { symbol: "DAX", name: "DAX Index", group: "INDICES", yahoo: "^GDAXI", decimals: 2 },
  { symbol: "BTC/USDT", name: "Bitcoin / Tether", group: "CRYPTO", crypto: "BTCUSDT", decimals: 2 },
  { symbol: "ETH/USDT", name: "Ethereum / Tether", group: "CRYPTO", crypto: "ETHUSDT", decimals: 2 },
  { symbol: "SOL/USDT", name: "Solana / Tether", group: "CRYPTO", crypto: "SOLUSDT", decimals: 3 },
  { symbol: "BNB/USDT", name: "BNB / Tether", group: "CRYPTO", crypto: "BNBUSDT", decimals: 2 },
  { symbol: "XRP/USDT", name: "XRP / Tether", group: "CRYPTO", crypto: "XRPUSDT", decimals: 4 },
  { symbol: "ADA/USDT", name: "Cardano / Tether", group: "CRYPTO", crypto: "ADAUSDT", decimals: 4 },
  { symbol: "DOGE/USDT", name: "Dogecoin / Tether", group: "CRYPTO", crypto: "DOGEUSDT", decimals: 5 },
];

async function yahooQuote(instrument: Instrument) {
  if (!instrument.yahoo) return null;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(instrument.yahoo)}?range=1d&interval=5m`;
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Mozilla/5.0 FOREXIQ market data" },
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error("Quote unavailable");
  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  const price = Number(meta?.regularMarketPrice ?? result?.indicators?.quote?.[0]?.close?.filter((n: number | null) => n != null).at(-1));
  const previous = Number(meta?.previousClose ?? meta?.chartPreviousClose);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid quote");
  const change = Number.isFinite(previous) && previous > 0 ? ((price - previous) / previous) * 100 : null;
  return { price, change, currency: meta?.currency ?? "USD", updatedAt: new Date().toISOString() };
}

async function cryptoQuotes() {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
    headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Crypto feed unavailable");
  const rows: Array<{ symbol: string; lastPrice: string; priceChangePercent: string }> = await response.json();
  const wanted = new Set(INSTRUMENTS.filter((item) => item.crypto).map((item) => item.crypto));
  return new Map(rows.filter((row) => wanted.has(row.symbol)).map((row) => [row.symbol, {
    price: Number(row.lastPrice), change: Number(row.priceChangePercent), currency: "USDT", updatedAt: new Date().toISOString(),
  }]));
}

export async function GET() {
  let crypto = new Map<string, { price: number; change: number; currency: string; updatedAt: string }>();
  try { crypto = await cryptoQuotes(); } catch { /* report crypto instruments as unavailable */ }

  const quotes = await Promise.all(INSTRUMENTS.map(async (instrument) => {
    try {
      const quote = instrument.crypto ? crypto.get(instrument.crypto) : await yahooQuote(instrument);
      if (!quote) throw new Error("Quote unavailable");
      return {
        symbol: instrument.symbol, name: instrument.name, group: instrument.group,
        price: quote.price.toLocaleString("en-US", { minimumFractionDigits: instrument.decimals ?? 2, maximumFractionDigits: instrument.decimals ?? 2 }),
        change: quote.change == null ? null : `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)}%`,
        up: quote.change == null ? null : quote.change >= 0,
        currency: quote.currency, updatedAt: quote.updatedAt, status: "live" as const,
      };
    } catch {
      return { symbol: instrument.symbol, name: instrument.name, group: instrument.group, price: "—", change: null, up: null, currency: "—", updatedAt: null, status: "unavailable" as const };
    }
  }));

  const liveCount = quotes.filter((quote) => quote.status === "live").length;
  return NextResponse.json(
    { updatedAt: new Date().toISOString(), liveCount, totalCount: quotes.length, quotes },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
