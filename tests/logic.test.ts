import { describe, it, expect } from "bun:test";
import type { JournalEntry } from "../lib/types";
import { assessRisk } from "../convex/lib/crisis";
import { extractTriggers, aggregateTriggers } from "../convex/lib/triggers";
import { computeMoodTrend } from "../convex/lib/mood";

describe("assessRisk", () => {
  it("flags explicit self-harm language as crisis", () => {
    expect(assessRisk("honestly I just want to die").level).toBe("crisis");
    expect(assessRisk("I keep thinking about suicide").level).toBe("crisis");
    expect(assessRisk("I might hurt myself tonight").level).toBe("crisis");
  });

  it("flags strong distress as elevated", () => {
    expect(assessRisk("I feel so hopeless about NEET").level).toBe("elevated");
    expect(assessRisk("I'm a failure, nothing works").level).toBe("elevated");
  });

  it("does not over-trigger on ordinary exam stress", () => {
    expect(assessRisk("the mock test was hard and I'm tired").level).toBe("none");
    expect(assessRisk("syllabus is huge but I'll manage").level).toBe("none");
  });

  it("does not match distress words inside unrelated words", () => {
    // "suicide" must not match via substrings; ordinary text stays "none"
    expect(assessRisk("I studied biocide chemistry today").level).toBe("none");
  });
});

describe("extractTriggers", () => {
  it("detects exam-specific triggers from free text", () => {
    const t = extractTriggers("my mock score dropped and my parents are disappointed");
    expect(t).toContain("mock-scores");
    expect(t).toContain("parental-pressure");
  });

  it("returns nothing when no triggers present", () => {
    expect(extractTriggers("had a calm productive morning")).toEqual([]);
  });
});

describe("aggregateTriggers", () => {
  it("ranks triggers by frequency across entries", () => {
    const ranked = aggregateTriggers([
      { triggers: ["sleep", "mock-scores"] },
      { triggers: ["sleep", "burnout"] },
      { triggers: ["sleep"] },
    ]);
    expect(ranked[0].trigger).toBe("sleep");
    expect(ranked[0].count).toBe(3);
    expect(ranked[0].label).toBe("Sleep");
  });

  it("ignores unknown trigger keys", () => {
    const ranked = aggregateTriggers([{ triggers: ["not-a-real-trigger" as never] }]);
    expect(ranked).toEqual([]);
  });
});

describe("computeMoodTrend", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.parse("2026-06-20T12:00:00Z");

  function entry(mood: number, daysAgo: number): JournalEntry {
    return { mood: mood as JournalEntry["mood"], text: "", createdAt: now - daysAgo * DAY };
  }

  it("averages mood per day and reports the latest", () => {
    const trend = computeMoodTrend([entry(2, 1), entry(4, 1), entry(5, 0)], now);
    expect(trend.series).toHaveLength(2); // two distinct days
    expect(trend.latest).toBe(5);
    expect(trend.average).toBeCloseTo(3.7, 1);
  });

  it("detects an improving direction", () => {
    const trend = computeMoodTrend(
      [entry(2, 4), entry(2, 3), entry(4, 1), entry(5, 0)],
      now,
    );
    expect(trend.direction).toBe("improving");
  });

  it("counts a consecutive logging streak ending today", () => {
    const trend = computeMoodTrend([entry(3, 0), entry(3, 1), entry(3, 2)], now);
    expect(trend.streakDays).toBe(3);
  });

  it("breaks the streak when a day is missing", () => {
    const trend = computeMoodTrend([entry(3, 0), entry(3, 2)], now);
    expect(trend.streakDays).toBe(1);
  });

  it("handles an empty history", () => {
    const trend = computeMoodTrend([], now);
    expect(trend).toEqual({ series: [], average: 0, latest: null, direction: "steady", streakDays: 0 });
  });
});
