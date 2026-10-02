/* ------------------------------------------------------------------
   Real neon render engine v4 — Canvas 2D

   Color modes:
   - solid    : one steady color
   - flow     : animated RGB "light strip" — selected colors sweep
                across the sign like LED neon strips (up to 5)
   - perLetter: every letter painted individually by clicking it
   - cycle    : one color at a time, holds N seconds, then fades
                smoothly into the next (any number of colors)

   Rendering: the sign (bloom + tubes) is drawn on a transparent
   layer, then composited over the chosen background (photo or
   solid). Bloom = additive blurred copies of the lit tubes via
   ctx.filter, with a per-glyph shadowBlur fallback for browsers
   without ctx.filter.

   Single-line tubes (v4): the letters themselves are thinned down to
   a real glass-tube width with a MEASURED, safety-clamped erosion —
   the actual typed text is pixel-scanned (thinnest + median stroke)
   so high-contrast fonts (calligraphy hairlines, Naskh joins, serif
   stems) can never be over-eroded into "eaten" letters again. The
   white-hot core and filament are blurred copies of the tube mask
   CLIPPED to the tube (blur ∩ mask): they mathematically cannot
   contain holes, so no bite marks, no missing chunks. All masks are
   cached per (font, text, size, erosion) — animated modes only
   re-tint, never re-rasterize.
------------------------------------------------------------------- */

export { NEON_COLORS, getColor, mixHex, withAlpha, isDarkHex } from "./colors";
export { NEON_FONTS, ensureFontsLoaded, getFont, fontCss, FONT_CATEGORIES, type NeonFont } from "./fonts";
export {
  BACKGROUNDS,
  getBackgroundDef,
  resolveBackground,
  ensureBackgroundLoaded,
  loadWallImage,
  type BackgroundSpec,
  type BackgroundDef,
} from "./backgrounds";

import {
  getColor,
  hexToRgb,
  rgbToCss,
  lerpRgb,
  withAlpha,
  smoothstep,
  type RGB,
} from "./colors";
import { getFont, fontCss, ensureFontsLoaded, hasArabicScript, fontGeneration } from "./fonts";
import { resolveBackground, drawBackground, ensureBackgroundLoaded } from "./backgrounds";
import type { BackgroundSpec } from "./backgrounds";

export type ColorMode = "solid" | "gradient" | "flow" | "perLetter" | "cycle";

/** Tube style:
 *  - double : the neon tube traces the OUTLINE of the letters (classic
 *             hollow sign — two lines along every letter stroke)
 *  - single : the text itself IS the tube — one solid glowing line */
export type LineMode = "double" | "single";

export const LINE_MODES: { id: LineMode; name: string; blurb: string }[] = [
  {
    id: "double",
    name: "Double-line",
    blurb: "The tube traces both edges of every letter — the classic hollow neon outline.",
  },
  {
    id: "single",
    name: "Single-line",
    blurb: "One thin glowing tube runs through the letters — the tube itself is the text.",
  },
];

export function getLineMode(id?: LineMode): LineMode {
  return id === "single" ? "single" : "double";
}

/** Line style used for one line of the sign. Arabic-script text is ALWAYS
 *  single-line: stroking an outline draws contour lines straight through
 *  the joined letters (the «مـ ن» cut bug) — a fill keeps the joins
 *  perfectly seamless. */
export function lineModeForLine(rtl: boolean, spec: LineMode): LineMode {
  return rtl || spec === "single" ? "single" : "double";
}

export const COLOR_MODES: { id: ColorMode; name: string; blurb: string }[] = [
  { id: "solid", name: "Solid", blurb: "One steady neon color" },
  { id: "gradient", name: "Gradient", blurb: "Smooth blend from one color to another" },
  { id: "flow", name: "Flow", blurb: "Animated colors sweeping like RGB strips" },
  { id: "perLetter", name: "Per Letter", blurb: "Click letters to paint each one" },
  { id: "cycle", name: "Cycle", blurb: "One color at a time, soft crossfade" },
];

export function getMode(id?: ColorMode): ColorMode {
  return id === "gradient" || id === "flow" || id === "perLetter" || id === "cycle" ? id : "solid";
}

export function isAnimatedMode(mode: ColorMode): boolean {
  return mode === "flow" || mode === "cycle";
}

/** true when the line contains Arabic-script letters (Kurdish Sorani / Persian) */
export function isRTLText(s: string): boolean {
  return hasArabicScript(s);
}

/** true when ANY line of the text uses the Arabic script */
export function hasRTL(text: string): boolean {
  return hasArabicScript(text);
}

/* ---------------- spec ---------------- */

export interface NeonSpec {
  lines: string[];
  fontId: string;
  mode?: ColorMode;
  /** tube style — outline (double) or solid text (single).
 *  Arabic-script lines are forced to "single" regardless. */
  lineMode?: LineMode;
  /** base color (solid mode / unpainted letters / initial brush) */
  colorId: string;
  /** second color (gradient mode) */
  colorId2?: string;
  /** perLetter mode: character index (newlines skipped) -> colorId */
  letterColors?: Record<number, string>;
  /** flow mode: 2–5 colorIds that sweep across the sign */
  flowColors?: string[];
  /** flow speed multiplier (0.25 slow … 3 fast) */
  flowSpeed?: number;
  /** cycle mode: colorIds to crossfade through */
  cycleColors?: string[];
  /** cycle mode: seconds each color stays lit */
  cycleHold?: number;
  /** cycle mode: seconds of the crossfade */
  cycleFade?: number;
  /** background: image or solid */
  background?: BackgroundSpec;
  /** power switch */
  on: boolean;
}

export interface DrawOptions {
  /** animation time in seconds */
  tSec?: number;
  /** device pixel ratio of the target canvas transform */
  dpr?: number;
  /** fallback text when input is empty */
  placeholder?: string;
}

/* ---------------- layout + glyph boxes ---------------- */

export interface GlyphBox {
  ch: string;
  /** index in the text with newlines removed */
  index: number;
  line: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NeonLayout {
  line: {
    text: string;
    fontSize: number;
    y: number;
    tube: number;
    startX: number;
    width: number;
    /** connected RTL script — glyphs are whole words, drawn right-to-left */
    rtl: boolean;
  }[];
  glyphs: GlyphBox[];
  width: number;
  height: number;
  bottom: number;
}

const LINE_GAP = 1.24;

export function layoutSign(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  spec: NeonSpec,
  opts: DrawOptions = {}
): NeonLayout {
  const padX = 0.075;
  const padY = 0.14;
  const maxW = cw * (1 - padX * 2);
  const availH = ch * (1 - padY * 2);

  let lines = spec.lines.map((l) => l.replace(/\r/g, ""));
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length === 0 || lines.every((l) => l.trim() === "")) {
    lines = [opts.placeholder ?? "NEON"];
  }

  const font = getFont(spec.fontId);

  // measure at 100px then scale down
  const sizes = lines.map((text) => {
    const t = text.trim();
    if (!t) return 100;
    ctx.font = fontCss(font, 100);
    const w = ctx.measureText(t).width;
    return w > 0 ? (100 * maxW) / w : 100;
  });

  // height constraint: everything must fit in availH
  let total = sizes.reduce((s, fs) => s + (fs > 0 ? fs * LINE_GAP : 0), 0);
  if (total > availH && total > 0) {
    const k = availH / total;
    for (let i = 0; i < sizes.length; i++) sizes[i] *= k;
    total = availH;
  }

  const cx = cw / 2;
  let top = (ch - total) / 2;
  const line: NeonLayout["line"] = [];
  const glyphs: GlyphBox[] = [];

  // per-line "glyph unit" count that advances the shared index counter:
  // chars for LTR lines, whole words for RTL (connected script) lines.
  // MUST stay in sync with textTokens() below.
  const unitCount = (l: string): number =>
    isRTLText(l) ? l.split(/\s+/).filter(Boolean).length : Array.from(l).length;

  let off = 0;
  const lineOffsets: number[] = [];
  for (const l of lines) {
    lineOffsets.push(off);
    off += unitCount(l);
  }

