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
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Convert message history to Gemini format
    const geminiHistory = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const body = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        ...geminiHistory,
        {
          role: "user",
          parts: [{ text: lastMessage.content }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Sorry, I couldn't respond right now. Please try again!";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}