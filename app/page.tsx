"use client";

import { useEffect, useRef, useState } from "react";
import { CompanionChat } from "./components/CompanionChat";
import { JournalCheckin } from "./components/JournalCheckin";
import { Insights } from "./components/Insights";
import { CalmZone } from "./components/CalmZone";
import { CrisisModal } from "./components/CrisisModal";

type Tab = "companion" | "journal" | "insights" | "calm";

type IconCmp = (props: { className?: string }) => React.ReactElement;

const TABS: { key: Tab; Icon: IconCmp; label: string }[] = [
  { key: "companion", Icon: ChatIcon, label: "Companion" },
  { key: "journal", Icon: PenIcon, label: "Daily reflection" },
  { key: "insights", Icon: ChartIcon, label: "Mood patterns" },
  { key: "calm", Icon: LotusIcon, label: "Calm zone" },
];

const EXAMS = ["JEE", "NEET", "UPSC", "CAT", "GATE", "CUET"];

export default function Home() {
  const [sessionId] = useState(
    () => Math.random().toString(36).slice(2) + Date.now().toString(36),
  );
  const [tab, setTab] = useState<Tab>("companion");
  const [crisis, setCrisis] = useState(false);

  const [name, setName] = useState("friend");
  const [exam, setExam] = useState("JEE");
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close the profile dropdown on outside click or Escape.
  useEffect(() => {
    if (!showProfile) return;
    function onPointer(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowProfile(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [showProfile]);

  // Lightweight personalisation, persisted locally (no account needed).
  useEffect(() => {
    const n = localStorage.getItem("haven-name");
    const e = localStorage.getItem("haven-exam");
    if (n) setName(n);
    if (e) setExam(e);
  }, []);
  useEffect(() => {
    localStorage.setItem("haven-name", name);
    localStorage.setItem("haven-exam", exam);
  }, [name, exam]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Ambient calming glow — pure CSS, no assets. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[50vw] w-[50vw] rounded-full bg-sage/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] rounded-full bg-water/20 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate">
              Haven
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-sage" />
            </h1>
            <p className="mt-1 text-sm text-muted">
              A quiet, spacious sanctuary for competitive-exam aspirants.
            </p>
          </div>

          <div ref={profileRef} className="relative w-full md:w-auto">
            <button
              onClick={() => setShowProfile((s) => !s)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-slate shadow-sm transition-all hover:border-sage/40 md:w-auto"
            >
              <span>
                Focus: {name} • {exam}
              </span>
              <span className="text-muted">▾</span>
            </button>

            {showProfile && (
              <div className="fade-up absolute right-0 z-40 mt-2 w-56 rounded-xl border border-line bg-surface p-4 shadow-xl">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
                  Your name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-xs focus:border-sage focus:outline-none"
                />
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted">
                  Exam path
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {EXAMS.map((x) => (
                    <button
                      key={x}
                      onClick={() => {
                        setExam(x);
                        setShowProfile(false);
                      }}
                      className={`min-h-[36px] cursor-pointer rounded-lg border py-2 text-[10px] font-medium transition-all ${
                        exam === x
                          ? "border-sage bg-sage text-white"
                          : "border-line text-muted hover:bg-base"
                      }`}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Workspace */}
        <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-12">
          <nav className="z-20 flex gap-2 self-start rounded-2xl border border-line bg-surface/60 p-2.5 shadow-sm lg:col-span-3 lg:flex-col">
            {TABS.map((t) => {
              const Icon = t.Icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-current={tab === t.key}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all lg:flex-initial lg:justify-start ${
                    tab === t.key
                      ? "bg-surface font-semibold text-sage-ink shadow-sm"
                      : "text-muted hover:bg-surface/50 hover:text-slate"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <main className="flex min-h-[550px] flex-col rounded-3xl border border-line bg-surface p-6 shadow-sm md:p-8 lg:col-span-9">
            {tab === "companion" && (
              <CompanionChat
                sessionId={sessionId}
                studentName={name}
                targetExam={exam}
                onCrisis={() => setCrisis(true)}
              />
            )}
            {tab === "journal" && (
              <JournalCheckin
                sessionId={sessionId}
                onCrisis={() => setCrisis(true)}
                onGoToCalm={() => setTab("calm")}
              />
            )}
            {tab === "insights" && <Insights sessionId={sessionId} />}
            {tab === "calm" && <CalmZone />}
          </main>
        </div>
      </div>

      {/* Footer / persistent safety line */}
      <footer className="relative z-10 mt-8 border-t border-line bg-surface/40 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-[11px] text-muted sm:flex-row">
          <span>
            Haven is a supportive companion, not a substitute for professional or medical help.
          </span>
          <button
            onClick={() => setCrisis(true)}
            className="cursor-pointer font-semibold text-sage-ink hover:underline"
          >
            Need immediate help?
          </button>
        </div>
      </footer>

      <CrisisModal open={crisis} onClose={() => setCrisis(false)} />
    </div>
  );
}

function svgProps(className?: string) {
  return {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M8 10.5h8M8 14h5" />
      <path d="M21 11.5a8 8 0 0 1-11.5 7.2L4 20.5l1.4-4.3A8 8 0 1 1 21 11.5Z" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M16.5 4.5 19.5 7.5 8.5 18.5 4 20l1.5-4.5z" />
      <path d="M14.5 6.5 17.5 9.5" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4 20h16" />
      <path d="M7 20v-5M12 20V8M17 20v-9" />
    </svg>
  );
}

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 4c1.8 2.2 1.8 5 0 7.5-1.8-2.5-1.8-5.3 0-7.5Z" />
      <path d="M12 11.5c2.7-1 4.8.3 5.7 3-2.7 1-4.8-.3-5.7-3Z" />
      <path d="M12 11.5c-2.7-1-4.8.3-5.7 3 2.7 1 4.8-.3 5.7-3Z" />
      <path d="M5 16.5c3 2.3 11 2.3 14 0" />
    </svg>
  );
}
