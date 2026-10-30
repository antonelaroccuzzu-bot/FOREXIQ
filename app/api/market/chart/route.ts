import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SYMBOLS: Record<string, { crypto?: string; yahoo: string }> = {
  "EUR/USD": { yahoo: "EURUSD=X" }, "GBP/USD": { yahoo: "GBPUSD=X" },
  "USD/JPY": { yahoo: "JPY=X" }, "AUD/USD": { yahoo: "AUDUSD=X" },
  "USD/CAD": { yahoo: "CAD=X" }, "USD/CHF": { yahoo: "CHF=X" },
  "NZD/USD": { yahoo: "NZDUSD=X" }, "XAU/USD": { yahoo: "XAUUSD=X" },
  "XAG/USD": { yahoo: "XAGUSD=X" }, "WTI": { yahoo: "CL=F" },
  "NATGAS": { yahoo: "NG=F" }, "S&P 500": { yahoo: "^GSPC" },
  "NASDAQ": { yahoo: "^IXIC" }, "DOW": { yahoo: "^DJI" },
  "FTSE 100": { yahoo: "^FTSE" }, "DAX": { yahoo: "^GDAXI" },
  "BTC/USDT": { crypto: "BTCUSDT", yahoo: "BTC-USD" },
  "ETH/USDT": { crypto: "ETHUSDT", yahoo: "ETH-USD" },
  "SOL/USDT": { crypto: "SOLUSDT", yahoo: "SOL-USD" },
  "BNB/USDT": { crypto: "BNBUSDT", yahoo: "BNB-USD" },
  "XRP/USDT": { crypto: "XRPUSDT", yahoo: "XRP-USD" },
  "ADA/USDT": { crypto: "ADAUSDT", yahoo: "ADA-USD" },
  "DOGE/USDT": { crypto: "DOGEUSDT", yahoo: "DOGE-USD" },
};

const PERIODS = {
  "1D": { yahooRange: "1d", yahooInterval: "1m", cryptoInterval: "1m", limit: 240 },
  "1W": { yahooRange: "5d", yahooInterval: "15m", cryptoInterval: "15m", limit: 480 },
  "1M": { yahooRange: "1mo", yahooInterval: "1h", cryptoInterval: "1h", limit: 720 },
  "1Y": { yahooRange: "1y", yahooInterval: "1d", cryptoInterval: "1d", limit: 365 },
} as const;

async function getJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json", "user-agent": "Mozilla/5.0 FOREXIQ" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Market source returned ${response.status}`);
  return response.json();
}

async function yahooPoints(symbol: string, period: keyof typeof PERIODS) {
  const config = PERIODS[period];
  const encoded = encodeURIComponent(symbol);
  let payload: any;
  let lastError: unknown;
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      payload = await getJson(`https://${host}/v8/finance/chart/${encoded}?range=${config.yahooRange}&interval=${config.yahooInterval}`);
      if (payload?.chart?.result?.[0]) break;
    } catch (error) {
      lastError = error;
    }
  }
  const result = payload?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp || [];
  const values: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];
  const points = timestamps
    .map((time, index) => ({ time: time * 1000, value: Number(values[index]) }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value) && point.value > 0);
  if (!points.length) throw lastError || new Error("No historical chart points");
  return points;
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") || "BTC/USDT";
  const period = (request.nextUrl.searchParams.get("period") || "1D") as keyof typeof PERIODS;
  const instrument = SYMBOLS[symbol];
  if (!instrument || !PERIODS[period]) {
    return NextResponse.json({ error: "Unsupported chart selection" }, { status: 400 });
  }

  const config = PERIODS[period];
  const headers = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

  if (instrument.crypto) {
    // Binance's primary API can be regionally unavailable. Try its market-data
    // mirror before falling back to Yahoo's delayed reference candles.
    for (const host of ["api.binance.com", "data-api.binance.vision"]) {
      try {
        const rows = await getJson(
          `https://${host}/api/v3/klines?symbol=${instrument.crypto}&interval=${config.cryptoInterval}&limit=${config.limit}`,
        ) as (string | number)[][];
        const points = rows
          .map((row) => ({ time: Number(row[0]), value: Number(row[4]) }))
          .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value) && point.value > 0);
        if (points.length) {
          return NextResponse.json(
            { symbol, period, points, sourceStatus: "live", updatedAt: new Date().toISOString() },
            { headers },
          );
        }
      } catch {
        // Continue to the next source; never replace missing data with estimates.
      }
    }
  }

  try {
    const points = await yahooPoints(instrument.yahoo, period);
    return NextResponse.json(
      { symbol, period, points, sourceStatus: "delayed", updatedAt: new Date().toISOString() },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "Chart data is temporarily unavailable for this instrument. Please try again shortly." },
      { status: 503, headers },
    );
  }
}
