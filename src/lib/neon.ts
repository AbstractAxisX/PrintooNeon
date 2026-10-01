/* ------------------------------------------------------------------
   موتور رندر نئون واقعی — Canvas 2D
   لایه‌های نور: هاله‌ی پهن → هاله‌ی نزدیک → بدنه‌ی لوله → مغز روشن → رشته‌ی داغ
   نئون واقعی = حروف توخالی ساخته‌شده از لوله‌ی شیشه‌ای (فقط stroke، بدون fill)
------------------------------------------------------------------- */

export type WallMode = "night" | "day";
export type ScriptKind = "fa" | "latin";

export interface NeonColor {
  id: string;
  name: string;
  tube: string; // رنگ لوله شیشه (روشن)
  glow: string; // رنگ هاله نور
}

/** رنگ‌های واقعی گاز و فسفر نئون */
export const NEON_COLORS: NeonColor[] = [
  { id: "rose", name: "رزِ کلاسیک", tube: "#FF4E6E", glow: "#FF2456" },
  { id: "red", name: "قرمز آتشین", tube: "#FF5240", glow: "#FF2600" },
  { id: "orange", name: "نارنجی غروب", tube: "#FF9E4A", glow: "#FF7A00" },
  { id: "gold", name: "زرد خورشیدی", tube: "#FFD95E", glow: "#FFC400" },
  { id: "green", name: "سبز نئونی", tube: "#4EF07E", glow: "#00E65A" },
  { id: "aqua", name: "فیروزه‌ای", tube: "#37F0D8", glow: "#00D9C0" },
  { id: "ice", name: "آبی یخی", tube: "#74DBFF", glow: "#17B9FF" },
  { id: "violet", name: "بنفش شیری", tube: "#B48CFF", glow: "#8E5CFF" },
  { id: "warm-white", name: "سفید گرم", tube: "#FFF2D8", glow: "#FFDF9E" },
];

export interface NeonFont {
  id: string;
  name: string;
  family: string; // نام خانواده CSS
  weight: number;
  script: ScriptKind;
  /** ضخامت نسبی لوله نسبت به سایز فونت — فونت‌های نازک لوله‌ی کلفت‌تر می‌خواهند */
  tubeFactor: number;
}

/** فونت‌های مناسب نئون — فارسی و لاتین */
export const NEON_FONTS: NeonFont[] = [
  { id: "lalezar", name: "لاله‌زار", family: "Lalezar", weight: 400, script: "fa", tubeFactor: 0.05 },
  { id: "vazir", name: "وزیر (مدرن)", family: "Vazirmatn", weight: 800, script: "fa", tubeFactor: 0.05 },
  { id: "naskh", name: "نسخ (کلاسیک)", family: "Noto Naskh Arabic", weight: 700, script: "fa", tubeFactor: 0.052 },
  { id: "amiri", name: "امیری (ظریف)", family: "Amiri", weight: 700, script: "fa", tubeFactor: 0.06 },
  { id: "pacifico", name: "Pacifico (اسکریپت)", family: "Pacifico", weight: 400, script: "latin", tubeFactor: 0.07 },
  { id: "vibes", name: "Great Vibes (ظریف)", family: "Great Vibes", weight: 400, script: "latin", tubeFactor: 0.075 },
  { id: "monoton", name: "Monoton (رترو)", family: "Monoton", weight: 400, script: "latin", tubeFactor: 0.07 },
  { id: "bebas", name: "Bebas Neue (بولد)", family: "Bebas Neue", weight: 400, script: "latin", tubeFactor: 0.045 },
];

export interface NeonSpec {
  lines: string[];
  fontId: string;
  colorId: string;
  on: boolean;
  wall: WallMode;
  /** فعال‌سازی انیمیشن سوسو زدن (فقط برای بوم پیش‌نمایش) */
  flicker?: boolean;
}

export interface DrawOptions {
  /** زمان برای انیمیشن سوسو (میلی‌ثانیه) */
  time?: number;
  /** ضریب روشنایی کلی (فلیکر) */
  brightness?: number;
  /** متن جایگزین وقتی ورودی خالی است */
  placeholder?: string;
  /** پدینگ نسبی افقی */
  padX?: number;
  /** پدینگ نسبی عمودی */
  padY?: number;
}

