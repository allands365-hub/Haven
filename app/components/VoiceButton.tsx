"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

type State = "idle" | "recording" | "transcribing";
const MAX_SECONDS = 60;

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

export function VoiceButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const transcribe = useAction(api.transcribe.transcribe);
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Render only after mount so SSR (null) and first client render match —
  // then reveal on supported browsers. Typing always works regardless.
  useEffect(() => setMounted(true), []);
  if (!mounted || !isSupported()) return null;

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = handleStop;
      mr.start();
      recorderRef.current = mr;
      setSeconds(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Mic access denied — you can still type.");
      setState("idle");
    }
  }

  function stop() {
    clearTimer();
    recorderRef.current?.stop();
  }

  async function handleStop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current?.mimeType || "audio/webm",
    });
    if (blob.size === 0) {
      setState("idle");
      return;
    }
    setState("transcribing");
    try {
      const base64 = await blobToBase64(blob);
      const { text } = await transcribe({ audioBase64: base64, mimeType: blob.type });
      if (text) onTranscript(text);
      else setError("Didn't catch that — try again.");
    } catch {
      setError("Couldn't transcribe — try again.");
    } finally {
      setState("idle");
    }
  }

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-[11px] text-chili">{error}</span>}

      {state === "transcribing" ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-sage-deep border-t-transparent" />
          Transcribing…
        </span>
      ) : state === "recording" ? (
        <button
          type="button"
          onClick={stop}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-chili/40 bg-chili/10 px-3 py-1 text-[11px] font-semibold text-chili"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-chili" />
          {mm}:{ss} · Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label="Record your reflection by voice"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-medium text-muted transition-colors hover:border-sage/40 hover:text-sage-ink"
        >
          <MicIcon /> Speak
        </button>
      )}
    </span>
  );
}

function MicIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result);
      resolve(result.includes(",") ? result.split(",")[1] : "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
