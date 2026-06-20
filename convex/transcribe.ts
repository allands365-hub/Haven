"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Voice → text. The browser records a short clip and sends it base64-encoded;
 * we forward it to OpenAI's Whisper transcription endpoint (multipart) and
 * return the text. The API key stays in Convex env — never on the client.
 */
export const transcribe = action({
  args: { audioBase64: v.string(), mimeType: v.string() },
  handler: async (_ctx, { audioBase64, mimeType }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const bytes = Buffer.from(audioBase64, "base64");
    const blob = new Blob([bytes], { type: mimeType || "audio/webm" });

    const form = new FormData();
    form.append("file", blob, `entry.${extFor(mimeType)}`);
    form.append("model", "whisper-1");
    form.append("language", "en"); // bias to English (helps Indian-accented speech)

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`OpenAI transcription ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { text?: string };
    return { text: typeof data.text === "string" ? data.text.trim() : "" };
  },
});

/** Map a MIME type to a file extension Whisper recognises. */
function extFor(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "mp4";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("wav")) return "wav";
  return "webm";
}
