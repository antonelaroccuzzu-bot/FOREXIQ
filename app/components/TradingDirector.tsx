"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, BrainCircuit, LoaderCircle, Send } from "lucide-react";

type Quote = { symbol: string; price: string; change: string | null; status: string };
type Message = { role: "user" | "assistant"; content: string };

export default function TradingDirector({ quotes }: { quotes: Quote[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || loading) return;
    const next = [...messages, { role: "user" as const, content: prompt }];
    setMessages(next);
    setQuestion("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, marketSnapshot: quotes }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI research request failed.");
      setMessages([...next, { role: "assistant", content: payload.answer }]);
    } catch (err) {
      setMessages(next);
      setError(err instanceof Error ? err.message : "AI research is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="panel insight-panel director-panel">
    <div className="panel-head"><div className="title-with-icon"><div className="ai-icon"><BrainCircuit size={17}/></div><div><h3>FOREXIQ Trading Director</h3><p>AI market research assistant</p></div></div><span className="coming-soon">AI RESEARCH</span></div>
    <div className="director-messages" aria-live="polite">
      {messages.length === 0 ? <p className="insight-copy">Ask about market conditions, technical concepts, instrument comparisons or risk management. The assistant receives the dashboard's current quote statuses and must identify delayed or missing data.</p> : messages.map((message, index) => <div className={"director-message " + message.role} key={index}><strong>{message.role === "user" ? "YOU" : "TRADING DIRECTOR"}</strong><p>{message.content}</p></div>)}
      {loading ? <div className="director-loading"><LoaderCircle size={14}/> Analysing market context…</div> : null}
      {error ? <p className="director-error">{error}</p> : null}
    </div>
    <form className="director-form" onSubmit={submit}>
      <input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask the Trading Director…" maxLength={2000} aria-label="Ask the Trading Director" disabled={loading}/>
      <button type="submit" disabled={loading || !question.trim()} aria-label="Send question"><Send size={15}/></button>
    </form>
    <div className="director-foot">Research only · No orders are placed · AI output can be wrong</div>
  </section>;
}
