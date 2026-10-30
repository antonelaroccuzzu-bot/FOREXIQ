"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, RotateCcw } from "lucide-react";

type Quote = { symbol: string; price: string; status: string };
type Trade = { id: number; side: "BUY" | "SELL"; symbol: string; quantity: number; price: number; time: string };
const STARTING_CASH = 10000;
const STORAGE_KEY = "forexiq-demo-account-v1";
const priceOf = (value: string) => Number(value.replace(/,/g, ""));
const money = (value: number) => "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DemoTrading({ quotes }: { quotes: Quote[] }) {
  const tradable = quotes.filter(q => Number.isFinite(priceOf(q.price)) && priceOf(q.price) > 0);
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [amount, setAmount] = useState("100");
  const [cash, setCash] = useState(STARTING_CASH);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [notice, setNotice] = useState("Your demo account starts with $10,000 in virtual funds.");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Number.isFinite(saved.cash) && saved.holdings && Array.isArray(saved.trades)) {
          setCash(saved.cash); setHoldings(saved.holdings); setTrades(saved.trades);
        }
      }
    } catch { /* Start with a fresh demo account if saved data is invalid. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ cash, holdings, trades }));
  }, [cash, holdings, trades, loaded]);

  const selected = tradable.find(q => q.symbol === symbol) || tradable[0];
  const price = selected ? priceOf(selected.price) : 0;
  const value = useMemo(() => Object.entries(holdings).reduce((sum, [key, quantity]) => {
    const quote = tradable.find(q => q.symbol === key);
    return sum + quantity * (quote ? priceOf(quote.price) : 0);
  }, 0), [holdings, tradable]);
  const equity = cash + value;
  const pnl = equity - STARTING_CASH;

  function execute(side: "BUY" | "SELL") {
    const notional = Number(amount);
    if (!selected || !price || !Number.isFinite(notional) || notional <= 0) { setNotice("Enter a valid order amount and select an available instrument."); return; }
    const quantity = notional / price;
    if (side === "BUY" && notional > cash) { setNotice("Insufficient virtual cash for this demo buy."); return; }
    if (side === "SELL" && quantity > (holdings[selected.symbol] || 0)) { setNotice("You do not hold enough of this instrument to sell that amount."); return; }
    setCash(current => current + (side === "BUY" ? -notional : notional));
    setHoldings(current => ({ ...current, [selected.symbol]: Math.max(0, (current[selected.symbol] || 0) + (side === "BUY" ? quantity : -quantity)) }));
    setTrades(current => [{ id: Date.now(), side, symbol: selected.symbol, quantity, price, time: new Date().toLocaleString() }, ...current].slice(0, 12));
    setNotice(side + " filled in demo mode at " + money(price) + ". No real order was sent.");
  }

  function reset() {
    setCash(STARTING_CASH); setHoldings({}); setTrades([]);
    setNotice("Demo account reset. Your virtual balance is $10,000.");
  }

  return <section className="panel demo-panel">
    <div className="panel-head"><div><h3>Demo Trading</h3><p>Practise with virtual funds · No broker connection</p></div><span className="demo-pill">PAPER MODE</span></div>
    <div className="demo-balance-grid">
      <div><span>VIRTUAL EQUITY</span><strong>{money(equity)}</strong></div>
      <div><span>AVAILABLE CASH</span><strong>{money(cash)}</strong></div>
      <div><span>UNREALISED P&amp;L</span><strong className={pnl >= 0 ? "positive" : "negative"}>{pnl >= 0 ? "+" : ""}{money(pnl)}</strong></div>
    </div>
    <div className="demo-order">
      <label>Instrument<select value={selected?.symbol || symbol} onChange={e => setSymbol(e.target.value)}>{tradable.map(q => <option key={q.symbol} value={q.symbol}>{q.symbol}</option>)}</select></label>
      <label>Order value (USD)<input inputMode="decimal" type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)}/></label>
      <div className="demo-current-price"><span>REFERENCE PRICE</span><strong>{price ? money(price) : "Unavailable"}</strong></div>
      <div className="demo-actions"><button className="demo-buy" onClick={() => execute("BUY")} disabled={!price}><ArrowUpRight size={15}/> Buy</button><button className="demo-sell" onClick={() => execute("SELL")} disabled={!price}><ArrowDownRight size={15}/> Sell</button></div>
    </div>
    <p className="demo-notice" role="status">{notice}</p>
    <div className="demo-holdings"><div className="demo-subhead"><strong>Positions</strong><span>{Object.values(holdings).filter(q => q > 0).length} open</span></div>
      {Object.entries(holdings).filter(([, quantity]) => quantity > 0).map(([key, quantity]) => <div className="demo-position" key={key}><span>{key}</span><strong>{quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })}</strong><span>{money(quantity * (priceOf(tradable.find(q => q.symbol === key)?.price || "0")))}</span></div>)}
      {!Object.values(holdings).some(q => q > 0) ? <p className="demo-empty">No open demo positions yet.</p> : null}
    </div>
    <div className="demo-subhead demo-trade-head"><strong>Recent demo orders</strong><button onClick={reset}><RotateCcw size={12}/> Reset account</button></div>
    {trades.length ? trades.slice(0, 5).map(trade => <div className="demo-trade" key={trade.id}><span className={trade.side === "BUY" ? "positive" : "negative"}>{trade.side}</span><strong>{trade.symbol}</strong><span>{trade.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })}</span><span>{money(trade.price)}</span></div>) : <p className="demo-empty">Your demo orders will appear here.</p>}
    <div className="demo-disclaimer">Simulation only. Uses the dashboard quote available at order time; reference prices may not match executable market prices. Virtual funds have no cash value.</div>
  </section>;
}
