"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MousePointerClick, Wand2 } from "lucide-react";
import { NeonCanvas } from "@/components/neon/NeonCanvas";
import { useDesign } from "@/lib/design-store";
import { getColor, type NeonSpec, type ColorMode } from "@/lib/neon";

interface Preset {
  text: string;
  fontId: string;
  colorId: string;
  colorId2?: string;
  mode?: ColorMode;
  label: string;
  widthCm?: number;
}

const PRESETS: Preset[] = [
  { text: "Good Vibes", fontId: "pacifico", colorId: "rose", colorId2: "hotpink", mode: "gradient", label: "Bestseller", widthCm: 80 },
  { text: "COFFEE", fontId: "monoton", colorId: "gold", label: "Retro Café", widthCm: 80 },
  { text: "love you more", fontId: "greatvibes", colorId: "hotpink", label: "Romantic", widthCm: 70 },
  { text: "WELCOME", fontId: "bebas", colorId: "warmwhite", label: "Storefront", widthCm: 100 },
  { text: "stay wild", fontId: "sacramento", colorId: "aqua", colorId2: "mint", mode: "gradient", label: "Boho Decor", widthCm: 60 },
  { text: "PARADISE", fontId: "righteous", colorId: "coral", label: "Beach Bar", widthCm: 80 },
  { text: "HOME", fontId: "lobster", colorId: "orange", label: "Home Decor", widthCm: 60 },
  { text: "OPEN 24/7", fontId: "audiowide", colorId: "green", label: "Open Sign", widthCm: 80 },
  { text: "Be Kind", fontId: "dancing", colorId: "violet", colorId2: "ice", mode: "gradient", label: "Inspirational", widthCm: 70 },
  { text: "MAMA", fontId: "passion", colorId: "rose", colorId2: "magenta", mode: "duo", label: "Gift Idea", widthCm: 50 },
  { text: "GLOW", fontId: "marker", colorId: "lemon", mode: "rainbow", label: "Fun & Games", widthCm: 60 },
  { text: "The Bar", fontId: "yellowtail", colorId: "red", label: "Lounge", widthCm: 80 },
];

export function Gallery() {
  const applyPreset = useDesign((s) => s.applyPreset);

  function handleApply(p: Preset) {
    applyPreset({
      text: p.text,
      fontId: p.fontId,
      colorId: p.colorId,
      colorId2: p.colorId2,
      mode: p.mode,
      widthCm: p.widthCm,
    });
    document.getElementById("designer")?.scrollIntoView({ behavior: "smooth" });
    toast.success(`“${p.text}” loaded into the studio.`);
  }

  return (
    <section id="gallery" className="scroll-mt-24 pb-16">
      <div className="mb-8 text-center">
        <Badge variant="outline" className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
          <Wand2 className="mr-1 h-3 w-3" />
          Made with this studio
        </Badge>
        <h2 className="section-title">Start from a design</h2>
        <p className="mx-auto mt-3 max-w-lg text-[14px] leading-7 text-muted-foreground">
          These are live renders — not photos. Tap any design to load its exact
          settings into the studio and keep tweaking.
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
            on: true,
            wall: "night",
          };
          const color = getColor(p.colorId);
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
                      {p.mode && p.mode !== "solid" ? " · " + p.mode : ""}
                    </span>
                  </div>
                  <span
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 38% 35%, ${color.tube}, ${color.glow} 70%)`,
                      boxShadow: `0 0 12px 1px ${color.glow}`,
                    }}
                    aria-hidden="true"
                  />
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
