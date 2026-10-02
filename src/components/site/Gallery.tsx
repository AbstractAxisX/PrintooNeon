"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MousePointerClick, Wand2 } from "lucide-react";
import { NeonCanvas } from "@/components/neon/NeonCanvas";
import { useDesign, type Preset } from "@/lib/design-store";
import { getColor } from "@/lib/colors";
import type { ColorMode, NeonSpec } from "@/lib/neon";

interface GalleryPreset extends Preset {
  label: string;
  modeBadge?: ColorMode;
}

const PRESETS: GalleryPreset[] = [
  {
    text: "Good Vibes", fontId: "pacifico", colorId: "rose", colorId2: "hotpink",
    mode: "gradient", backgroundId: "brick", label: "Bestseller", modeBadge: "gradient", widthCm: 80,
  },
  {
    text: "COFFEE", fontId: "monoton", colorId: "gold",
    backgroundId: "concrete", label: "Retro Café", widthCm: 80,
  },
  {
    text: "love you more", fontId: "greatvibes", colorId: "hotpink",
    mode: "cycle", cycleColors: ["hotpink", "rose", "violet"], cycleHold: 1.5, cycleFade: 1,
    backgroundId: "plaster", label: "Romantic fade", modeBadge: "cycle", widthCm: 70,
  },
  {
    text: "WELCOME", fontId: "bebas", colorId: "warmwhite",
    backgroundId: "wood", label: "Storefront", widthCm: 100,
  },
  {
    text: "stay wild", fontId: "sacramento", colorId: "aqua",
    mode: "flow", flowColors: ["aqua", "mint", "ice", "violet"], flowSpeed: 1,
    backgroundId: "solid-charcoal", label: "RGB flow", modeBadge: "flow", widthCm: 60,
  },
  {
    text: "GLOW", fontId: "righteous", colorId: "warmwhite",
    mode: "perLetter", letterColors: { 0: "green", 1: "lemon", 2: "orange", 3: "warmwhite" },
    backgroundId: "brick", label: "Per-letter art", modeBadge: "perLetter", widthCm: 60,
  },
  {
    text: "OPEN 24/7", fontId: "audiowide", colorId: "green",
    mode: "cycle", cycleColors: ["green", "ice"], cycleHold: 1, cycleFade: 0.6,
    backgroundId: "solid-black", label: "Open sign", modeBadge: "cycle", widthCm: 80,
  },
  {
    text: "PARADISE", fontId: "righteous", colorId: "coral",
    mode: "flow", flowColors: ["coral", "gold", "hotpink", "peach"], flowSpeed: 0.75,
    backgroundId: "wood", label: "Beach bar", modeBadge: "flow", widthCm: 80,
  },
  {
    text: "dream big", fontId: "alexbrush", colorId: "violet", colorId2: "ice",
    mode: "gradient", backgroundId: "solid-charcoal", label: "Elegant", modeBadge: "gradient", widthCm: 70,
  },
  {
    text: "MUSIC", fontId: "orbitron", colorId: "ice",
    mode: "flow", flowColors: ["ice", "ultra", "hotpink"], flowSpeed: 1.25,
    backgroundId: "solid-black", label: "Night club", modeBadge: "flow", widthCm: 80,
  },
  {
    text: "The Bar", fontId: "yellowtail", colorId: "red", colorId2: "orange",
    mode: "gradient", backgroundId: "brick", label: "Lounge", modeBadge: "gradient", widthCm: 80,
  },
  {
    text: "Be Kind", fontId: "dancing", colorId: "violet",
    mode: "cycle", cycleColors: ["violet", "ice", "mint"], cycleHold: 1.2, cycleFade: 0.9,
    backgroundId: "plaster", label: "Inspirational", modeBadge: "cycle", widthCm: 70,
  },
];

const MODE_BADGE_LABEL: Record<ColorMode, string> = {
  solid: "",
  gradient: "Gradient",
  flow: "Flow",
  perLetter: "Per letter",
  cycle: "Cycle",
};

export function Gallery() {
  const applyPreset = useDesign((s) => s.applyPreset);

  function handleApply(p: GalleryPreset) {
    applyPreset(p);
    document.getElementById("designer")?.scrollIntoView({ behavior: "smooth" });
    toast.success(`“${p.text}” loaded into the studio.`);
  }

  return (
    <section id="gallery" className="scroll-mt-24 pb-16">
      <div className="mb-8 text-center">
        <Badge
          variant="outline"
          className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-accent-foreground dark:text-primary"
        >
          <Wand2 className="mr-1 h-3 w-3" />
          Made with this studio
        </Badge>
        <h2 className="section-title">Start from a design</h2>
        <p className="mx-auto mt-3 max-w-lg text-[14px] leading-7 text-muted-foreground">
          These are live renders — not photos. Flow and cycle samples are
          actually animating. Tap any design to load its exact settings into
          the studio and keep tweaking.
        </p>
        <div className="section-rule" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {PRESETS.map((p, i) => {
          const spec: NeonSpec = {
            lines: p.text.split("\n"),
            fontId: p.fontId,
            colorId: p.colorId,
            colorId2: p.colorId2,
            mode: p.mode,
            letterColors: p.letterColors,
            flowColors: p.flowColors,
            flowSpeed: p.flowSpeed,
            cycleColors: p.cycleColors,
            cycleHold: p.cycleHold,
            cycleFade: p.cycleFade,
            background: { id: p.backgroundId ?? "brick" },
            on: true,
          };
          const colorIds =
            p.mode === "gradient"
              ? [p.colorId, p.colorId2 ?? "ice"]
              : p.mode === "flow"
                ? p.flowColors ?? []
                : p.mode === "cycle"
                  ? p.cycleColors ?? []
                  : [p.colorId];
          return (
            <motion.button
              key={p.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              onClick={() => handleApply(p)}
              className="group rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Load the design “${p.text}” into the studio`}
            >
              <Card className="h-full overflow-hidden rounded-2xl border-border/70 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/10 dark:group-hover:shadow-black/40">
                <div className="relative">
                  <NeonCanvas spec={spec} aspect={1.55} />
                  {/* hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 backdrop-blur-0 transition-all duration-300 group-hover:bg-black/45 group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-[12.5px] font-bold text-foreground shadow-lg">
                      <MousePointerClick className="h-4 w-4 text-primary" />
                      Load into studio
                    </span>
                  </div>
                </div>
                <CardContent className="flex items-center justify-between gap-2 p-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[14.5px] font-bold" dir="auto">
                      {p.text}
                    </span>
                    <span className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {p.label}
                      {p.modeBadge ? ` · ${MODE_BADGE_LABEL[p.modeBadge]}` : ""}
                    </span>
                  </div>
                  <span className="flex shrink-0 -space-x-1" aria-hidden="true">
                    {colorIds.slice(0, 4).map((id, j) => {
                      const c = getColor(id);
                      return (
                        <span
                          key={`${p.text}-${id}-${j}`}
                          className="h-6 w-6 rounded-full border-2 border-card"
                          style={{
                            background: `radial-gradient(circle at 38% 35%, ${c.tube}, ${c.glow} 70%)`,
                            boxShadow: `0 0 10px 1px ${c.glow}`,
                          }}
                        />
                      );
                    })}
                    {colorIds.length > 4 && (
                      <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-muted text-[9px] font-bold text-muted-foreground">
                        +{colorIds.length - 4}
                      </span>
                    )}
                  </span>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
