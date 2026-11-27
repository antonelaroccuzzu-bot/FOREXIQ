"use client";

import { useMemo, useState } from "react";
import { Copy, ShieldCheck, Wallet, ArrowUpRight, ChevronDown, Menu, X, CheckCircle2, Clock3, Info } from "lucide-react";
import { DEPOSIT_ASSETS } from "@/lib/deposit-assets";

export default function Home() {
  const [assetId, setAssetId] = useState(DEPOSIT_ASSETS[0].id);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [duration, setDuration] = useState("30");
  const selected = useMemo(() => DEPOSIT_ASSETS.find((asset) => asset.id === assetId) ?? DEPOSIT_ASSETS[0], [assetId]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(selected.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className={mobileOpen ? "sidebar open" : "sidebar"}>
        <a className="brand" href="#"><span className="brand-symbol">0</span><span>0KX</span></a>
        <div className="side-label">MENU</div>
        <nav className="side-nav">
          <a className="nav-link active" href="#overview"><span>▦</span> Overview</a>
          <a className="nav-link" href="#invest"><span>◈</span> Investment</a>
          <a className="nav-link" href="#deposit"><span>⇧</span> Deposit</a>
          <a className="nav-link" href="#activity"><span>◷</span> Activity</a>
        </nav>
        <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={17}/><strong>Security first</strong><p>Always confirm the asset and network before sending crypto.</p></div><span className="version">0KX · DIGITAL ASSET INVESTMENTS</span></div>
        <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19}/></button>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="top-right"><span className="secure-status"><i/> SECURE WORKSPACE</span><div className="user-avatar">U</div></div>
        </header>

        <div className="page-content" id="overview">
          <div className="welcome">
            <div><div className="eyebrow">DIGITAL ASSET INVESTMENT PLATFORM</div><h1>Welcome to <span>0KX.</span></h1><p>Manage your crypto investment activity from one place.</p></div>
            <div className="account-chip"><span className="account-dot"/> Account preview <ChevronDown size={14}/></div>
          </div>

          <section className="notice-banner"><Info size={18}/><div><strong>Platform preview</strong><p>Account balances, investment execution, withdrawals and admin verification are not connected yet. Do not send funds until your deposit process has been tested and the platform is authorised to accept investments.</p></div></section>

          <div className="section-title"><div><h2>Get started</h2><p>Choose an investment duration or prepare a crypto deposit.</p></div></div>
          <div className="quick-grid">
            <a className="quick-card" href="#invest"><span className="quick-icon"><ArrowUpRight size={18}/></span><span><strong>Explore investment</strong><small>Choose a flexible investment period</small></span><b>→</b></a>
            <a className="quick-card" href="#deposit"><span className="quick-icon"><Wallet size={18}/></span><span><strong>Make a deposit</strong><small>View supported assets and networks</small></span><b>→</b></a>
          </div>

          <section className="panel" id="invest">
            <div className="panel-heading"><div><h2>Investment duration</h2><p>Select how long you would like an investment to run.</p></div><span className="tag">FLEXIBLE TERM</span></div>
            <div className="duration-options">
              {["7","14","30","60","90","custom"].map((d) => <button key={d} className={duration===d?"duration-option chosen":"duration-option"} onClick={() => setDuration(d)}>{d==="custom"?"Custom":d+" days"}</button>)}
            </div>
            {duration==="custom" && <div className="custom-duration"><label htmlFor="custom-duration">Custom duration (days)</label><input id="custom-duration" type="number" min="1" max="3650" placeholder="Enter number of days"/></div>}
            <p className="fine-print">Choosing a duration here does not start an investment or guarantee a return. Investment terms, performance calculation and withdrawals must be configured before launch.</p>
          </section>

          <section className="panel deposit-panel" id="deposit">
            <div className="panel-heading"><div><h2>Crypto deposit</h2><p>Initial supported deposit routes configured for 0KX.</p></div><span className="tag">4 DEPOSIT ROUTES</span></div>
            <div className="deposit-layout">
              <div className="deposit-form">
                <label htmlFor="asset">Select asset and network</label>
                <select id="asset" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                  {DEPOSIT_ASSETS.map((asset) => <option value={asset.id} key={asset.id}>{asset.symbol} · {asset.network}</option>)}
                </select>
                <div className="field-label">Deposit address</div>
                <div className="address-box"><code>{selected.address}</code><button onClick={copyAddress} aria-label="Copy deposit address"><Copy size={16}/></button></div>
                <div className="copy-feedback">{copied ? <><CheckCircle2 size={13}/> Address copied</> : "Copy the address exactly as shown."}</div>
                <div className="network-warning"><Info size={16}/><span><strong>{selected.network}</strong><br/>{selected.warning}</span></div>
                <label htmlFor="amount">Amount sent ({selected.symbol})</label>
                <input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}/>
                <label htmlFor="txhash">Transaction hash / TXID</label>
                <input id="txhash" placeholder="Paste your transaction ID" value={txHash} onChange={(e) => setTxHash(e.target.value)}/>
                <button className="submit-button" disabled>Deposit verification will be enabled after secure account setup</button>
                <p className="fine-print">This is a display preview only. No deposit request is submitted or saved, and no account balance is credited from this page.</p>
              </div>
              <div className="deposit-side">
                <div className="qr-placeholder"><Wallet size={28}/><span>QR code will appear here</span></div>
                <h3>Before you transfer</h3>
                <ul><li>Match the selected asset and network.</li><li>Never send a different coin to this address.</li><li>Wait for the required blockchain confirmations.</li><li>Keep your transaction hash for verification.</li></ul>
                <div className="pending-note"><Clock3 size={16}/><span>Deposits will require blockchain verification and admin approval before principal is credited.</span></div>
              </div>
            </div>
          </section>

          <section className="panel activity-panel" id="activity">
            <div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest account transactions will appear here.</p></div></div>
            <div className="empty-activity"><Clock3 size={22}/><strong>No activity yet</strong><span>Deposit and investment records will appear after secure account and transaction services are connected.</span></div>
          </section>
          <footer><span>© 2026 0KX</span><span>Digital asset investments involve risk. Capital is not guaranteed.</span></footer>
        </div>
      </section>
    </main>
  );
}
