"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, BrainCircuit, ChevronDown, CircleHelp, LayoutDashboard, LineChart, Menu, Search, ShieldCheck, Sparkles, WalletCards, X } from "lucide-react";

type Group = "FOREX" | "METALS" | "ENERGY" | "INDICES" | "CRYPTO";
type Quote = { symbol: string; name: string; group: Group; price: string; change: string | null; up: boolean | null; currency: string; status: "live" | "unavailable"; updatedAt: string | null };
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
  useEffect(() => {
    let activeRequest = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      try {
        const response = await fetch("/api/market/overview", { cache: "no-store" });
        if (!response.ok) throw new Error("Market feed unavailable");
        const data = await response.json();
        if (!activeRequest) return;
        setQuotes(data.quotes ?? []);
        setUpdatedAt(data.updatedAt ?? "");
        setFeedStatus(data.liveCount === data.totalCount ? "live" : data.liveCount > 0 ? "partial" : "offline");
      } catch { if (activeRequest) setFeedStatus("offline"); }
    };
    load();
    timer = setInterval(load, 30000);
    return () => { activeRequest = false; if (timer) clearInterval(timer); };
  }, []);
  const filtered = useMemo(() => quotes.filter((item) =>
    (category === "ALL" || item.group === category) &&
    (item.symbol + " " + item.name).toLowerCase().includes(query.toLowerCase())
  ), [quotes, category, query]);
  const liveCount = quotes.filter((q) => q.status === "live").length;
  const statusLabel = feedStatus === "live" ? "ALL MARKETS LIVE" : feedStatus === "partial" ? "PARTIAL MARKET FEED" : feedStatus === "offline" ? "MARKET FEED OFFLINE" : "CONNECTING MARKET FEED";
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
        <div className="preview-banner"><div className="preview-symbol"><Activity size={18}/></div><div><strong>Market data connection</strong><p>Quotes refresh every 30 seconds. Availability and update frequency vary by market and source. Some feeds may be delayed; unavailable quotes are shown as such. Trading is not enabled.</p></div><span className="preview-pill">{liveCount} / {quotes.length || 23} LIVE</span></div>
        <div className="section-heading"><div><h2>Global markets</h2><p>Live quote availability across asset classes</p></div><span className="market-count">{liveCount} live instruments</span></div>
        <div className="stat-grid"><article className="stat-card"><div className="stat-top"><span>Live instruments</span><Activity size={17}/></div><div className="stat-value">{String(liveCount).padStart(2,"0")} <small>/ {quotes.length || 23} tracked</small></div><div className="stat-foot"><span className="green-dot"/> Live quotes currently available</div></article><article className="stat-card"><div className="stat-top"><span>Asset classes</span><LineChart size={17}/></div><div className="stat-value">05 <small>markets</small></div><div className="stat-foot"><span className="neutral-dot"/> FX · metals · energy · indices · crypto</div></article><article className="stat-card"><div className="stat-top"><span>AI research</span><BrainCircuit size={17}/></div><div className="stat-value">Setup pending</div><div className="stat-foot"><span className="neutral-dot"/> AI provider not connected</div></article></div>
        <section className="panel market-panel full-market-panel">
          <div className="panel-head"><div><h3>Market watch</h3><p>Search and filter instruments across global markets</p></div><span className="feed-refresh">{updatedAt ? "Updated " + new Date(updatedAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "Awaiting first quote"}</span></div>
          <div className="market-controls"><div className="search-wrap"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search gold, EUR/USD, Bitcoin..."/></div><div className="market-tabs">{categories.map((item)=><button key={item} className={category===item?"market-tab-active":""} onClick={()=>setCategory(item)}>{item}</button>)}</div></div>
          <div className="market-table"><div className="table-head market-table-head"><span>INSTRUMENT</span><span>MARKET</span><span>LAST PRICE</span><span>24H CHANGE</span><span>STATUS</span></div>
            {filtered.map(item=><div className="market-row market-row-wide" key={item.symbol}><div className="instrument"><div className="coin-icon">{item.group==="METALS"?"Au":item.group==="ENERGY"?"O":item.group==="INDICES"?"#":item.group==="CRYPTO"?"₿":item.symbol.slice(0,1)}</div><div><strong>{item.symbol}</strong><small>{item.name}</small></div></div><span className="market-type">{item.group}</span><strong className="price">{item.price}{item.status==="live"&&item.currency!=="—"?<small> {item.currency}</small>:null}</strong><span className={"change " + (item.up===null?"neutral-change":item.up?"positive":"negative")}>{item.change===null?"—":<>{item.up?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {item.change}</>}</span><span className={"quote-status " + item.status}>{item.status==="live"?"LIVE":"UNAVAILABLE"}</span></div>)}
            {filtered.length===0&&<div className="empty-state">No instruments match that search.</div>}
          </div>
          <div className="panel-foot">Prices are indicative market quotes, not executable bid/ask prices. Crypto pairs are quoted in USDT. Gold and silver use futures-market proxies, not a broker's spot CFD price.</div>
        </section>
        <div className="bottom-grid"><section className="panel insight-panel"><div className="panel-head"><div className="title-with-icon"><div className="ai-icon"><BrainCircuit size={17}/></div><div><h3>FOREXIQ Trading Director</h3><p>AI market research assistant</p></div></div><span className="coming-soon">SETUP PENDING</span></div><p className="insight-copy">The Trading Director will summarize market conditions, explain price movements, compare instruments and help assess risk. AI analysis is not connected yet and no trade signals are being issued.</p><button className="outline-button" onClick={()=>setNotice("AI analysis requires a server-side provider key and backend integration.")}>Configure AI research <ArrowUpRight size={15}/></button></section><section className="panel security-panel"><div className="panel-head"><div><h3>Trading readiness</h3><p>Live execution remains disabled</p></div><ShieldCheck size={19}/></div><div className="check-row"><span className="check-pending"/> User accounts <small>Not configured</small></div><div className="check-row"><span className="check-pending"/> Broker / exchange connection <small>Not configured</small></div><div className="check-row"><span className="check-pending"/> Order execution <small>Disabled</small></div><div className="check-row"><span className="check-pending"/> Risk limits & audit logs <small>Required</small></div></section></div>
        <footer><span>© 2026 FOREXIQ</span><span>Trade Smarter. See Further.</span><span>Trading involves risk. Quotes may be delayed. AI insights are not financial advice.</span></footer>
        {notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}
      </div>
    </section>
  </main>;
}
