"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Search, Type } from "lucide-react";
import { NEON_FONTS, FONT_CATEGORIES, getFont, type FontCategory, type NeonFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface FontPickerProps {
  value: string;
  onChange: (id: string) => void;
}

/** Searchable font chooser — every option rendered in its own typeface */
export function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const active = getFont(value);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FONT_CATEGORIES.map((cat) => ({
      cat,
      fonts: NEON_FONTS.filter(
        (f) =>
          f.category === (cat.id as FontCategory) &&
          (!q || f.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q))
      ),
    })).filter((g) => g.fonts.length > 0);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="font-picker-list"
          aria-haspopup="listbox"
          aria-label={`Font: ${active.name}. Click to browse all fonts`}
          className={cn(
            "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 text-left shadow-sm transition-all",
            "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open && "border-primary/60 ring-2 ring-ring/20"
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Type className="h-4 w-4 shrink-0 text-primary/70" />
            <span
              className="truncate text-[20px] leading-tight text-foreground"
              style={{ fontFamily: `"${active.family}", "Inter", sans-serif`, fontWeight: active.weight }}
            >
              {active.name}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id="font-picker-list"
        align="start"
        className="w-[var(--radix-popover-trigger-width)] rounded-2xl p-0"
        sideOffset={6}
      >
        <div className="border-b p-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts…"
              className="h-10 rounded-lg border-input pl-9 text-[13.5px]"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-[340px]">
          <div className="grid grid-cols-3 gap-2 p-3">
            {groups.map(({ cat, fonts }) => (
              <div key={cat.id} className="col-span-3 grid grid-cols-3 gap-2">
                <div className="col-span-3 mt-2 flex items-center gap-2 first:mt-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {cat.name}
                  </span>
                  <span className="h-px flex-1 bg-border/60" />
                </div>
                {fonts.map((f) => (
                  <FontOption
                    key={f.id}
                    font={f}
                    active={f.id === value}
                    onPick={() => {
                      onChange(f.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  />
                ))}
              </div>
            ))}
            {groups.length === 0 && (
              <div className="col-span-3 py-8 text-center text-[13px] text-muted-foreground">
                No font matches “{query}”
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function FontOption({
  font,
  active,
  onPick,
}: {
  font: NeonFont;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onPick}
      title={font.name}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-3 transition-all duration-200",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/50"
      )}
    >
      <span
        className={cn(
          "truncate text-[17px] leading-snug transition-colors",
          active ? "text-primary" : "text-foreground/75"
        )}
        style={{ fontFamily: `"${font.family}", "Inter", sans-serif`, fontWeight: font.weight }}
      >
        Neon
      </span>
      <span className="mt-1 w-full truncate text-center text-[10px] leading-tight text-muted-foreground">
        {font.name}
      </span>
      {active && (
        <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
