"use client";

import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Check, Search, Type } from "lucide-react";
import { NEON_FONTS, FONT_CATEGORIES, getFont, type FontCategory, type NeonFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface FontAccordionProps {
  value: string;
  onChange: (id: string) => void;
}

/**
 * Inline font accordion — expands in place (no modal/popover).
 * Header shows the active font in its own typeface; the content holds a
 * searchable, category-grouped grid. Stays open while browsing so the
 * live preview (and the mobile floating preview) react to every pick.
 */
export function FontAccordion({ value, onChange }: FontAccordionProps) {
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
    <Accordion
      type="single"
      collapsible
      className="rounded-xl border border-border bg-background shadow-sm"
    >
      <AccordionItem value="fonts" className="border-b-0 px-4">
        <AccordionTrigger
          className={cn(
            "gap-3 py-3.5 text-sm font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180"
          )}
          aria-label={`Font: ${active.name}. Click to browse all ${NEON_FONTS.length} fonts`}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <Type className="h-4 w-4 shrink-0 text-primary/70" />
            <span
              className="truncate text-[20px] leading-tight text-foreground"
              style={{
                fontFamily: `"${active.family}", "Inter", sans-serif`,
                fontWeight: active.weight,
              }}
            >
              {active.name}
            </span>
          </span>
          <span className="hidden shrink-0 text-[11px] font-normal text-muted-foreground sm:inline">
            {NEON_FONTS.length} typefaces · searchable
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts…"
              className="h-10 rounded-lg border-input pl-9 text-[13.5px]"
            />
          </div>
          {/* Full height — no scrolling box, no clipping: every font is
              rendered in place and the page itself scrolls. */}
          <div>
            <div className="grid grid-cols-3 gap-2">
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
                      onPick={() => onChange(f.id)}
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
          </div>
          <p className="mt-2.5 text-[11px] leading-5 text-muted-foreground">
            The preview updates live while you browse fonts.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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
