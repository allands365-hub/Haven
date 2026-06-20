"use client";

import { useEffect, useState } from "react";

const PHASE = 4; // seconds per phase
const CYCLE = PHASE * 3; // in → hold → out
const PHASE_LABELS = ["Breathe in", "Hold", "Breathe out"] as const;

export function CalmZone() {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const phaseIndex = Math.floor((tick % CYCLE) / PHASE);
  const phaseLabel = PHASE_LABELS[phaseIndex];
  const countdown = PHASE - (tick % PHASE);
  const cycles = Math.floor(tick / CYCLE);
  const expanded = running && phaseIndex !== 2; // big during in + hold

  function toggle() {
    if (running) {
      setRunning(false);
    } else {
      setTick(0);
      setRunning(true);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        {/* Breathing */}
        <div className="flex flex-col items-center rounded-2xl border border-line bg-base p-6">
          <span className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">
            Box breathing · 4-4-4
          </span>

          <div className="relative mb-6 flex h-44 w-44 items-center justify-center">
            <div
              className={`breathing-circle absolute rounded-full bg-sage/10 transition-transform ease-in-out ${
                expanded ? "scale-[1.3]" : "scale-[0.92]"
              }`}
              style={{ width: "100%", height: "100%", transitionDuration: "4000ms" }}
            />
            <div
              className={`breathing-circle absolute rounded-full bg-sage/15 transition-transform ease-in-out ${
                expanded ? "scale-[1.12]" : "scale-90"
              }`}
              style={{ width: "82%", height: "82%", transitionDuration: "4000ms" }}
            />
            <div className="z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-sage p-3 text-center text-white shadow-md">
              <span className="mb-0.5 text-[10px] font-bold uppercase tracking-widest opacity-90">
                {running ? phaseLabel : "Steady"}
              </span>
              <span className="text-lg font-light">{running ? `${countdown}s` : "Ready"}</span>
            </div>
          </div>

          <div className="mb-4 flex gap-4 text-center text-xs">
            <div>
              <span className="block text-[10px] uppercase text-muted">Pace</span>
              <span className="font-semibold text-slate">Equal 4s</span>
            </div>
            <div className="h-6 border-r border-line" />
            <div>
              <span className="block text-[10px] uppercase text-muted">Cycles</span>
              <span className="font-semibold text-slate">{cycles}</span>
            </div>
          </div>

          <button
            onClick={toggle}
            className={`w-full cursor-pointer rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              running ? "bg-line text-slate" : "bg-sage text-white hover:opacity-95"
            }`}
          >
            {running ? "Pause" : "Begin"}
          </button>
        </div>

        {/* Micro-resets */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Quick 2-minute resets
          </h3>
          <Accordion title="5-4-3-2-1 sensory grounding">
            <p>When thoughts spin out before a test, anchor to your desk and name:</p>
            <p className="text-slate">
              <strong>5</strong> things you see · <strong>4</strong> you can touch ·{" "}
              <strong>3</strong> you can hear · <strong>2</strong> you can smell ·{" "}
              <strong>1</strong> you can taste.
            </p>
          </Accordion>
          <Accordion title="Shoulder release (30s)">
            <p>Long study hours pool tension in your neck and shoulders.</p>
            <p>
              Inhale and lift both shoulders toward your ears. Hold for three counts, then
              drop them with a heavy sigh out. Repeat twice.
            </p>
          </Accordion>
          <Accordion title="Fact vs. exam narrative">
            <p>Catch the catastrophic story and rewrite it:</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-water bg-water/30 p-2.5">
                <span className="mb-1 block text-[10px] font-bold text-slate">Anxious thought</span>
                <span>“If I don&apos;t clear this attempt, my life is over.”</span>
              </div>
              <div className="rounded-lg border border-sage/20 bg-sage/10 p-2.5">
                <span className="mb-1 block text-[10px] font-bold text-sage-ink">Balanced reality</span>
                <span>
                  “This exam is selective. Clearing it is great, but my effort builds a future
                  either way.”
                </span>
              </div>
            </div>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate hover:bg-base"
      >
        <span>{title}</span>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-line bg-base px-4 py-3 text-xs leading-relaxed text-muted">
          {children}
        </div>
      )}
    </div>
  );
}
