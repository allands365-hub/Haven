"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

type State = "idle" | "loading" | "playing";

/**
 * Reads a companion reply aloud in a warm OpenAI voice. The audio is generated
 * once and cached on the element, so replaying the same message costs nothing
 * extra. The API key stays server-side (Convex action).
 */
export function SpeakAloud({ text }: { text: string }) {
  const speak = useAction(api.speak.speak);
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function toggle() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    if (state === "loading") return;

    // Replay already-generated audio without re-billing.
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setState("playing");
        return;
      } catch {
        /* fall through and regenerate */
      }
    }

    setState("loading");
    try {
      const { audioBase64 } = await speak({ text });
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      audioRef.current = audio;
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={state === "playing" ? "Stop reading aloud" : "Read aloud"}
      className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-muted transition-colors hover:text-sage-ink"
    >
      {state === "loading" ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-sage-deep border-t-transparent" />
          Preparing…
        </>
      ) : state === "playing" ? (
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-deep" /> Stop
        </>
      ) : (
        <>
          <SpeakerIcon /> Listen
        </>
      )}
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
