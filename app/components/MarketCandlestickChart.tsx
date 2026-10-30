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

      socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/market/stream?symbol=${encodeURIComponent(symbol)}`);
      socket.onmessage = (event) => {
        if (!alive || !seriesRef.current) return;
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "error") { setMessage(packet.message || "Live feed unavailable."); return; }
          if (packet.type !== "tick") return;
          const price = Number(packet.price);
          const tickSeconds = Number(packet.time);
          if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(tickSeconds)) return;
          const bucket = Math.floor(tickSeconds / intervals[period]) * intervals[period];
          const time = bucket as UTCTimestamp;
          if (!liveCandle || liveCandle.time !== time) {
            liveCandle = { time, open: price, high: price, low: price, close: price };
          } else {
            liveCandle = { ...liveCandle, high: Math.max(liveCandle.high, price), low: Math.min(liveCandle.low, price), close: price };
          }
          seriesRef.current.update(liveCandle);
          onStatus("live");
          onDetails({ latest: price, low: liveCandle.low, high: liveCandle.high, updatedAt: new Date(tickSeconds * 1000).toISOString() });
          setMessage("");
        } catch { /* Ignore malformed frames. */ }
      };
      socket.onerror = () => { if (alive) onStatus("delayed"); };
      socket.onclose = () => { if (alive) onStatus("delayed"); };
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
