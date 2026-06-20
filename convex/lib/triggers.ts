import type { EntryAnalysis, TriggerCount, TriggerKey } from "../../lib/types";

/** Canonical triggers with display labels and detection keywords. */
export const TRIGGERS: Record<TriggerKey, { label: string; keywords: string[] }> = {
  "mock-scores": { label: "Mock test scores", keywords: ["mock", "test score", "marks", "rank", "percentile", "result"] },
  "syllabus-backlog": { label: "Syllabus backlog", keywords: ["syllabus", "backlog", "pending", "behind", "revision", "incomplete", "portion"] },
  "parental-pressure": { label: "Parental pressure", keywords: ["parents", "father", "mother", "family", "expectations", "disappoint"] },
  "peer-comparison": { label: "Peer comparison", keywords: ["friends", "others", "everyone else", "comparison", "compared", "topper"] },
  sleep: { label: "Sleep", keywords: ["sleep", "tired", "insomnia", "awake", "exhausted", "no rest"] },
  "time-management": { label: "Time management", keywords: ["time", "schedule", "deadline", "not enough time", "running out"] },
  "self-doubt": { label: "Self-doubt", keywords: ["doubt", "can't do", "not good enough", "stupid", "fail", "useless"] },
  burnout: { label: "Burnout", keywords: ["burnout", "burnt out", "drained", "overwhelmed", "can't anymore", "no energy"] },
  concentration: { label: "Concentration", keywords: ["focus", "concentrate", "distracted", "procrastinate", "phone"] },
  "future-anxiety": { label: "Future anxiety", keywords: ["future", "career", "what if", "life over", "no backup", "career over"] },
};

export const TRIGGER_KEYS = Object.keys(TRIGGERS) as TriggerKey[];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match a keyword at a word boundary (allows suffixes like "disappoint" →
 *  "disappointed", but not mid-word matches like "time" in "sometimes"). */
function keywordHit(text: string, kw: string): boolean {
  return new RegExp(`\\b${escapeRe(kw)}`, "i").test(text);
}

/** Deterministic keyword-based trigger extraction (fallback to / backstop for the AI). */
export function extractTriggers(text: string): TriggerKey[] {
  const found: TriggerKey[] = [];
  for (const key of TRIGGER_KEYS) {
    if (TRIGGERS[key].keywords.some((kw) => keywordHit(text, kw))) {
      found.push(key);
    }
  }
  return found;
}

/**
 * Aggregate triggers across analysed entries into a frequency-ranked list —
 * this is what surfaces the recurring patterns a single entry can't show.
 */
export function aggregateTriggers(analyses: Pick<EntryAnalysis, "triggers">[]): TriggerCount[] {
  const counts = new Map<TriggerKey, number>();
  for (const a of analyses) {
    for (const t of a.triggers) {
      if (t in TRIGGERS) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([trigger, count]) => ({ trigger, label: TRIGGERS[trigger].label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
