/* ------------------------------------------------------------------
   Real neon render engine — Canvas 2D
   Light layers: wide halo -> tight halo -> tube body -> bright core -> hot filament
   Real neon = hollow letters made of glass tube (stroke only, no fill)

   Color modes:
   - solid    : single color
   - gradient : smooth A -> B blend across each line
   - duo      : letters alternate between two colors
   - rainbow  : each letter gets its own hue from a color wheel
------------------------------------------------------------------- */

export type WallMode = "night" | "day";
export type ColorMode = "solid" | "gradient" | "duo" | "rainbow";

export interface NeonColor {
  id: string;
  name: string;
  tube: string; // glass tube color (lit)
  glow: string; // halo color
}

/** Real gas & phosphor neon colors */
export const NEON_COLORS: NeonColor[] = [
  { id: "rose", name: "Classic Rose", tube: "#FF4E6E", glow: "#FF2456" },
  { id: "hotpink", name: "Hot Pink", tube: "#FF87F0", glow: "#FF2BD6" },
  { id: "magenta", name: "Magenta", tube: "#F76BFF", glow: "#C800F5" },
  { id: "red", name: "Fire Red", tube: "#FF5240", glow: "#FF2600" },
  { id: "coral", name: "Coral", tube: "#FF8A78", glow: "#FF5F4D" },
  { id: "orange", name: "Sunset Orange", tube: "#FF9E4A", glow: "#FF7A00" },
  { id: "gold", name: "Sun Gold", tube: "#FFD95E", glow: "#FFC400" },
  { id: "lemon", name: "Lemon Zest", tube: "#F0FF7A", glow: "#DFFF00" },
  { id: "green", name: "Neon Green", tube: "#4EF07E", glow: "#00E65A" },
  { id: "mint", name: "Mint", tube: "#7CFFC4", glow: "#00FFA8" },
  { id: "aqua", name: "Aqua", tube: "#37F0D8", glow: "#00D9C0" },
  { id: "ice", name: "Ice Blue", tube: "#74DBFF", glow: "#17B9FF" },
  { id: "sky", name: "Sky Blue", tube: "#8FB8FF", glow: "#4D8DFF" },
  { id: "violet", name: "Soft Violet", tube: "#B48CFF", glow: "#8E5CFF" },
  { id: "ultra", name: "Ultraviolet", tube: "#9A6BFF", glow: "#6C2BFF" },
  { id: "white", name: "Pure White", tube: "#FFFFFF", glow: "#E9F4FF" },
  { id: "warmwhite", name: "Warm White", tube: "#FFF2D8", glow: "#FFDF9E" },
];

export interface NeonFont {
  id: string;
  name: string;
  family: string; // CSS family name
  weight: number;
  /** Relative tube thickness vs font size — thin scripts need a fatter tube */
  tubeFactor: number;
}

/** Neon-friendly display fonts (Latin) */
export const NEON_FONTS: NeonFont[] = [
  { id: "pacifico", name: "Pacifico", family: "Pacifico", weight: 400, tubeFactor: 0.065 },
  { id: "greatvibes", name: "Great Vibes", family: "Great Vibes", weight: 400, tubeFactor: 0.08 },
  { id: "sacramento", name: "Sacramento", family: "Sacramento", weight: 400, tubeFactor: 0.085 },
  { id: "satisfy", name: "Satisfy", family: "Satisfy", weight: 400, tubeFactor: 0.07 },
  { id: "dancing", name: "Dancing Script", family: "Dancing Script", weight: 700, tubeFactor: 0.062 },
  { id: "kaushan", name: "Kaushan", family: "Kaushan Script", weight: 400, tubeFactor: 0.06 },
  { id: "yellowtail", name: "Yellowtail", family: "Yellowtail", weight: 400, tubeFactor: 0.065 },
  { id: "lobster", name: "Lobster", family: "Lobster", weight: 400, tubeFactor: 0.05 },
  { id: "caveat", name: "Caveat", family: "Caveat", weight: 700, tubeFactor: 0.065 },
  { id: "bebas", name: "Bebas Neue", family: "Bebas Neue", weight: 400, tubeFactor: 0.045 },
  { id: "monoton", name: "Monoton", family: "Monoton", weight: 400, tubeFactor: 0.05 },
  { id: "righteous", name: "Righteous", family: "Righteous", weight: 400, tubeFactor: 0.05 },
  { id: "passion", name: "Passion One", family: "Passion One", weight: 700, tubeFactor: 0.045 },
  { id: "marker", name: "Permanent Marker", family: "Permanent Marker", weight: 400, tubeFactor: 0.06 },
  { id: "audiowide", name: "Audiowide", family: "Audiowide", weight: 400, tubeFactor: 0.05 },
  { id: "playfair", name: "Playfair", family: "Playfair Display", weight: 700, tubeFactor: 0.055 },
];

