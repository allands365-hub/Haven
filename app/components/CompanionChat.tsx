"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const QUICK_REPLIES = [
  "I'm feeling very overwhelmed by backlogs",
  "How do I deal with mock score drops?",
  "Need to quiet my mind before sleeping",
];

export function CompanionChat({
  sessionId,
  studentName,
  targetExam,
  onCrisis,
}: {
  sessionId: string;
  studentName: string;
  targetExam: string;
  onCrisis: () => void;
}) {
  const messages = useQuery(api.chat.list, { sessionId });
  const send = useAction(api.companion.sendMessage);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function submit(text: string) {
    if (!text.trim() || sending) return;
    setInput("");
    setSending(true);
    try {
      const res = await send({ sessionId, text });
      if (res?.risk === "crisis") onCrisis();
    } catch {
      /* the action keeps a gentle fallback; nothing to surface here */
    } finally {
      setSending(false);
    }
  }

  const isEmpty = messages !== undefined && messages.length === 0;

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-sage/10 bg-sage/5 p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate">Namaste, {studentName}</h2>
          <p className="mt-0.5 text-xs text-muted">
            A quiet space to unpack whatever&apos;s on your mind.
          </p>
        </div>
        <span className="text-xs font-light text-muted">Targeting {targetExam}</span>
      </div>

      <div className="mb-6 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
        {isEmpty && (
          <Bubble role="companion">
            Namaste {studentName}. The pressure of preparing for {targetExam}
            {" "}can feel heavy — but right now, you&apos;re safe here. How is your mind
            feeling in this moment?
          </Bubble>
        )}
        {messages?.map((m) => (
          <Bubble key={m._id} role={m.role}>
            {m.text}
          </Bubble>
        ))}
        {sending && <Typing />}
        <div ref={endRef} />
      </div>

      <div className="space-y-4 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => submit(reply)}
              disabled={sending}
              className="inline-flex min-h-[40px] cursor-pointer items-center rounded-full border border-line bg-surface px-3.5 py-1.5 text-left text-xs font-medium text-slate transition-all hover:border-sage/40 hover:text-sage-ink disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder="Share a thought, a backlog stressor, a mock-test frustration…"
            aria-label="Message Haven"
            className="flex-1 rounded-xl border border-line bg-base px-4 py-3 text-sm text-slate placeholder:text-muted/70 focus:border-sage focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex cursor-pointer items-center justify-center rounded-xl bg-sage-deep px-5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "companion";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-none bg-sage-deep text-white shadow-sm"
            : "rounded-tl-none border border-line bg-base text-slate"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted">
      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-sage [animation-delay:0ms]" />
      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-sage [animation-delay:150ms]" />
      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-sage [animation-delay:300ms]" />
      <span className="font-light italic">Haven is holding space for you…</span>
    </div>
  );
}
