"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMounted } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Power,
  Download,
  Ruler,
  Type,
  Palette,
  PenLine,
  ShoppingBag,
  Loader2,
  Droplet,
  Blend,
  Waves,
  Paintbrush,
  Repeat,
  Image as ImageIcon,
  History,
} from "lucide-react";
import { NeonCanvas } from "./NeonCanvas";
import { OrderDialog } from "./OrderDialog";
import { HistoryDialog } from "./HistoryDialog";
import { FontAccordion } from "./FontAccordion";
import { ColorPalette, ColorListPicker, ColorChipList } from "./ColorControls";
import { LetterPainter } from "./LetterPainter";
import { BackgroundPicker } from "./BackgroundPicker";
import {
  COLOR_MODES,
  downloadNeonFile,
  estimateSizeCm,
  getMode,
  hasRTL,
  isAnimatedMode,
  type NeonSpec,
  type NeonLayout,
  type ColorMode,
} from "@/lib/neon";
import { getColor } from "@/lib/colors";
import { NEON_FONTS, getFont } from "@/lib/fonts";
import {
  useDesign,
  splitLines,
  MAX_LINES,
  MAX_CHARS_PER_LINE,
  SIZE_OPTIONS,
  FLOW_MAX_COLORS,
  CYCLE_MAX_COLORS,
} from "@/lib/design-store";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<ColorMode, React.ComponentType<{ className?: string }>> = {
  solid: Droplet,
  gradient: Blend,
  flow: Waves,
  perLetter: Paintbrush,
  cycle: Repeat,
};