  lines.forEach((raw, i) => {
    const drawText = raw.trim();
    const fs = sizes[i];
    const y = top + (fs * LINE_GAP) / 2;
    top += fs * LINE_GAP;
    ctx.font = fontCss(font, fs);
    const width = drawText ? ctx.measureText(drawText).width : 0;
    const rtl = drawText ? isRTLText(drawText) : false;

    if (rtl) {
      /* ---- connected script: whole-word boxes, placed right-to-left.
         Drawing a word as ONE string keeps the letter joins intact —
         per-character drawing would isolate every letter and visibly
         cut the word apart (the «من» bug). ---- */
      const tokens = drawText.split(/\s+/).filter(Boolean);
      const tokenW = tokens.map((t) => ctx.measureText(t).width);
      const spaceW = tokens.length > 1 ? ctx.measureText(" ").width : 0;

      line.push({
        text: drawText,
        fontSize: fs,
        y,
        tube: Math.max(2.5, fs * font.tubeFactor),
        startX: cx - width / 2,
        width: Math.min(width, maxW),
        rtl: true,
      });

      // first logical word goes on the RIGHT (RTL reading order)
      let cursor = cx + width / 2;
      tokens.forEach((tok, j) => {
        const w = tokenW[j];
        const x = cursor - w;
        glyphs.push({
          ch: tok,
          index: lineOffsets[i] + j,
          line: i,
          x,
          y: y - fs * 0.72,
          w: Math.max(w, fs * 0.2),
          h: fs * 1.44,
        });
        cursor = x - spaceW;
      });
      return;
    }

    // ---- LTR: per-character boxes (Latin letters never join) ----
    const chars = Array.from(drawText);
    const rawChars = Array.from(raw);
    const lead = rawChars.length - Array.from(raw.trimStart()).length;
    let adv = 0;
    for (const c of chars) adv += ctx.measureText(c).width;

    line.push({
      text: drawText,
      fontSize: fs,
      y,
      tube: Math.max(2.5, fs * font.tubeFactor),
      startX: cx - adv / 2,
      width: Math.min(width, maxW),
      rtl: false,
    });

    let x = cx - adv / 2;
    chars.forEach((cch, j) => {
      const w = ctx.measureText(cch).width;
      glyphs.push({
        ch: cch,
        index: lineOffsets[i] + lead + j,
        line: i,
        x,
        y: y - fs * 0.55,
        w: Math.max(w, fs * 0.1),
        h: fs * 1.1,
      });
      x += w;
    });
  });

  const widest = line.reduce((m, l) => Math.max(m, l.width), 0);
  return {
    line,
    glyphs,
    width: Math.min(widest, maxW),
    height: total,
    bottom: (ch - total) / 2 + total,
  };
}

/**
 * Paintable units of the text with newlines removed:
 * per-character for Latin, per-WORD for Arabic-script text (words are the
 * connected unit — Latin-style letter-by-letter would break the joins).
 * Indices align 1:1 with layoutSign's glyph boxes.
 */
export function textTokens(text: string): { ch: string; index: number; rtl: boolean }[] {
  const out: { ch: string; index: number; rtl: boolean }[] = [];
  let idx = 0;
  for (const raw of text.split("\n")) {
    const t = raw.trim();
    if (isRTLText(t)) {
      for (const tok of t.split(/\s+/).filter(Boolean)) {
        out.push({ ch: tok, index: idx++, rtl: true });
      }
    } else {
      for (const ch of Array.from(raw)) {
        out.push({ ch, index: idx++, rtl: false });
      }
    }
  }
  return out;
}

/* ---------------- per-frame color resolution ---------------- */

export interface GlyphColor {
  tube: RGB;
  glow: RGB;
}

export interface FrameColors {
  /** one color per glyph, aligned with layout.glyphs */
  glyph: GlyphColor[];
  uniform: boolean;
  dominantGlow: RGB;
}

function colorOf(id: string): GlyphColor {
  const c = getColor(id);
  return { tube: hexToRgb(c.tube), glow: hexToRgb(c.glow) };
}

/** sample an interpolated color from a ring of color ids at p ∈ [0,1) */
function sampleRing(ids: string[], p: number): GlyphColor {
  if (ids.length === 0) return colorOf("warmwhite");
  if (ids.length === 1) return colorOf(ids[0]);
  const n = ids.length;
  const q = ((p % 1) + 1) % 1;
  const seg = Math.min(n - 1, Math.floor(q * n));
  const f = q * n - seg;
  const A = colorOf(ids[seg]);
  const B = colorOf(ids[(seg + 1) % n]);
  return { tube: lerpRgb(A.tube, B.tube, f), glow: lerpRgb(A.glow, B.glow, f) };
}

/** cycle mode: the single color visible at time t (with crossfade) */
export function cycleColorAt(ids: string[], hold: number, fade: number, t: number): GlyphColor {
  if (ids.length === 0) return colorOf("warmwhite");
  if (ids.length === 1) return colorOf(ids[0]);
  const h = Math.max(0.05, hold);
  const f = Math.max(0, fade);
  const period = ids.length * (h + f);
  const phase = ((t % period) + period) % period;
  const seg = Math.floor(phase / (h + f));
  const within = phase - seg * (h + f);
  if (within < h || f <= 0.001) return colorOf(ids[seg % ids.length]);
  const k = smoothstep((within - h) / f);
  const A = colorOf(ids[seg % ids.length]);
  const B = colorOf(ids[(seg + 1) % ids.length]);
  return { tube: lerpRgb(A.tube, B.tube, k), glow: lerpRgb(A.glow, B.glow, k) };
}

function averageGlow(colors: GlyphColor[]): RGB {
  if (colors.length === 0) return [255, 220, 160];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const c of colors) {
    r += c.glow[0];
    g += c.glow[1];
    b += c.glow[2];
  }
  return [Math.round(r / colors.length), Math.round(g / colors.length), Math.round(b / colors.length)];
}

function resolveFrameColors(spec: NeonSpec, layout: NeonLayout, t: number): FrameColors {
  const mode = getMode(spec.mode);

  if (mode === "solid") {
    const c = colorOf(spec.colorId);
    return { glyph: layout.glyphs.map(() => c), uniform: true, dominantGlow: c.glow };
  }

  if (mode === "gradient") {
    // smooth A -> B blend across the whole sign (static)
    const A = colorOf(spec.colorId);
    const B = colorOf(spec.colorId2 || "ice");
    const left = layout.glyphs.length ? Math.min(...layout.glyphs.map((g) => g.x)) : 0;
    const right = layout.glyphs.length ? Math.max(...layout.glyphs.map((g) => g.x + g.w)) : 1;
    const span = Math.max(1, right - left);
    const glyph = layout.glyphs.map((g) => {
      const xn = Math.min(1, Math.max(0, (g.x + g.w / 2 - left) / span));
      return { tube: lerpRgb(A.tube, B.tube, xn), glow: lerpRgb(A.glow, B.glow, xn) };
    });
    return {
      glyph,
      uniform: false,
      dominantGlow: lerpRgb(A.glow, B.glow, 0.5),
    };
  }

  if (mode === "cycle") {
    const ids = (spec.cycleColors ?? []).filter((id) => id);
    const c = ids.length
      ? cycleColorAt(ids, spec.cycleHold ?? 1, spec.cycleFade ?? 0.8, t)
      : colorOf(spec.colorId);
    return { glyph: layout.glyphs.map(() => c), uniform: true, dominantGlow: c.glow };
  }

  if (mode === "flow") {
    const ids = (spec.flowColors ?? []).filter((id) => id);
    if (ids.length === 0) ids.push(spec.colorId);
    const speed = Math.min(3, Math.max(0.25, spec.flowSpeed ?? 1));
    const left = layout.glyphs.length ? Math.min(...layout.glyphs.map((g) => g.x)) : 0;
    const right = layout.glyphs.length ? Math.max(...layout.glyphs.map((g) => g.x + g.w)) : 1;
    const span = Math.max(1, right - left);
    const glyph = layout.glyphs.map((g) => {
      const xn = (g.x + g.w / 2 - left) / span;
      return sampleRing(ids, xn * 0.4 + t * speed * 0.085);
    });
    const ringAvg = averageGlow(ids.map((id) => colorOf(id)));
    return { glyph, uniform: false, dominantGlow: ringAvg };
  }

  // perLetter
  const map = spec.letterColors ?? {};
  const base = colorOf(spec.colorId);
  const glyph = layout.glyphs.map((g) => (map[g.index] ? colorOf(map[g.index]) : base));
  return { glyph, uniform: false, dominantGlow: averageGlow(glyph) };
}

/* ---------------- scratch canvases ---------------- */

const scratches = new Map<string, HTMLCanvasElement>();