export const COLOR_MODES: { id: ColorMode; name: string }[] = [
  { id: "solid", name: "Solid" },
  { id: "gradient", name: "Gradient" },
  { id: "duo", name: "Two-Tone" },
  { id: "rainbow", name: "Rainbow" },
];

export interface NeonSpec {
  lines: string[];
  fontId: string;
  colorId: string;
  /** second color (used by gradient & two-tone modes) */
  colorId2?: string;
  /** color mode — defaults to solid */
  mode?: ColorMode;
  on: boolean;
  wall: WallMode;
  /** enable flicker animation (preview canvas only) */
  flicker?: boolean;
}

export interface DrawOptions {
  /** time for flicker animation (ms) */
  time?: number;
  /** global brightness multiplier (flicker) */
  brightness?: number;
  /** fallback text when input is empty */
  placeholder?: string;
  /** relative horizontal padding */
  padX?: number;
  /** relative vertical padding */
  padY?: number;
}

export interface NeonLayout {
  line: { text: string; fontSize: number; y: number; tube: number }[];
  width: number; // real design width (px)
  height: number; // real design height (px)
  bottom: number; // lowest point (for floor reflection)
}

/* ---------------- color utils ---------------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

/* ---------------- fonts ---------------- */

export function getFont(id: string): NeonFont {
  return NEON_FONTS.find((f) => f.id === id) ?? NEON_FONTS[0];
}

export function getColor(id: string): NeonColor {
  return NEON_COLORS.find((c) => c.id === id) ?? NEON_COLORS[0];
}

export function getMode(id?: ColorMode): ColorMode {
  return COLOR_MODES.find((m) => m.id === id)?.id ?? "solid";
}

function fontCss(font: NeonFont, px: number): string {
  return `${font.weight} ${px}px "${font.family}", "Inter", sans-serif`;
}

/** Warm up fonts before drawing (canvas needs fonts loaded in the document) */
export async function ensureFontsLoaded(specs: NeonFont[]): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    await Promise.all(
      specs.map((f) => document.fonts.load(`${f.weight} 32px "${f.family}"`))
    );
    await document.fonts.ready;
  } catch {
    /* if a font fails we still draw with the fallback */
  }
}

/* ---------------- realistic flicker ---------------- */

/** Flicker pattern: steady base + micro jitter + occasional stutters */
export function flickerLevel(tMs: number): number {
  const s = tMs / 1000;
  let v = 1 - 0.05 * (0.5 + 0.5 * Math.sin(s * 31.4) * Math.sin(s * 17.3));
  const stutter = Math.sin(s * 0.9) * Math.sin(s * 2.33);
  if (stutter > 0.84) {
    v -= 0.5 * Math.abs(Math.sin(s * 43));
  }
  return Math.min(1, Math.max(0.14, v));
}

/* ---------------- layout ---------------- */

