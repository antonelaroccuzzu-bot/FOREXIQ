"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Bell, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Copy, History, LayoutDashboard, Menu, Search, ShieldCheck, Wallet, X } from "lucide-react";
import { DEPOSIT_ASSETS } from "@/lib/deposit-assets";

const coinMeta: Record<string, { color: string; mark: string; description: string }> = {
  BTC: { color: "#f7931a", mark: "₿", description: "Bitcoin" },
  USDT: { color: "#26a17b", mark: "₮", description: "Tether" },
  ETH: { color: "#7c83db", mark: "◆", description: "Ethereum" },
};

export default function Home() {
  const [assetId, setAssetId] = useState(DEPOSIT_ASSETS[0].id);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState("30");
  const [customDays, setCustomDays] = useState("");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState("deposit");
  const selected = useMemo(() => DEPOSIT_ASSETS.find((a) => a.id === assetId) ?? DEPOSIT_ASSETS[0], [assetId]);
  const filteredAssets = DEPOSIT_ASSETS.filter((a) => (a.symbol + " " + a.name + " " + a.network).toLowerCase().includes(search.toLowerCase()));
  const meta = coinMeta[selected.symbol] ?? { color: "#777", mark: selected.symbol.slice(0, 1), description: selected.name };

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(selected.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }

  return (
    <main className="okx-shell">
      <aside className={menuOpen ? "sidebar sidebar-open" : "sidebar"}>
        <a className="brand" href="#"><span className="brand-mark">0</span><span>0KX</span></a>
        <div className="nav-caption">MENU</div>
        <nav className="side-nav">
          <a href="#overview" className="side-link active"><LayoutDashboard size={18}/> Overview</a>
          <a href="#investment" className="side-link"><ArrowUpRight size={18}/> Investments</a>
          <a href="#deposit" className="side-link"><ArrowDownToLine size={18}/> Deposit</a>
          <a href="#activity" className="side-link"><History size={18}/> Transaction history</a>
        </nav>
        <div className="sidebar-foot"><div className="security-card"><ShieldCheck size={19}/><strong>Security reminder</strong><p>Always check the coin and network before making a transfer.</p></div><span>0KX DIGITAL ASSET PLATFORM</span></div>
        <button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20}/></button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22}/></button>
          <a className="mobile-brand" href="#">0KX</a>
          <div className="top-nav"><a href="#overview">Dashboard</a><a href="#investment">Invest</a><a href="#deposit" className="top-active">Deposit</a><a href="#activity">Assets</a></div>
          <div className="top-actions"><button aria-label="Help"><CircleHelp size={19}/></button><button aria-label="Notifications"><Bell size={19}/></button><div className="profile-avatar">U</div></div>
        </header>

        <div className="content" id="overview">
          <div className="page-heading"><div><div className="overline">YOUR INVESTMENT SPACE</div><h1>Welcome to 0KX</h1><p>Manage your digital assets and investment activity.</p></div><div className="account-state"><i/> Account preview <ChevronDown size={15}/></div></div>

          <div className="preview-alert"><ShieldCheck size={19}/><div><strong>Preview environment</strong><p>Deposits and account balances are not connected yet. Do not transfer funds until the deposit verification and account system have been fully tested.</p></div></div>

          <section className="quick-actions">
            <a href="#deposit" className="action-card"><span className="action-icon"><Wallet size={21}/></span><span><b>Make a deposit</b><small>View supported assets and networks</small></span><ChevronRight size={20}/></a>
            <a href="#investment" className="action-card"><span className="action-icon"><ArrowUpRight size={21}/></span><span><b>Explore investments</b><small>Choose an investment duration</small></span><ChevronRight size={20}/></a>
          </section>

          <section className="section-block" id="investment">
            <div className="section-heading"><div><h2>Investment duration</h2><p>Select how long you would like an investment to run.</p></div><span className="section-tag">FLEXIBLE TERM</span></div>
            <div className="duration-row">{["7","14","30","60","90","custom"].map((d) => <button key={d} className={duration === d ? "duration-pill selected" : "duration-pill"} onClick={() => setDuration(d)}>{d === "custom" ? "Custom" : d + " days"}</button>)}</div>
            {duration === "custom" && <div className="custom-days"><label htmlFor="customDays">Custom duration in days</label><input id="customDays" type="number" min="1" max="3650" placeholder="Enter number of days" value={customDays} onChange={(e) => setCustomDays(e.target.value)}/></div>}
            <p className="helper-text">Selecting a duration does not start an investment or guarantee a return. Investment terms and performance calculations must be configured before launch.</p>
          </section>

          <section className="section-block deposit-section" id="deposit">
            <div className="section-heading"><div><h2>Deposit crypto</h2><p>Choose a coin and its supported network to view deposit details.</p></div><span className="section-tag">{DEPOSIT_ASSETS.length} NETWORK ROUTES</span></div>
            <div className="deposit-tabs"><button className={tab === "deposit" ? "deposit-tab active-tab" : "deposit-tab"} onClick={() => setTab("deposit")}>On-chain deposit</button><button className="deposit-tab" disabled>Buy crypto <span>Coming soon</span></button></div>
            <div className="deposit-columns">
              <div className="coin-picker">
                <div className="picker-title">Select coin</div>
                <div className="coin-search"><Search size={18}/><input placeholder="Search coin or network" value={search} onChange={(e) => setSearch(e.target.value)}/></div>
                <div className="coin-list">
                  {filteredAssets.map((asset) => {
                    const m = coinMeta[asset.symbol] ?? { color: "#888", mark: asset.symbol.slice(0,1) };
                    return <button key={asset.id} className={asset.id === assetId ? "coin-row coin-selected" : "coin-row"} onClick={() => { setAssetId(asset.id); setCopied(false); }}>
                      <span className="coin-logo" style={{ background: m.color }}>{m.mark}</span><span className="coin-info"><b>{asset.symbol}</b><small>{asset.network}</small></span>{asset.id === assetId && <Check size={18} className="coin-check"/>}
                    </button>;
                  })}
                  {filteredAssets.length === 0 && <div className="no-results">No matching coin or network.</div>}
                </div>
              </div>

              <div className="deposit-details">
                <div className="selected-coin-heading"><span className="coin-logo large-logo" style={{ background: meta.color }}>{meta.mark}</span><div><h3>{selected.symbol} deposit</h3><p>{selected.name}</p></div></div>
                <div className="network-line"><span>Network</span><strong>{selected.network}</strong></div>
                <div className="address-label">Deposit address <span>Only send {selected.symbol} using this network</span></div>
                <div className="address-panel"><code>{selected.address}</code><button onClick={copyAddress} aria-label="Copy address">{copied ? <Check size={19}/> : <Copy size={19}/>}</button></div>
                <div className={copied ? "copy-status copied" : "copy-status"}>{copied ? "Address copied to clipboard" : "Copy the complete address exactly as shown."}</div>
                <div className="chain-warning"><span className="warning-icon">!</span><div><strong>Network warning</strong><p>{selected.warning} Sending assets through another network may result in permanent loss.</p></div></div>
                <div className="deposit-fields"><label htmlFor="amount">Amount sent ({selected.symbol})</label><input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}/><label htmlFor="txhash">Transaction ID / TXID</label><input id="txhash" placeholder="Enter transaction hash" value={txHash} onChange={(e) => setTxHash(e.target.value)}/><button className="verify-button" disabled>Submit for verification <ChevronRight size={18}/></button><p className="helper-text">Deposit submission will be enabled after secure account setup. No balance is credited from this preview.</p></div>
              </div>
            </div>
          </section>

          <section className="section-block activity-section" id="activity"><div className="section-heading"><div><h2>Recent activity</h2><p>Your latest deposits and investment records will appear here.</p></div><a href="#activity">View all <ChevronRight size={15}/></a></div><div className="empty-state"><History size={26}/><b>No transactions yet</b><span>Your activity will appear here when account services are connected.</span></div></section>
          <footer><span>© 2026 0KX</span><span>Digital asset investments involve risk. Capital is not guaranteed.</span></footer>
        </div>
      </div>
    </main>
  );
}
