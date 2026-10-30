import { experimental_upgradeWebSocket, type WebSocketData } from "@vercel/functions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SYMBOL_CODES: Record<string, string> = {
  "EUR/USD": "EURUSD", "GBP/USD": "GBPUSD", "USD/JPY": "USDJPY",
  "AUD/USD": "AUDUSD", "USD/CAD": "USDCAD", "USD/CHF": "USDCHF",
  "NZD/USD": "NZDUSD", "XAU/USD": "XAUUSD", "XAG/USD": "XAGUSD",
  "WTI": "USOIL", "BTC/USDT": "BTCUSDT", "ETH/USDT": "ETHUSDT",
  "SOL/USDT": "SOLUSDT", "BNB/USDT": "BNBUSDT", "XRP/USDT": "XRPUSDT",
  "ADA/USDT": "ADAUSDT", "DOGE/USDT": "DOGEUSDT",
};

export function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol") || "BTC/USDT";
  const code = SYMBOL_CODES[symbol];
  const token = process.env.ALLTICK_API_TOKEN;
  if (!code || !token) return new Response("Live market stream is not configured for this instrument.", { status: 503 });

  return experimental_upgradeWebSocket((client) => {
    let upstream: WebSocket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let seq = 1;
    const sendClient = (payload: unknown) => {
      if (client.readyState === 1) client.send(JSON.stringify(payload));
    };
    const closeUpstream = () => {
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = undefined;
      try { upstream?.close(); } catch { /* already closed */ }
      upstream = null;
    };

    client.on("close", closeUpstream);
    client.on("error", closeUpstream);
    client.on("message", (_data: WebSocketData) => {
      // The browser cannot choose provider symbols or access the provider token.
    });

    try {
      upstream = new WebSocket("wss://quote.alltick.co/quote-b-ws-api?token=" + encodeURIComponent(token));
      upstream.addEventListener("open", () => {
        upstream?.send(JSON.stringify({ cmd_id: 22004, seq_id: seq++, trace: "forexiq-" + symbol.replace(/[^A-Z0-9]/gi, ""), data: { symbol_list: [{ code }] } }));
        heartbeat = setInterval(() => {
          if (upstream?.readyState === WebSocket.OPEN) upstream.send(JSON.stringify({ cmd_id: 22000, seq_id: seq++, trace: "forexiq-heartbeat", data: {} }));
        }, 10000);
      });
      upstream.addEventListener("message", (event) => {
        try {
          const packet = JSON.parse(String(event.data));
          if (Number(packet.cmd_id) === 22998 && packet.data) {
            const price = Number(packet.data.price);
            const time = Number(packet.data.tick_time);
            if (Number.isFinite(price) && price > 0 && Number.isFinite(time)) sendClient({ type: "tick", symbol, price, time });
          } else if (Number(packet.ret) !== 0 && packet.ret !== undefined) {
            sendClient({ type: "error", message: "AllTick rejected this instrument subscription." });
          }
        } catch { /* Ignore malformed provider messages. */ }
      });
      upstream.addEventListener("error", () => sendClient({ type: "error", message: "AllTick live connection failed." }));
      upstream.addEventListener("close", () => {
        if (heartbeat) clearInterval(heartbeat);
        sendClient({ type: "error", message: "AllTick live connection closed." });
      });
    } catch {
      sendClient({ type: "error", message: "Unable to open the AllTick live connection." });
    }
  });
}
