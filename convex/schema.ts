import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const riskLevel = v.union(v.literal("none"), v.literal("elevated"), v.literal("crisis"));

export default defineSchema({
  // Journal + mood check-ins.
  entries: defineTable({
    sessionId: v.string(),
    mood: v.number(), // 1..5
    text: v.string(),
    createdAt: v.number(),
    // Risk is computed deterministically at write time — the safety net does
    // not wait on the AI.
    risk: riskLevel,
    status: v.union(v.literal("analyzing"), v.literal("done"), v.literal("error")),
    analysis: v.optional(
      v.object({
        emotions: v.array(v.string()),
        triggers: v.array(v.string()),
        reflection: v.string(),
      }),
    ),
  }).index("by_session", ["sessionId"]),

  // Conversational companion thread.
  messages: defineTable({
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("companion")),
    text: v.string(),
    createdAt: v.number(),
    risk: v.optional(riskLevel),
  }).index("by_session", ["sessionId"]),
});
