"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MousePointerClick, Wand2 } from "lucide-react";
import { NeonCanvas } from "@/components/neon/NeonCanvas";
import { useDesign } from "@/lib/design-store";
import { getColor, type NeonSpec } from "@/lib/neon";

interface Preset {
  text: string;
  fontId: string;
  colorId: string;
  label: string;
  widthCm?: number;
}

const PRESETS: Preset[] = [
  { text: "کافه آرام", fontId: "lalezar", colorId: "aqua", label: "کافه و بistro", widthCm: 80 },
  { text: "HOME", fontId: "pacifico", colorId: "rose", label: "دکور خانه", widthCm: 60 },
  { text: "خوش آمدید", fontId: "naskh", colorId: "warm-white", label: "مغازه و ویترین", widthCm: 100 },
  { text: "COFFEE", fontId: "monoton", colorId: "gold", label: "رترو", widthCm: 80 },
  { text: "باز شد", fontId: "vazir", colorId: "green", label: "افتتاحیه", widthCm: 80 },
  { text: "Amore", fontId: "vibes", colorId: "violet", label: "رومانتیک", widthCm: 60 },
];

export function Gallery() {
  const applyPreset = useDesign((s) => s.applyPreset);

  function handleApply(p: Preset) {
    applyPreset({ text: p.text, fontId: p.fontId, colorId: p.colorId, widthCm: p.widthCm });
    document.getElementById("designer")?.scrollIntoView({ behavior: "smooth" });
    toast.success(`طرح «${p.text}» در ابزار طراحی اعمال شد.`);
  }

  return (
    <section id="gallery" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
            <Wand2 className="ml-1 h-3 w-3" />
            ساخته‌شده با این ابزار
          </Badge>
          <h2 className="section-title">نمونه طرح‌های زنده</h2>
          <p className="mx-auto mt-3 max-w-lg text-[14px] leading-7 text-muted-foreground">
            این‌ها عکس نیستند؛ همان موتور نئونِ ابزار طراحی‌اند. روی هر طرح کلیک
            کن تا تنظیماتش بیاید داخل ابزار و از همان‌جا ادامه بده.
          </p>
          <div className="section-rule" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {PRESETS.map((p, i) => {
            const spec: NeonSpec = {
              lines: p.text.split("\n"),
              fontId: p.fontId,
              colorId: p.colorId,
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
                className="group text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
                aria-label={`اعمال طرح ${p.text} در ابزار طراحی`}
              >
                <Card className="h-full overflow-hidden rounded-2xl border-border/70 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/10 dark:group-hover:shadow-black/40">
                  <div className="relative">
                    <NeonCanvas spec={spec} aspect={1.55} />
                    {/* اورلی هاور */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 backdrop-blur-0 transition-all duration-300 group-hover:bg-black/45 group-hover:opacity-100">
                      <span className="flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-[12.5px] font-bold text-foreground shadow-lg">
                        <MousePointerClick className="h-4 w-4 text-primary" />
                        اعمال در ابزار طراحی
                      </span>
                    </div>
                  </div>
                  <CardContent className="flex items-center justify-between gap-2 p-4">
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-bold" dir="auto">
                        {p.text}
                      </span>
                      <span className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {p.label}
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
      </div>
    </section>
  );
}