function getScratch(key: string, cw: number, ch: number, dpr: number): HTMLCanvasElement {
  const w = Math.max(2, Math.round(cw * dpr));
  const h = Math.max(2, Math.round(ch * dpr));
  const k = `${key}:${w}x${h}`;
  let c = scratches.get(k);
  if (!c) {
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    scratches.set(k, c);
    if (scratches.size > 10) {
      // drop one entry from another size to keep memory in check
      for (const kk of scratches.keys()) {
        if (!kk.startsWith(key)) {
          scratches.delete(kk);
          break;
        }
      }
    }
  }
  return c;
}

function scratchCtx(key: string, cw: number, ch: number, dpr: number): CanvasRenderingContext2D | null {
  const c = getScratch(key, cw, ch, dpr);
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  return ctx;
}

/* ---------------- ctx.filter support ---------------- */

let filterSupport: boolean | null = null;

function supportsFilter(): boolean {
  if (filterSupport === null) {
    try {
      const c = document.createElement("canvas").getContext("2d");
      if (!c || typeof c.filter !== "string") {
        filterSupport = false;
      } else {
        c.filter = "blur(2px)";
        filterSupport = c.filter !== "none" && c.filter !== "";
        c.filter = "none";
      }
    } catch {
      filterSupport = false;
    }
  }
  return filterSupport;
}

/* ---------------- paint styles ---------------- */

type LineStyle = string | CanvasGradient;

interface PaintSet {
  glow: LineStyle;
  tube: LineStyle;
  core: LineStyle;
  filament: LineStyle;
}

const WHITE: RGB = [255, 255, 255];

function flatPaint(gc: GlyphColor): PaintSet {
  return {
    glow: rgbToCss(gc.glow),
    tube: rgbToCss(gc.tube),
    core: rgbToCss(lerpRgb(gc.tube, WHITE, 0.55)),
    filament: rgbToCss(lerpRgb(gc.tube, WHITE, 0.85)),
  };
}

/** smooth gradient across the line with stops at glyph centers (flow mode) */
function gradientPaint(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  glyphs: GlyphBox[],
  colors: GlyphColor[]
): PaintSet {
  const span = Math.max(1, x1 - x0);
  const mk = (pick: (g: GlyphColor) => RGB): CanvasGradient => {
    const grad = ctx.createLinearGradient(x0, 0, x0 + span, 0);
    for (let i = 0; i < glyphs.length; i++) {
      const p = Math.min(1, Math.max(0, (glyphs[i].x + glyphs[i].w / 2 - x0) / span));
      grad.addColorStop(p, rgbToCss(pick(colors[i])));
    }
    return grad;
  };
  return {
    glow: mk((g) => g.glow),
    tube: mk((g) => g.tube),
    core: mk((g) => lerpRgb(g.tube, WHITE, 0.55)),
    filament: mk((g) => lerpRgb(g.tube, WHITE, 0.85)),
  };
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: LineStyle,
  width: number,
  alpha: number
): void {
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.strokeStyle = style;
  ctx.strokeText(text, x, y);
}

/* ---------------- single-line tube geometry ---------------- */

/**
 * Approximate ink-stroke thickness of a font (ratio of font size), measured
 * once per font with a tiny offscreen pixel scan. Used only as a FALLBACK —
 * measureInkStats() below scans the actual typed text, which is what the
 * erosion clamp really needs (the old probe-glyph median was blind to
 * hairlines and caused the "eaten text" bug in high-contrast fonts).
 */
const strokeRatioCache = new Map<string, number>();

function fontStrokeRatio(fontId: string): number {
  const hit = strokeRatioCache.get(fontId);
  if (hit !== undefined) return hit;
  let ratio = 0.075; // safe default when measuring is impossible
  try {
    if (typeof document !== "undefined") {
      const font = getFont(fontId);
      const S = 100;
      const W = 340;
      const H = 170;
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const c2 = cv.getContext("2d", { willReadFrequently: true });
      if (c2) {
        c2.font = fontCss(font, S);
        c2.textBaseline = "middle";
        c2.fillStyle = "#fff";
        // probe glyph per script: "o" for Latin fonts, "م" for Arabic-script
        c2.fillText(font.script === "arabic" ? "م" : "o", 24, H / 2);
        const data = c2.getImageData(0, 0, W, H).data;
        const runs: number[] = [];
        for (let y = 0; y < H; y += 2) {
          let run = 0;
          for (let x = 0; x < W; x++) {
            if (data[(y * W + x) * 4 + 3] > 110) run++;
            else {
              if (run > 1 && run < S * 0.55) runs.push(run);
              run = 0;
            }
          }
          if (run > 1 && run < S * 0.55) runs.push(run);
        }
        if (runs.length >= 6) {
          runs.sort((a, b) => a - b);
          ratio = Math.max(0.03, Math.min(0.2, runs[Math.floor(runs.length / 2)] / S));
        }
      }
    }
  } catch {
    /* keep the default ratio */
  }
  strokeRatioCache.set(fontId, ratio);
  return ratio;
}

/* ---------------- per-text ink measurement ---------------- */

interface InkStats {
  /** thinnest measured stroke (P25 of runs ≥ 2px), ratio of font size */
  thin: number;
  /** median stroke, ratio of font size */
  med: number;
  /** largest erosion (ratio of font size) that PROVABLY never splits the
   *  rendered text into more pieces — measured empirically by binary
   *  search. This is the real safety net: cursive letter-joins and Naskh
   *  connections are 1.5–3px thin (far below any percentile), T-junctions
   *  break ~25% earlier than flat strokes — only counting actual pieces
   *  catches all of them. */
  maxSafe: number;
}

const inkStatsCache = new Map<string, InkStats>();
const inkProbe = { canvas: null as HTMLCanvasElement | null, ctx: null as CanvasRenderingContext2D | null };
let seenBuf = new Uint8Array(0);

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[i];
}

/** count connected ink pieces (alpha > 120, area > 12 px) */
function countInkPieces(data: Uint8ClampedArray, w: number, h: number): number {
  if (seenBuf.length < w * h) seenBuf = new Uint8Array(w * h);
  seenBuf.fill(0, 0, w * h);
  const stack = new Int32Array(w * h);
  let comps = 0;
  for (let i = 0; i < w * h; i++) {
    if (seenBuf[i] || data[i * 4 + 3] <= 120) continue;
    let sp = 0;
    stack[sp++] = i;
    seenBuf[i] = 1;
    let size = 0;
    while (sp > 0) {
      const j = stack[--sp];
      size++;
      const jx = j % w;
      const jy = (j / w) | 0;
      let k: number;
      if (jx > 0 && !seenBuf[(k = j - 1)] && data[k * 4 + 3] > 120) {
        seenBuf[k] = 1;
        stack[sp++] = k;
      }
      if (jx < w - 1 && !seenBuf[(k = j + 1)] && data[k * 4 + 3] > 120) {
        seenBuf[k] = 1;
        stack[sp++] = k;
      }
      if (jy > 0 && !seenBuf[(k = j - w)] && data[k * 4 + 3] > 120) {
        seenBuf[k] = 1;
        stack[sp++] = k;
      }
      if (jy < h - 1 && !seenBuf[(k = j + w)] && data[k * 4 + 3] > 120) {
        seenBuf[k] = 1;
        stack[sp++] = k;
      }
    }
    if (size > 12) comps++;
  }
  return comps;
}

/** render the probe text at 60px with optional erosion (same technique as
 *  the real mask builder) and return the pixels */
function renderInkProbe(
  fontId: string,
  text: string,
  rtl: boolean,
  erode: number,
  w: number,
  h: number
): Uint8ClampedArray | null {
  const ctx = inkProbe.ctx;
  if (!ctx) return null;
  const font = getFont(fontId);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = fontCss(font, 60);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, 6, h / 2);
  if (erode > 0.05) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = erode * 2;
    ctx.strokeStyle = "#000";
    ctx.strokeText(text, 6, h / 2);
    ctx.globalCompositeOperation = "source-over";
  }
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * Measure the ACTUAL text once at a small canonical size:
 *  - stroke-thickness stats (P25 thin / P50 median, runs ≥ 2px),
 *  - and the empirical MAX SAFE EROSION: the largest erosion that keeps
 *    the rendered piece count identical (binary search). Cached per
 *  (font generation, font, text) — runs only when the text changes,
 *  never per animation frame.
 */
