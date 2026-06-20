import type { Helpline, RiskResult } from "../../lib/types";

/**
 * Deterministic crisis triage.
 *
 * This is the guaranteed safety net: even if the AI misjudges tone, this scans
 * the raw text for explicit distress signals and escalates. It is intentionally
 * conservative — when a student may be in danger we would rather show support
 * resources unnecessarily than miss a real signal.
 *
 * It does NOT diagnose. It only decides whether to surface help resources.
 */

/** Explicit self-harm / suicidal-ideation phrases → "crisis". */
const CRISIS_PHRASES = [
  "kill myself",
  "killing myself",
  "want to die",
  "wanna die",
  "end my life",
  "end it all",
  "ending it all",
  "take my life",
  "suicide",
  "suicidal",
  "self harm",
  "self-harm",
  "harm myself",
  "hurt myself",
  "cut myself",
  "no reason to live",
  "no point in living",
  "better off dead",
  "don't want to be here anymore",
  "can't go on anymore",
];

/** Strong distress, not necessarily acute → "elevated". */
const ELEVATED_PHRASES = [
  "hopeless",
  "worthless",
  "can't take it anymore",
  "cant take it anymore",
  "want to give up",
  "giving up",
  "no way out",
  "everything is pointless",
  "i hate myself",
  "i'm a failure",
  "im a failure",
  "nobody cares",
  "can't cope",
  "cant cope",
];

/** Match a phrase as a whole token sequence (avoids matching inside words). */
function containsPhrase(haystack: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i");
  return pattern.test(haystack);
}

export function assessRisk(text: string): RiskResult {
  const normalized = ` ${text.toLowerCase()} `;

  const crisisMatches = CRISIS_PHRASES.filter((p) => containsPhrase(normalized, p));
  if (crisisMatches.length > 0) {
    return { level: "crisis", matches: crisisMatches };
  }

  const elevatedMatches = ELEVATED_PHRASES.filter((p) => containsPhrase(normalized, p));
  if (elevatedMatches.length > 0) {
    return { level: "elevated", matches: elevatedMatches };
  }

  return { level: "none", matches: [] };
}

/** India-focused support resources, surfaced on elevated/crisis risk. */
export const HELPLINES: Helpline[] = [
  { name: "Tele-MANAS (Govt. of India)", number: "14416", note: "24/7 mental health support" },
  { name: "KIRAN Helpline", number: "1800-599-0019", note: "24/7, multiple languages" },
  { name: "iCall (TISS)", number: "9152987821", note: "Mon–Sat, 8am–10pm" },
];
