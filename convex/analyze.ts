"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { openaiChat } from "./lib/openai";
import { TRIGGER_KEYS } from "./lib/triggers";
import type { TriggerKey } from "../lib/types";

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    emotions: { type: "array", items: { type: "string" } },
    triggers: { type: "array", items: { type: "string", enum: TRIGGER_KEYS } },
    reflection: { type: "string" },
  },
  required: ["emotions", "triggers", "reflection"],
};

const SYSTEM = `You are Haven, a warm, calm wellness companion for Indian students preparing for high-stakes exams (NEET, JEE, CUET, CAT, GATE, UPSC).
Analyse the student's journal entry and respond as JSON:
- emotions: 1-3 short lowercase emotion labels (e.g. "overwhelm", "self-doubt", "fatigue").
- triggers: choose ONLY keys whose meaning the text CLEARLY refers to. Prefer fewer, accurate triggers; if none clearly apply, return an empty list. Do NOT tag "mock-scores" for general exam stress — only for an actual mock/practice test result.
  Key meanings:
  • mock-scores: a mock/practice test result, marks, rank, or percentile
  • syllabus-backlog: falling behind, pending topics, revision pressure
  • parental-pressure: family/parental expectations or being compared by family
  • peer-comparison: comparing themselves to friends, toppers, or others
  • sleep: poor sleep, tiredness, lack of rest
  • time-management: not enough time, scheduling, deadlines
  • self-doubt: doubting their ability, feeling not good enough
  • burnout: drained, exhausted, unable to keep going
  • concentration: trouble focusing, distraction, procrastination
  • future-anxiety: fear about the future or career, "what if I fail", re-attempting or re-giving exams, life consequences
- reflection: 2-3 warm sentences. Validate the feeling, gently normalise it, and offer ONE small concrete coping step. Never diagnose, never give medical advice, never mention being an AI.`;

export const analyzeEntry = action({
  args: { entryId: v.id("entries"), text: v.string() },
  handler: async (ctx, { entryId, text }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(api.entries.fail, { entryId });
      return;
    }
    try {
      const raw = await openaiChat({
        apiKey,
        messages: [
          { role: "system", text: SYSTEM },
          { role: "user", text: `Journal entry:\n"""${text}"""` },
        ],
        json: { name: "entry_analysis", schema: analysisSchema },
        temperature: 0.4,
        maxTokens: 400,
      });
      const parsed = JSON.parse(raw) as {
        emotions?: unknown;
        triggers?: unknown;
        reflection?: unknown;
      };
      const known = new Set<string>(TRIGGER_KEYS);
      const triggers = (Array.isArray(parsed.triggers) ? parsed.triggers : [])
        .filter((t): t is TriggerKey => typeof t === "string" && known.has(t));
      const emotions = (Array.isArray(parsed.emotions) ? parsed.emotions : [])
        .filter((e): e is string => typeof e === "string")
        .slice(0, 3);
      const reflection = typeof parsed.reflection === "string" ? parsed.reflection : "";

      await ctx.runMutation(api.entries.setAnalysis, {
        entryId,
        analysis: { emotions, triggers, reflection },
      });
    } catch {
      await ctx.runMutation(api.entries.fail, { entryId });
    }
  },
});