function measureInkStats(fontId: string, text: string): InkStats {
  const key = `${fontGeneration()}|${fontId}|${text}`;
  const hit = inkStatsCache.get(key);
  if (hit) return hit;
  let thin = 0;
  let med = 0;
  let maxSafe = 0;
  try {
    if (typeof document !== "undefined" && text.trim().length > 0) {
      if (!inkProbe.canvas) {
        inkProbe.canvas = document.createElement("canvas");
        inkProbe.ctx = inkProbe.canvas.getContext("2d", { willReadFrequently: true });
      }
      const mctx = inkProbe.ctx;
      if (mctx) {
        const S = 60;
        mctx.setTransform(1, 0, 0, 1, 0, 0);
        mctx.font = fontCss(getFont(fontId), S);
        const adv = mctx.measureText(text).width;
        const w = Math.min(4000, Math.ceil(adv) + 12);
        const h = Math.ceil(S * 1.7);
        if (w > 10 && h > 10 && inkProbe.canvas) {
          inkProbe.canvas.width = w;
          inkProbe.canvas.height = h;
          const rtl = hasArabicScript(text);
          const base = renderInkProbe(fontId, text, rtl, 0, w, h);
          if (base) {
            const runs: number[] = [];
            const maxRun = S * 0.55;
            const push = (run: number) => {
              if (run >= 2 && run <= maxRun) runs.push(run);
            };
            for (let y = 0; y < h; y++) {
              let run = 0;
              for (let x = 0; x <= w; x++) {
                const on = x < w && base[(y * w + x) * 4 + 3] > 110;
                if (on) run++;
                else {
                  push(run);
                  run = 0;
                }
              }
              push(run);
            }
            for (let x = 0; x < w; x++) {
              let run = 0;
              for (let y = 0; y <= h; y++) {
                const on = y < h && base[(y * w + x) * 4 + 3] > 110;
                if (on) run++;
                else {
                  push(run);
                  run = 0;
                }
              }
              push(run);
            }
            runs.sort((a, b) => a - b);
            if (runs.length >= 8) {
              thin = Math.max(0.012, percentile(runs, 0.25) / S);
              med = Math.max(0.015, percentile(runs, 0.5) / S);
            }
            // binary-search the largest erosion preserving the piece count
            const basePieces = countInkPieces(base, w, h);
            let lo = 0;
            let hi = 24;
            while (hi - lo > 0.5) {
              const mid = (lo + hi) / 2;
              const d = renderInkProbe(fontId, text, rtl, mid, w, h);
              if (d && countInkPieces(d, w, h) === basePieces) lo = mid;
              else hi = mid;
            }
            maxSafe = Math.max(0, lo / S);
          }
        }
      }
    }
  } catch {
    /* fall back to the probe ratio below */
  }
  if (thin <= 0 || med <= 0) {
    const probe = fontStrokeRatio(fontId);
    thin = probe * 0.5;
    med = probe;
  }
  if (maxSafe <= 0) maxSafe = med * 0.2; // never measured → very conservative
  const st: InkStats = { thin, med, maxSafe };
  inkStatsCache.set(key, st);
  if (inkStatsCache.size > 64) {
    const oldest = inkStatsCache.keys().next().value;
    if (oldest !== undefined) inkStatsCache.delete(oldest);
  }
  return st;
}

export interface SingleLineGeom {
  /** median ink thickness (px at this line's size) */
  ink: number;
  /** thinnest ink stroke in THIS text (px) — erosion safety reference */
  thin: number;
  /** final tube width the letter strokes are thinned to */
  body: number;
  /** erosion (px, per side) that thins the glyph down to `body`.
   *  Hard-clamped to 45% of the thinnest measured stroke — eroding more
   *  would erase thin strokes entirely (the "eaten / bitten text" bug). */
  erodeBody: number;
  /** erosion for the glow layer (wider than the tube) */
  erodeGas: number;
  /** blur sigma (px) of the white-hot core overlay */
  coreSigma: number;
  /** blur sigma (px) of the near-white filament overlay */
  filSigma: number;
}

/**
 * Single-line tube geometry for one line: the letter body becomes a tube of
 * about the same width class as a double-line tube (thin!), never fatter
 * than 42% of the median ink. The erosion is bounded by THREE independent
 * caps, so no letter, join, dot or hairline can ever be erased:
 *  1. the piece-count calibrated cap (empirical, per actual text),
 *  2. 45% of the thinnest measured stroke,
 *  3. hairline fonts simply keep their natural width (ink < target).
 */
function singleLineGeom(fontSize: number, tube: number, fontId: string, text: string): SingleLineGeom {
  const st = measureInkStats(fontId, text);
  const ink = Math.max(1, st.med * fontSize);
  const thin = Math.max(0.75, st.thin * fontSize);
  const target = Math.min(
    ink, // never fatter than the actual letters
    Math.max(tube * 1.05, Math.min(ink * 0.42, tube * 1.9))
  );
  const capStat = 0.45 * thin;
  const capPiece = 0.85 * st.maxSafe * fontSize;
  const erodeBody = Math.min(Math.max(0, (ink - target) / 2), capStat, capPiece);
  const body = Math.max(1, ink - erodeBody * 2);
  const gasW = Math.min(ink, body * 1.8);
  const erodeGas = Math.min(Math.max(0, (ink - gasW) / 2), capStat, capPiece);
  return {
    ink,
    thin,
    body,
    erodeBody,
    erodeGas,
    coreSigma: Math.max(0.6, body * 0.3),
    filSigma: Math.max(0.35, body * 0.13),
  };
}

/* ---------------- cached single-line masks ---------------- */

interface SlMask {
  canvas: HTMLCanvasElement;
  /** css-space width/height of the mask */
  w: number;
  h: number;
  /** css-space anchor of the text (baseline-middle point) inside the mask */
  ax: number;
  ay: number;
}

interface SlSet {
  body: SlMask;
  gas: SlMask;
  core: SlMask;
  fil: SlMask;
  /** device pixels held by this entry (for the cache budget) */
  pixels: number;
}

const slSetCache = new Map<string, SlSet>();
let slSetPixels = 0;
const SL_SET_BUDGET = 12_000_000; // device px (~48 MB) — generous but bounded
const SL_SET_MAX = 96;
let slMeasureCtx: CanvasRenderingContext2D | null = null;

/**
 * Render `text` white on a tight-bbox canvas, then erode it by `erode` px
 * from every edge (destination-out contour stroke — a canvas "shrink").
 * The glyph keeps its exact shaped outline (Arabic joins stay intact).
 */
function buildErodedMask(
  fontId: string,
  text: string,
  fs: number,
  rtl: boolean,
  erode: number,
  dpr: number
): SlMask | null {
  if (!slMeasureCtx) {
    slMeasureCtx = document.createElement("canvas").getContext("2d");
  }
  const mctx = slMeasureCtx;
  if (!mctx) return null;
  const font = getFont(fontId);
  mctx.font = fontCss(font, fs);
  mctx.direction = rtl ? "rtl" : "ltr";
  mctx.textAlign = "left";
  mctx.textBaseline = "middle";
  const m = mctx.measureText(text);
  const bbl = Number.isFinite(m.actualBoundingBoxLeft) ? m.actualBoundingBoxLeft : 0;
  const bbr = Number.isFinite(m.actualBoundingBoxRight) ? m.actualBoundingBoxRight : m.width;
  const bba = Number.isFinite(m.actualBoundingBoxAscent) ? m.actualBoundingBoxAscent : fs * 0.78;
  const bbd = Number.isFinite(m.actualBoundingBoxDescent) ? m.actualBoundingBoxDescent : fs * 0.32;
  const pad = 6;
  const w = Math.ceil(bbl + bbr + pad * 2);
  const h = Math.ceil(bba + bbd + pad * 2);
  if (w < 2 || h < 2 || w > 8000 || h > 4000) return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(w * dpr));
  canvas.height = Math.max(2, Math.round(h * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = fontCss(font, fs);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const ax = bbl + pad;
  const ay = bba + pad;
  ctx.fillStyle = "#fff";
  ctx.fillText(text, ax, ay);
  if (erode > 0.05) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = erode * 2;
    ctx.strokeStyle = "#000";
    ctx.strokeText(text, ax, ay);
    ctx.globalCompositeOperation = "source-over";
  }
  return { canvas, w, h, ax, ay };
}

/**
 * A blurred copy of `base` CLIPPED to `base` (blur ∩ mask). Because a blur
 * can never create holes and the intersection keeps every pixel inside the
 * tube, the core/filament overlays built this way can NEVER look bitten or
 * broken — fat strokes get a white-hot center with colored rims, thin
 * strokes simply glow hotter. Exactly the double-line recipe's feel,
 * without its fragility.
 */
