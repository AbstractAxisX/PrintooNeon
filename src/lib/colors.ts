/* ------------------------------------------------------------------
   Neon color palette + color math (shared by engine & UI)
   Each color = tube (lit glass color) + glow (saturated halo color)
------------------------------------------------------------------- */

export interface NeonColor {
  id: string;
  name: string;
  /** glass tube color when lit */
  tube: string;
  /** saturated halo color (the "gas glow") */
  glow: string;
}

/** Real gas & phosphor neon colors (23) */
export const NEON_COLORS: NeonColor[] = [
  { id: "rose", name: "Classic Rose", tube: "#FF4E6E", glow: "#FF2456" },
  { id: "hotpink", name: "Hot Pink", tube: "#FF87F0", glow: "#FF2BD6" },
  { id: "magenta", name: "Magenta", tube: "#F76BFF", glow: "#C800F5" },
  { id: "lavender", name: "Lavender", tube: "#DCB4FF", glow: "#B57BFF" },
  { id: "violet", name: "Soft Violet", tube: "#B48CFF", glow: "#8E5CFF" },
  { id: "ultra", name: "Ultraviolet", tube: "#9A6BFF", glow: "#6C2BFF" },
  { id: "red", name: "Fire Red", tube: "#FF5240", glow: "#FF2600" },
  { id: "crimson", name: "Crimson", tube: "#FF5858", glow: "#EF1212" },
  { id: "coral", name: "Coral", tube: "#FF8A78", glow: "#FF5F4D" },
  { id: "peach", name: "Peach", tube: "#FFC2A0", glow: "#FF9E63" },
  { id: "orange", name: "Sunset Orange", tube: "#FF9E4A", glow: "#FF7A00" },
  { id: "gold", name: "Sun Gold", tube: "#FFD95E", glow: "#FFC400" },
  { id: "champagne", name: "Champagne", tube: "#FFE8C7", glow: "#FFD79B" },
  { id: "warmwhite", name: "Warm White", tube: "#FFF2D8", glow: "#FFDF9E" },
  { id: "white", name: "Pure White", tube: "#FFFFFF", glow: "#E9F4FF" },
  { id: "lemon", name: "Lemon Zest", tube: "#F0FF7A", glow: "#DFFF00" },
  { id: "lime", name: "Lime Punch", tube: "#D4FF61", glow: "#A8F026" },
  { id: "green", name: "Neon Green", tube: "#4EF07E", glow: "#00E65A" },
  { id: "mint", name: "Mint", tube: "#7CFFC4", glow: "#00FFA8" },
  { id: "aqua", name: "Aqua", tube: "#37F0D8", glow: "#00D9C0" },
  { id: "ice", name: "Ice Blue", tube: "#74DBFF", glow: "#17B9FF" },
  { id: "sky", name: "Sky Blue", tube: "#8FB8FF", glow: "#4D8DFF" },
  { id: "cobalt", name: "Cobalt", tube: "#6E96FF", glow: "#2E5BFF" },
];

export function getColor(id: string): NeonColor {
  return NEON_COLORS.find((c) => c.id === id) ?? NEON_COLORS[14];
}

/* ---------------- rgb helpers ---------------- */

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
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

export function rgbToCss(rgb: RGB): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function rgbToHex(rgb: RGB): string {
  const to = (x: number) => Math.round(x).toString(16).padStart(2, "0");
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`;
}

export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function mixHex(a: string, b: string, t: number): string {
  return rgbToCss(lerpRgb(hexToRgb(a), hexToRgb(b), t));
}

export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** relative luminance 0..1 (for dark/light background detection) */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function isDarkHex(hex: string): boolean {
  return luminance(hex) < 0.22;
}

/** smoothstep easing — buttery color fades */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}
