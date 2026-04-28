import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are FarmBot, a friendly and knowledgeable AI assistant for FarmX — India's leading farm-to-consumer marketplace. You help both farmers and consumers.

Your expertise covers:
- Crop cultivation, sowing seasons, and harvesting timelines (especially for India)
- Organic farming, fertilizers, pesticides, and soil health
- Irrigation, water management, and weather adaptation
- Post-harvest storage and preservation
- Product freshness, shelf life, and storage tips for consumers
- Nutritional value of farm produce
- Pricing guidance and market trends in India
- FarmX platform: how to sell, buy, track orders, and use features

Personality: warm, practical, concise. Use short paragraphs. Use emojis sparingly but naturally. When answering about products, mention that users can find them on FarmX. Always give actionable advice. Respond in the same language the user writes in (Hindi or English).

Keep responses under 180 words unless a detailed breakdown is truly needed. Do not make up product prices — say "check FarmX for current pricing" instead.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set in .env.local" }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",   // Free on Groq, very fast
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", JSON.stringify(data));
      return NextResponse.json(
        { error: data?.error?.message ?? "AI error" },
        { status: response.status }
      );
    }

    const text = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't respond right now.";
    return NextResponse.json({ text });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Chat API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}