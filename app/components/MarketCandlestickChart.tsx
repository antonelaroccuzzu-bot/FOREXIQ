"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, type CandlestickData, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";

type CandlePayload = { time: number; open: number; high: number; low: number; close: number };
type Props = { symbol: string; period: "1D" | "1W" | "1M" | "1Y"; onStatus: (status: "loading" | "live" | "delayed" | "error") => void; onDetails: (details: { latest: number; low: number; high: number; updatedAt: string }) => void };

const intervals = { "1D": 60, "1W": 900, "1M": 3600, "1Y": 86400 } as const;

export default function MarketCandlestickChart({ symbol, period, onStatus, onDetails }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [message, setMessage] = useState("Loading market candles…");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let alive = true;
    let socket: WebSocket | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let chart: IChartApi | null = null;
    let liveCandle: { time: UTCTimestamp; open: number; high: number; low: number; close: number } | null = null;
    onStatus("loading");
    setMessage("Loading market candles…");

    const start = async () => {
      chart = createChart(host, {
        width: host.clientWidth, height: host.clientHeight,
        layout: { background: { type: ColorType.Solid, color: "#0b141b" }, textColor: "#91a3ad", fontFamily: "Inter, system-ui, sans-serif" },
        grid: { vertLines: { color: "#182832" }, horzLines: { color: "#182832" } },
        rightPriceScale: { borderColor: "#263640", scaleMargins: { top: 0.12, bottom: 0.12 } },
        timeScale: { borderColor: "#263640", timeVisible: true, secondsVisible: false, rightOffset: 8, barSpacing: 7, minBarSpacing: 2 },
        crosshair: { mode: 0, vertLine: { color: "#6b8793", labelBackgroundColor: "#20343d" }, horzLine: { color: "#6b8793", labelBackgroundColor: "#20343d" } },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      });
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#20c997", downColor: "#f05b67", borderUpColor: "#20c997", borderDownColor: "#f05b67",
        wickUpColor: "#20c997", wickDownColor: "#f05b67",
      });
      seriesRef.current = series;
      resizeObserver = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (rect && chart) chart.applyOptions({ width: Math.max(320, Math.floor(rect.width)), height: Math.max(190, Math.floor(rect.height)) });
      });
      resizeObserver.observe(host);

      try {
        const response = await fetch(`/api/market/chart?symbol=${encodeURIComponent(symbol)}&period=${period}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Chart history unavailable");
        const payload = await response.json();
        if (!alive) return;
        const candles = (payload.candles || []).map((c: CandlePayload) => ({
          time: Math.floor(c.time / 1000) as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close,
        })) as CandlestickData<UTCTimestamp>[];
        if (!candles.length) throw new Error("No candles returned");
        series.setData(candles);
        chart.timeScale().fitContent();
        onStatus("delayed");
        const latest = candles[candles.length - 1];
        onDetails({ latest: latest.close, low: Math.min(...candles.map(c => c.low)), high: Math.max(...candles.map(c => c.high)), updatedAt: payload.updatedAt || new Date().toISOString() });
        setMessage("");
      } catch {
        if (!alive) return;
        onStatus("error");
        setMessage("Chart history unavailable. Please try again shortly.");
        return;
      }

      if (symbol.endsWith("/USDT")) {
        const pair = symbol.replace("/", "");
        const interval = period === "1D" ? "1" : period === "1W" ? "15" : period === "1M" ? "60" : "D";
        socket = new WebSocket("wss://stream.bybit.com/v5/public/spot");
        socket.onopen = () => {
          socket?.send(JSON.stringify({ op: "subscribe", args: [`kline.${interval}.${pair}`] }));
          const ping = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: "ping" }));
          }, 20000);
          socket?.addEventListener("close", () => window.clearInterval(ping), { once: true });
        };
        socket.onmessage = (event) => {
          if (!alive || !seriesRef.current) return;
          try {
            const packet = JSON.parse(event.data);
            if (packet.op === "ping") return;
            const row = Array.isArray(packet.data) ? packet.data[0] : null;
            if (!row || !String(packet.topic || "").startsWith("kline.")) return;
            const startMs = Number(row.start);
            const time = Math.floor(startMs / 1000) as UTCTimestamp;
            const candle = { time, open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close) };
            if (!Number.isFinite(time) || ![candle.open,candle.high,candle.low,candle.close].every(v => Number.isFinite(v) && v > 0)) return;
            try { seriesRef.current.update(candle); } catch { return; }
            liveCandle = { ...candle, high: Math.max(candle.high, liveCandle?.high ?? candle.high), low: Math.min(candle.low, liveCandle?.low ?? candle.low) };
            onStatus("live");
            onDetails({ latest: candle.close, low: liveCandle.low, high: liveCandle.high, updatedAt: new Date(startMs).toISOString() });
            setMessage("");
          } catch { /* Ignore malformed exchange messages. */ }
        };
        socket.onerror = () => { if (alive) onStatus("delayed"); };
        socket.onclose = () => { if (alive) onStatus("delayed"); };
      } else {
        onStatus("delayed");
      }
    };

    void start();
    return () => {
      alive = false;
      socket?.close();
      resizeObserver?.disconnect();
      chart?.remove();
      seriesRef.current = null;
    };
  }, [symbol, period, onStatus, onDetails]);

  return <div className="candlestick-chart-wrap">
    <div ref={hostRef} className="candlestick-chart" />
    {message ? <div className="chart-overlay-message">{message}</div> : null}
    <div className="chart-live-caption">Drag to pan · Pinch or scroll to zoom · Crosshair shows candle values</div>
  </div>;
}
