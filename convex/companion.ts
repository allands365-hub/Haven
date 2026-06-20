"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { openaiChat, type ChatTurn } from "./lib/openai";
import { assessRisk } from "./lib/crisis";

const SYSTEM = `You are Haven, a warm, empathetic wellness companion for Indian students preparing for high-stakes competitive exams (NEET, JEE, CUET, CAT, GATE, UPSC).
Speak gently and human, like a caring older friend. Keep replies to 2-4 sentences.
- Validate the feeling first, then offer ONE small, practical, exam-aware suggestion (a reframe, a short break, a tiny next step, or the breathing exercise in the Calm tab).
- Encourage without toxic positivity. Separate self-worth from exam scores.
- NEVER diagnose, prescribe, or give medical advice. NEVER claim to be a therapist or mention being an AI/model.`;

/** Deterministic, compassionate reply when acute risk is detected — never
 *  delegated to the model. The UI also surfaces helpline resources. */
const CRISIS_REPLY =
  "I hear how much pain you're carrying right now, and I'm really glad you told me. You don't have to face this alone — please reach out to someone who can support you properly. I've shared some confidential helplines on your screen you can call. You matter, far beyond any exam.";

export const sendMessage = action({
  args: { sessionId: v.string(), text: v.string() },
  handler: async (ctx, { sessionId, text }) => {
    const risk = assessRisk(text).level;
    await ctx.runMutation(api.chat.addMessage, { sessionId, role: "user", text, risk });

    if (risk === "crisis") {
      await ctx.runMutation(api.chat.addMessage, {
        sessionId,
        role: "companion",
        text: CRISIS_REPLY,
        risk: "crisis",
      });
      return { risk };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    let reply = "I'm here with you. Tell me a little more about what's on your mind.";
    if (apiKey) {
      try {
        const history = await ctx.runQuery(api.chat.list, { sessionId });
        const messages: ChatTurn[] = [
          { role: "system", text: SYSTEM },
          ...history.slice(-10).map((m) => ({
            role: (m.role === "companion" ? "assistant" : "user") as ChatTurn["role"],
            text: m.text,
          })),
        ];
        reply = (
          await openaiChat({ apiKey, messages, temperature: 0.8, maxTokens: 256 })
        ).trim();
      } catch {
        /* keep the gentle fallback reply */
      }
    }

    await ctx.runMutation(api.chat.addMessage, {
      sessionId,
      role: "companion",
      text: reply,
      risk,
    });
    return { risk };
  },
});