function softMask(base: SlMask, sigma: number, dpr: number): SlMask | null {
  const canvas = document.createElement("canvas");
  canvas.width = base.canvas.width;
  canvas.height = base.canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (supportsFilter()) {
    ctx.filter = `blur(${(sigma * dpr).toFixed(2)}px)`;
    ctx.drawImage(base.canvas, 0, 0);
    ctx.filter = "none";
  } else {
    // shadow-blur fallback: draw the mask off-canvas so only its blurred
    // shadow lands on the canvas (offset trick)
    const off = canvas.height + 16;
    ctx.save();
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = sigma * dpr * 2;
    ctx.shadowOffsetY = off;
    ctx.drawImage(base.canvas, 0, -off);
    ctx.restore();
  }
  // clip the blurred copy to the tube shape
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(base.canvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  return { canvas, w: base.w, h: base.h, ax: base.ax, ay: base.ay };
}

/** full mask set for one piece of text — cached, position-independent */
function getSlSet(
  fontId: string,
  text: string,
  fs: number,
  rtl: boolean,
  geom: SingleLineGeom,
  dpr: number
): SlSet | null {
  if (!text || !text.trim()) return null;
  const fsKey = (Math.round(fs * 2) / 2).toFixed(1);
  const key = `${fontGeneration()}|${fontId}|${fsKey}|${dpr}|${geom.erodeBody.toFixed(2)}|${geom.erodeGas.toFixed(2)}|${text}`;
  const hit = slSetCache.get(key);
  if (hit) return hit;

  const body = buildErodedMask(fontId, text, fs, rtl, geom.erodeBody, dpr);
  if (!body) return null;
  const gas =
    Math.abs(geom.erodeGas - geom.erodeBody) < 0.05
      ? body
      : buildErodedMask(fontId, text, fs, rtl, geom.erodeGas, dpr) ?? body;
  const core = softMask(body, geom.coreSigma, dpr) ?? body;
  const fil = softMask(body, geom.filSigma, dpr) ?? body;

  const canvases = new Set([body.canvas, gas.canvas, core.canvas, fil.canvas]);
  let pixels = 0;
  canvases.forEach((c) => {
    pixels += c.width * c.height;
  });
  const set: SlSet = { body, gas, core, fil, pixels };
  slSetCache.set(key, set);
  slSetPixels += pixels;
  while (slSetCache.size > 1 && (slSetPixels > SL_SET_BUDGET || slSetCache.size > SL_SET_MAX)) {
    const oldest = slSetCache.keys().next().value;
    if (oldest === undefined || oldest === key) break;
    const drop = slSetCache.get(oldest);
    slSetCache.delete(oldest);
    if (drop) slSetPixels -= drop.pixels;
  }
  return set;
}

/** tint a cached mask with a paint (flat color or gradient) and blit it */
function blitSlMask(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  dpr: number,
  mask: SlMask,
  x: number,
  y: number,
  paint: LineStyle,
  alpha: number,
  additive: boolean
): void {
  const t = scratchCtx("sl-tint", cw, ch, dpr);
  if (!t) return;
  // snap the cached mask to the device grid so it stays pixel-crisp
  const dx = Math.round((x - mask.ax) * dpr) / dpr;
  const dy = Math.round((y - mask.ay) * dpr) / dpr;
  t.drawImage(mask.canvas, dx, dy, mask.w, mask.h);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = paint;
  t.fillRect(0, 0, cw, ch);
  t.globalCompositeOperation = "source-over";
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = additive ? "lighter" : "source-over";
  ctx.globalAlpha = alpha;
  ctx.drawImage(t.canvas, 0, 0, cw, ch);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prevOp;
}

/** group glyphs & colors per line once per frame */
interface LineGroup {
  l: NeonLayout["line"][number];
  boxes: GlyphBox[];
  colors: GlyphColor[];
  /** flat/gradient paint, or null for per-glyph (perLetter) mode */
  paint: PaintSet | null;
  perGlyph: PaintSet[] | null;
}

function buildLineGroups(
  ctx: CanvasRenderingContext2D,
  layout: NeonLayout,
  frame: FrameColors,
  mode: ColorMode
): LineGroup[] {
  const boxesByLine: GlyphBox[][] = layout.line.map(() => []);
  const colorsByLine: GlyphColor[][] = layout.line.map(() => []);
  layout.glyphs.forEach((g, i) => {
    if (g.line < layout.line.length) {
      boxesByLine[g.line].push(g);
      colorsByLine[g.line].push(frame.glyph[i]);
    }
  });
  return layout.line.map((l, li) => {
    const boxes = boxesByLine[li];
    const colors = colorsByLine[li];
    let paint: PaintSet | null = null;
    let perGlyph: PaintSet[] | null = null;
    if (frame.uniform) {
      paint = flatPaint(frame.glyph[0] ?? colorOf("warmwhite"));
    } else if (mode === "perLetter") {
      perGlyph = colors.map((c) => flatPaint(c));
    } else {
      paint = gradientPaint(ctx, l.startX, l.startX + l.width, boxes, colors);
    }
    return { l, boxes, colors, paint, perGlyph };
  });
}

/* ---------------- the lit sign (bloom + tubes) on a transparent layer ---------------- */

function drawLitSign(
  nctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  dpr: number,
  fontId: string,
  mode: ColorMode,
  lineMode: LineMode,
  layout: NeonLayout,
  frame: FrameColors,
  dark: boolean
): void {
  const groups = buildLineGroups(nctx, layout, frame, mode);
  const font = getFont(fontId);

  // per-line single-line tube geometry (measured, safety-clamped erosion)
  const geoms = groups.map((g) =>
    singleLineGeom(g.l.fontSize, g.l.tube, fontId, g.l.text)
  );
  const anySingle = groups.some((g, i) => lineModeForLine(g.l.rtl, lineMode) === "single" && geoms[i].ink > 0);
  // bloom reference width: the lit tube itself — for single-line that is the
  // (thinned) letter body, slightly WIDER halos than the outline tube
  const tubeRef = Math.max(
    4,
    groups.reduce((m, g, i) => {
      const single = lineModeForLine(g.l.rtl, lineMode) === "single";
      return Math.max(m, single ? geoms[i].body : g.l.tube);
    }, 4)
  );

  nctx.save();
  nctx.textAlign = "left";
  nctx.textBaseline = "middle";
  nctx.lineJoin = "round";
  nctx.lineCap = "round";

  /* ---- 1. light layer: bright saturated shapes on their own canvas ----
     single-line: the glowing "gas" — the letters eroded to just a touch
     wider than the tube, so the light hugs the tube like real gas glow */
  const lctx = scratchCtx("light", cw, ch, dpr);
  if (lctx) {
    lctx.textAlign = "left";
    lctx.textBaseline = "middle";
    lctx.lineJoin = "round";
    lctx.lineCap = "round";
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      if (!g.l.text) continue;
      lctx.font = fontCss(font, g.l.fontSize);
      lctx.direction = g.l.rtl ? "rtl" : "ltr";
      const single = lineModeForLine(g.l.rtl, lineMode) === "single";
      const geom = geoms[gi];
      if (single) {
        const set = getSlSet(fontId, g.l.text, g.l.fontSize, g.l.rtl, geom, dpr);
        if (set) {
          if (g.paint) {
            blitSlMask(lctx, cw, ch, dpr, set.gas, g.l.startX, g.l.y, g.paint.glow, 0.9, true);
          } else if (g.perGlyph) {
            for (let i = 0; i < g.boxes.length; i++) {
              const gb = g.boxes[i];
              if (gb.ch.trim() === "") continue;
              const gs = getSlSet(fontId, gb.ch, g.l.fontSize, g.l.rtl, geom, dpr);
              if (gs) blitSlMask(lctx, cw, ch, dpr, gs.gas, gb.x, g.l.y, g.perGlyph[i].glow, 0.9, true);
            }
          }
          continue;
        }
        // degenerate fallback: the un-eroded fill still glows correctly
        lctx.globalCompositeOperation = "lighter";
        if (g.paint) {
          lctx.globalAlpha = 0.9;
          lctx.fillStyle = g.paint.glow;
          lctx.fillText(g.l.text, g.l.startX, g.l.y);
          lctx.globalAlpha = 1;
        } else if (g.perGlyph) {
          for (let i = 0; i < g.boxes.length; i++) {
            const gb = g.boxes[i];
            if (gb.ch.trim() === "") continue;
            lctx.globalAlpha = 0.9;
            lctx.fillStyle = g.perGlyph[i].glow;
            lctx.fillText(gb.ch, gb.x, g.l.y);
            lctx.globalAlpha = 1;
          }
        }
        continue;
      }
      lctx.globalCompositeOperation = "lighter";
      if (g.paint) {
        strokeLine(lctx, g.l.text, g.l.startX, g.l.y, g.paint.glow, g.l.tube * 1.35, 0.9);
      } else if (g.perGlyph) {
        for (let i = 0; i < g.boxes.length; i++) {
          const gb = g.boxes[i];
          strokeLine(lctx, gb.ch, gb.x, g.l.y, g.perGlyph[i].glow, g.l.tube * 1.35, 0.9);
        }
      }
    }
    const lightCanvas = getScratch("light", cw, ch, dpr);

    /* ---- 2. bloom: blurred additive copies (or shadowBlur fallback) ---- */
    if (lightCanvas && supportsFilter()) {
      nctx.globalCompositeOperation = "lighter";
      const a = dark ? 1 : 0.55;
      // single-line signs get a lusher halo — that is where the neon FEEL lives
      const m1 = anySingle ? 1.6 : 2.2;
      const m2 = anySingle ? 4.5 : 6.0;
      const m3 = anySingle ? 11 : 12;
      nctx.filter = `blur(${(tubeRef * m1).toFixed(1)}px)`;
      nctx.globalAlpha = (anySingle ? 0.85 : 0.8) * a;
      nctx.drawImage(lightCanvas, 0, 0, cw, ch);
      nctx.filter = `blur(${(tubeRef * m2).toFixed(1)}px)`;
      nctx.globalAlpha = (anySingle ? 0.5 : 0.45) * a;
      nctx.drawImage(lightCanvas, 0, 0, cw, ch);
      if (dark) {
        nctx.filter = `blur(${(tubeRef * m3).toFixed(1)}px)`;
        nctx.globalAlpha = anySingle ? 0.26 : 0.2;
        nctx.drawImage(lightCanvas, 0, 0, cw, ch);
      }
      nctx.filter = "none";
      nctx.globalAlpha = 1;
      nctx.globalCompositeOperation = "source-over";
    } else {
      // fallback: shadowBlur glow around the shapes (visually close)
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        if (!g.l.text) continue;
        nctx.font = fontCss(font, g.l.fontSize);
        nctx.direction = g.l.rtl ? "rtl" : "ltr";
        const single = lineModeForLine(g.l.rtl, lineMode) === "single";
        const geom = geoms[gi];
        const set = single ? getSlSet(fontId, g.l.text, g.l.fontSize, g.l.rtl, geom, dpr) : null;
        if (single && set) {
          if (g.paint) {
            const glowCss = g.paint.glow as string;
            nctx.shadowColor = glowCss;
            nctx.shadowBlur = geom.body * 6.5;
            blitSlMask(nctx, cw, ch, dpr, set.gas, g.l.startX, g.l.y, glowCss, 0.35, true);
            blitSlMask(nctx, cw, ch, dpr, set.gas, g.l.startX, g.l.y, glowCss, 0.3, true);
          } else if (g.perGlyph) {
            for (let i = 0; i < g.boxes.length; i++) {
              const gb = g.boxes[i];
              if (gb.ch.trim() === "") continue;
              const glowCss = g.perGlyph[i].glow as string;
              const gs = getSlSet(fontId, gb.ch, g.l.fontSize, g.l.rtl, geom, dpr);
              nctx.shadowColor = glowCss;
              nctx.shadowBlur = geom.body * 6.5;
              if (gs) blitSlMask(nctx, cw, ch, dpr, gs.gas, gb.x, g.l.y, glowCss, 0.4, true);
            }
          }
          continue;
        }
        if (g.paint) {
          const glowCss = g.paint.glow as string;
          nctx.shadowColor = glowCss;
          nctx.shadowBlur = single ? geom.body * 6.5 : g.l.tube * 6.5;
          if (single) {
            nctx.globalCompositeOperation = "lighter";
            nctx.globalAlpha = 0.35;
            nctx.fillStyle = glowCss;
            nctx.fillText(g.l.text, g.l.startX, g.l.y);
            nctx.globalAlpha = 0.3;
            nctx.fillText(g.l.text, g.l.startX, g.l.y);
            nctx.globalAlpha = 1;
          } else {
            strokeLine(nctx, g.l.text, g.l.startX, g.l.y, glowCss, g.l.tube * 1.2, 0.35);
            strokeLine(nctx, g.l.text, g.l.startX, g.l.y, glowCss, g.l.tube * 1.2, 0.3);
          }
        } else if (g.perGlyph) {
          for (let i = 0; i < g.boxes.length; i++) {
            const gb = g.boxes[i];
            const glowCss = g.perGlyph[i].glow as string;
            nctx.shadowColor = glowCss;
            nctx.shadowBlur = single ? geom.body * 6.5 : g.l.tube * 6.5;
            if (single) {
              nctx.globalCompositeOperation = "lighter";
              nctx.globalAlpha = 0.4;
              nctx.fillStyle = glowCss;
              nctx.fillText(gb.ch, gb.x, g.l.y);
              nctx.globalAlpha = 1;
            } else {
              strokeLine(nctx, gb.ch, gb.x, g.l.y, glowCss, g.l.tube * 1.2, 0.4);
            }
          }
        }
      }
      nctx.shadowBlur = 0;
      nctx.shadowColor = "transparent";
      nctx.globalAlpha = 1;
      nctx.globalCompositeOperation = "source-over";
    }
  }

  /* ---- 3. glass tube body ----
     double-line: the outline stroke IS the tube.
     single-line: the letters eroded down to a thin tube — exactly the same
     width class as the double-line tube, never a fat filled letter. */
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (!g.l.text) continue;
    nctx.font = fontCss(font, g.l.fontSize);
    nctx.direction = g.l.rtl ? "rtl" : "ltr";
    const single = lineModeForLine(g.l.rtl, lineMode) === "single";
    const geom = geoms[gi];
    const set = single ? getSlSet(fontId, g.l.text, g.l.fontSize, g.l.rtl, geom, dpr) : null;
    if (single && set) {
      if (g.paint) {
        blitSlMask(nctx, cw, ch, dpr, set.body, g.l.startX, g.l.y, g.paint.tube, 1, false);
      } else if (g.perGlyph) {
        for (let i = 0; i < g.boxes.length; i++) {
          const gb = g.boxes[i];
          if (gb.ch.trim() === "") continue;
          const gs = getSlSet(fontId, gb.ch, g.l.fontSize, g.l.rtl, geom, dpr);
          if (gs) blitSlMask(nctx, cw, ch, dpr, gs.body, gb.x, g.l.y, g.perGlyph[i].tube, 1, false);
        }
      }
      continue;
    }
    if (g.paint) {
      if (single) {
        // degenerate fallback: solid filled letters (never missing)
        nctx.globalAlpha = 1;
        nctx.fillStyle = g.paint.tube;
        nctx.fillText(g.l.text, g.l.startX, g.l.y);
      } else {
        strokeLine(nctx, g.l.text, g.l.startX, g.l.y, g.paint.tube, g.l.tube, 1);
      }
    } else if (g.perGlyph) {
      for (let i = 0; i < g.boxes.length; i++) {
        const gb = g.boxes[i];
        if (single) {
          nctx.globalAlpha = 1;
          nctx.fillStyle = g.perGlyph[i].tube;
          nctx.fillText(gb.ch, gb.x, g.l.y);
        } else {
          strokeLine(nctx, gb.ch, gb.x, g.l.y, g.perGlyph[i].tube, g.l.tube, 1);
        }
      }
    }
  }

  /* ---- 4. hot core (additive) — THE neon look ----
     double-line: a whiter core stroke inset inside the tube + a near-white
     filament line down its center.
     single-line: the same recipe built from blur∩mask overlays — a soft
     white-hot center with colored rims, clipped to the tube so it can
     never look bitten or broken, no matter how thin the letters get. */
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (!g.l.text) continue;
    nctx.font = fontCss(font, g.l.fontSize);
    nctx.direction = g.l.rtl ? "rtl" : "ltr";
    const single = lineModeForLine(g.l.rtl, lineMode) === "single";
    const geom = geoms[gi];
    const set = single ? getSlSet(fontId, g.l.text, g.l.fontSize, g.l.rtl, geom, dpr) : null;
    if (single && set) {
      if (g.paint) {
        blitSlMask(nctx, cw, ch, dpr, set.core, g.l.startX, g.l.y, g.paint.core, 0.95, true);
        blitSlMask(nctx, cw, ch, dpr, set.fil, g.l.startX, g.l.y, g.paint.filament, 0.9, true);
      } else if (g.perGlyph) {
        for (let i = 0; i < g.boxes.length; i++) {
          const gb = g.boxes[i];
          if (gb.ch.trim() === "") continue;
          const gs = getSlSet(fontId, gb.ch, g.l.fontSize, g.l.rtl, geom, dpr);
          if (gs) {
            blitSlMask(nctx, cw, ch, dpr, gs.core, gb.x, g.l.y, g.perGlyph[i].core, 0.95, true);
            blitSlMask(nctx, cw, ch, dpr, gs.fil, gb.x, g.l.y, g.perGlyph[i].filament, 0.9, true);
          }
        }
      }
      continue;
    }
    if (g.paint) {
      if (single) {
        // degenerate fallback: one soft additive core fill
        nctx.globalCompositeOperation = "lighter";
        nctx.globalAlpha = 0.55;
        nctx.fillStyle = g.paint.core;
        nctx.fillText(g.l.text, g.l.startX, g.l.y);
        nctx.globalAlpha = 1;
        nctx.globalCompositeOperation = "source-over";
      } else {
        nctx.globalCompositeOperation = "lighter";
        strokeLine(nctx, g.l.text, g.l.startX, g.l.y, g.paint.core, g.l.tube * 0.45, 0.95);
        strokeLine(nctx, g.l.text, g.l.startX, g.l.y, g.paint.filament, g.l.tube * 0.18, 0.9);
        nctx.globalCompositeOperation = "source-over";
      }
    } else if (g.perGlyph) {
      for (let i = 0; i < g.boxes.length; i++) {
        const gb = g.boxes[i];
        if (single) {
          nctx.globalCompositeOperation = "lighter";
          nctx.globalAlpha = 0.55;
          nctx.fillStyle = g.perGlyph[i].core;
          nctx.fillText(gb.ch, gb.x, g.l.y);
          nctx.globalAlpha = 1;
          nctx.globalCompositeOperation = "source-over";
        } else {
          nctx.globalCompositeOperation = "lighter";
          strokeLine(nctx, gb.ch, gb.x, g.l.y, g.perGlyph[i].core, g.l.tube * 0.45, 0.95);
          strokeLine(nctx, gb.ch, gb.x, g.l.y, g.perGlyph[i].filament, g.l.tube * 0.18, 0.9);
          nctx.globalCompositeOperation = "source-over";
        }
      }
    }
  }
  nctx.globalAlpha = 1;
  nctx.restore();
}

