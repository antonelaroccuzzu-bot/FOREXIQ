"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MarketCandlestickChart from "./components/MarketCandlestickChart";
import TradingDirector from "./components/TradingDirector";
import DemoTrading from "./components/DemoTrading";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, BrainCircuit, ChevronDown, CircleHelp, LayoutDashboard, LineChart, Menu, Search, ShieldCheck, Sparkles, WalletCards, X } from "lucide-react";

type Group = "FOREX" | "METALS" | "ENERGY" | "INDICES" | "CRYPTO";
type Quote = { symbol: string; name: string; group: Group; price: string; change: string | null; up: boolean | null; currency: string; status: "live" | "delayed" | "unavailable"; updatedAt: string | null };
const categories = ["ALL", "FOREX", "METALS", "ENERGY", "INDICES", "CRYPTO"] as const;
const nav = [{ label: "Overview", icon: LayoutDashboard }, { label: "Markets", icon: LineChart }, { label: "AI Research", icon: BrainCircuit }, { label: "Risk Center", icon: ShieldCheck }, { label: "Portfolio", icon: WalletCards }];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("ALL");
  const [notice, setNotice] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [feedStatus, setFeedStatus] = useState<"connecting" | "live" | "partial" | "offline">("connecting");
  const [updatedAt, setUpdatedAt] = useState("");
  const [aiStatus, setAiStatus] = useState<"checking" | "connected" | "unavailable">("checking");
  const [chartSymbol, setChartSymbol] = useState("BTC/USDT");
  const [chartPeriod, setChartPeriod] = useState<"1D" | "1W" | "1M" | "1Y">("1D");
  const [chartStatus, setChartStatus] = useState<"loading" | "live" | "delayed" | "error">("loading");
  const [chartDetails, setChartDetails] = useState({ latest: 0, low: 0, high: 0, updatedAt: "" });
  const chartPeriods = ["1D", "1W", "1M", "1Y"] as const;
  const handleChartStatus = useCallback((status: "loading" | "live" | "delayed" | "error") => setChartStatus(status), []);
  const handleChartDetails = useCallback((details: { latest: number; low: number; high: number; updatedAt: string }) => setChartDetails(details), []);
  useEffect(() => {
    let activeRequest = true;
    fetch("/api/ai/research", { cache: "no-store" }).then(async response => { const data = await response.json(); if (activeRequest) setAiStatus(response.ok && data.connected ? "connected" : "unavailable"); }).catch(() => { if (activeRequest) setAiStatus("unavailable"); });
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      try {
        const response = await fetch("/api/market/overview", { cache: "no-store" });
        if (!response.ok) throw new Error("Market feed unavailable");
        const data = await response.json();
        if (!activeRequest) return;
        setQuotes(data.quotes ?? []);
        setUpdatedAt(data.updatedAt ?? "");
        setFeedStatus(data.liveCount === data.totalCount ? "live" : data.availableCount > 0 ? "partial" : "offline");
      } catch { if (activeRequest) setFeedStatus("offline"); }
    };
    load();
    timer = setInterval(load, 30000);
    return () => { activeRequest = false; if (timer) clearInterval(timer); };
  }, []);
  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    const cryptoSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT"];
    const connect = () => {
      if (stopped) return;
      socket = new WebSocket("wss://stream.bybit.com/v5/public/spot");
      socket.onopen = () => {
        socket?.send(JSON.stringify({ op: "subscribe", args: cryptoSymbols.map(symbol => "tickers." + symbol) }));
        pingTimer = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: "ping" })); }, 20000);
      };
      socket.onmessage = event => {
        if (stopped) return;
        try {
          const packet = JSON.parse(event.data);
          const data = packet?.data;
          const pair = String(packet?.topic || "").replace("tickers.", "");
          const symbols: Record<string, string> = { BTCUSDT: "BTC/USDT", ETHUSDT: "ETH/USDT", SOLUSDT: "SOL/USDT", BNBUSDT: "BNB/USDT", XRPUSDT: "XRP/USDT", ADAUSDT: "ADA/USDT", DOGEUSDT: "DOGE/USDT" };
          const instrument = symbols[pair];
          const price = Number(data?.lastPrice);
          if (!instrument || !Number.isFinite(price) || price <= 0) return;
          const pct = Number(data?.price24hPcnt) * 100;
          setQuotes(current => current.map(q => q.symbol === instrument ? {
            ...q,
            price: price.toLocaleString("en-US", { maximumFractionDigits: 8 }),
            change: Number.isFinite(pct) ? (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%" : q.change,
            up: Number.isFinite(pct) ? pct >= 0 : q.up,
            currency: "USDT",
            updatedAt: new Date().toISOString(),
            status: "live",
          } : q));
        } catch { /* Ignore malformed public exchange messages. */ }
      };
      socket.onclose = () => {
        if (pingTimer) clearInterval(pingTimer);
        if (stopped) return;
        setQuotes(current => current.map(q => q.group === "CRYPTO" ? { ...q, status: "delayed" } : q));
        reconnectTimer = setTimeout(connect, 5000);
      };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      socket?.close();
    };
  }, []);
  const filtered = useMemo(() => quotes.filter((item) =>
    (category === "ALL" || item.group === category) &&
    (item.symbol + " " + item.name).toLowerCase().includes(query.toLowerCase())
  ), [quotes, category, query]);
  const receivedCount = quotes.filter((q) => q.status === "live" || q.status === "delayed").length;
  const liveCount = quotes.filter((q) => q.status === "live").length;
  const delayedCount = quotes.filter((q) => q.status === "delayed").length;
  const statusLabel = feedStatus === "live" ? "ALL FEEDS LIVE" : feedStatus === "partial" ? "MIXED MARKET DATA" : feedStatus === "offline" ? "MARKET FEED OFFLINE" : "CONNECTING MARKET FEED";
  return <main className="shell">
    <aside className={"sidebar " + (mobileOpen ? "sidebar-open" : "")}>
      <div className="brand"><div className="brand-mark">F</div><div><strong>FOREX<span>IQ</span></strong><small>INTELLIGENCE TERMINAL</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(({label,icon:Icon}) => <button key={label} className={"nav-item " + (active===label?"nav-active":"")} onClick={() => {setActive(label);setMobileOpen(false);}}><Icon size={18}/><span>{label}</span>{label==="AI Research"&&<i className="new-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Sharper decisions start here.</strong><p>AI tools and market context in one workspace.</p><button onClick={() => setNotice("AI plans and billing will be enabled after account and subscription setup.")}>Explore plans <ArrowUpRight size={14}/></button></div><button className="nav-item" onClick={() => setNotice("Support centre is being prepared.")}><CircleHelp size={18}/><span>Help & support</span></button><div className="profile"><div className="avatar">V</div><div><strong>Trader account</strong><small>Preview workspace</small></div><ChevronDown size={16}/></div></div>
    </aside>
    {mobileOpen&&<button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
    <section className="main-area">
      <header className="topbar"><div className="top-left"><button className="menu-button" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu size={20}/></button><span className="breadcrumb">Workspace</span><span className="crumb-sep">/</span><strong>{active}</strong></div><div className="top-actions"><div className={"status " + (feedStatus === "live" ? "status-live" : "")}><span/> {statusLabel}</div><button className="icon-button" aria-label="Notifications" onClick={()=>setNotice("You are all caught up.")}><Bell size={18}/></button><div className="avatar small-avatar">V</div></div></header>
      <div className="content">
        <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> GLOBAL MARKET INTELLIGENCE</div><h1>{active==="Overview"?"One terminal. Multiple markets.":active}</h1><p className="subheading">Monitor forex, precious metals, energy, global indices and digital assets.</p></div></div>
        <div className="preview-banner"><div className="preview-symbol"><Activity size={18}/></div><div><strong>Market data connection</strong><p>All market categories are requested together and the board refreshes every 30 seconds. LIVE means a verified streaming feed; REFERENCE means an indicative quote without a verified stream. Prices are not executable broker prices. Trading is not enabled.</p></div><span className="preview-pill">{receivedCount} / {quotes.length || 23} QUOTES RECEIVED</span></div>
        <section className="panel live-chart-panel">
          <div className="panel-head"><div><h3>Live market chart</h3><p>{chartSymbol} · live exchange stream where available</p></div><span className={"quote-status " + (chartStatus === "error" ? "unavailable" : chartStatus === "delayed" ? "reference" : "live")}>{chartStatus === "loading" ? "LOADING" : chartStatus === "error" ? "DATA UNAVAILABLE" : chartStatus === "live" ? "LIVE FEED" : "REFERENCE DATA"}</span></div>
          <div className="live-chart-controls"><select aria-label="Chart instrument" value={chartSymbol} onChange={e=>setChartSymbol(e.target.value)}>{quotes.map(q=><option key={q.symbol} value={q.symbol}>{q.symbol} — {q.name}</option>)}</select><div className="periods" aria-label="Chart timeframe">{chartPeriods.map(p=><button key={p} className={chartPeriod===p?"period-active":""} onClick={()=>setChartPeriod(p)}>{p}</button>)}</div></div>
          <div className="live-chart-summary"><strong>{chartDetails.latest ? chartDetails.latest.toLocaleString("en-US",{maximumFractionDigits: chartSymbol.includes("JPY")?3:5}) : "—"}</strong><span>{chartStatus==="live"?"Live exchange candle stream":chartStatus==="delayed"?"Historical reference candles":chartStatus==="error"?"Waiting for market data":"Connecting to market data…"}</span></div>
          <MarketCandlestickChart symbol={chartSymbol} period={chartPeriod} onStatus={handleChartStatus} onDetails={handleChartDetails}/>
          <div className="live-chart-footer"><span>LOW {chartDetails.low ? chartDetails.low.toLocaleString("en-US",{maximumFractionDigits:5}) : "—"}</span><span>{chartDetails.updatedAt ? "Updated "+new Date(chartDetails.updatedAt).toLocaleTimeString("en-US") : "Connecting…"}</span><span>HIGH {chartDetails.high ? chartDetails.high.toLocaleString("en-US",{maximumFractionDigits:5}) : "—"}</span></div><p className="chart-disclaimer">A chart is marked LIVE only after a verified streaming tick arrives. Historical candles are reference data. This chart does not execute trades.</p>
        </section>
        <div className="section-heading"><div><h2>Global markets</h2><p>Streaming and reference quotes across asset classes</p></div><span className="market-count">{receivedCount} quotes received</span></div>
        <div className="stat-grid"><article className="stat-card"><div className="stat-top"><span>Live feeds</span><Activity size={17}/></div><div className="stat-value">{String(liveCount).padStart(2,"0")} <small>/ {quotes.length || 23} instruments</small></div><div className="stat-foot"><span className="green-dot"/>{liveCount} live · {delayedCount} reference</div></article><article className="stat-card"><div className="stat-top"><span>Asset classes</span><LineChart size={17}/></div><div className="stat-value">05 <small>markets</small></div><div className="stat-foot"><span className="neutral-dot"/> FX · metals · energy · indices · crypto</div></article><article className="stat-card"><div className="stat-top"><span>AI research</span><BrainCircuit size={17}/></div><div className="stat-value">{aiStatus === "checking" ? "Checking…" : aiStatus === "connected" ? "Connected" : "Unavailable"}</div><div className="stat-foot"><span className={aiStatus === "connected" ? "green-dot" : "neutral-dot"}/>{aiStatus === "connected" ? "OpenRouter API verified" : aiStatus === "checking" ? "Checking provider access" : "Provider key or access needs attention"}</div></article></div>
        <DemoTrading quotes={quotes.map(({symbol,price,status})=>({symbol,price,status}))}/>
        <section className="panel market-panel full-market-panel">
          <div className="panel-head"><div><h3>Market watch</h3><p>Search and filter instruments across global markets</p></div><span className="feed-refresh">{updatedAt ? "Updated " + new Date(updatedAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "Awaiting first quote"}</span></div>
          <div className="market-controls"><div className="search-wrap"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search gold, EUR/USD, Bitcoin..."/></div><div className="market-tabs">{categories.map((item)=><button key={item} className={category===item?"market-tab-active":""} onClick={()=>setCategory(item)}>{item}</button>)}</div></div>
          <div className="market-table"><div className="table-head market-table-head"><span>INSTRUMENT</span><span>MARKET</span><span>LAST PRICE</span><span>24H CHANGE</span><span>STATUS</span></div>
            {filtered.map(item=><div className="market-row market-row-wide" key={item.symbol}><div className="instrument"><div className="coin-icon">{item.group==="METALS"?"Au":item.group==="ENERGY"?"O":item.group==="INDICES"?"#":item.group==="CRYPTO"?"₿":item.symbol.slice(0,1)}</div><div><strong>{item.symbol}</strong><small>{item.name}</small></div></div><span className="market-type">{item.group}</span><strong className="price">{item.price}{item.status==="live"&&item.currency!=="—"?<small> {item.currency}</small>:null}</strong><span className={"change " + (item.up===null?"neutral-change":item.up?"positive":"negative")}>{item.change===null?"—":<>{item.up?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {item.change}</>}</span><span className={"quote-status " + item.status}>{item.status==="live"?"LIVE":item.status==="delayed"?"REFERENCE":"UNAVAILABLE"}</span></div>)}
            {filtered.length===0&&<div className="empty-state">No instruments match that search.</div>}
          </div>
          <div className="panel-foot">Prices are indicative reference quotes, not executable bid/ask prices. FX, metals, energy and index prices are reference quotes unless marked LIVE; crypto pairs are quoted in USDT.</div>
        </section>
        <div className="bottom-grid"><TradingDirector quotes={quotes.map(({symbol,price,change,status})=>({symbol,price,change,status}))} aiStatus={aiStatus}/><section className="panel security-panel"><div className="panel-head"><div><h3>Trading readiness</h3><p>Live execution remains disabled</p></div><ShieldCheck size={19}/></div><div className="check-row"><span className="check-pending"/> User accounts <small>Not configured</small></div><div className="check-row"><span className="check-pending"/> Broker / exchange connection <small>Not configured</small></div><div className="check-row"><span className="check-pending"/> Order execution <small>Disabled</small></div><div className="check-row"><span className="check-pending"/> Risk limits & audit logs <small>Required</small></div></section></div>
        <footer><span>© 2026 FOREXIQ</span><span>Trade Smarter. See Further.</span><span>Trading involves risk. Some quotes are reference data. AI insights are not financial advice.</span></footer>
        {notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}
      </div>
    </section>
  </main>;
}
