"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TRIGGERS } from "../../convex/lib/triggers";
import { recommendExercise, type ExerciseKey } from "../../convex/lib/recommend";
import { VoiceButton } from "./VoiceButton";
import type { TriggerKey } from "../../lib/types";
import type { Id } from "../../convex/_generated/dataModel";

const MOODS = [
  { val: 1, emoji: "😞", label: "Overwhelmed" },
  { val: 2, emoji: "🙁", label: "Fatigued" },
  { val: 3, emoji: "😐", label: "Neutral" },
  { val: 4, emoji: "🙂", label: "Focused" },
  { val: 5, emoji: "😄", label: "Confident" },
] as const;

export function JournalCheckin({
  sessionId,
  onCrisis,
  onGoToCalm,
}: {
  sessionId: string;
  onCrisis: () => void;
  onGoToCalm: (exercise?: ExerciseKey) => void;
}) {
  const create = useMutation(api.entries.create);
  const analyze = useAction(api.analyze.analyzeEntry);
  const entries = useQuery(api.entries.list, { sessionId });

  const [mood, setMood] = useState(3);
  const [text, setText] = useState("");
  const [currentId, setCurrentId] = useState<Id<"entries"> | null>(null);

  const current = entries?.find((e) => e._id === currentId) ?? null;
  const recommended = current?.analysis
    ? recommendExercise(
        current.analysis.emotions,
        current.analysis.triggers as TriggerKey[],
        current.mood,
      )
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { entryId, risk } = await create({ sessionId, mood, text });
      setCurrentId(entryId);
      if (risk === "crisis" || risk === "elevated") onCrisis();
      await analyze({ entryId, text });
    } catch {
      /* entry is saved; the reflection card surfaces the error state */
    }
  }

  function reset() {
    setCurrentId(null);
    setText("");
    setMood(3);
  }

  if (current) {
    return (
      <div className="fade-up flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted">
            Haven&apos;s reflection
          </span>
          <button
            onClick={reset}
            className="cursor-pointer text-xs font-semibold text-sage-ink hover:underline"
          >
            Write another entry
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-line bg-base p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">
                Mood logged
              </span>
              <span className="text-xl">
                {MOODS[Math.min(5, Math.max(1, current.mood)) - 1].emoji}
              </span>
            </div>
            {current.status === "analyzing" && (
              <span className="flex items-center gap-2 text-xs text-muted">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sage border-t-transparent" />
                Reflecting…
              </span>
            )}
          </div>

          {current.status === "error" && (
            <p className="text-sm text-muted">
              I couldn&apos;t reflect on that just now — but your entry is saved. Please try again.
            </p>
          )}

          {current.analysis && (
            <>
              {current.analysis.emotions.length > 0 && (
                <div>
                  <span className="mb-2 block text-[10px] uppercase tracking-wider text-muted">
                    Emotions noticed
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {current.analysis.emotions.map((em) => (
                      <span
                        key={em}
                        className="rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage-ink"
                      >
                        {em}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {current.analysis.triggers.length > 0 && (
                <div>
                  <span className="mb-2 block text-[10px] uppercase tracking-wider text-muted">
                    Stress triggers
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {current.analysis.triggers.map((t) => (
                      <span
                        key={t}
                        className="rounded-lg border border-line bg-surface px-3 py-1 text-xs text-slate"
                      >
                        {TRIGGERS[t as keyof typeof TRIGGERS]?.label ?? t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-line pt-4">
                <span className="mb-1 block text-xs font-semibold text-sage-ink">
                  A soft perspective
                </span>
                <p className="text-[15px] italic leading-relaxed text-slate">
                  “{current.analysis.reflection}”
                </p>
              </div>
            </>
          )}
        </div>

        {recommended ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-sage/10 bg-sage/5 p-4">
            <div>
              <p className="text-xs font-semibold text-slate">
                Haven suggests: {recommended.title}
              </p>
              <p className="mt-0.5 text-xs text-muted">A 2-minute reset {recommended.reason}.</p>
            </div>
            <button
              onClick={() => onGoToCalm(recommended.key)}
              className="shrink-0 cursor-pointer rounded-xl bg-sage-deep px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              Try it
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-sage/10 bg-sage/5 p-4">
            <p className="text-xs text-muted">Need a moment to breathe?</p>
            <button
              onClick={() => onGoToCalm()}
              className="cursor-pointer rounded-xl bg-sage-deep px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              Go to Calm
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between space-y-6">
      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-water/30 p-4">
          <h3 className="text-sm font-semibold text-slate">Expressive writing</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Writing down what holds your mind frees up working memory. Let it spill out below —
            nothing here is graded.
          </p>
        </div>

        <fieldset className="space-y-2.5">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Current mental state
          </legend>
          <div className="grid grid-cols-5 gap-3">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.val}
                onClick={() => setMood(m.val)}
                aria-pressed={mood === m.val}
                className={`flex min-h-[44px] cursor-pointer flex-col items-center rounded-xl border p-3 transition-all ${
                  mood === m.val
                    ? "border-sage bg-sage/10 font-semibold text-sage-ink"
                    : "border-line hover:bg-base"
                }`}
              >
                <span className="mb-1 text-2xl">{m.emoji}</span>
                <span className="text-center text-[10px]">{m.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="journal-text"
              className="text-xs font-semibold uppercase tracking-wider text-muted"
            >
              What&apos;s occupying your mind?
            </label>
            <VoiceButton
              onTranscript={(t) => setText((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t))}
            />
          </div>
          <textarea
            id="journal-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="There's so much Physics to revise before the weekly test. I can't shake the fear that I'll run out of time… (or tap Speak)"
            rows={6}
            required
            className="w-full resize-none rounded-xl border border-line bg-base p-4 text-sm leading-relaxed text-slate placeholder:text-muted/70 focus:border-sage focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sage-deep py-3.5 font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
      >
        Reflect with Haven
      </button>
    </form>
  );
}
