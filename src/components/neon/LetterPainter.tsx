"use client";

import { textTokens, hasRTL } from "@/lib/neon";
import { getColor } from "@/lib/colors";
import { Paintbrush, Eraser, MousePointerClick, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Per-letter painting. For Latin text every character is a chip; for
 * Kurdish/Persian (connected script) every WORD is a chip — letters
 * inside a word are physically joined in Arabic script, so the word is
 * the smallest unit a real neon tube can be colored in.
 */
export function LetterPainter({
  text,
  letterColors,
  brushColorId,
  onPaint,
  onClear,
}: {
  text: string;
  letterColors: Record<number, string>;
  brushColorId: string;
  onPaint: (index: number) => void;
  onClear: () => void;
}) {
  const tokens = textTokens(text);
  const rtl = hasRTL(text);
  const paintedCount = tokens.filter((g) => letterColors[g.index]).length;
  const brush = getColor(brushColorId);

  if (tokens.length === 0) {
    return (
      <p className="text-[12px] italic text-muted-foreground">
        Type some text first, then paint each {rtl ? "word" : "letter"}.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <div
        dir={rtl ? "rtl" : "ltr"}
        className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-muted/30 p-2.5"
      >
        {tokens.map((g) => {
          const id = letterColors[g.index];
          const c = id ? getColor(id) : null;
          const clickable = g.ch.trim() !== "";
          return (
            <button
              key={g.index}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onPaint(g.index)}
              aria-label={
                clickable
                  ? `${rtl ? "Word" : "Letter"} ${g.ch}${c ? `, painted ${c.name}` : ", not painted"} — click to paint with ${brush.name}`
                  : undefined
              }
              className={cn(
                "rounded-lg border px-1.5 py-1 font-semibold leading-5 transition-all",
                rtl
                  ? "text-[15px]"
                  : "min-w-7 text-[15px]",
                clickable
                  ? "border-border hover:-translate-y-0.5 hover:border-primary/50"
                  : "cursor-default border-transparent text-transparent"
              )}
              style={
                c
                  ? {
                      color: c.tube,
                      textShadow: `0 0 9px ${c.glow}, 0 0 22px ${c.glow}`,
                      borderColor: `${c.glow}66`,
                      background: `${c.glow}14`,
                    }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {g.ch === " " ? "·" : g.ch}
            </button>
          );
        })}
      </div>

      {rtl && (
        <p className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] leading-5 text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Kurdish &amp; Persian letters join inside a word — so whole words are
          painted, exactly like the glass tubes of a real sign.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11.5px] leading-5 text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
          Click a {rtl ? "word" : "letter"} here or directly on the preview to paint it.
        </p>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
            <Paintbrush className="h-3.5 w-3.5" style={{ color: brush.tube }} />
            Brush: {brush.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={paintedCount === 0}
            className={cn(
              "flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11.5px] font-semibold transition-all",
              paintedCount > 0
                ? "text-destructive hover:border-destructive/50 hover:bg-destructive/10"
                : "cursor-not-allowed text-muted-foreground/50"
            )}
          >
            <Eraser className="h-3 w-3" />
            Clear {paintedCount > 0 && `(${paintedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
