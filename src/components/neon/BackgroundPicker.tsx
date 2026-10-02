"use client";

import { BACKGROUNDS, resolveBackground } from "@/lib/backgrounds";
import { cn } from "@/lib/utils";
import { ImageIcon, Plus } from "lucide-react";

/**
 * Preview background picker: 4 generated wall photos, 6 solid colors
 * and a custom color input.
 */
export function BackgroundPicker({
  backgroundId,
  customColor,
  onChange,
}: {
  backgroundId: string;
  customColor: string;
  onChange: (id: string, custom?: string) => void;
}) {
  const images = BACKGROUNDS.filter((b) => b.kind === "image");
  const solids = BACKGROUNDS.filter((b) => b.kind === "solid");
  const activeDef = resolveBackground({ id: backgroundId, customColor });
  const isCustom = backgroundId === "custom";

  return (
    <div className="space-y-3">
      {/* wall photos */}
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Wall photo background">
        {images.map((b) => {
          const active = backgroundId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(b.id)}
              title={`${b.name} wall`}
              className={cn(
                "relative h-14 overflow-hidden rounded-xl border transition-all",
                active
                  ? "border-primary shadow-md shadow-primary/20 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40"
              )}
            >
              {/* wall photo thumbnails are plain <img> on purpose (canvas-adjacent UI) */}
              <img src={b.src} alt={`${b.name} wall background`} className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[11px] font-bold text-white backdrop-blur-sm">
                {b.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* solid colors */}
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Solid background color">
        {solids.map((b) => {
          const active = backgroundId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(b.id)}
              title={b.name}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform duration-200",
                active
                  ? "scale-110 border-foreground/70 dark:border-white/80"
                  : "border-border/60 hover:scale-105"
              )}
              style={{ backgroundColor: b.color }}
            />
          );
        })}

        {/* custom color */}
        <label
          className={cn(
            "relative grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 transition-transform duration-200",
            isCustom
              ? "scale-110 border-primary"
              : "border-border/60 hover:scale-105"
          )}
          style={
            isCustom
              ? { background: customColor, boxShadow: `0 0 10px 1px ${customColor}` }
              : undefined
          }
          title="Custom solid color"
        >
          <input
            type="color"
            value={isCustom ? customColor : "#1A1714"}
            onChange={(e) => onChange("custom", e.target.value)}
            onClick={(e) => {
              // selecting a color should also switch to the custom background
              (e.target as HTMLInputElement).value = isCustom ? customColor : "#1A1714";
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Custom solid background color"
          />
          {!isCustom && (
            <Plus className="pointer-events-none h-3.5 w-3.5 text-muted-foreground" />
          )}
        </label>
      </div>

      <p className="flex items-center gap-1.5 text-[11.5px] leading-5 text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5 shrink-0" />
        Current background: {activeDef.name}
        {activeDef.kind === "solid" && (
          <span className="font-mono text-[11px] text-muted-foreground/80">{activeDef.color}</span>
        )}
      </p>
    </div>
  );
}