/* ---------------- off state ---------------- */

function drawOffSign(
  nctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  dpr: number,
  fontId: string,
  mode: ColorMode,
  lineMode: LineMode,
  layout: NeonLayout,
  frame: FrameColors,
  dark: boolean
): void {
  const base: RGB = dark ? [74, 69, 63] : [150, 143, 132];
  const groups = buildLineGroups(nctx, layout, frame, mode === "perLetter" ? "perLetter" : "solid");
  const font = getFont(fontId);

  nctx.save();
  nctx.textAlign = "left";
  nctx.textBaseline = "middle";
  nctx.lineJoin = "round";
  nctx.lineCap = "round";
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (!g.l.text) continue;
    nctx.font = fontCss(font, g.l.fontSize);
    nctx.direction = g.l.rtl ? "rtl" : "ltr";
    const single = lineModeForLine(g.l.rtl, lineMode) === "single";
    const geom = singleLineGeom(g.l.fontSize, g.l.tube, fontId, g.l.text);
    const set = single ? getSlSet(fontId, g.l.text, g.l.fontSize, g.l.rtl, geom, dpr) : null;
    if (single && set) {
      if (g.paint) {
        // thin unlit glass tube + faint colored sheen inside
        blitSlMask(nctx, cw, ch, dpr, set.body, g.l.startX, g.l.y, rgbToCss(base), 0.92, false);
        blitSlMask(nctx, cw, ch, dpr, set.core, g.l.startX, g.l.y, g.paint.tube, 0.28, false);
      } else if (g.perGlyph) {
        for (let i = 0; i < g.boxes.length; i++) {
          const gb = g.boxes[i];
          if (gb.ch.trim() === "") continue;
          const glass = rgbToCss(lerpRgb(g.colors[i].tube, base, 0.55));
          const gs = getSlSet(fontId, gb.ch, g.l.fontSize, g.l.rtl, geom, dpr);
          if (gs) blitSlMask(nctx, cw, ch, dpr, gs.body, gb.x, g.l.y, glass, 0.92, false);
        }
      }
      continue;
    }
    if (g.paint) {
      if (single) {
        // degenerate fallback: solid unlit letters
        nctx.globalAlpha = 0.92;
        nctx.fillStyle = rgbToCss(base);
        nctx.fillText(g.l.text, g.l.startX, g.l.y);
        nctx.globalAlpha = 0.28;
        nctx.fillStyle = g.paint.tube;
        nctx.fillText(g.l.text, g.l.startX, g.l.y);
        nctx.globalAlpha = 1;
      } else {
        // pale unlit glass + faint colored sheen
        strokeLine(nctx, g.l.text, g.l.startX, g.l.y, rgbToCss(base), g.l.tube, 0.92);
        strokeLine(nctx, g.l.text, g.l.startX, g.l.y, g.paint.tube, g.l.tube * 0.22, 0.28);
      }
    } else if (g.perGlyph) {
      for (let i = 0; i < g.boxes.length; i++) {
        const gb = g.boxes[i];
        const glass = rgbToCss(lerpRgb(g.colors[i].tube, base, 0.55));
        if (single) {
          nctx.globalAlpha = 0.92;
          nctx.fillStyle = glass;
          nctx.fillText(gb.ch, gb.x, g.l.y);
          nctx.globalAlpha = 1;
        } else {
          strokeLine(nctx, gb.ch, gb.x, g.l.y, glass, g.l.tube, 0.92);
        }
      }
    }
  }
  nctx.globalAlpha = 1;
  nctx.restore();
}

