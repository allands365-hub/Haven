"use client";

import { HELPLINES } from "../../convex/lib/crisis";

/** Telephone href from a display number (strip spaces/dashes). */
function tel(num: string): string {
  return `tel:${num.replace(/[^0-9]/g, "")}`;
}

export function CrisisModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Immediate help resources"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate/60 p-4 backdrop-blur-[2px]"
    >
      <div className="fade-up w-full max-w-lg space-y-6 rounded-2xl bg-surface p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate">
            <span aria-hidden>🫶</span> You don&apos;t have to face this alone
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1 text-2xl leading-none text-muted hover:text-slate"
          >
            ×
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted">
          If things feel unmanageable right now, please reach out to one of these free,
          confidential helplines in India. Talking to someone helps — your worth has
          nothing to do with any exam.
        </p>

        <ul className="space-y-3">
          {HELPLINES.map((h) => (
            <li
              key={h.name}
              className="flex items-center justify-between gap-3 rounded-xl bg-sage/10 p-3.5 text-sm"
            >
              <div>
                <span className="block font-semibold text-slate">{h.name}</span>
                <span className="text-xs text-muted">{h.note}</span>
              </div>
              <a
                href={tel(h.number)}
                className="shrink-0 rounded-lg bg-sage px-3 py-1.5 text-xs font-bold text-white hover:opacity-95"
              >
                {h.number}
              </a>
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="w-full cursor-pointer rounded-xl bg-base py-3 text-xs font-bold uppercase tracking-wider text-slate hover:bg-line"
        >
          Return to Haven
        </button>
      </div>
    </div>
  );
}
