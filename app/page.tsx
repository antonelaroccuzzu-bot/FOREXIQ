"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, BrainCircuit, ChevronDown, CircleHelp, Clock3, Gauge, LayoutDashboard, LineChart, Menu, Search, ShieldCheck, SlidersHorizontal, Sparkles, WalletCards, X } from "lucide-react";

const watchlist = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", price: "1.08432", change: "+0.24%", up: true, tag: "FOREX" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", price: "1.26781", change: "-0.18%", up: false, tag: "FOREX" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", price: "149.482", change: "+0.41%", up: true, tag: "FOREX" },
  { symbol: "BTC/USD", name: "Bitcoin / US Dollar", price: "67,420.50", change: "+1.32%", up: true, tag: "CRYPTO" },
  { symbol: "ETH/USD", name: "Ethereum / US Dollar", price: "3,521.80", change: "-0.62%", up: false, tag: "CRYPTO" },
];
const nav = [{ label: "Overview", icon: LayoutDashboard }, { label: "Markets", icon: LineChart }, { label: "AI Research", icon: BrainCircuit }, { label: "Risk Center", icon: ShieldCheck }, { label: "Portfolio", icon: WalletCards }];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("1D");
  const [notice, setNotice] = useState("");
  const [liveCrypto, setLiveCrypto] = useState<Record<string, { price: string; change: string; up: boolean }>>({});
  const [feedStatus, setFeedStatus] = useState<"connecting" | "live" | "offline">("connecting");
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      try {
        const response = await fetch("/api/market/crypto", { cache: "no-store" });
        if (!response.ok) throw new Error("Market feed unavailable");
        const data = await response.json();
        if (!active) return;
        const next: typeof liveCrypto = {};
        for (const item of data.prices ?? []) {
          next[item.symbol] = { price: item.price, change: item.change, up: item.up };
        }
        setLiveCrypto(next);
        setFeedStatus("live");
      } catch {
        if (active) setFeedStatus("offline");
      }
    };
    load();
    timer = setInterval(load, 15000);
    return () => { active = false; if (timer) clearInterval(timer); };
  }, []);
  const currentWatchlist = watchlist.map((item) => liveCrypto[item.symbol] ? { ...item, ...liveCrypto[item.symbol] } : item);
  const filtered = currentWatchlist.filter((item) => `${item.symbol} ${item.name}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark">F</div><div><strong>FOREX<span>IQ</span></strong><small>INTELLIGENCE TERMINAL</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(({label,icon:Icon}) => <button key={label} className={`nav-item ${active===label?"nav-active":""}`} onClick={() => {setActive(label);setMobileOpen(false);}}><Icon size={18}/><span>{label}</span>{label==="AI Research"&&<i className="new-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Sharper decisions start here.</strong><p>AI tools and market context in one workspace.</p><button onClick={() => setNotice("Subscription plans will appear when billing is connected.")}>Explore plans <ArrowUpRight size={14}/></button></div><button className="nav-item"><CircleHelp size={18}/><span>Help & support</span></button><div className="profile"><div className="avatar">V</div><div><strong>Trader account</strong><small>Free workspace</small></div><ChevronDown size={16}/></div></div>
    </aside>
    {mobileOpen&&<button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
    <section className="main-area">
      <header className="topbar"><div className="top-left"><button className="menu-button" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu size={20}/></button><span className="breadcrumb">Workspace</span><span className="crumb-sep">/</span><strong>{active}</strong></div><div className="top-actions"><div className={`status ${feedStatus === "live" ? "status-live" : ""}`}><span/> {feedStatus === "live" ? "CRYPTO FEED LIVE" : feedStatus === "offline" ? "MARKET FEED OFFLINE" : "CONNECTING MARKET FEED"}</div><button className="icon-button" aria-label="Notifications" onClick={()=>setNotice("You are all caught up.")}><Bell size={18}/></button><div className="avatar small-avatar">V</div></div></header>
      <div className="content"><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> MARKET INTELLIGENCE, MADE CLEAR</div><h1>{active==="Overview"?"Good trading starts with clarity.":active}</h1><p className="subheading">Your market workspace for research, context and risk-aware decisions.</p></div><button className="date-button"><Clock3 size={15}/> Market snapshot <ChevronDown size={15}/></button></div>
      <div className="preview-banner"><div className="preview-symbol"><Activity size={18}/></div><div><strong>Market data status</strong><p>Crypto quotes update from the market feed every 15 seconds. Forex values and the EUR/USD chart remain illustrative until a forex data provider is connected. Trading and deposits are not enabled.</p></div><span className="preview-pill">{feedStatus === "live" ? "CRYPTO LIVE · FOREX DEMO" : "FEED STATUS"}</span></div>
      <div className="section-heading"><div><h2>Market overview</h2><p>Illustrative snapshot across key instruments</p></div><button className="text-button" onClick={()=>setActive("Markets")}>View markets <ArrowUpRight size={15}/></button></div>
      <div className="stat-grid"><article className="stat-card"><div className="stat-top"><span>Watchlist instruments</span><LineChart size={17}/></div><div className="stat-value">05 <small>assets</small></div><div className="stat-foot"><span className="neutral-dot"/> Curated starter watchlist</div></article><article className="stat-card"><div className="stat-top"><span>Market volatility</span><Gauge size={17}/></div><div className="stat-value">Moderate</div><div className="stat-foot"><span className="green-dot"/> Illustrative risk context</div></article><article className="stat-card"><div className="stat-top"><span>AI research status</span><BrainCircuit size={17}/></div><div className="stat-value">Not connected</div><div className="stat-foot"><span className="neutral-dot"/> Provider setup required</div></article></div>
      <div className="dashboard-grid"><section className="panel market-panel"><div className="panel-head"><div><h3>Watchlist</h3><p>Forex and digital assets</p></div><button className="filter-button" onClick={()=>setQuery(query?"":"BTC")}><SlidersHorizontal size={15}/> {query?"Clear":"Quick filter"}</button></div><div className="search-wrap"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search instruments..."/></div><div className="market-table"><div className="table-head"><span>INSTRUMENT</span><span>PRICE</span><span>24H MOVE</span></div>{filtered.map(item=><div className="market-row" key={item.symbol}><div className="instrument"><div className="coin-icon">{item.symbol.slice(0,1)}</div><div><strong>{item.symbol}</strong><small>{item.name}</small></div></div><strong className="price">{item.price}</strong><span className={`change ${item.up?"positive":"negative"}`}>{item.up?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {item.change}</span></div>)}{filtered.length===0&&<div className="empty-state">No instruments match that search.</div>}</div><div className="panel-foot">Crypto: live public market quotes <span>·</span> Forex: illustrative values <span>·</span> No order execution</div></section>
      <section className="panel chart-panel"><div className="panel-head"><div><h3>EUR/USD</h3><p>Illustrative price movement</p></div><span className="chart-price">1.08432 <i>+0.24%</i></span></div><div className="chart-legend"><span><i/> DEMO PRICE</span><div className="periods">{["1H","1D","1W","1M"].map(p=><button key={p} className={period===p?"period-active":""} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div><div className="chart-area"><div className="chart-grid"><span>1.0900</span><span>1.0875</span><span>1.0850</span><span>1.0825</span><span>1.0800</span></div><svg viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="Illustrative EUR USD line chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#24d6a0" stopOpacity=".22"/><stop offset="100%" stopColor="#24d6a0" stopOpacity="0"/></linearGradient></defs><path d="M0 156 C20 145 24 160 42 145 S72 128 90 139 S120 116 138 127 S165 150 184 121 S215 112 230 120 S258 88 277 105 S304 119 322 91 S350 100 367 82 S395 104 412 86 S442 65 460 79 S490 60 506 70 S535 40 552 55 S580 34 600 42 L600 220 L0 220Z" fill="url(#area)"/><path d="M0 156 C20 145 24 160 42 145 S72 128 90 139 S120 116 138 127 S165 150 184 121 S215 112 230 120 S258 88 277 105 S304 119 322 91 S350 100 367 82 S395 104 412 86 S442 65 460 79 S490 60 506 70 S535 40 552 55 S580 34 600 42" fill="none" stroke="#24d6a0" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/><circle cx="600" cy="42" r="4.5" fill="#24d6a0"/></svg></div><div className="chart-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span></div><div className="chart-note"><Activity size={14}/> Demo chart illustration · {period} view</div></section></div>
      <div className="bottom-grid"><section className="panel insight-panel"><div className="panel-head"><div className="title-with-icon"><div className="ai-icon"><BrainCircuit size={17}/></div><div><h3>AI market brief</h3><p>Research assistant preview</p></div></div><span className="coming-soon">NOT CONNECTED</span></div><p className="insight-copy">Connect a supported AI provider to generate instrument summaries, explain market drivers and review potential risks. No trade signal is being issued in this preview.</p><button className="outline-button" onClick={()=>setNotice("AI analysis is not connected yet. Add a server-side AI provider key before enabling this feature.")}>Configure AI research <ArrowUpRight size={15}/></button></section><section className="panel security-panel"><div className="panel-head"><div><h3>Security & readiness</h3><p>Platform implementation checklist</p></div><ShieldCheck size={19}/></div><div className="check-row"><span className="check-pending"/> Authentication <small>Not configured</small></div><div className="check-row"><span className="check-pending"/> Market data feed <small>Not connected</small></div><div className="check-row"><span className="check-pending"/> Order execution <small>Disabled</small></div><div className="check-row"><span className="check-pending"/> Risk controls <small>In development</small></div></section></div>
      <footer><span>© 2026 FOREXIQ</span><span>Trade Smarter. See Further.</span><span>Trading involves risk. AI insights are not financial advice.</span></footer>
      {notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}
      </div>
    </section>
  </main>;
}
