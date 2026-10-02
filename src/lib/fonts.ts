/* ------------------------------------------------------------------
   Self-hosted neon font registry (27 Latin + 8 Kurdish Sorani fonts,
   /public/fonts/*.woff2). No CDN dependency — same origin only.
------------------------------------------------------------------- */

export type FontCategory =
  | "script"
  | "hand"
  | "display"
  | "bold"
  | "clean"
  | "elegant"
  | "ku-display"
  | "ku-classic";

export type FontScript = "latin" | "arabic";

export interface NeonFont {
  id: string;
  name: string;
  /** CSS font-family */
  family: string;
  weight: number;
  /** Relative tube thickness vs font size — thin scripts need a fatter tube */
  tubeFactor: number;
  category: FontCategory;
  /** writing system — arabic = connected RTL script (Kurdish Sorani / Persian) */
  script: FontScript;
}

export const FONT_CATEGORIES: { id: FontCategory; name: string; script: FontScript }[] = [
  { id: "script", name: "Script", script: "latin" },
  { id: "hand", name: "Handwritten", script: "latin" },
  { id: "display", name: "Neon & Display", script: "latin" },
  { id: "bold", name: "Bold & Strong", script: "latin" },
  { id: "clean", name: "Clean & Modern", script: "latin" },
  { id: "elegant", name: "Elegant", script: "latin" },
  { id: "ku-display", name: "کوردی · Display & Rounded", script: "arabic" },
  { id: "ku-classic", name: "کوردی · Classic & Modern", script: "arabic" },
];

/** Neon-friendly display fonts (Latin) — all served from /public/fonts */
export const NEON_FONTS: NeonFont[] = [
  // ---- script ----
  { id: "pacifico", name: "Pacifico", family: "Pacifico", weight: 400, tubeFactor: 0.065, category: "script", script: "latin" },
  { id: "greatvibes", name: "Great Vibes", family: "Great Vibes", weight: 400, tubeFactor: 0.08, category: "script", script: "latin" },
  { id: "sacramento", name: "Sacramento", family: "Sacramento", weight: 400, tubeFactor: 0.085, category: "script", script: "latin" },
  { id: "satisfy", name: "Satisfy", family: "Satisfy", weight: 400, tubeFactor: 0.07, category: "script", script: "latin" },
  { id: "dancing", name: "Dancing Script", family: "Dancing Script", weight: 700, tubeFactor: 0.062, category: "script", script: "latin" },
  { id: "kaushan", name: "Kaushan Script", family: "Kaushan Script", weight: 400, tubeFactor: 0.06, category: "script", script: "latin" },
  { id: "yellowtail", name: "Yellowtail", family: "Yellowtail", weight: 400, tubeFactor: 0.065, category: "script", script: "latin" },
  { id: "lobster", name: "Lobster", family: "Lobster", weight: 400, tubeFactor: 0.05, category: "script", script: "latin" },
  { id: "alexbrush", name: "Alex Brush", family: "Alex Brush", weight: 400, tubeFactor: 0.085, category: "script", script: "latin" },
  { id: "parisienne", name: "Parisienne", family: "Parisienne", weight: 400, tubeFactor: 0.08, category: "script", script: "latin" },
  // ---- handwritten ----
  { id: "caveat", name: "Caveat", family: "Caveat", weight: 700, tubeFactor: 0.065, category: "hand", script: "latin" },
  { id: "marker", name: "Permanent Marker", family: "Permanent Marker", weight: 400, tubeFactor: 0.06, category: "hand", script: "latin" },
  // ---- neon & display ----
  { id: "monoton", name: "Monoton", family: "Monoton", weight: 400, tubeFactor: 0.05, category: "display", script: "latin" },
  { id: "righteous", name: "Righteous", family: "Righteous", weight: 400, tubeFactor: 0.05, category: "display", script: "latin" },
  { id: "bungee", name: "Bungee", family: "Bungee", weight: 400, tubeFactor: 0.042, category: "display", script: "latin" },
  { id: "audiowide", name: "Audiowide", family: "Audiowide", weight: 400, tubeFactor: 0.05, category: "display", script: "latin" },
  { id: "orbitron", name: "Orbitron", family: "Orbitron", weight: 700, tubeFactor: 0.045, category: "display", script: "latin" },
  { id: "pressstart", name: "Press Start 2P", family: "Press Start 2P", weight: 400, tubeFactor: 0.04, category: "display", script: "latin" },
  // ---- bold & strong ----
  { id: "staatliches", name: "Staatliches", family: "Staatliches", weight: 400, tubeFactor: 0.04, category: "bold", script: "latin" },
  { id: "anton", name: "Anton", family: "Anton", weight: 400, tubeFactor: 0.038, category: "bold", script: "latin" },
  { id: "passion", name: "Passion One", family: "Passion One", weight: 700, tubeFactor: 0.045, category: "bold", script: "latin" },
  { id: "alfaslab", name: "Alfa Slab One", family: "Alfa Slab One", weight: 400, tubeFactor: 0.04, category: "bold", script: "latin" },
  // ---- clean & modern ----
  { id: "bebas", name: "Bebas Neue", family: "Bebas Neue", weight: 400, tubeFactor: 0.045, category: "clean", script: "latin" },
  { id: "montserrat", name: "Montserrat", family: "Montserrat", weight: 700, tubeFactor: 0.04, category: "clean", script: "latin" },
  { id: "poppins", name: "Poppins", family: "Poppins", weight: 600, tubeFactor: 0.04, category: "clean", script: "latin" },
  // ---- elegant ----
  { id: "playfair", name: "Playfair Display", family: "Playfair Display", weight: 700, tubeFactor: 0.055, category: "elegant", script: "latin" },
  { id: "cinzel", name: "Cinzel", family: "Cinzel", weight: 700, tubeFactor: 0.05, category: "elegant", script: "latin" },
  // ---- kurdish sorani · display & rounded (Arabic script, RTL) ----
  { id: "lalezar", name: "Lalezar لالێزار", family: "Lalezar", weight: 400, tubeFactor: 0.052, category: "ku-display", script: "arabic" },
  { id: "baloobhaijaan", name: "Baloo Bhaijaan بەلو", family: "Baloo Bhaijaan 2", weight: 700, tubeFactor: 0.055, category: "ku-display", script: "arabic" },
  { id: "reemkufi", name: "Reem Kufi ڕیم", family: "Reem Kufi", weight: 600, tubeFactor: 0.05, category: "ku-display", script: "arabic" },
  { id: "mada", name: "Mada مەدا", family: "Mada", weight: 700, tubeFactor: 0.045, category: "ku-display", script: "arabic" },
  // ---- kurdish sorani · classic & modern ----
  { id: "vazirmatn", name: "Vazirmatn ڤازیر", family: "Vazirmatn", weight: 700, tubeFactor: 0.042, category: "ku-classic", script: "arabic" },
  { id: "notonaskh", name: "Noto Naskh نەسخ", family: "Noto Naskh Arabic", weight: 700, tubeFactor: 0.048, category: "ku-classic", script: "arabic" },
  { id: "amiri", name: "Amiri ئامیری", family: "Amiri", weight: 700, tubeFactor: 0.05, category: "ku-classic", script: "arabic" },
  { id: "harmattan", name: "Harmattan هارمەتان", family: "Harmattan", weight: 700, tubeFactor: 0.05, category: "ku-classic", script: "arabic" },
];