/* ---------------- ambient light + vignette ---------------- */

function drawAmbient(ctx: CanvasRenderingContext2D, cw: number, ch: number, glow: RGB, dark: boolean): void {
  const strength = dark ? 0.14 : 0.05;
  const css = `rgb(${glow[0]}, ${glow[1]}, ${glow[2]})`;
  const r = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.max(cw, ch) * 0.65);
  r.addColorStop(0, withAlpha(css, strength));
  r.addColorStop(1, withAlpha(css, 0));
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, cw, ch);
}

function drawVignette(ctx: CanvasRenderingContext2D, cw: number, ch: number, dark: boolean): void {
  const a = dark ? 0.5 : 0.1;
  const v = ctx.createRadialGradient(
    cw / 2,
    ch / 2,
    Math.min(cw, ch) * 0.38,
    cw / 2,
    ch / 2,
    Math.max(cw, ch) * 0.78
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, cw, ch);
}

/* ---------------- floor reflection (dark backgrounds) ---------------- */

function drawReflection(
  ctx: CanvasRenderingContext2D,
  neonCanvas: HTMLCanvasElement,
  layout: NeonLayout,
  cw: number,
  ch: number,
  dpr: number
): void {
  const bandH = Math.min(ch * 0.16, 80);
  if (bandH <= 4) return;
  // cached scratch (this runs on EVERY animation frame on dark walls —
  // allocating a fresh canvas per frame was pure GC churn)
  const ref = getScratch("reflect", cw, bandH, dpr);
  const rctx = scratchCtx("reflect", cw, bandH, dpr);
  if (!ref || !rctx) return;
  const devW = ref.width;
  const bandDev = ref.height;

  // work in device pixels (identity transform)
  rctx.setTransform(1, 0, 0, 1, 0, 0);
  const srcY = Math.max(0, Math.round((layout.bottom - bandH) * dpr));
  rctx.save();
  rctx.scale(1, -1);
  rctx.drawImage(neonCanvas, 0, srcY, devW, bandDev, 0, -bandDev, devW, bandDev);
  rctx.restore();

  // fade the reflection out toward the bottom
  rctx.globalCompositeOperation = "destination-in";
  const g = rctx.createLinearGradient(0, 0, 0, bandDev);
  g.addColorStop(0, "rgba(0,0,0,0.32)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  rctx.fillStyle = g;
  rctx.fillRect(0, 0, devW, bandDev);
  rctx.globalCompositeOperation = "source-over";

  ctx.save();
  if (supportsFilter()) ctx.filter = `blur(${(2 * dpr).toFixed(1)}px)`;
  ctx.globalAlpha = 0.6;
  ctx.drawImage(ref, 0, 0, ref.width, ref.height, 0, layout.bottom, cw, bandH);
  ctx.filter = "none";
  ctx.restore();
}

/* ---------------- final composite ---------------- */

export function drawNeon(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  spec: NeonSpec,
  opts: DrawOptions = {}
): NeonLayout {
  const dpr = opts.dpr ?? 1;
  const t = opts.tSec ?? 0;
  const bgDef = resolveBackground(spec.background ?? { id: "brick" });
  const dark = bgDef.dark;
  const mode = getMode(spec.mode);

  ctx.save();
  // 1. background
  drawBackground(ctx, cw, ch, bgDef);

  // 2. layout
  const layout = layoutSign(ctx, cw, ch, spec, opts);

  // 3. colors for this frame
  const frame = resolveFrameColors(spec, layout, t);

  // 4. ambient wall light + vignette
  drawVignette(ctx, cw, ch, dark);
  if (spec.on) drawAmbient(ctx, cw, ch, frame.dominantGlow, dark);

  // 5. the sign on its own transparent layer
  const neonCtx = scratchCtx("neon", cw, ch, dpr);
  const neonCanvas = getScratch("neon", cw, ch, dpr);
  if (neonCtx && neonCanvas) {
    if (spec.on) {
      drawLitSign(neonCtx, cw, ch, dpr, spec.fontId, mode, getLineMode(spec.lineMode), layout, frame, dark);
    } else {
      drawOffSign(neonCtx, cw, ch, dpr, spec.fontId, mode, getLineMode(spec.lineMode), layout, frame, dark);
    }

    // 6. reflection below the sign (dark backgrounds, powered on)
    if (spec.on && dark) {
      drawReflection(ctx, neonCanvas, layout, cw, ch, dpr);
    }

    // 7. composite the sign
    ctx.globalAlpha = 1;
    ctx.drawImage(neonCanvas, 0, 0, neonCanvas.width, neonCanvas.height, 0, 0, cw, ch);
  }
  ctx.restore();
  return layout;
}

/* ---------------- PNG / JPEG export ---------------- */

export interface ExportResult {
  dataUrl: string;
  layout: NeonLayout;
}

export function exportNeonImage(
  spec: NeonSpec,
  options: {
    width?: number;
    height?: number;
    type?: "image/png" | "image/jpeg";
    quality?: number;
    tSec?: number;
  } = {}
): ExportResult | null {
  if (typeof document === "undefined") return null;
  const cw = options.width ?? 1600;
  const ch = options.height ?? 1000;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const layout = drawNeon(ctx, cw, ch, spec, {
    placeholder: "NEON",
    tSec: options.tSec ?? 0,
    dpr: 1,
  });
  const type = options.type ?? "image/png";
  const dataUrl = canvas.toDataURL(type, options.quality ?? 0.92);
  return { dataUrl, layout };
}

/* ---------------- GIF export (animated modes) ---------------- */

interface GifFrame {
  t: number;
  delayMs: number;
}

export function isAnimatedSpec(spec: NeonSpec): boolean {
  return isAnimatedMode(getMode(spec.mode));
}

/**
 * Export the design as an animated GIF. Flow mode renders one full sweep,
 * cycle mode renders every color with its hold + crossfade.
 */
export async function exportNeonGif(
  spec: NeonSpec,
  options: {
    width?: number;
    height?: number;
    /** flow mode: number of frames in one full sweep (default 48) */
    flowFrames?: number;
    /** hard cap on total frames — longer plans are uniformly subsampled */
    frameBudget?: number;
    /** compact order previews: swap photo backgrounds for flat charcoal —
     *  flat areas compress hugely, keeping the GIF well under payload caps */
    flatBackground?: boolean;
    /** cap the per-color hold in the preview so long holds (e.g. 10s) still
     *  read as ANIMATING — the real timing travels with the order data */
    cycleHoldCap?: number;
    onProgress?: (done: number, total: number) => void;
  } = {}
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");

  const mode = getMode(spec.mode);
  if (!isAnimatedMode(mode)) return null;

  // make sure assets are ready
  const bgDef = resolveBackground(spec.background ?? { id: "brick" });
  await ensureBackgroundLoaded(bgDef);
  await ensureFontsLoaded();

  const drawSpec: NeonSpec =
    options.flatBackground && bgDef.kind === "image"
      ? { ...spec, background: { id: "solid-charcoal" } }
      : spec;

  const cw = options.width ?? 900;
  const ch = options.height ?? 560;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  // ---- build the frame plan ----
  let frames: GifFrame[] = [];
  if (mode === "flow") {
    const speed = Math.min(3, Math.max(0.25, spec.flowSpeed ?? 1));
    const cycle = 8 / speed; // seconds for one full sweep
    const n = Math.max(12, Math.min(48, options.flowFrames ?? 48));
    for (let i = 0; i < n; i++) {
      frames.push({ t: (i * cycle) / n, delayMs: Math.max(20, Math.round((cycle * 1000) / n)) });
    }
  } else {
    // cycle: one long frame per hold + short frames across the fade
    const ids = (spec.cycleColors ?? []).filter(Boolean);
    const hold = Math.min(
      Math.max(0.2, spec.cycleHold ?? 1),
      options.cycleHoldCap ?? Infinity
    );
    const fade = Math.min(Math.max(0, spec.cycleFade ?? 0.8), 2.5);
    const N = Math.max(1, ids.length);
    const fadeSteps = fade > 0.01 ? 10 : 0;
    for (let i = 0; i < N; i++) {
      const t0 = i * (hold + fade);
      frames.push({ t: t0 + hold * 0.5, delayMs: Math.min(6000, Math.round(hold * 1000)) });
      for (let k = 1; k <= fadeSteps; k++) {
        frames.push({
          t: t0 + hold + (k / (fadeSteps + 1)) * fade,
          delayMs: Math.max(20, Math.round((fade * 1000) / (fadeSteps + 1))),
        });
      }
    }
  }

  // ---- keep the payload small: uniformly subsample long plans, merging delays ----
  const budget = Math.max(12, options.frameBudget ?? 160);
  if (frames.length > budget) {
    const k = Math.ceil(frames.length / budget);
    const kept: GifFrame[] = [];
    for (let i = 0; i < frames.length; i += k) {
      let delay = 0;
      for (let j = i; j < Math.min(i + k, frames.length); j++) delay += frames[j].delayMs;
      kept.push({ t: frames[i].t, delayMs: Math.max(20, delay) });
    }
    frames = kept;
  }

  const gif = GIFEncoder();
  const total = frames.length;
  for (let i = 0; i < total; i++) {
    const f = frames[i];
    drawNeon(ctx, cw, ch, drawSpec, { placeholder: "NEON", tSec: f.t, dpr: 1 });
    const { data } = ctx.getImageData(0, 0, cw, ch);
    const palette = quantize(data, 256, { format: "rgb565" });
    const index = applyPalette(data, palette, "rgb565");
    gif.writeFrame(index, cw, ch, { palette, delay: f.delayMs });
    options.onProgress?.(i + 1, total);
    // let the UI breathe between frames
    if (i % 8 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  gif.finish();
  return new Blob([gif.bytesView()], { type: "image/gif" });
}

/* ---------------- download ---------------- */

function slugify(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40) || "neon-sign"
  );
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Download PNG (static modes) or GIF (flow / cycle). Returns what was downloaded. */
export async function downloadNeonFile(spec: NeonSpec, label: string): Promise<"png" | "gif" | null> {
  const base = `printoo-neon-${slugify(label)}`;
  if (isAnimatedSpec(spec)) {
    const bgDef = resolveBackground(spec.background ?? { id: "brick" });
    await ensureBackgroundLoaded(bgDef);
    const blob = await exportNeonGif(spec, { width: 900, height: 560 });
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${base}.gif`);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "gif";
  }
  const res = exportNeonImage(spec, { width: 1600, height: 1000, type: "image/png" });
  if (!res) return null;
  triggerDownload(res.dataUrl, `${base}.png`);
  return "png";
}

/* ---------------- physical size estimate ---------------- */

export function estimateSizeCm(
  widthCm: number,
  layout: { width: number; height: number }
): { widthCm: number; heightCm: number } {
  if (layout.width <= 0) return { widthCm, heightCm: 0 };
  return {
    widthCm,
    heightCm: Math.max(8, Math.round((widthCm * layout.height) / layout.width)),
  };
}

/** Normalize Persian/Arabic digits to Latin (for phone numbers) */
export function normalizeDigits(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = fa.indexOf(d);
    return String(i >= 0 ? i : ar.indexOf(d));
  });
}
