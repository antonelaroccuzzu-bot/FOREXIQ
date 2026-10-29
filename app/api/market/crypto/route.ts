import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
const DISPLAY: Record<string, string> = {
  BTCUSDT: "BTC/USD",
  ETHUSDT: "ETH/USD",
  SOLUSDT: "SOL/USD",
};

export async function GET() {
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Market data provider unavailable" }, { status: 502 });
    }
    const rows: Array<{ symbol: string; lastPrice: string; priceChangePercent: string }> = await response.json();
    const prices = rows
      .filter((row) => SYMBOLS.includes(row.symbol as (typeof SYMBOLS)[number]))
      .map((row) => {
        const changeValue = Number(row.priceChangePercent);
        return {
          symbol: DISPLAY[row.symbol],
          price: Number(row.lastPrice).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          change: `${changeValue >= 0 ? "+" : ""}${changeValue.toFixed(2)}%`,
          up: changeValue >= 0,
        };
      });
    return NextResponse.json(
      { provider: "internal-market-feed", updatedAt: new Date().toISOString(), prices },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ error: "Unable to retrieve market data" }, { status: 503 });
  }
}
