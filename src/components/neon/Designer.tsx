"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useMounted } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Moon,
  Sun,
  Power,
  Zap,
  Download,
  Ruler,
  Type,
  Palette,
  PenLine,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { NeonCanvas } from "./NeonCanvas";
import { OrderDialog } from "./OrderDialog";
import {
  NEON_COLORS,
  NEON_FONTS,
  downloadNeonPng,
  estimateSizeCm,
  type NeonSpec,
  type NeonLayout,
} from "@/lib/neon";
import {
  useDesign,
  splitLines,
  MAX_LINES,
  MAX_CHARS_PER_LINE,
  SIZE_OPTIONS,
} from "@/lib/design-store";
import { cn } from "@/lib/utils";

export function Designer() {
  const mounted = useMounted();
  const {
    text,
    fontId,
    colorId,
    widthCm,
    on,
    wall,
    flicker,
    setText,
    setFont,
    setColor,
    setSize,
    setOn,
    setWall,
    setFlicker,
  } = useDesign();

  const [orderOpen, setOrderOpen] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const spec: NeonSpec = useMemo(
    () => ({ lines: splitLines(text), fontId, colorId, on, wall, flicker }),
    [text, fontId, colorId, on, wall, flicker]
  );

  const lines = splitLines(text);
  const hasText = lines.some((l) => l.trim().length > 0);
  const totalChars = text.length;

  const handleLayout = useCallback((l: NeonLayout) => {
    setDims((prev) => {
      const next = { w: Math.round(l.width), h: Math.round(l.height) };
      if (prev && prev.w === next.w && prev.h === next.h) return prev;
      return next;
    });
  }, []);

  const estimate = useMemo(() => {
    if (!dims || dims.w <= 0) return null;
    return estimateSizeCm(widthCm, { width: dims.w, height: dims.h, line: [], bottom: 0 });
  }, [dims, widthCm]);

  function handleDownload() {
    const ok = downloadNeonPng(spec, hasText ? text : "neon");
    if (ok) toast.success("تصویر طرح با کیفیت بالا دانلود شد.");
    else toast.error("دانلود تصویر ممکن نشد.");
  }

  const activeColor = NEON_COLORS.find((c) => c.id === colorId) ?? NEON_COLORS[0];

  return (
    <section id="designer" className="scroll-mt-24">
      {/* ---------- سربرگ بخش ---------- */}
      <div className="mb-8 text-center">
        <Badge variant="outline" className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
          <Zap className="ml-1 h-3 w-3" />
          ابزار طراحی زنده
        </Badge>
        <h2 className="section-title">تابلوی نئونت را همین‌جا بساز</h2>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-7 text-muted-foreground">
          متن دلخواهت را بنویس، فونت و رنگ نئون را انتخاب کن؛ نتیجه همان لحظه روی
          دیوار پیش‌نمایش می‌شود. با کیفیتِ لوله‌ی شیشه‌ای واقعی.
        </p>
        <div className="section-rule" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        {/* ================= پیش‌نمایش ================= */}
        <Card className="min-w-0 overflow-hidden rounded-2xl border-border/70 shadow-lg shadow-black/[0.04] dark:shadow-black/30">
          {/* نوار ابزار بالای دیوار */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
            <Tabs
              value={wall}
              onValueChange={(v) => setWall(v as "night" | "day")}
            >
              <TabsList className="h-9 rounded-lg p-1">
                <TabsTrigger value="night" className="gap-1.5 rounded-md px-3 text-[12.5px]">
                  <Moon className="h-3.5 w-3.5" />
                  شب
                </TabsTrigger>
                <TabsTrigger value="day" className="gap-1.5 rounded-md px-3 text-[12.5px]">
                  <Sun className="h-3.5 w-3.5" />
                  روز
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-4">
              <TooltipProvider delayDuration={150}>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Zap
                          className={cn(
                            "h-4 w-4 transition-colors",
                            flicker ? "text-primary" : "text-muted-foreground/60"
                          )}
                        />
                        <Switch
                          checked={flicker}
                          onCheckedChange={setFlicker}
                          aria-label="افکت سوسو زدن"
                          disabled={!on}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11.5px]">
                      افکت سوسو زدن (مثل نئون واقعی)
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Power
                          className={cn(
                            "h-4 w-4 transition-colors",
                            on ? "text-primary" : "text-muted-foreground/60"
                          )}
                        />
                        <Switch
                          checked={on}
                          onCheckedChange={setOn}
                          aria-label="روشن یا خاموش کردن تابلو"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11.5px]">
                      {on ? "خاموش کردن تابلو" : "روشن کردن تابلو"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>

          {/* دیوار پیش‌نمایش */}
          <div className="bg-dots bg-muted/20 p-3 sm:p-5">
            <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/20 ring-1 ring-black/10 dark:ring-white/5">
              {mounted ? (
                <NeonCanvas spec={spec} aspect={1.5} onLayout={handleLayout} />
              ) : (
                <div className="grid aspect-[3/2] w-full place-items-center bg-[#181320]">
                  <Loader2 className="h-7 w-7 animate-spin text-white/40" />
                </div>
              )}
            </div>
          </div>

          {/* نوار پایین: ابعاد + اکشن‌ها */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3.5">
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Ruler className="h-4 w-4" />
              {estimate ? (
                <span dir="ltr" className="font-semibold tabular-nums text-foreground/80">
                  ≈ {estimate.widthCm} × {estimate.heightCm} cm
                </span>
              ) : (
                <span>ابعاد بعد از نوشتن متن…</span>
              )}
              <span className="hidden text-muted-foreground/70 sm:inline">
                (تقریبی)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2 rounded-lg"
              >
                <Download className="h-4 w-4" />
                دانلود تصویر
              </Button>
              <Button
                onClick={() => setOrderOpen(true)}
                className="gap-2 rounded-lg font-bold shadow-md shadow-primary/25"
              >
                <ShoppingBag className="h-4 w-4" />
                ثبت سفارش این طرح
              </Button>
            </div>
          </div>
        </Card>

        {/* ================= کنترل‌ها ================= */}
        <Card className="min-w-0 rounded-2xl border-border/70">
          <CardContent className="flex flex-col gap-7 p-5 sm:p-6">
            {/* متن */}
            <div>
              <div className="field-label">
                <PenLine className="h-4 w-4 text-primary/80" />
                متن تابلو
                <span className="mr-auto text-[11px] font-normal text-muted-foreground">
                  حداکثر {MAX_LINES} خط · هر خط {MAX_CHARS_PER_LINE} کاراکتر
                </span>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"متن دلخواهت…\nمثلاً: کافه آرام"}
                rows={3}
                dir="rtl"
                className="resize-none rounded-xl text-[15px] leading-8"
                maxLength={MAX_LINES * (MAX_CHARS_PER_LINE + 1) - 1}
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{totalChars} کاراکتر</span>
                {!hasText && <span className="text-primary/70">برای شروع، متنی بنویس ✨</span>}
              </div>
            </div>

            {/* فونت */}
            <div>
              <div className="field-label">
                <Type className="h-4 w-4 text-primary/80" />
                فونت نئون
                <span className="mr-auto text-[11px] font-normal text-muted-foreground">
                  {NEON_FONTS.find((f) => f.id === fontId)?.script === "fa" ? "فارسی" : "لاتین"}
                </span>
              </div>
              <div
                className="flex min-w-0 gap-2 overflow-x-auto pb-2.5"
                role="radiogroup"
                aria-label="انتخاب فونت"
              >
                {NEON_FONTS.map((f) => {
                  const active = f.id === fontId;
                  return (
                    <button
                      key={f.id}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFont(f.id)}
                      className={cn(
                        "group relative flex min-w-[92px] shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-3 transition-all duration-200",
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <span
                        dir={f.script === "fa" ? "rtl" : "ltr"}
                        className={cn(
                          "text-[17px] leading-snug transition-colors",
                          active ? "text-primary" : "text-foreground/75"
                        )}
                        style={{
                          fontFamily: `"${f.family}", "Vazirmatn", sans-serif`,
                          fontWeight: f.weight,
                        }}
                      >
                        {f.script === "fa" ? "نئون" : "Neon"}
                      </span>
                      <span className="mt-1 text-[10.5px] text-muted-foreground">
                        {f.name}
                      </span>
                      {active && (
                        <span
                          className="pointer-events-none absolute inset-x-4 bottom-1 h-0.5 rounded-full"
                          style={{
                            background: activeColor.tube,
                            boxShadow: `0 0 8px ${activeColor.glow}`,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* رنگ */}
            <div>
              <div className="field-label">
                <Palette className="h-4 w-4 text-primary/80" />
                رنگ نئون
                <span className="mr-auto text-[11px] font-normal text-muted-foreground">
                  {activeColor.name}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2.5"
                role="radiogroup"
                aria-label="انتخاب رنگ نئون"
              >
                {NEON_COLORS.map((c) => {
                  const active = c.id === colorId;
                  return (
                    <button
                      key={c.id}
                      role="radio"
                      aria-checked={active}
                      aria-label={c.name}
                      title={c.name}
                      onClick={() => setColor(c.id)}
                      className={cn(
                        "relative h-11 w-11 rounded-full border-2 transition-transform duration-200",
                        active
                          ? "scale-110 border-foreground/70 dark:border-white/80"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{
                        background: `radial-gradient(circle at 38% 35%, ${c.tube}, ${c.glow} 70%)`,
                        boxShadow: active
                          ? `0 0 16px 2px ${c.glow}, 0 0 4px 1px ${c.tube} inset`
                          : `0 0 8px 0 ${c.glow}55`,
                      }}
                    >
                      <span className="absolute inset-[30%] rounded-full bg-white/70 mix-blend-screen" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* اندازه */}
            <div>
              <div className="field-label">
                <Ruler className="h-4 w-4 text-primary/80" />
                عرض تابلو (سانتی‌متر)
                <span className="mr-auto text-[11px] font-normal text-muted-foreground">
                  {estimate ? `ارتفاع ≈ ${estimate.heightCm} cm` : ""}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="انتخاب عرض">
                {SIZE_OPTIONS.map((cm) => {
                  const active = cm === widthCm;
                  return (
                    <button
                      key={cm}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSize(cm)}
                      className={cn(
                        "rounded-lg border py-2.5 text-[13px] font-bold tabular-nums transition-all",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                          : "border-border text-foreground/70 hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      {cm}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                عرض کل تابلو از آخرین نقطه‌ی لوله تا ابتدایش. اندازه‌ی نهایی پس از
                بررسی طرح تأیید می‌شود.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* دیالوگ سفارش */}
      {mounted && (
        <OrderDialog
          open={orderOpen}
          onOpenChange={setOrderOpen}
          spec={spec}
          text={text}
          widthCm={widthCm}
        />
      )}
    </section>
  );
}