export function layoutSign(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  spec: NeonSpec,
  opts: DrawOptions = {}
): NeonLayout {
  const padX = opts.padX ?? 0.08;
  const padY = opts.padY ?? 0.16;
  const maxW = cw * (1 - padX * 2);
  const availH = ch * (1 - padY * 2);
  const lineGap = 1.22;

  let lines = spec.lines.map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    lines = [opts.placeholder ?? "NEON"];
  }

  const font = getFont(spec.fontId);

  // measure at 100px then scale down
  const sizes = lines.map((text) => {
    ctx.font = fontCss(font, 100);
    const w = ctx.measureText(text).width;
    return w > 0 ? (100 * maxW) / w : 100;
  });

  // height constraint: everything must fit in availH
  let total = sizes.reduce((s, fs) => s + fs * lineGap, 0);
  if (total > availH && total > 0) {
    const k = availH / total;
    for (let i = 0; i < sizes.length; i++) sizes[i] *= k;
    total = availH;
  }

  const cx = cw / 2;
  let top = (ch - total) / 2;
  let widest = 0;
  const line: NeonLayout["line"] = [];

  lines.forEach((text, i) => {
    const fs = sizes[i];
    const y = top + (fs * lineGap) / 2;
    top += fs * lineGap;
    ctx.font = fontCss(font, fs);
    widest = Math.max(widest, ctx.measureText(text).width);
    line.push({
      text,
      fontSize: fs,
      y,
      tube: Math.max(2.5, fs * font.tubeFactor),
    });
  });

  return {
    line,
    width: Math.min(widest, maxW),
    height: total,
    bottom: (ch - total) / 2 + total,
  };
}

/* ---------------- wall ---------------- */

const WALL = {
  night: {
    top: "#221C26",
    bottom: "#120E16",
    vignette: 0.55,
    ambient: 0.14, // colored ambient light strength on the wall
    haloA: 0.6,
    halo2A: 1,
  },
  day: {
    top: "#EFE9DE",
    bottom: "#E2DBCD",
    vignette: 0.12,
    ambient: 0.05,
    haloA: 0.22,
    halo2A: 0.6,
  },
} as const;

export function drawWall(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  wall: WallMode,
  glowColor?: string
): void {
  const w = WALL[wall];
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, w.top);
  g.addColorStop(1, w.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, ch);

  // colored ambient light on the wall
  if (glowColor) {
    const r = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      0,
      cw / 2,
      ch / 2,
      Math.max(cw, ch) * 0.62
    );
    r.addColorStop(0, withAlpha(glowColor, w.ambient));
    r.addColorStop(1, withAlpha(glowColor, 0));
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, cw, ch);
  }

  // corner vignette
  const v = ctx.createRadialGradient(
    cw / 2,
    ch / 2,
    Math.min(cw, ch) * 0.35,
    cw / 2,
    ch / 2,
    Math.max(cw, ch) * 0.75
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${w.vignette})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, cw, ch);
}

/* ---------------- per-letter colors (duo / rainbow) ---------------- */

interface Seg {
  text: string;
  x: number;
  tube: string; // hex
  glow: string; // hex
}

function buildSegments(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  mode: ColorMode,
  A: NeonColor,
  B: NeonColor
): Seg[] {
  const widths: number[] = [];
  let total = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    widths.push(w);
    total += w;
  }
  const segs: Seg[] = [];
  let x = cx - total / 2;
  let letterIdx = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let tube: string;
    let glow: string;
    if (ch === " ") {
      tube = A.tube;
      glow = A.glow;
    } else if (mode === "duo") {
      const c = letterIdx % 2 === 0 ? A : B;
      tube = c.tube;
      glow = c.glow;
    } else {
      // rainbow — rotate hue per letter
      const h = (letterIdx * 47) % 360;
      tube = hslToHex(h, 100, 74);
      glow = hslToHex(h, 100, 55);
    }
    if (ch !== " ") letterIdx++;
    segs.push({ text: ch, x, tube, glow });
    x += widths[i];
  }
  return segs;
}

/** Average glow color for ambient wall light / shadows */
function ambientGlowColor(spec: NeonSpec): string {
  const A = getColor(spec.colorId);
  const mode = getMode(spec.mode);
  if (mode === "gradient" || mode === "duo") {
    const B = spec.colorId2 ? getColor(spec.colorId2) : getColor("ice");
    return mixHex(A.glow, B.glow, 0.5);
  }
  return A.glow;
}

