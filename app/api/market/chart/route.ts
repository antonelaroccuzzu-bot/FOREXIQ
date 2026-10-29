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

async function json(url: string) {
  const response = await fetch(url, { cache: "no-store", headers: { accept: "application/json", "user-agent": "Mozilla/5.0 FOREXIQ" }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("Chart source unavailable");
  return response.json();
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") || "BTC/USDT";
  const period = (request.nextUrl.searchParams.get("period") || "1D") as keyof typeof PERIODS;
  const instrument = SYMBOLS[symbol];
  if (!instrument || !PERIODS[period]) return NextResponse.json({ error: "Unsupported chart selection" }, { status: 400 });
  const config = PERIODS[period];
  try {
    if (instrument.crypto) {
      const rows = await json(`https://api.binance.com/api/v3/klines?symbol=${instrument.crypto}&interval=${config.cryptoInterval}&limit=${config.limit}`) as (string | number)[][];
      const points = rows.map((row) => ({ time: Number(row[0]), value: Number(row[4]) })).filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value));
      if (!points.length) throw new Error("No chart points");
      return NextResponse.json({ symbol, period, points, sourceStatus: "live", updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    const query = async (host: string) => json(`https://${host}/v8/finance/chart/${encodeURIComponent(instrument.yahoo)}?range=${config.yahooRange}&interval=${config.yahooInterval}`);
    let result: any;
    try { result = (await query("query1.finance.yahoo.com"))?.chart?.result?.[0]; }
    catch { result = (await query("query2.finance.yahoo.com"))?.chart?.result?.[0]; }
    const timestamps: number[] = result?.timestamp || [];
    const values: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];
    const points = timestamps.map((time, index) => ({ time: time * 1000, value: Number(values[index]) })).filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value) && p.value > 0);
    if (!points.length) throw new Error("No chart points");
    return NextResponse.json({ symbol, period, points, sourceStatus: "delayed", updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Chart data is temporarily unavailable for this instrument." }, { status: 503 });
  }
}