export function getFont(id: string): NeonFont {
  return NEON_FONTS.find((f) => f.id === id) ?? NEON_FONTS[0];
}

/* ------------------------------------------------------------------
   Font generation counter — bumped every time fonts finish loading.
   Render caches (ink measurements, single-line tube masks) embed it in
   their keys so nothing measured with a fallback font stays cached.
------------------------------------------------------------------- */
let generation = 0;

export function fontGeneration(): number {
  return generation;
}

/** true when the string contains Arabic-script characters (Kurdish Sorani / Persian / Arabic) */
export function hasArabicScript(s: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s);
}

/** sample word rendered on font cards (Kurdish script for Arabic fonts) */
export function fontSampleText(font: NeonFont): string {
  return font.script === "arabic" ? "نیۆن" : "Neon";
}

export function fontCss(font: NeonFont, px: number): string {
  return `${font.weight} ${px}px "${font.family}", "Inter", sans-serif`;
}

/** Warm up fonts before drawing (canvas needs fonts loaded in the document) */
export async function ensureFontsLoaded(specs?: NeonFont[]): Promise<void> {
  if (typeof document === "undefined") return;
  const fonts = specs ?? NEON_FONTS;
  try {
    await Promise.all(
      fonts.map((f) => document.fonts.load(`${f.weight} 32px "${f.family}"`))
    );
    await document.fonts.ready;
    // fonts may have become available — invalidate render caches keyed to
    // the previous (fallback-font) generation
    generation++;
  } catch {
    /* if a font fails we still draw with the fallback */
  }
}
