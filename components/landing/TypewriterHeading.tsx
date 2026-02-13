"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const PHRASE = "Ne ratez plus jamais un match.";
const CURSOR = "|";
const TYPING_MS = 60;
const PAUSE_MS = 2000;
const DELETING_MS = 60;

export function TypewriterHeading({ className }: { className?: string }) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (phase === "typing") {
      if (text.length < PHRASE.length) {
        const t = setTimeout(
          () => setText(PHRASE.slice(0, text.length + 1)),
          TYPING_MS,
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("pause"), TYPING_MS);
      return () => clearTimeout(t);
    }
    if (phase === "pause") {
      const t = setTimeout(() => setPhase("deleting"), PAUSE_MS);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (text.length > 0) {
        const t = setTimeout(
          () => setText(PHRASE.slice(0, text.length - 1)),
          DELETING_MS,
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("typing"), 400);
      return () => clearTimeout(t);
    }
  }, [text, phase]);

  useEffect(() => {
    const t = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <h1
      className={cn(
        "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight max-w-3xl",
        className,
      )}
    >
      <span className="inline-block min-h-[1.2em]">
        {text}
        <span
          className={cn(
            "text-primary align-middle transition-opacity duration-75",
            showCursor ? "opacity-100" : "opacity-0",
          )}
        >
          {CURSOR}
        </span>
      </span>
    </h1>
  );
}
