"use client";
import { ArrowRight, ShieldCheck, Globe2, ChartNoAxesCombined, CircleDollarSign, Headphones, PlayCircle, Users, WalletCards } from "lucide-react";
import AuthPanel from "./AuthPanel";
import LiveMarketBoard from "./LiveMarketBoard";

const plans=[
 {name:"Basic Plan",tag:"STARTER ACCESS",copy:"A straightforward starting point for exploring the 0KX platform.",items:["Personal account dashboard","Supported crypto deposits","Access to market charts"],tone:"basic"},
 {name:"Standard Plan",tag:"FLEXIBLE ACCESS",copy:"More room to organise your digital-asset activity.",items:["Everything in Basic","Investment activity tracking","Priority support requests"],tone:"standard"},
 {name:"Premium Plan",tag:"ADVANCED ACCESS",copy:"An expanded platform experience for active customers.",items:["Everything in Standard","Detailed portfolio overview","Enhanced account assistance"],tone:"premium"},
 {name:"Monthly Plan",tag:"MONTHLY ACCESS",copy:"A monthly platform-access option with clear terms.",items:["Monthly account access","Portfolio and market overview","Customer support"],tone:"monthly"}
];
const features=[
 {title:"Fund your account",text:"Choose a supported digital asset and network. Always verify the destination address before sending.",image:"https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1000&q=85"},
 {title:"Track your portfolio",text:"Review your account activity and follow market movements from one place.",image:"https://images.unsplash.com/photo-1640340434855-6084b1f4901d?auto=format&fit=crop&w=1000&q=85"},
 {title:"Stay informed",text:"Explore digital-asset market information and educational resources before making decisions.",image:"https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1000&q=85"}
];
export default function LandingSections({ onAuthChange }: { onAuthChange?: (session: { access_token: string; user: { id: string; email?: string } } | null, admin: boolean) => void }){
 return <div className="landing-experience">
  <section className="landing-hero" id="home">
   <div className="hero-shade"/>
   <div className="hero-inner">
    <div className="hero-copy"><span className="hero-eyebrow"><i/> DIGITAL ASSET PLATFORM</span><h1>Build your crypto<br/><em>portfolio</em> with 0KX</h1><p>Explore digital assets, follow the markets and manage your account through one focused platform experience.</p>
     <div className="hero-actions"><a href="#investment-plans" className="hero-primary">Explore the platform <ArrowRight size={17}/></a><a href="#about-0kx" className="hero-secondary">Discover 0KX</a></div>
     <div className="hero-trust"><span><ShieldCheck size={16}/> Account-focused tools</span><span><Globe2 size={16}/> Online access</span></div>
    </div>
    <div className="hero-account"><div className="hero-account-top"><span>WELCOME TO 0KX</span><span className="hero-live-dot">● SECURE ACCESS</span></div><AuthPanel onAuthChange={onAuthChange}/></div>
   </div>
   <div className="hero-bottomline"><span>01 / DIGITAL ASSETS</span><span>EXPLORE • MANAGE • LEARN</span></div>
  </section>

  <section className="intro-strip"><div><b>0KX</b><span>Digital asset investment platform</span></div><p>Market information. Account tools. Customer assistance.</p></section>

  <section className="story-section" id="about-0kx">
   <div className="story-photo"><img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=85" alt="Abstract blockchain network visual"/><div className="photo-stamp"><b>0KX</b><span>YOUR DIGITAL ASSET SPACE</span></div></div>
   <div className="story-copy"><span className="section-overline">ABOUT 0KX</span><h2>We care about your life's important investments.</h2><p>0KX is a digital-asset platform designed to bring account access, cryptocurrency information and customer assistance together in one online experience.</p><p>Our focus is to make it easier for customers to navigate supported digital assets, review account activity and stay informed about the markets. We believe clear information, careful asset handling and accessible support should be central to every customer experience.</p><a className="text-link" href="#portfolio">Learn about the platform <ArrowRight size={16}/></a></div>
  </section>

  <section className="focus-section" id="crypto-focus">
   <div className="focus-heading"><span className="section-overline">OUR FOCUS</span><h2>Our focus on cryptocurrency</h2><p>Explore the digital-asset ecosystem through market tools, account features and educational media.</p></div>
   <div className="focus-grid">{features.map((f,i)=><article className="focus-card" key={f.title}><div className="focus-image"><img src={f.image} alt=""/></div><div className="focus-card-body"><span>0{i+1} / PLATFORM</span><h3>{f.title}</h3><p>{f.text}</p></div></article>)}</div>
  </section>

  <section className="video-section" id="videos"><div className="video-copy"><span className="section-overline">MARKET INSIGHTS</span><h2>Stay connected to the world of digital assets.</h2><p>Watch an industry discussion from the official OKX channel. This is third-party industry media and is not a 0KX company announcement.</p><a href="https://www.youtube.com/@OKX" target="_blank" rel="noreferrer" className="text-link">Explore OKX videos <ArrowRight size={16}/></a></div><div className="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/9hkMll4VsCI?rel=0" title="OKX industry discussion video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><div className="video-caption"><PlayCircle size={17}/> INDUSTRY VIDEO • OFFICIAL OKX CHANNEL</div></div></section>

  <section className="plans-section" id="investment-plans"><div className="plans-heading"><span className="section-overline">OUR SERVICES</span><h2>Investment plans</h2><p>Choose the level of platform access that matches the services you need. Specific investment terms and rates must be published transparently before any funds are committed.</p></div><div className="plans-grid">{plans.map((p,i)=><article className={"plan-card "+p.tone} key={p.name}><div className="plan-top"><span>{p.tag}</span><b>0{i+1}</b></div><h3>{p.name}</h3><p>{p.copy}</p><ul>{p.items.map(item=><li key={item}><ShieldCheck size={15}/>{item}</li>)}</ul><a href="#account-dashboard">View platform details <ArrowRight size={15}/></a></article>)}</div><p className="plans-note">0KX does not promise fixed or guaranteed returns. Digital assets are volatile and you may lose some or all of the money you commit.</p></section>

  <section className="portfolio-section" id="portfolio"><div className="portfolio-image"><img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1300&q=85" alt="Financial market charts on a trading screen"/><div className="portfolio-image-label">MARKET DATA • DIGITAL ASSETS</div></div><div className="portfolio-copy"><span className="section-overline">BUILD YOUR CRYPTO PORTFOLIO</span><h2>Make informed decisions with a clearer view.</h2><div className="portfolio-point"><ChartNoAxesCombined/><div><b>Follow market activity</b><p>View live chart feeds for Bitcoin, Solana, Ethereum and stablecoin markets.</p></div></div><div className="portfolio-point"><WalletCards/><div><b>Review account activity</b><p>Keep your deposits, balances and investment records organised in one account.</p></div></div><div className="portfolio-point"><Headphones/><div><b>Get customer assistance</b><p>Reach the 0KX support channel when you need help using the platform.</p></div></div></div></section>

  <section className="market-embed-section"><div className="plans-heading"><span className="section-overline">LIVE CRYPTOCURRENCY VOLUME</span><h2>Explore the crypto markets</h2><p>Live third-party market charts for BTC, SOL, ETH and USDT pairs.</p></div><LiveMarketBoard/></section>

  <section className="team-section" id="team"><div className="team-copy"><span className="section-overline">TEAM OF PROFESSIONALS</span><h2>Our expert team</h2><p>Our team profiles are being prepared. 0KX leadership and staff details will be published when the official team information and photographs are provided.</p><span className="team-coming">TEAM PROFILES COMING SOON</span></div><div className="team-visual"><Users size={58}/><b>People behind 0KX</b><span>Official team introductions will appear here.</span></div></section>

  <section className="global-section" id="global"><div className="global-photo"><img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85" alt="Modern global business district"/></div><div className="global-copy"><span className="section-overline">ONLINE ACCESS</span><h2>A digital platform for a connected world.</h2><p>0KX provides its services online. Our customer support contact is available through WhatsApp. We will publish a verified 0KX office address if and when the business has one.</p><div className="global-facts"><div><Globe2/><span>Online platform</span></div><div><Headphones/><span>Direct customer support</span></div></div></div></section>

  <section className="contact-section" id="contact"><div><span className="section-overline">WE'RE HERE TO HELP</span><h2>Need assistance?</h2><p>Contact 0KX customer support through WhatsApp. You can send a message and receive a reply from our support team.</p></div><a href="https://wa.me/2348108521685?text=Hello%200KX%20customer%20support" target="_blank" rel="noopener noreferrer" className="contact-whatsapp"><Headphones size={19}/> Chat with 0KX support <ArrowRight size={17}/></a></section>

  <footer className="landing-footer"><a href="#home" className="footer-brand">0KX</a><p>Digital asset services involve risk. Cryptocurrency values can rise or fall, and losses are possible. 0KX is not affiliated with the separate OKX exchange.</p><div><a href="#about-0kx">About</a><a href="#investment-plans">Plans</a><a href="#videos">Videos</a><a href="#contact">Contact</a></div><span>© 2026 0KX. All rights reserved.</span></footer>
 </div>;
}