/* ---------------- sign drawing ---------------- */

interface SignPassOptions {
  alphaMul?: number;
  simple?: boolean; // for reflection / mini card: tube + core only
}

type ColorTransform = (c: NeonColor) => string;

export function drawSignPasses(
  ctx: CanvasRenderingContext2D,
  layout: NeonLayout,
  cw: number,
  spec: NeonSpec,
  opts: SignPassOptions = {}
): void {
  const A = getColor(spec.colorId);
  const mode = getMode(spec.mode);
  const B =
    mode === "gradient" || mode === "duo"
      ? spec.colorId2
        ? getColor(spec.colorId2)
        : getColor("ice")
      : A;
  const wallC = WALL[spec.wall];
  const font = getFont(spec.fontId);
  const alphaMul = opts.alphaMul ?? 1;
  const cx = cw / 2;
  const perLetter = mode === "duo" || mode === "rainbow";
  const shadowCol =
    mode === "solid" || mode === "rainbow"
      ? A.glow
      : mixHex(A.glow, B.glow, 0.5);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const l of layout.line) {
    ctx.font = fontCss(font, l.fontSize);
    const text = l.text;

    // ---- resolve stroke styles ----
    // solid mode: flat color from A
    // gradient mode: smooth A -> B linear gradient across the line
    // duo / rainbow: per-letter segments
    let lineW = 0;
    if (mode === "gradient") lineW = ctx.measureText(text).width;
    const x0 = cx - lineW / 2;
    const x1 = cx + lineW / 2;

    const grad = (fn: ColorTransform): CanvasGradient => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, fn(A));
      g.addColorStop(1, fn(B));
      return g;
    };
    const style = (fn: ColorTransform): string | CanvasGradient =>
      mode === "gradient" ? grad(fn) : fn(A);

    let segs: Seg[] | null = null;
    if (perLetter) {
      segs = buildSegments(ctx, text, cx, mode, A, B);
    }

    /** stroke the current line (whole-line or per-letter) */
    const strokeLine = (
      lineStyle: string | CanvasGradient,
      segStyle: (s: Seg) => string,
      width: number,
      alpha: number
    ) => {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      if (segs) {
        ctx.textAlign = "left";
        for (const s of segs) {
          ctx.strokeStyle = segStyle(s);
          ctx.strokeText(s.text, s.x, l.y);
        }
        ctx.textAlign = "center";
      } else {
        ctx.strokeStyle = lineStyle as string | CanvasGradient;
        ctx.strokeText(text, cx, l.y);
      }
    };

    if (!spec.on) {
      // off state: pale glass tube + glass sheen
      strokeLine(
        style((c) => mixHex(c.tube, "#544E5C", 0.62)),
        (s) => mixHex(s.tube, "#544E5C", 0.62),
        l.tube,
        0.96 * alphaMul
      );
      strokeLine(
        style((c) => mixHex(c.tube, "#FFFFFF", 0.35)),
        (s) => mixHex(s.tube, "#FFFFFF", 0.35),
        l.tube * 0.22,
        0.5 * alphaMul
      );
      continue;
    }

    // layer 1 — wide colored halo
    ctx.shadowColor = shadowCol;
    ctx.shadowBlur = l.tube * 6.5;
    strokeLine(
      style((c) => c.glow),
      (s) => s.glow,
      l.tube * 1.18,
      wallC.haloA * alphaMul
    );
    strokeLine(
      style((c) => c.glow),
      (s) => s.glow,
      l.tube * 1.18,
      wallC.haloA * alphaMul
    );

    // layer 2 — tight halo
    ctx.shadowBlur = l.tube * 2.1;
    strokeLine(
      style((c) => c.tube),
      (s) => s.tube,
      l.tube,
      wallC.halo2A * alphaMul
    );

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    if (!opts.simple) {
      // layer 3 — glass tube body
      strokeLine(
        style((c) => c.tube),
        (s) => s.tube,
        l.tube,
        alphaMul
      );

      // layer 4 — bright core
      strokeLine(
        style((c) => mixHex(c.tube, "#FFFFFF", 0.6)),
        (s) => mixHex(s.tube, "#FFFFFF", 0.6),
        l.tube * 0.52,
        alphaMul
      );

      // layer 5 — hot filament
      strokeLine(
        style((c) => mixHex(c.tube, "#FFFFFF", 0.88)),
        (s) => mixHex(s.tube, "#FFFFFF", 0.88),
        l.tube * 0.2,
        0.95 * alphaMul
      );
    }
  }
  ctx.restore();
}

