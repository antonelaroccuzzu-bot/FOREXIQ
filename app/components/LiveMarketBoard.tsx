"use client";
import { useState } from "react";
import { Activity, ExternalLink } from "lucide-react";
const markets=[
 {id:"BTC",name:"Bitcoin",symbol:"BINANCE:BTCUSDT",pair:"BTC / USDT",color:"#f7931a"},
 {id:"SOL",name:"Solana",symbol:"BINANCE:SOLUSDT",pair:"SOL / USDT",color:"#8b72ed"},
 {id:"ETH",name:"Ethereum",symbol:"BINANCE:ETHUSDT",pair:"ETH / USDT",color:"#7c83db"},
 {id:"USDT",name:"Tether",symbol:"BINANCE:USDTUSDC",pair:"USDT / USDC",color:"#26a17b"}
];
export default function LiveMarketBoard(){
 const [active,setActive]=useState("BTC"); const coin=markets.find(x=>x.id===active)!;
 const src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_0kx&symbol="+encodeURIComponent(coin.symbol)+"&interval=15&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=0b0d0e&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&studies=[]&locale=en";
 return <section className="section-block market-section" id="markets"><div className="section-heading"><div><div className="market-kicker"><Activity size={14}/> LIVE MARKET DATA</div><h2>Live crypto trading charts</h2><p>Live market prices and chart activity from TradingView.</p></div><span className="live-indicator"><i/> LIVE</span></div>
 <div className="market-tabs">{markets.map(m=><button key={m.id} onClick={()=>setActive(m.id)} className={active===m.id?"market-tab selected":"market-tab"}><span style={{background:m.color}}>{m.id==="BTC"?"₿":m.id==="SOL"?"◎":m.id==="ETH"?"◆":"₮"}</span><b>{m.id}</b><small>{m.name}</small></button>)}</div>
 <div className="market-chart-head"><div><b>{coin.name}</b><span>{coin.pair}</span></div><span className="market-source">TradingView <ExternalLink size={12}/></span></div>
 <div className="tradingview-frame"><iframe key={coin.id} title={coin.name+" live trading chart"} src={src} loading="lazy" allowFullScreen/></div>
 <p className="market-disclaimer">Market data is provided by TradingView and may be delayed depending on the exchange. This chart shows market prices, not your personal investment profit or account balance.</p></section>;
}