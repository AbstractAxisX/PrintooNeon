/* ------------------------------------------------------------------
   Preview backgrounds — generated wall photos + solid colors
   (replaces the old night/day wall modes)
------------------------------------------------------------------- */

import { isDarkHex, luminance } from "./colors";

export interface BackgroundDef {
  id: string;
  name: string;
  kind: "image" | "solid";
  /** for image backgrounds */
  src?: string;
  /** for solid backgrounds */
  color?: string;
  dark: boolean;
}

export interface BackgroundSpec {
  id: string;
  /** custom solid color (only used when id === "custom") */
  customColor?: string;
}

export const BACKGROUNDS: BackgroundDef[] = [
  { id: "brick", name: "Brick", kind: "image", src: "/images/bg/brick.jpg", dark: true },
  { id: "concrete", name: "Concrete", kind: "image", src: "/images/bg/concrete.jpg", dark: true },
  { id: "wood", name: "Wood", kind: "image", src: "/images/bg/wood.jpg", dark: true },
  { id: "plaster", name: "Plaster", kind: "image", src: "/images/bg/plaster.jpg", dark: false },
  { id: "solid-charcoal", name: "Charcoal", kind: "solid", color: "#1A1714", dark: true },
  { id: "solid-black", name: "Black", kind: "solid", color: "#0C0A09", dark: true },
  { id: "solid-graphite", name: "Graphite", kind: "solid", color: "#26231F", dark: true },
  { id: "solid-stone", name: "Stone", kind: "solid", color: "#3A362F", dark: true },
  { id: "solid-cream", name: "Cream", kind: "solid", color: "#F3EDE4", dark: false },
  { id: "solid-white", name: "White", kind: "solid", color: "#FFFFFF", dark: false },
];

export function getBackgroundDef(id: string): BackgroundDef {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/** Resolve a BackgroundSpec into a drawable definition (handles custom) */
export function resolveBackground(spec: BackgroundSpec): BackgroundDef {
  if (spec.id === "custom" && spec.customColor) {
    return {
      id: "custom",
      name: "Custom",
      kind: "solid",
      color: spec.customColor,
      dark: isDarkHex(spec.customColor),
    };
  }
  return getBackgroundDef(spec.id);
}

/* ---------------- image cache ---------------- */

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const loadedImages = new Map<string, HTMLImageElement>();

export function loadWallImage(src: string): Promise<HTMLImageElement> {
  const already = loadedImages.get(src);
  if (already) return Promise.resolve(already);
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        loadedImages.set(src, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`bg failed: ${src}`));
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

/** Preload the active background so the first render includes it */
export async function ensureBackgroundLoaded(def: BackgroundDef): Promise<boolean> {
  if (def.kind !== "image" || !def.src) return true;
  try {
    await loadWallImage(def.src);
    return true;
  } catch {
    return false;
  }
}

/* ---------------- painting ---------------- */

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  def: BackgroundDef
): void {
  if (def.kind === "image" && def.src) {
    const img = loadedImages.get(def.src);
    if (img && img.naturalWidth > 0) {
      // cover-fit
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      return;
    }
    // not loaded yet — draw a matching flat base color meanwhile
    ctx.fillStyle = def.dark ? "#221D19" : "#EDE7DC";
    ctx.fillRect(0, 0, cw, ch);
    return;
  }
  ctx.fillStyle = def.color ?? "#1A1714";
  ctx.fillRect(0, 0, cw, ch);
}
