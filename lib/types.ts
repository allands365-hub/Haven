/**
 * Shared domain types for Haven — a wellness companion for exam-stressed students.
 * The contract between the Gemini layer, the deterministic logic, and the UI.
 */

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

/** Crisis triage levels, ordered by severity. */
export type RiskLevel = "none" | "elevated" | "crisis";

/** Canonical exam-stress trigger keys. The AI is asked to use these; the
 *  deterministic extractor falls back to them too, so insights stay consistent. */
export type TriggerKey =
  | "mock-scores"
  | "syllabus-backlog"
  | "parental-pressure"
  | "peer-comparison"
  | "sleep"
  | "time-management"
  | "self-doubt"
  | "burnout"
  | "concentration"
  | "future-anxiety";

export interface JournalEntry {
  mood: MoodLevel;
  text: string;
  createdAt: number; // epoch ms
}

/** What Gemini returns for a single journal entry (post-validated). */
export interface EntryAnalysis {
  emotions: string[];
  triggers: TriggerKey[];
  reflection: string; // short, empathetic, non-clinical
}

export interface ChatMessage {
  role: "user" | "companion";
  text: string;
  createdAt: number;
}

export interface TriggerCount {
  trigger: TriggerKey;
  label: string;
  count: number;
}

export interface MoodTrend {
  /** One point per day logged, oldest first. */
  series: { date: string; mood: number }[];
  average: number;
  latest: MoodLevel | null;
  direction: "improving" | "declining" | "steady";
  /** Consecutive days (ending today) with at least one entry. */
  streakDays: number;
}

export interface RiskResult {
  level: RiskLevel;
  matches: string[];
}

export interface Helpline {
  name: string;
  number: string;
  note: string;
}
