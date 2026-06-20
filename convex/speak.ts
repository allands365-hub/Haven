"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const MODEL = "gpt-4o-mini-tts";
const VOICE = "shimmer"; // soft, warm — fits a calm companion

/**
 * Text → warm spoken audio via OpenAI TTS. Returns base64 mp3 the browser
 * plays. The API key stays in Convex env.
 */
export const speak = action({
  args: { text: v.string() },
  handler: async (_ctx, { text }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        input: text.slice(0, 2000),
        response_format: "mp3",
        instructions:
          "Speak in a warm, calm, gentle and reassuring tone, like a caring older friend. Keep an unhurried, soothing pace.",
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return { audioBase64: buf.toString("base64") };
  },
});
