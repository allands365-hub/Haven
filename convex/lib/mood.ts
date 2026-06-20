import type { JournalEntry, MoodLevel, MoodTrend } from "../../lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // Haven's audience is in India (UTC+5:30)

/** YYYY-MM-DD in IST for grouping entries by local day. */
function dayKey(ts: number): string {
  return new Date(ts + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Build a mood trend from journal entries.
 *
 * - `series`: one averaged point per day that has entries, oldest first.
 * - `direction`: compares the first and second half of the series.
 * - `streakDays`: consecutive days (ending today) with at least one entry.
 *
 * Pure function — no clock access beyond the `now` argument, so it's testable.
 */
export function computeMoodTrend(entries: JournalEntry[], now: number): MoodTrend {
  if (entries.length === 0) {
    return { series: [], average: 0, latest: null, direction: "steady", streakDays: 0 };
  }

  // Average mood per day.
  const byDay = new Map<string, number[]>();
  for (const e of entries) {
    const key = dayKey(e.createdAt);
    (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(e.mood);
  }

  const series = [...byDay.entries()]
    .map(([date, moods]) => ({ date, mood: round1(avg(moods)) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const average = round1(avg(entries.map((e) => e.mood)));

  const latest = [...entries].sort((a, b) => b.createdAt - a.createdAt)[0].mood as MoodLevel;

  return {
    series,
    average,
    latest,
    direction: computeDirection(series.map((s) => s.mood)),
    streakDays: computeStreak(byDay, now),
  };
}

function computeDirection(moods: number[]): MoodTrend["direction"] {
  if (moods.length < 2) return "steady";
  const mid = Math.floor(moods.length / 2);
  const firstHalf = avg(moods.slice(0, mid));
  const secondHalf = avg(moods.slice(mid));
  const delta = secondHalf - firstHalf;
  if (delta >= 0.4) return "improving";
  if (delta <= -0.4) return "declining";
  return "steady";
}

function computeStreak(byDay: Map<string, unknown>, now: number): number {
  let streak = 0;
  for (let i = 0; ; i++) {
    const key = dayKey(now - i * DAY_MS);
    if (byDay.has(key)) streak++;
    else break;
  }
  return streak;
}

function avg(nums: number[]): number {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
