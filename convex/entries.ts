import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assessRisk } from "./lib/crisis";

/** Create a journal entry. Risk is assessed deterministically here, so the
 *  safety net fires immediately without waiting on the AI. */
export const create = mutation({
  args: { sessionId: v.string(), mood: v.number(), text: v.string() },
  handler: async (ctx, { sessionId, mood, text }) => {
    const safeMood = Math.min(5, Math.max(1, Math.round(mood))); // guard the 1..5 range
    const risk = assessRisk(text).level;
    const entryId = await ctx.db.insert("entries", {
      sessionId,
      mood: safeMood,
      text,
      createdAt: Date.now(),
      risk,
      status: "analyzing",
    });
    return { entryId, risk };
  },
});

export const setAnalysis = mutation({
  args: {
    entryId: v.id("entries"),
    analysis: v.object({
      emotions: v.array(v.string()),
      triggers: v.array(v.string()),
      reflection: v.string(),
    }),
  },
  handler: async (ctx, { entryId, analysis }) => {
    await ctx.db.patch(entryId, { status: "done", analysis });
  },
});

export const fail = mutation({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    await ctx.db.patch(entryId, { status: "error" });
  },
});

/** All entries for a session, newest first. The Insights screen derives mood
 *  trends and trigger frequencies from this with the pure logic libs. */
export const list = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .collect();
  },
});
