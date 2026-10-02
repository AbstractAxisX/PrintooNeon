/* ------------------------------------------------------------------
   Self-hosted neon font registry (27 display fonts, /public/fonts/*.woff2)
   No CDN dependency — fonts load from the same origin.
------------------------------------------------------------------- */

export type FontCategory = "script" | "hand" | "display" | "bold" | "clean" | "elegant";

export interface NeonFont {
  id: string;
  name: string;
  /** CSS font-family */
  family: string;
  weight: number;
  /** Relative tube thickness vs font size — thin scripts need a fatter tube */
  tubeFactor: number;
  category: FontCategory;
}

export const FONT_CATEGORIES: { id: FontCategory; name: string }[] = [
  { id: "script", name: "Script" },
  { id: "hand", name: "Handwritten" },
  { id: "display", name: "Neon & Display" },
  { id: "bold", name: "Bold & Strong" },
  { id: "clean", name: "Clean & Modern" },
  { id: "elegant", name: "Elegant" },
];

/** Neon-friendly display fonts (Latin) — all served from /public/fonts */
export const NEON_FONTS: NeonFont[] = [
  // ---- script ----
  { id: "pacifico", name: "Pacifico", family: "Pacifico", weight: 400, tubeFactor: 0.065, category: "script" },
  { id: "greatvibes", name: "Great Vibes", family: "Great Vibes", weight: 400, tubeFactor: 0.08, category: "script" },
  { id: "sacramento", name: "Sacramento", family: "Sacramento", weight: 400, tubeFactor: 0.085, category: "script" },
  { id: "satisfy", name: "Satisfy", family: "Satisfy", weight: 400, tubeFactor: 0.07, category: "script" },
  { id: "dancing", name: "Dancing Script", family: "Dancing Script", weight: 700, tubeFactor: 0.062, category: "script" },
  { id: "kaushan", name: "Kaushan Script", family: "Kaushan Script", weight: 400, tubeFactor: 0.06, category: "script" },
  { id: "yellowtail", name: "Yellowtail", family: "Yellowtail", weight: 400, tubeFactor: 0.065, category: "script" },
  { id: "lobster", name: "Lobster", family: "Lobster", weight: 400, tubeFactor: 0.05, category: "script" },
  { id: "alexbrush", name: "Alex Brush", family: "Alex Brush", weight: 400, tubeFactor: 0.085, category: "script" },
  { id: "parisienne", name: "Parisienne", family: "Parisienne", weight: 400, tubeFactor: 0.08, category: "script" },
  // ---- handwritten ----
  { id: "caveat", name: "Caveat", family: "Caveat", weight: 700, tubeFactor: 0.065, category: "hand" },
  { id: "marker", name: "Permanent Marker", family: "Permanent Marker", weight: 400, tubeFactor: 0.06, category: "hand" },
  // ---- neon & display ----
  { id: "monoton", name: "Monoton", family: "Monoton", weight: 400, tubeFactor: 0.05, category: "display" },
  { id: "righteous", name: "Righteous", family: "Righteous", weight: 400, tubeFactor: 0.05, category: "display" },
  { id: "bungee", name: "Bungee", family: "Bungee", weight: 400, tubeFactor: 0.042, category: "display" },
  { id: "audiowide", name: "Audiowide", family: "Audiowide", weight: 400, tubeFactor: 0.05, category: "display" },
  { id: "orbitron", name: "Orbitron", family: "Orbitron", weight: 700, tubeFactor: 0.045, category: "display" },
  { id: "pressstart", name: "Press Start 2P", family: "Press Start 2P", weight: 400, tubeFactor: 0.04, category: "display" },
  // ---- bold & strong ----
  { id: "staatliches", name: "Staatliches", family: "Staatliches", weight: 400, tubeFactor: 0.04, category: "bold" },
  { id: "anton", name: "Anton", family: "Anton", weight: 400, tubeFactor: 0.038, category: "bold" },
  { id: "passion", name: "Passion One", family: "Passion One", weight: 700, tubeFactor: 0.045, category: "bold" },
  { id: "alfaslab", name: "Alfa Slab One", family: "Alfa Slab One", weight: 400, tubeFactor: 0.04, category: "bold" },
  // ---- clean & modern ----
  { id: "bebas", name: "Bebas Neue", family: "Bebas Neue", weight: 400, tubeFactor: 0.045, category: "clean" },
  { id: "montserrat", name: "Montserrat", family: "Montserrat", weight: 700, tubeFactor: 0.04, category: "clean" },
  { id: "poppins", name: "Poppins", family: "Poppins", weight: 600, tubeFactor: 0.04, category: "clean" },
  // ---- elegant ----
  { id: "playfair", name: "Playfair Display", family: "Playfair Display", weight: 700, tubeFactor: 0.055, category: "elegant" },
  { id: "cinzel", name: "Cinzel", family: "Cinzel", weight: 700, tubeFactor: 0.05, category: "elegant" },
];

export function getFont(id: string): NeonFont {
  return NEON_FONTS.find((f) => f.id === id) ?? NEON_FONTS[0];
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
  } catch {
    /* if a font fails we still draw with the fallback */
  }
}
