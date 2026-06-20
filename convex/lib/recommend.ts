import type { TriggerKey } from "../../lib/types";

/**
 * Deterministic "adaptive mindfulness" — pick the calm exercise that best fits
 * the detected emotional state. The AI surfaces emotions/triggers; this pure
 * function decides the response (same split as the rest of Haven), so it's
 * testable and predictable.
 */

export type ExerciseKey = "breathing" | "grounding" | "reframe" | "shoulder";

export interface ExerciseInfo {
  key: ExerciseKey;
  title: string;
  /** One-line reason, shown to the student. */
  reason: string;
}

export const EXERCISES: Record<ExerciseKey, ExerciseInfo> = {
  breathing: { key: "breathing", title: "Box breathing", reason: "to settle a racing mind" },
  grounding: { key: "grounding", title: "5-4-3-2-1 grounding", reason: "to anchor when it all feels like too much" },
  reframe: { key: "reframe", title: "Fact vs. exam narrative", reason: "to loosen a harsh thought" },
  shoulder: { key: "shoulder", title: "Shoulder release", reason: "to ease the tension your body is holding" },
};

function mentions(emotions: string[], needles: string[]): boolean {
  return emotions.some((e) => needles.some((n) => e.toLowerCase().includes(n)));
}

export function recommendExercise(
  emotions: string[],
  triggers: TriggerKey[],
  mood: number,
): ExerciseInfo {
  const t = new Set(triggers);

  // Acute anxiety / panic → calm the nervous system first.
  if (mentions(emotions, ["anx", "panic", "fear", "scared", "nervous", "racing"])) {
    return EXERCISES.breathing;
  }

  // Self-critical / catastrophic thoughts → reframe them.
  if (
    mentions(emotions, ["doubt", "hopeless", "worthless", "failure", "inadequate", "not good"]) ||
    t.has("self-doubt") ||
    t.has("peer-comparison") ||
    t.has("future-anxiety")
  ) {
    return EXERCISES.reframe;
  }

  // Overwhelm / too much to do → ground and shrink the moment.
  if (
    mentions(emotions, ["overwhelm", "stress", "pressure"]) ||
    t.has("burnout") ||
    t.has("syllabus-backlog") ||
    t.has("time-management")
  ) {
    return EXERCISES.grounding;
  }

  // Physical fatigue / held tension → release the body.
  if (mentions(emotions, ["fatigue", "tired", "exhausted", "drained"]) || t.has("sleep")) {
    return EXERCISES.shoulder;
  }

  // Default: breathing is universally settling.
  return EXERCISES.breathing;
}
