"use client";

import { NEON_COLORS, type NeonColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

/** one glowing palette swatch */
export function ColorSwatch({
  color,
  active,
  onClick,
  size = "md",
  title,
  ariaLabel,
  disabled,
}: {
  color: NeonColor;
  active: boolean;
  onClick: () => void;
  size?: "md" | "sm";
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const dim = size === "md" ? "h-10 w-10" : "h-8 w-8";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? color.name}
      title={title ?? color.name}
      disabled={disabled}
      className={cn(
        "relative rounded-full border-2 transition-transform duration-200",
        dim,
        active ? "scale-110 border-foreground/70 dark:border-white/80" : "border-transparent hover:scale-105",
        disabled && "cursor-not-allowed opacity-35 hover:scale-100"
      )}
      style={{
        background: `radial-gradient(circle at 38% 35%, ${color.tube}, ${color.glow} 70%)`,
        boxShadow: active
          ? `0 0 16px 2px ${color.glow}, 0 0 4px 1px ${color.tube} inset`
          : `0 0 8px 0 ${color.glow}55`,
      }}
    >
      <span className="absolute inset-[30%] rounded-full bg-white/70 mix-blend-screen" />
    </button>
  );
}

/** the full 23-color palette as a radiogroup */
export function ColorPalette({
  value,
  onChange,
  ariaLabel = "Neon color",
}: {
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={ariaLabel}>
      {NEON_COLORS.map((c) => (
        <ColorSwatch key={c.id} color={c} active={c.id === value} onClick={() => onChange(c.id)} />
      ))}
    </div>
  );
}

/**
 * Palette used as a multi-select list editor (flow / cycle modes):
 * click a swatch to add it to the list, click again to remove it.
 */
export function ColorListPicker({
  ids,
  max,
  onChange,
  ariaLabel,
}: {
  ids: string[];
  max: number;
  onChange: (ids: string[]) => void;
  ariaLabel: string;
}) {
  const full = ids.length >= max;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {NEON_COLORS.map((c) => {
        const idx = ids.indexOf(c.id);
        const active = idx >= 0;
        return (
          <ColorSwatch
            key={c.id}
            color={c}
            size="sm"
            active={active}
            disabled={!active && full}
            title={
              active
                ? `${c.name} — click to remove`
                : full
                  ? `${c.name} — list is full (${max})`
                  : `${c.name} — click to add`
            }
            onClick={() => {
              if (active) {
                onChange(ids.filter((x) => x !== c.id));
              } else if (!full) {
                onChange([...ids, c.id]);
              }
            }}
          />
        );
      })}
    </div>
  );
}

/** the ordered list of picked colors with remove buttons */
export function ColorChipList({
  ids,
  onRemove,
  emptyHint,
}: {
  ids: string[];
  onRemove: (id: string) => void;
  emptyHint: string;
}) {
  if (ids.length === 0) {
    return <p className="text-[12px] italic text-muted-foreground">{emptyHint}</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Selected colors">
      {ids.map((id) => {
        const c = NEON_COLORS.find((x) => x.id === id);
        if (!c) return null;
        return (
          <span
            key={id}
            className="group relative inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 py-1 pl-1.5 pr-2.5 text-[11.5px] font-semibold"
          >
            <span
              className="h-5 w-5 rounded-full"
              style={{
                background: `radial-gradient(circle at 38% 35%, ${c.tube}, ${c.glow} 70%)`,
                boxShadow: `0 0 10px 1px ${c.glow}`,
              }}
              aria-hidden="true"
            />
            {c.name}
            <button
              type="button"
              onClick={() => onRemove(id)}
              aria-label={`Remove ${c.name}`}
              className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </span>
        );
      })}
    </div>
  );
}
