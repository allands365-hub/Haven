"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { computeMoodTrend } from "../../convex/lib/mood";
import { aggregateTriggers } from "../../convex/lib/triggers";
import type { JournalEntry, TriggerKey } from "../../lib/types";

export function Insights({ sessionId }: { sessionId: string }) {
  const entries = useQuery(api.entries.list, { sessionId });

  if (entries === undefined) {
    return <p className="text-sm text-muted">Loading your patterns…</p>;
  }
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-semibold text-slate">No patterns yet</p>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Write a few daily reflections and Haven will surface your mood trend and the
          triggers that come up most.
        </p>
      </div>
    );
  }

  const trend = computeMoodTrend(
    entries.map((e) => ({ mood: e.mood, text: e.text, createdAt: e.createdAt }) as JournalEntry),
    Date.now(),
  );
  const ranked = aggregateTriggers(
    entries
      .filter((e) => e.analysis)
      .map((e) => ({ triggers: (e.analysis!.triggers as TriggerKey[]) })),
  );

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Mood trend
          </h3>
          <div className="rounded-2xl border border-line bg-base p-4">
            <div className="mb-3 flex items-center gap-4 text-xs">
              <Stat label="Average" value={trend.average.toFixed(1)} />
              <Stat label="Streak" value={`${trend.streakDays}d`} />
              <DirectionBadge direction={trend.direction} />
            </div>
            <MoodChart series={trend.series} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Top stress triggers
          </h3>
          <div className="rounded-2xl border border-line bg-base p-4">
            {ranked.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">
                No triggers detected yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {ranked.map((t, i) => {
                  const pct = (t.count / ranked[0].count) * 100;
                  return (
                    <li key={t.trigger} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate">
                        <span>{t.label}</span>
                        <span className="text-[10px] text-muted">
                          {t.count} {t.count === 1 ? "log" : "logs"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-sage transition-all duration-500"
                          style={{ width: `${pct}%`, opacity: 1 - i * 0.15 }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Observation trend={trend} topTrigger={ranked[0]?.label} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <span className="font-semibold text-slate">{value}</span>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: "improving" | "declining" | "steady" }) {
  const map = {
    improving: { label: "Improving", cls: "bg-sage/15 text-sage-ink", arrow: "↗" },
    steady: { label: "Steady", cls: "bg-line text-muted", arrow: "→" },
    declining: { label: "Needs care", cls: "bg-water text-slate", arrow: "↘" },
  } as const;
  const d = map[direction];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${d.cls}`}>
      {d.arrow} {d.label}
    </span>
  );
}

/** Minimal area+line chart scaled from the real series (mood 1..5). */
function MoodChart({ series }: { series: { date: string; mood: number }[] }) {
  const n = series.length;
  const y = (mood: number) => 100 - ((mood - 1) / 4) * 92 - 4; // pad 4% top/bottom
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const points = series.map((s, i) => `${x(i)},${y(s.mood)}`);
  const line = points.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(" ");
  const area = `M 0,100 L ${points.join(" L ")} L 100,100 Z`;

  return (
    <div className="relative h-28 w-full">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c9a82" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7c9a82" stopOpacity="0" />
          </linearGradient>
        </defs>
        {n > 1 && <path d={area} fill="url(#moodGrad)" />}
        {n > 1 && (
          <path d={line} fill="none" stroke="#7c9a82" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        )}
        {series.map((s, i) => (
          <circle key={s.date} cx={x(i)} cy={y(s.mood)} r="1.6" fill="#7c9a82" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}

function Observation({
  trend,
  topTrigger,
}: {
  trend: ReturnType<typeof computeMoodTrend>;
  topTrigger?: string;
}) {
  let note: string;
  if (topTrigger && trend.direction === "declining") {
    note = `“${topTrigger}” has been your most frequent stressor, and your mood has dipped a little recently. Be gentle with yourself — maybe pick one small thing from the Calm tab today.`;
  } else if (topTrigger) {
    note = `“${topTrigger}” comes up most often in your reflections. Naming a pattern is the first step to loosening its grip.`;
  } else if (trend.direction === "improving") {
    note = `Your mood has been trending up — whatever you're doing, it's working. Keep the small habits going.`;
  } else {
    note = `Keep checking in daily. The more you write, the clearer your patterns become.`;
  }

  return (
    <div className="rounded-2xl border border-sage/10 bg-sage/5 p-5">
      <div className="flex gap-3">
        <span className="text-xl" aria-hidden>
          🌱
        </span>
        <div>
          <h4 className="mb-1 text-xs font-semibold text-slate">Haven&apos;s quiet observation</h4>
          <p className="text-xs leading-relaxed text-muted">{note}</p>
        </div>
      </div>
    </div>
  );
}
