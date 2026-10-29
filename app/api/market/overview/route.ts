import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Group = "FOREX" | "METALS" | "ENERGY" | "INDICES" | "CRYPTO";
type Instrument = { symbol: string; name: string; group: Group; decimals: number; yahoo?: string; crypto?: string; fx?: string; inverseFx?: boolean; metal?: string };
type QuoteValue = { price: number; change: number | null; currency: string; updatedAt: string; status: "live" | "delayed" };
type ApiQuote = { symbol: string; name: string; group: Group; price: string; change: string | null; up: boolean | null; currency: string; updatedAt: string | null; status: "live" | "delayed" | "unavailable" };

const INSTRUMENTS: Instrument[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", group: "FOREX", fx: "EUR", inverseFx: true, decimals: 5 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", group: "FOREX", fx: "GBP", inverseFx: true, decimals: 5 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", group: "FOREX", fx: "JPY", decimals: 3 },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", group: "FOREX", fx: "AUD", inverseFx: true, decimals: 5 },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", group: "FOREX", fx: "CAD", decimals: 5 },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", group: "FOREX", fx: "CHF", decimals: 5 },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", group: "FOREX", fx: "NZD", inverseFx: true, decimals: 5 },
  { symbol: "XAU/USD", name: "Gold Spot", group: "METALS", metal: "XAU", decimals: 2 },
  { symbol: "XAG/USD", name: "Silver Spot", group: "METALS", metal: "XAG", decimals: 3 },
  { symbol: "WTI", name: "WTI Crude Oil Futures", group: "ENERGY", yahoo: "CL=F", decimals: 2 },
  { symbol: "NATGAS", name: "Natural Gas Futures", group: "ENERGY", yahoo: "NG=F", decimals: 3 },
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

const now = () => new Date().toISOString();

async function getJson(url: string, timeout = 8000) {
  const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0 FOREXIQ" }, cache: "no-store", signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error("Upstream quote request failed");
  return response.json();
}

async function forexQuotes() {
  const data = await getJson("https://open.er-api.com/v6/latest/USD");
  if (data.result !== "success" || !data.rates) throw new Error("FX rates unavailable");
  const map = new Map<string, QuoteValue>();
  for (const item of INSTRUMENTS.filter((x) => x.fx)) {
    const rate = Number(data.rates[item.fx!]);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    map.set(item.symbol, { price: item.inverseFx ? 1 / rate : rate, change: null, currency: item.symbol.split("/")[1], updatedAt: data.time_last_update_utc ? new Date(data.time_last_update_utc).toISOString() : now(), status: "delayed" });
  }
  return map;
}

async function metalQuotes() {
  const entries = await Promise.all(INSTRUMENTS.filter((x) => x.metal).map(async (item) => {
    const data = await getJson("https://api.gold-api.com/price/" + item.metal);
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) throw new Error("Metal quote unavailable");
    return [item.symbol, { price, change: Number.isFinite(Number(data.chp)) ? Number(data.chp) : null, currency: data.currency || "USD", updatedAt: data.updatedAt || now(), status: "live" as const }] as const;
  }));
  return new Map(entries);
}

async function cryptoQuotes() {
  const rows = await getJson("https://api.binance.com/api/v3/ticker/24hr", 10000) as Array<{ symbol: string; lastPrice: string; priceChangePercent: string }>;
  const wanted = INSTRUMENTS.filter((x) => x.crypto);
  const map = new Map<string, QuoteValue>();
  for (const item of wanted) {
    const row = rows.find((x) => x.symbol === item.crypto);
    const price = Number(row?.lastPrice);
    if (row && Number.isFinite(price) && price > 0) map.set(item.symbol, { price, change: Number(row.priceChangePercent), currency: "USDT", updatedAt: now(), status: "live" });
  }
  return map;
}

async function yahooQuote(symbol: string): Promise<QuoteValue> {
  const url = (host: string) => "https://" + host + "/v8/finance/chart/" + encodeURIComponent(symbol) + "?range=5d&interval=1d";
  let lastError: unknown;
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      const data = await getJson(url(host));
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      const price = Number(meta?.regularMarketPrice ?? result?.indicators?.quote?.[0]?.close?.filter((n: number | null) => n != null).at(-1));
      const previous = Number(meta?.chartPreviousClose ?? meta?.previousClose);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid quote");
      return { price, change: Number.isFinite(previous) && previous > 0 ? ((price - previous) / previous) * 100 : null, currency: meta?.currency || "USD", updatedAt: now(), status: "delayed" };
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error("Quote unavailable");
}

export async function GET() {
  const [fxResult, metalsResult, cryptoResult] = await Promise.allSettled([forexQuotes(), metalQuotes(), cryptoQuotes()]);
  const fx = fxResult.status === "fulfilled" ? fxResult.value : new Map<string, QuoteValue>();
  const metals = metalsResult.status === "fulfilled" ? metalsResult.value : new Map<string, QuoteValue>();
  const crypto = cryptoResult.status === "fulfilled" ? cryptoResult.value : new Map<string, QuoteValue>();

  const quotes: ApiQuote[] = await Promise.all(INSTRUMENTS.map(async (instrument) => {
    try {
      let quote: QuoteValue | undefined;
      if (instrument.fx) quote = fx.get(instrument.symbol);
      else if (instrument.metal) quote = metals.get(instrument.symbol);
      else if (instrument.crypto) quote = crypto.get(instrument.symbol);
      else if (instrument.yahoo) quote = await yahooQuote(instrument.yahoo);
      if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) throw new Error("No quote");
      return {
        symbol: instrument.symbol, name: instrument.name, group: instrument.group,
        price: quote.price.toLocaleString("en-US", { minimumFractionDigits: instrument.decimals, maximumFractionDigits: instrument.decimals }),
        change: quote.change == null || !Number.isFinite(quote.change) ? null : (quote.change >= 0 ? "+" : "") + quote.change.toFixed(2) + "%",
        up: quote.change == null || !Number.isFinite(quote.change) ? null : quote.change >= 0,
        currency: quote.currency, updatedAt: quote.updatedAt, status: quote.status,
      };
    } catch {
      return { symbol: instrument.symbol, name: instrument.name, group: instrument.group, price: "—", change: null, up: null, currency: "—", updatedAt: null, status: "unavailable" };
    }
  }));

  const availableCount = quotes.filter((q) => q.status !== "unavailable").length;
  return NextResponse.json({ updatedAt: now(), availableCount, totalCount: quotes.length, quotes }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
