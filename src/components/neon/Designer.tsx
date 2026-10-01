"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMounted } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Droplets,
} from "lucide-react";
import { NeonCanvas } from "./NeonCanvas";
import { OrderDialog } from "./OrderDialog";
import {
  NEON_COLORS,
  NEON_FONTS,
  COLOR_MODES,
  downloadNeonPng,
  estimateSizeCm,
  getMode,
  type NeonSpec,
  type NeonLayout,
  type ColorMode,
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
    colorId2,
    mode,
    widthCm,
    on,
    wall,
    flicker,
    setText,
    setFont,
    setColor,
    setColor2,
    setMode,
    setSize,
    setOn,
    setWall,
    setFlicker,
  } = useDesign();

  const [orderOpen, setOrderOpen] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [miniVisible, setMiniVisible] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // rehydrate the persisted draft AFTER mount (avoids SSR hydration mismatch)
  useEffect(() => {
    useDesign.persist.rehydrate();
  }, []);

  const spec: NeonSpec = useMemo(
    () => ({
      lines: splitLines(text),
      fontId,
      colorId,
      colorId2,
      mode,
      on,
      wall,
      flicker,
    }),
    [text, fontId, colorId, colorId2, mode, on, wall, flicker]
  );

  const lines = splitLines(text);
  const hasText = lines.some((l) => l.trim().length > 0);
  const totalChars = text.length;
  const overflowLine = lines.findIndex((l) => l.length > MAX_CHARS_PER_LINE);
  const usesSecondColor = mode === "gradient" || mode === "duo";

  /* ---- floating mini preview (mobile): show when the real preview scrolled away ---- */
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      setMiniVisible(r.bottom < 72);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    raf = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

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
    if (ok) toast.success("High-quality image downloaded.");
    else toast.error("Could not download the image.");
  }

  const activeColor = NEON_COLORS.find((c) => c.id === colorId) ?? NEON_COLORS[0];
  const activeColor2 = NEON_COLORS.find((c) => c.id === colorId2) ?? NEON_COLORS[1];

  return (
    <section id="designer" className="scroll-mt-24">
      {/* ---------- section header ---------- */}
      <div className="mb-8 text-center">
        <Badge variant="outline" className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
          <Zap className="mr-1 h-3 w-3" />
          Live design studio
        </Badge>
        <h1 className="section-title">Create your neon sign</h1>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-7 text-muted-foreground">
          Type your text, pick a font and color, and watch it light up on the
          wall in real time — rendered like real glass-tube neon.
        </p>
        <div className="section-rule" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        {/* ================= preview ================= */}
        <Card className="min-w-0 overflow-hidden rounded-2xl border-border/70 shadow-lg shadow-black/[0.04] dark:shadow-black/30">
          {/* toolbar above the wall — plain buttons, no toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
            {/* wall: night / day */}
            <div className="flex items-center gap-1.5" role="group" aria-label="Preview wall">
              <button
                type="button"
                aria-pressed={wall === "night"}
                onClick={() => setWall("night")}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-all",
                  wall === "night"
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Moon className="h-3.5 w-3.5" />
                Night
              </button>
              <button
                type="button"
                aria-pressed={wall === "day"}
                onClick={() => setWall("day")}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-all",
                  wall === "day"
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Sun className="h-3.5 w-3.5" />
                Day
              </button>
            </div>

            {/* power & flicker — single press buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-pressed={flicker}
                disabled={!on}
                onClick={() => setFlicker(!flicker)}
                title={flicker ? "Turn flicker off" : "Turn flicker on (like real neon)"}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-all",
                  !on && "cursor-not-allowed opacity-40",
                  flicker && on
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Zap className="h-3.5 w-3.5" />
                Flicker
              </button>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setOn(!on)}
                title={on ? "Switch the sign off" : "Switch the sign on"}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-all",
                  on
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Power className="h-3.5 w-3.5" />
                {on ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* the wall */}
          <div ref={previewRef} className="bg-dots scroll-mt-20 bg-muted/20 p-3 sm:p-5">
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

          {/* bottom bar: size + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3.5">
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Ruler className="h-4 w-4" />
              {estimate ? (
                <span className="font-semibold tabular-nums text-foreground/80">
                  ≈ {estimate.widthCm} × {estimate.heightCm} cm
                </span>
              ) : (
                <span>Dimensions appear once you type…</span>
              )}
              <span className="hidden text-muted-foreground/70 sm:inline">(approx.)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!hasText}
                className="gap-2 rounded-lg"
              >
                <Download className="h-4 w-4" />
                Save image
              </Button>
              <Button
                onClick={() => setOrderOpen(true)}
                disabled={!hasText}
                className="gap-2 rounded-lg font-bold shadow-md shadow-primary/25"
              >
                <ShoppingBag className="h-4 w-4" />
                Order this design
              </Button>
            </div>
          </div>
        </Card>

        {/* ================= controls ================= */}
        <Card className="min-w-0 rounded-2xl border-border/70">
          <CardContent className="flex flex-col gap-7 p-5 sm:p-6">
            {/* text */}
            <div>
              <div className="field-label">
                <PenLine className="h-4 w-4 text-primary/80" />
                Sign text
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  max {MAX_LINES} lines · {MAX_CHARS_PER_LINE} chars each
                </span>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"Your text…\ne.g. Good Vibes"}
                rows={3}
                className="resize-none rounded-xl text-[15px] leading-8"
                maxLength={MAX_LINES * (MAX_CHARS_PER_LINE + 1) - 1}
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
                <span>{totalChars} / {MAX_LINES * (MAX_CHARS_PER_LINE + 1) - 1} characters</span>
                {!hasText && (
                  <span className="text-primary/70">Type something to begin ✨</span>
                )}
                {overflowLine >= 0 && (
                  <span className="font-medium text-destructive">
                    Line {overflowLine + 1} is over {MAX_CHARS_PER_LINE} chars — it will be trimmed in the preview
                  </span>
                )}
              </div>
            </div>

            {/* font — grid, no horizontal scroll */}
            <div>
              <div className="field-label">
                <Type className="h-4 w-4 text-primary/80" />
                Font
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  {NEON_FONTS.find((f) => f.id === fontId)?.name}
                </span>
              </div>
              <div
                className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                role="radiogroup"
                aria-label="Font choice"
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
                        "relative flex min-w-0 flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all duration-200",
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
                        style={{
                          fontFamily: `"${f.family}", "Inter", sans-serif`,
                          fontWeight: f.weight,
                        }}
                      >
                        Neon
                      </span>
                      <span className="mt-1 w-full truncate text-center text-[10.5px] text-muted-foreground">
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

            {/* color mode */}
            <div>
              <div className="field-label">
                <Droplets className="h-4 w-4 text-primary/80" />
                Color mode
              </div>
              <div
                className="grid grid-cols-4 gap-1.5"
                role="radiogroup"
                aria-label="Color mode"
              >
                {COLOR_MODES.map((m) => {
                  const active = getMode(mode) === m.id;
                  return (
                    <button
                      key={m.id}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "rounded-lg border py-2.5 text-[12.5px] font-bold transition-all",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                          : "border-border text-foreground/70 hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* primary color */}
            <div>
              <div className="field-label">
                <Palette className="h-4 w-4 text-primary/80" />
                {usesSecondColor ? "Main color" : "Neon color"}
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  {activeColor.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Neon color">
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
                        "relative h-10 w-10 rounded-full border-2 transition-transform duration-200",
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

            {/* second color (gradient / two-tone only) */}
            {usesSecondColor && (
              <div>
                <div className="field-label">
                  <Palette className="h-4 w-4 text-primary/80" />
                  Second color
                  <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                    {activeColor2.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Second neon color">
                  {NEON_COLORS.map((c) => {
                    const active = c.id === colorId2;
                    return (
                      <button
                        key={c.id}
                        role="radio"
                        aria-checked={active}
                        aria-label={c.name}
                        title={c.name}
                        onClick={() => setColor2(c.id)}
                        className={cn(
                          "relative h-10 w-10 rounded-full border-2 transition-transform duration-200",
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
            )}

            {/* size */}
            <div>
              <div className="field-label">
                <Ruler className="h-4 w-4 text-primary/80" />
                Sign width (cm)
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  {estimate ? `height ≈ ${estimate.heightCm} cm` : ""}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Sign width">
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
                Total width from the first to the last tube. The final size is
                confirmed after we review your design.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- floating mini preview (mobile only) ---------- */}
      <AnimatePresence>
        {miniVisible && mounted && !orderOpen && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-3 bottom-3 z-40 lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              type="button"
              onClick={() =>
                previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="relative block w-full overflow-hidden rounded-2xl border bg-background/90 shadow-2xl shadow-black/25 ring-1 ring-black/10 backdrop-blur dark:ring-white/10"
              aria-label="Jump back to the live preview"
            >
              <NeonCanvas spec={spec} aspect={2.6} />
              <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[10.5px] font-bold text-muted-foreground shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Live preview · tap to open
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* order dialog */}
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