export function Designer() {
  const mounted = useMounted();
  const d = useDesign();
  const {
    text,
    fontId,
    mode,
    colorId,
    colorId2,
    brushColorId,
    letterColors,
    flowColors,
    flowSpeed,
    cycleColors,
    cycleHold,
    cycleFade,
    backgroundId,
    backgroundCustom,
    widthCm,
    on,
  } = d;

  const [orderOpen, setOrderOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [miniVisible, setMiniVisible] = useState(false);

  // how many past orders does this customer have? (for the badge)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("printoo-neon-orders");
      const n = raw ? (JSON.parse(raw) as unknown[]).length : 0;
      if (Number.isFinite(n)) setOrderCount(n);
    } catch {
      /* ignore */
    }
  }, [historyOpen]);

  const previewRef = useRef<HTMLDivElement>(null);

  // rehydrate the persisted draft AFTER mount (avoids SSR hydration mismatch)
  useEffect(() => {
    useDesign.persist.rehydrate();
  }, []);

  const spec: NeonSpec = useMemo(
    () => ({
      lines: splitLines(text),
      fontId,
      mode,
      colorId,
      colorId2,
      letterColors,
      flowColors,
      flowSpeed,
      cycleColors,
      cycleHold,
      cycleFade,
      background: { id: backgroundId, customColor: backgroundCustom },
      on,
    }),
    [
      text,
      fontId,
      mode,
      colorId,
      colorId2,
      letterColors,
      flowColors,
      flowSpeed,
      cycleColors,
      cycleHold,
      cycleFade,
      backgroundId,
      backgroundCustom,
      on,
    ]
  );

  const lines = splitLines(text);
  const hasText = lines.some((l) => l.trim().length > 0);
  const totalChars = text.length;
  const maxChars = MAX_LINES * (MAX_CHARS_PER_LINE + 1) - 1;
  const overflowLine = lines.findIndex((l) => l.length > MAX_CHARS_PER_LINE);
  const animated = isAnimatedMode(mode) && on;

  // Kurdish / Persian text: RTL typing direction + the matching font tab
  const textRtl = hasRTL(text);
  const textScript: "latin" | "arabic" = textRtl ? "arabic" : "latin";
  const activeFont = getFont(fontId);

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
    return estimateSizeCm(widthCm, { width: dims.w, height: dims.h });
  }, [dims, widthCm]);

  async function handleDownload() {
    if (saving) return;
    setSaving(true);
    try {
      const kind = await downloadNeonFile(spec, hasText ? text : "neon");
      if (kind === "gif") toast.success("Animated GIF downloaded.");
      else if (kind === "png") toast.success("High-quality image downloaded.");
      else toast.error("Could not export the design.");
    } catch {
      toast.error("Could not export the design.");
    } finally {
      setSaving(false);
    }
  }

  /** paint / unpaint a letter (canvas click or chip click) */
  const paintLetter = useCallback(
    (index: number) => {
      d.paintLetter(index, letterColors[index] === brushColorId ? null : brushColorId);
    },
    [d, letterColors, brushColorId]
  );

  const activeMode = getMode(mode);
  const activeColor = getColor(colorId);
  const activeColor2 = getColor(colorId2);
  const activeBrush = getColor(brushColorId);

  return (
    <section id="designer" className="scroll-mt-24">
      {/* ---------- section header ---------- */}
      <div className="mb-8 text-center">
        <Badge
          variant="outline"
          className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-accent-foreground dark:text-primary"
        >
          <Waves className="mr-1 h-3 w-3" />
          Live design studio
        </Badge>
        <h1 className="section-title">Create your neon sign</h1>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-7 text-muted-foreground">
          Type your text, pick a font, paint the colors — animated RGB flow,
          per-letter colors or a soft color cycle, rendered like real
          glass-tube neon.
        </p>
        <div className="section-rule" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr] lg:gap-6">
        {/* ================= preview ================= */}
        <Card className="min-w-0 overflow-hidden rounded-2xl border-border/70 shadow-lg shadow-black/[0.04] dark:shadow-black/30">
          {/* toolbar — power button (single press) */}
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
              <ImageIcon className="h-4 w-4 text-primary/70" />
              {activeMode === "flow" || activeMode === "cycle" ? "Live animation" : "Live preview"}
            </span>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => d.setOn(!on)}
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

          {/* the wall */}
          <div ref={previewRef} className="bg-dots scroll-mt-20 bg-muted/20 p-3 sm:p-5">
            <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/20 ring-1 ring-black/10 dark:ring-white/5">
              {mounted ? (
                <NeonCanvas
                  spec={spec}
                  aspect={1.5}
                  onLayout={handleLayout}
                  interactive={activeMode === "perLetter"}
                  onGlyphClick={paintLetter}
                />
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
                disabled={!hasText || saving}
                className="gap-2 rounded-lg"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {animated
                  ? saving
                    ? "Rendering GIF…"
                    : "Save GIF"
                  : "Save image"}
              </Button>
              <Button
                onClick={() => setOrderOpen(true)}
                disabled={!hasText}
                className="gap-2 rounded-lg font-bold shadow-md shadow-primary/25"
              >
                <ShoppingBag className="h-4 w-4" />
                Order this design
              </Button>
              <Button
                variant="outline"
                onClick={() => setHistoryOpen(true)}
                className="relative gap-2 rounded-lg"
                title="My past orders and their codes"
              >
                <History className="h-4 w-4" />
                My orders
                {orderCount > 0 && (
                  <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10.5px] font-bold text-primary-foreground">
                    {orderCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* ================= controls ================= */}
        <Card className="min-w-0 rounded-2xl border-border/70">
          <CardContent className="flex flex-col gap-7 p-5 sm:p-6">
            {/* ---- text ---- */}
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
                onChange={(e) => d.setText(e.target.value)}
                placeholder={"Your text…\ne.g. Good Vibes"}
                rows={3}
                dir={textRtl ? "rtl" : "ltr"}
                className="resize-none rounded-xl text-[15px] leading-8"
                maxLength={maxChars}
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
                <span>
                  {totalChars} / {maxChars} characters
                </span>
                {!hasText && (
                  <span className="text-primary/70">Type something to begin ✨</span>
                )}
                {overflowLine >= 0 && (
                  <span className="font-medium text-destructive">
                    Line {overflowLine + 1} is over {MAX_CHARS_PER_LINE} chars — it will be
                    trimmed in the preview
                  </span>
                )}
              </div>
            </div>

            {/* ---- font (searchable picker) ---- */}
            <div>
              <div className="field-label">
                <Type className="h-4 w-4 text-primary/80" />
                Font
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  {NEON_FONTS.length} typefaces · searchable
                </span>
              </div>
              <FontAccordion value={fontId} onChange={d.setFont} hintScript={textScript} />
            </div>

            {/* ---- color mode ---- */}
            <div>
              <div className="field-label">
                <Waves className="h-4 w-4 text-primary/80" />
                Color mode
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Color mode">
                {COLOR_MODES.map((m) => {
                  const Icon = MODE_ICONS[m.id];
                  const active = activeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => d.setMode(m.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all duration-200",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                          : "border-border text-foreground/70 hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active ? "text-primary-foreground" : "text-primary/70")} />
                      <span className="text-[12px] font-bold leading-tight">{m.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11.5px] leading-5 text-muted-foreground">
                {COLOR_MODES.find((m) => m.id === activeMode)?.blurb}
              </p>
            </div>

            {/* ---- mode-specific controls ---- */}
            {activeMode === "solid" && (
              <div>
                <div className="field-label">
                  <Palette className="h-4 w-4 text-primary/80" />
                  Neon color
                  <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                    {activeColor.name}
                  </span>
                </div>
                <ColorPalette value={colorId} onChange={d.setColor} />
              </div>
            )}

            {activeMode === "gradient" && (
              <div className="space-y-3.5">
                <div>
                  <div className="field-label">
                    <Palette className="h-4 w-4 text-primary/80" />
                    Main color
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {activeColor.name}
                    </span>
                  </div>
                  <ColorPalette value={colorId} onChange={d.setColor} ariaLabel="Main gradient color" />
                </div>
                <div>
                  <div className="field-label">
                    <Palette className="h-4 w-4 text-primary/80" />
                    Second color
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {activeColor2.name}
                    </span>
                  </div>
                  <ColorPalette value={colorId2} onChange={d.setColor2} ariaLabel="Second gradient color" />
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="h-3 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${activeColor.tube}, ${activeColor2.tube})`, boxShadow: `0 0 12px ${activeColor.glow}55, 0 0 12px ${activeColor2.glow}55` }} aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    The sign blends smoothly from the main color on the left to
                    the second color on the right.
                  </p>
                </div>
              </div>
            )}

            {activeMode === "flow" && (
              <div className="space-y-3.5">
                <div>
                  <div className="field-label">
                    <Palette className="h-4 w-4 text-primary/80" />
                    Flow colors
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {flowColors.length} / {FLOW_MAX_COLORS} picked
                    </span>
                  </div>
                  <ColorChipList
                    ids={flowColors}
                    onRemove={(id) => d.setFlowColors(flowColors.filter((x) => x !== id))}
                    emptyHint="Pick at least two colors below — they will sweep across the sign."
                  />
                  <div className="mt-2.5">
                    <ColorListPicker
                      ids={flowColors}
                      max={FLOW_MAX_COLORS}
                      onChange={d.setFlowColors}
                      ariaLabel="Flow colors"
                    />
                  </div>
                </div>
                <div>
                  <div className="field-label">
                    <Waves className="h-4 w-4 text-primary/80" />
                    Flow speed
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {flowSpeed.toFixed(2).replace(/\.?0+$/, "")}×
                    </span>
                  </div>
                  <Slider
                    value={[flowSpeed]}
                    min={0.25}
                    max={3}
                    step={0.25}
                    onValueChange={(v) => d.setFlowSpeed(v[0] ?? 1)}
                    aria-label="Flow speed"
                  />
                  <div className="mt-1 flex justify-between text-[10.5px] text-muted-foreground">
                    <span>Calm</span>
                    <span>Fast RGB</span>
                  </div>
                </div>
              </div>
            )}

            {activeMode === "perLetter" && (
              <div className="space-y-3.5">
                <div>
                  <div className="field-label">
                    <Paintbrush className="h-4 w-4 text-primary/80" />
                    Letter painter
                  </div>
                  <LetterPainter
                    text={text}
                    letterColors={letterColors}
                    brushColorId={brushColorId}
                    onPaint={paintLetter}
                    onClear={d.clearLetterColors}
                  />
                </div>
                <div>
                  <div className="field-label">
                    <Palette className="h-4 w-4 text-primary/80" />
                    Paint color
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {activeBrush.name}
                    </span>
                  </div>
                  <ColorPalette value={brushColorId} onChange={d.setBrush} ariaLabel="Paint color" />
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    Unpainted letters keep the base color ({activeColor.name}) — switching back
                    to Solid mode lets you change it.
                  </p>
                </div>
              </div>
            )}

            {activeMode === "cycle" && (
              <div className="space-y-3.5">
                <div>
                  <div className="field-label">
                    <Palette className="h-4 w-4 text-primary/80" />
                    Cycle colors
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {cycleColors.length} / {CYCLE_MAX_COLORS} picked
                    </span>
                  </div>
                  <ColorChipList
                    ids={cycleColors}
                    onRemove={(id) => d.setCycleColors(cycleColors.filter((x) => x !== id))}
                    emptyHint="Pick colors below — the sign will fade through them one by one."
                  />
                  <div className="mt-2.5">
                    <ColorListPicker
                      ids={cycleColors}
                      max={CYCLE_MAX_COLORS}
                      onChange={d.setCycleColors}
                      ariaLabel="Cycle colors"
                    />
                  </div>
                </div>
                <div>
                  <div className="field-label">
                    <Repeat className="h-4 w-4 text-primary/80" />
                    Each color stays
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {cycleHold < 1
                        ? `${Math.round(cycleHold * 100) / 100}s`
                        : `${cycleHold.toFixed(1).replace(/\.0$/, "")}s`}
                    </span>
                  </div>
                  <Slider
                    value={[cycleHold]}
                    min={0.5}
                    max={8}
                    step={0.5}
                    onValueChange={(v) => d.setCycleHold(v[0] ?? 1)}
                    aria-label="Color hold duration in seconds"
                  />
                </div>
                <div>
                  <div className="field-label">
                    <Droplet className="h-4 w-4 text-primary/80" />
                    Crossfade duration
                    <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                      {cycleFade.toFixed(1).replace(/\.0$/, "")}s
                    </span>
                  </div>
                  <Slider
                    value={[cycleFade]}
                    min={0.3}
                    max={3}
                    step={0.1}
                    onValueChange={(v) => d.setCycleFade(v[0] ?? 0.8)}
                    aria-label="Crossfade duration in seconds"
                  />
                </div>
              </div>
            )}

            {/* ---- background ---- */}
            <div>
              <div className="field-label">
                <ImageIcon className="h-4 w-4 text-primary/80" />
                Background
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  walls or solid color
                </span>
              </div>
              <BackgroundPicker
                backgroundId={backgroundId}
                customColor={backgroundCustom}
                onChange={d.setBackground}
              />
            </div>

            {/* ---- size ---- */}
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
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => d.setSize(cm)}
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
                Total width from the first to the last tube. The final size is confirmed
                after we review your design.
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
                {animated ? "Live animation · tap to open" : "Live preview · tap to open"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* order dialog */}
      {mounted && (
        <OrderDialog
          open={orderOpen}
          onOpenChange={(v) => {
            setOrderOpen(v);
            if (!v) {
              // refresh the My-orders badge after a successful order
              try {
                const raw = window.localStorage.getItem("printoo-neon-orders");
                const n = raw ? (JSON.parse(raw) as unknown[]).length : 0;
                if (Number.isFinite(n)) setOrderCount(n);
              } catch {
                /* ignore */
              }
            }
          }}
          spec={spec}
          text={text}
          widthCm={widthCm}
        />
      )}

      {/* customer order history (localStorage) */}
      {mounted && (
        <HistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onOrdersChanged={() => setOrderCount(0)}
        />
      )}
    </section>
  );
}