export interface NeonLayout {
  line: { text: string; fontSize: number; y: number; tube: number }[];
  width: number; // عرض واقعی طرح (px)
  height: number; // ارتفاع واقعی طرح (px)
  bottom: number; // پایین‌ترین نقطه (برای انعکاس کف)
}

/* ---------------- ابزار رنگ ---------------- */

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

/* ---------------- فونت ---------------- */

export function getFont(id: string): NeonFont {
  return NEON_FONTS.find((f) => f.id === id) ?? NEON_FONTS[0];
}

export function getColor(id: string): NeonColor {
  return NEON_COLORS.find((c) => c.id === id) ?? NEON_COLORS[0];
}

function fontCss(font: NeonFont, px: number): string {
  const fallback =
    font.script === "fa"
      ? '"Vazirmatn", "Tahoma", sans-serif'
      : '"Vazirmatn", sans-serif';
  return `${font.weight} ${px}px "${font.family}", ${fallback}`;
}

/** آماده‌سازی فونت‌ها قبل از رسم (canvas به فونت‌های load‌شده‌ی document نیاز دارد) */
export async function ensureFontsLoaded(specs: NeonFont[]): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    await Promise.all(
      specs.map((f) => document.fonts.load(`${f.weight} 32px "${f.family}"`))
    );
    await document.fonts.ready;
  } catch {
    /* اگر فونتی لود نشد، رسم با فونت جایگزین ادامه می‌یابد */
  }
}

/* ---------------- سوسو زدن واقعی نئون ---------------- */

/** الگوی فلیکر: بازِ ثابت + لرزش ریز + گیرهای گاه‌به‌گاه */
export function flickerLevel(tMs: number): number {
  const s = tMs / 1000;
  // لرزش ریز (برق‌ورزی گاز)
  let v = 1 - 0.05 * (0.5 + 0.5 * Math.sin(s * 31.4) * Math.sin(s * 17.3));
  // گیرهای گاه‌به‌گاه
  const stutter = Math.sin(s * 0.9) * Math.sin(s * 2.33);
  if (stutter > 0.84) {
    v -= 0.5 * Math.abs(Math.sin(s * 43));
  }
  return Math.min(1, Math.max(0.14, v));
}

/* ---------------- چیدمان ---------------- */

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

  // اندازه‌گیری در ۱۰۰px سپس مقیاس‌دهی
  const sizes = lines.map((text) => {
    ctx.font = fontCss(font, 100);
    const w = ctx.measureText(text).width;
    return w > 0 ? (100 * maxW) / w : 100;
  });

  // محدودیت ارتفاع: کل باید در availH جا شود
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

/* ---------------- دیوار ---------------- */

