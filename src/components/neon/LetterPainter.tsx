"use client";

import { textGlyphs } from "@/lib/neon";
import { getColor } from "@/lib/colors";
import { Paintbrush, Eraser, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Per-letter painting: every character of the text becomes a chip.
 * Click a chip (or the letter on the preview) to paint it with the
 * active palette color; clicking a chip already in that color resets it.
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
  const glyphs = textGlyphs(text);
  const paintedCount = glyphs.filter((g) => letterColors[g.index]).length;
  const brush = getColor(brushColorId);

  if (glyphs.length === 0) {
    return (
      <p className="text-[12px] italic text-muted-foreground">
        Type some text first, then paint each letter.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-muted/30 p-2.5">
        {glyphs.map((g) => {
          const id = letterColors[g.index];
          const c = id ? getColor(id) : null;
          const clickable = g.ch !== " ";
          return (
            <button
              key={g.index}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onPaint(g.index)}
              aria-label={
                clickable
                  ? `Letter ${g.ch}${c ? `, painted ${c.name}` : ", not painted"} — click to paint with ${brush.name}`
                  : undefined
              }
              className={cn(
                "min-w-7 rounded-lg border px-1.5 py-1 text-[15px] font-semibold leading-5 transition-all",
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11.5px] leading-5 text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
          Click a letter here or directly on the preview to paint it.
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
