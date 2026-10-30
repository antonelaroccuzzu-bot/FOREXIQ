import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SYSTEM_PROMPT = `You are FOREXIQ Trading Director, a careful market-research assistant.
Explain market concepts, compare instruments, summarize user-supplied market data, and discuss risk management.
Never claim to have live data unless it is included in the user's market snapshot. Clearly identify stale, delayed, or missing data.
Do not guarantee returns, invent prices, or present uncertain analysis as fact. Do not execute trades or claim to connect to a broker.
For trade ideas, explain assumptions, invalidation levels, and downside risks. This is educational information, not personalized financial advice.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI research is not configured yet. Add OPENROUTER_API_KEY to the server environment." }, { status: 503 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const incoming = Array.isArray(body?.messages) ? body.messages.slice(-16) : [];
  const messages = incoming
    .filter((item: any) => (item?.role === "user" || item?.role === "assistant") && typeof item?.content === "string")
    .map((item: any) => ({ role: item.role, content: item.content.slice(0, 5000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Send a question to begin." }, { status: 400 });
  }

  const market = Array.isArray(body?.marketSnapshot) ? body.marketSnapshot.slice(0, 23) : [];
  const marketContext = market.length
    ? "\n\nCurrent dashboard snapshot supplied by FOREXIQ (status is authoritative; do not infer missing values):\n" +
      market.map((q: any) => `${String(q.symbol).slice(0, 24)} | ${String(q.price).slice(0, 32)} | ${String(q.change ?? "n/a").slice(0, 20)} | ${String(q.status).slice(0, 16)}`).join("\n")
    : "\n\nNo market snapshot was supplied. Do not invent current prices.";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://forexiq.vercel.app",
        "X-Title": "FOREXIQ Trading Director",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [{ role: "system", content: SYSTEM_PROMPT + marketContext }, ...messages],
        temperature: 0.2,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: response.status === 429 ? "AI provider rate limit reached. Try again shortly." : "The AI provider could not complete the request." }, { status: response.status === 429 ? 429 : 502 });
    }
    const payload = await response.json();
    const answer = payload?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) throw new Error("Empty AI response");
    return NextResponse.json({ answer: answer.trim(), model: payload.model || process.env.OPENROUTER_MODEL || "openrouter/free" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "FOREXIQ could not reach the AI provider. Please try again." }, { status: 502 });
  }
}
