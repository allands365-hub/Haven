# Haven 🌿

**A calm AI companion that helps exam-stressed students look after their mind.**

Haven is a quiet, spacious sanctuary for students preparing for high-stakes Indian
entrance and board exams (NEET, JEE, CUET, CAT, GATE, UPSC). It listens, helps them
journal, surfaces the stress patterns they can't see themselves, and — most
importantly — knows when to step back and point them to real human help.

> Haven is a supportive companion, **not** a substitute for professional or medical help.

---

## Chosen vertical

**Mental Wellness Tracker** — a Generative-AI tool that helps students monitor and
improve their well-being during high-stakes exam preparation. It analyses open-ended
daily journaling and mood logs to uncover hidden stress triggers and emotional
patterns that standard trackers miss, and offers conversational, contextual support.

## What it does (four spaces)

| Space | Purpose |
| --- | --- |
| **Companion** (centerpiece) | An empathetic, always-available chat. Validates feelings, then offers one small, exam-aware next step. |
| **Daily reflection** | Mood check-in (1–5) + open-ended journaling → an AI reflection naming emotions, stress triggers, and a soft coping suggestion. |
| **Mood patterns** | A mood trend over time + the recurring stress triggers ranked by frequency — the patterns a single entry can't show. |
| **Calm zone** | Guided 4-4-4 box breathing + 2-minute resets (grounding, shoulder release, thought reframing). |
| **Safety net** (always on) | Deterministic crisis detection that surfaces India helplines the moment distress is detected. |

## Approach & logic

The core design decision: **the AI does the empathetic, generative work; deterministic,
unit-tested code does the logic — and, crucially, the safety net.**

- **AI layer** (OpenAI `gpt-4o-mini`, called server-side from Convex):
  - the companion's conversational replies (`convex/companion.ts`)
  - journal analysis as **structured JSON** — emotions, triggers, a reflection (`convex/analyze.ts`)
- **Deterministic engine** — pure functions in `convex/lib/`, covered by unit tests **and** HTTP integration tests:
  - `crisis.ts` — risk triage (`none` / `elevated` / `crisis`). This is the **guaranteed safety net**: it never depends on the model's judgement, normalises phone-keyboard curly apostrophes, and surfaces helplines.
  - `triggers.ts` — an exam-stress trigger taxonomy + frequency aggregation (the "patterns standard trackers miss").
  - `mood.ts` — mood trend, direction, and logging streak (IST-aware day bucketing).

This split is what makes the safety-critical behaviour reliable: a crisis is caught by
plain, testable code, not left to a probabilistic model.

## How the solution works

```
 Browser (Next.js, reactive UI)
        │  create entry / send message      ▲ live updates
        ▼                                    │ (Convex reactive queries)
 Convex  ──mutation──▶ deterministic risk triage (instant, no AI)
   │     ──action────▶ OpenAI (key stays in Convex env, never in the client)
   │                        │
   └────────────── grocery/mood/trigger logic + DB ◀──────┘
```

1. When a student saves a journal entry, **risk is assessed deterministically in the
   mutation** — so if there's a crisis signal, helplines appear *immediately*, without
   waiting on the AI.
2. A Convex **action** then calls OpenAI for the empathetic reflection / chat reply.
   The API key lives only in Convex's environment — it never reaches the browser.
3. The UI subscribes to Convex **reactive queries**, so analyses and chat replies stream
   in as they're ready.
4. **Insights are derived in the browser** from the entries using the same pure logic
   libraries — the deterministic engine runs in both places.

## Safety & ethics

- The companion is prompted to be warm, to **never diagnose or give medical advice**,
  and to separate self-worth from exam scores.
- Crisis detection is deliberately **conservative** (it would rather surface help
  unnecessarily than miss a real signal) and is unit + HTTP tested.
- On distress it shows India helplines: **Tele-MANAS 14416**, **KIRAN 1800-599-0019**,
  **iCall 9152987821**.

## Tech stack

Next.js 16 · React 19 · Convex · Tailwind CSS v4 · Bun · OpenAI · TypeScript
Tests: **Bun** (unit) + **Hurl** (HTTP integration against the live deployment).

## Run locally

```bash
bun install
bunx convex dev                                   # creates a deployment + generates types
bunx convex env set OPENAI_API_KEY <your-key>     # key lives only in Convex
bun run dev                                        # http://localhost:3000
```

`bunx convex dev` writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local` (git-ignored).

## Tests

```bash
bun test          # 16 unit tests — crisis triage, trigger detection, mood trends
bun run test:api  # Hurl — verifies the deployed crisis triage over HTTP (no AI tokens spent)
```

## Assumptions made

- **Audience is India-based students**, so: day/streak bucketing uses **IST**, and the
  crisis resources are Indian national helplines.
- **Anonymous, per-session** (one session id per browser tab) — no accounts, no
  cross-device sync. This is intentional for an MVP and keeps sensitive journaling
  private.
- **`gpt-4o-mini`** was chosen for cost and latency; the LLM is isolated in a single
  helper (`convex/lib/openai.ts`), so swapping providers is a one-file change.
- Crisis detection is a **keyword/phrase safety net**, not a clinical assessment — it
  decides only whether to surface help resources.
- Mood/trigger insights are computed from the **current session's** entries.
- Student name and exam are lightweight local personalisation (`localStorage`), not
  stored server-side.

---

🤖 Built for PromptWars. AI for empathy; deterministic, tested code for the safety net.