/* ---------------- floor reflection (night wall only) ---------------- */

function drawReflection(
  ctx: CanvasRenderingContext2D,
  layout: NeonLayout,
  cw: number,
  ch: number,
  spec: NeonSpec
): void {
  const reflectH = Math.min(ch * 0.16, 70);
  if (reflectH <= 0) return;
  ctx.save();
  // clip to the reflection band so tall signs never overflow the canvas edge
  ctx.beginPath();
  ctx.rect(0, layout.bottom, cw, reflectH);
  ctx.clip();
  // mirror around the bottom of the design
  ctx.translate(0, 2 * layout.bottom + 4);
  ctx.scale(1, -1);
  drawSignPasses(ctx, layout, cw, spec, { simple: true, alphaMul: 0.14 });
  ctx.restore();

  // fade the reflection out
  const g = ctx.createLinearGradient(0, layout.bottom, 0, layout.bottom + reflectH);
  const base = WALL.night.bottom;
  g.addColorStop(0, withAlpha(base, 0.15));
  g.addColorStop(1, withAlpha(base, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, layout.bottom, cw, reflectH + 8);
}

/* ---------------- final composite ---------------- */

export function drawNeon(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  spec: NeonSpec,
  opts: DrawOptions = {}
): NeonLayout {
  const brightness = spec.on
    ? (opts.brightness ?? 1) * (spec.wall === "night" ? 1 : 0.94)
    : 1;

  ctx.save();
  ctx.clearRect(0, 0, cw, ch);
  drawWall(ctx, cw, ch, spec.wall, spec.on ? ambientGlowColor(spec) : undefined);

  const layout = layoutSign(ctx, cw, ch, spec, opts);

  if (spec.on && spec.wall === "night") {
    drawReflection(ctx, layout, cw, ch, { ...spec, on: true });
  }

  drawSignPasses(ctx, layout, cw, spec, {
    alphaMul: brightness,
  });

  ctx.restore();
  return layout;
}

/* ---------------- image export ---------------- */

export interface ExportResult {
  dataUrl: string;
  layout: NeonLayout;
}

/** Render the design at high quality and return a data URL */
export function exportNeonImage(
  spec: NeonSpec,
  options: {
    width?: number;
    height?: number;
    type?: "image/png" | "image/jpeg";
    quality?: number;
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

  const layout = drawNeon(ctx, cw, ch, spec, { placeholder: "NEON" });
  const type = options.type ?? "image/png";
  const dataUrl = canvas.toDataURL(type, options.quality ?? 0.92);
  return { dataUrl, layout };
}

/** Download a PNG of the design in the browser */
export function downloadNeonPng(spec: NeonSpec, label: string): boolean {
  const res = exportNeonImage(spec, { width: 1600, height: 1000, type: "image/png" });
  if (!res) return false;
  const a = document.createElement("a");
  a.href = res.dataUrl;
  const slug =
    label
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "")
      .slice(0, 40) || "neon-sign";
  a.download = `neon-${slug}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

/* ---------------- physical size estimate ---------------- */

export function estimateSizeCm(
  widthCm: number,
  layout: NeonLayout
): { widthCm: number; heightCm: number } {
  if (layout.width <= 0) return { widthCm, heightCm: 0 };
  return {
    widthCm,
    heightCm: Math.round((widthCm * layout.height) / layout.width),
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