const WALL = {
  night: {
    top: "#221C26",
    bottom: "#120E16",
    vignette: 0.55,
    ambient: 0.14, // شدت نور رنگی روی دیوار
    haloA: 0.6, // آلفای هاله‌ی پهن
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

  // نور محیطی رنگ نئون روی دیوار
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

  // وینیت گوشه‌ها
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

/* ---------------- رسم علامت نئون ---------------- */

interface SignPassOptions {
  alphaMul?: number;
  simple?: boolean; // برای انعکاس/مینی‌کارت: فقط بدنه و مغز
}

export function drawSignPasses(
  ctx: CanvasRenderingContext2D,
  layout: NeonLayout,
  cw: number,
  spec: NeonSpec,
  opts: SignPassOptions = {}
): void {
  const color = getColor(spec.colorId);
  const wallC = WALL[spec.wall];
  const font = getFont(spec.fontId);
  const alphaMul = opts.alphaMul ?? 1;
  const cx = cw / 2;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const l of layout.line) {
    ctx.font = fontCss(font, l.fontSize);
    const text = l.text;

    if (!spec.on) {
      // حالت خاموش: شیشه‌ی رنگ‌پریده + هایلایت شیشه
      const dim = mixHex(color.tube, "#544E5C", 0.62);
      ctx.globalAlpha = 0.96 * alphaMul;
      ctx.strokeStyle = dim;
      ctx.lineWidth = l.tube;
      ctx.strokeText(text, cx, l.y);

      ctx.globalAlpha = 0.5 * alphaMul;
      ctx.strokeStyle = mixHex(color.tube, "#FFFFFF", 0.35);
      ctx.lineWidth = l.tube * 0.22;
      ctx.strokeText(text, cx, l.y);
      continue;
    }

    // لایه ۱ — هاله‌ی پهن رنگی
    ctx.globalAlpha = wallC.haloA * alphaMul;
    ctx.shadowColor = color.glow;
    ctx.shadowBlur = l.tube * 6.5;
    ctx.strokeStyle = color.glow;
    ctx.lineWidth = l.tube * 1.18;
    ctx.strokeText(text, cx, l.y);
    ctx.strokeText(text, cx, l.y);

    // لایه ۲ — هاله‌ی نزدیک
    ctx.shadowBlur = l.tube * 2.1;
    ctx.globalAlpha = wallC.halo2A * alphaMul;
    ctx.strokeStyle = color.tube;
    ctx.lineWidth = l.tube;
    ctx.strokeText(text, cx, l.y);

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    if (!opts.simple) {
      // لایه ۳ — بدنه‌ی لوله
      ctx.globalAlpha = alphaMul;
      ctx.strokeStyle = color.tube;
      ctx.lineWidth = l.tube;
      ctx.strokeText(text, cx, l.y);

      // لایه ۴ — مغز روشن
      ctx.globalAlpha = alphaMul;
      ctx.strokeStyle = mixHex(color.tube, "#FFFFFF", 0.6);
      ctx.lineWidth = l.tube * 0.52;
      ctx.strokeText(text, cx, l.y);

      // لایه ۵ — رشته‌ی داغ سفید
      ctx.globalAlpha = 0.95 * alphaMul;
      ctx.strokeStyle = mixHex(color.tube, "#FFFFFF", 0.88);
      ctx.lineWidth = l.tube * 0.2;
      ctx.strokeText(text, cx, l.y);
    }
  }
  ctx.restore();
}

/* ---------------- انعکاس کف (فقط دیوار شب) ---------------- */

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
  // آینه کردن حول پایین طرح
  ctx.translate(0, 2 * layout.bottom + 4);
  ctx.scale(1, -1);
  drawSignPasses(ctx, layout, cw, spec, { simple: true, alphaMul: 0.14 });
  ctx.restore();

  // محو تدریجی انعکاس
  const g = ctx.createLinearGradient(0, layout.bottom, 0, layout.bottom + reflectH);
  const base = WALL.night.bottom;
  g.addColorStop(0, withAlpha(base, 0.15));
  g.addColorStop(1, withAlpha(base, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, layout.bottom, cw, reflectH + 8);
}

/* ---------------- ترکیب نهایی ---------------- */

export function drawNeon(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  spec: NeonSpec,
  opts: DrawOptions = {}
): NeonLayout {
  const color = getColor(spec.colorId);
  const brightness = spec.on
    ? (opts.brightness ?? 1) * (spec.wall === "night" ? 1 : 0.94)
    : 1;

  ctx.save();
  ctx.clearRect(0, 0, cw, ch);
  drawWall(ctx, cw, ch, spec.wall, spec.on ? color.glow : undefined);

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

/* ---------------- خروجی تصویر ---------------- */

export interface ExportResult {
  dataUrl: string;
  layout: NeonLayout;
}

/** رندر طرح با کیفیت بالا و خروجی به‌صورت data URL */
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

/** دانلود خروجی PNG در مرورگر */
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

/* ---------------- متریک اندازه واقعی ---------------- */

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

/** نرمال‌سازی ارقام فارسی/عربی به لاتین (برای شماره تماس) */
export function normalizeDigits(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = fa.indexOf(d);
    return String(i >= 0 ? i : ar.indexOf(d));
  });
}
