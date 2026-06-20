import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const riskLevel = v.union(v.literal("none"), v.literal("elevated"), v.literal("crisis"));

export const addMessage = mutation({
  args: {
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("companion")),
    text: v.string(),
    risk: v.optional(riskLevel),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", { ...args, createdAt: Date.now() });
  },
});

export const list = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("asc")
      .collect();
  },
});
