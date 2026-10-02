"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { hasRTL, textTokens, type ColorMode, type LineMode } from "@/lib/neon";

export const MAX_LINES = 3;
export const MAX_CHARS_PER_LINE = 30;
export const SIZE_OPTIONS = [40, 60, 80, 100, 125, 150] as const;

export const FLOW_MAX_COLORS = 5;
export const CYCLE_MAX_COLORS = 8;

export interface DesignState {
  text: string;
  fontId: string;
  mode: ColorMode;
  /** tube style — outline (double) or solid text (single).
 *  Arabic-script lines render single-line regardless. */
  lineMode: LineMode;
  /** solid color / fallback for unpainted letters */
  colorId: string;
  /** gradient mode: second color */
  colorId2: string;
  /** perLetter brush color (what gets painted on click) */
  brushColorId: string;
  /** perLetter: char index (newlines skipped) -> colorId */
  letterColors: Record<number, string>;
  /** flow: 2–5 colorIds */
  flowColors: string[];
  flowSpeed: number;
  /** cycle: colorIds (up to 8) */
  cycleColors: string[];
  cycleHold: number;
  cycleFade: number;
  backgroundId: string;
  /** custom solid background color (used when backgroundId === "custom") */
  backgroundCustom: string;
  widthCm: number;
  on: boolean;

  setText: (t: string) => void;
  setFont: (id: string) => void;
  setMode: (m: ColorMode) => void;
  setLineMode: (m: LineMode) => void;
  setColor: (id: string) => void;
  setColor2: (id: string) => void;
  setBrush: (id: string) => void;
  paintLetter: (index: number, colorId: string | null) => void;
  clearLetterColors: () => void;
  setFlowColors: (ids: string[]) => void;
  setFlowSpeed: (v: number) => void;
  setCycleColors: (ids: string[]) => void;
  setCycleHold: (v: number) => void;
  setCycleFade: (v: number) => void;
  setBackground: (id: string, custom?: string) => void;
  setSize: (cm: number) => void;
  setOn: (v: boolean) => void;
  applyPreset: (p: Preset) => void;
}

export interface Preset {
  text: string;
  fontId: string;
  colorId: string;
  colorId2?: string;
  mode?: ColorMode;
  letterColors?: Record<number, string>;
  flowColors?: string[];
  flowSpeed?: number;
  cycleColors?: string[];
  cycleHold?: number;
  cycleFade?: number;
  backgroundId?: string;
  widthCm?: number;
}

export function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.slice(0, MAX_CHARS_PER_LINE))
    .slice(0, MAX_LINES);
}

const DEFAULT_DESIGN = {
  text: "Good Vibes",
  fontId: "pacifico",
  mode: "solid" as ColorMode,
  lineMode: "double" as LineMode,
  colorId: "rose",
  colorId2: "ice",
  brushColorId: "rose",
  letterColors: {} as Record<number, string>,
  flowColors: ["rose", "gold", "ice", "violet"],
  flowSpeed: 1,
  cycleColors: ["rose", "gold", "ice"],
  cycleHold: 1,
  cycleFade: 0.8,
  backgroundId: "brick",
  backgroundCustom: "#1A1714",
  widthCm: 80,
  on: true,
};

export const useDesign = create<DesignState>()(
  persist(
    (set) => ({
      ...DEFAULT_DESIGN,

      setText: (text) =>
        set((s) => {
          // keep the per-letter paint map aligned with the text: drop
          // colors whose letter no longer exists, and clear everything
          // when the script (Latin ↔ Arabic) flips — indices would point
          // at the wrong units otherwise
          const tokenCount = textTokens(text).length;
          const scriptFlipped = hasRTL(s.text) !== hasRTL(text);
          const next: Record<number, string> = {};
          if (!scriptFlipped) {
            for (const [k, v] of Object.entries(s.letterColors)) {
              const i = Number(k);
              if (Number.isFinite(i) && i >= 0 && i < tokenCount) next[i] = v;
            }
          }
          return { text, letterColors: next };
        }),
      setFont: (fontId) => set({ fontId }),
      setMode: (mode) =>
        set((s) => ({ mode, brushColorId: mode === "perLetter" ? s.colorId : s.brushColorId })),
      setLineMode: (lineMode) => set({ lineMode }),
      setColor: (colorId) => set({ colorId }),
      setColor2: (colorId2) => set({ colorId2 }),
      setBrush: (brushColorId) => set({ brushColorId }),
      paintLetter: (index, colorId) =>
        set((s) => {
          const next = { ...s.letterColors };
          if (colorId === null) delete next[index];
          else next[index] = colorId;
          return { letterColors: next };
        }),
      clearLetterColors: () => set({ letterColors: {} }),
      setFlowColors: (flowColors) => set({ flowColors }),
      setFlowSpeed: (flowSpeed) => set({ flowSpeed }),
      setCycleColors: (cycleColors) => set({ cycleColors }),
      setCycleHold: (cycleHold) => set({ cycleHold }),
      setCycleFade: (cycleFade) => set({ cycleFade }),
      setBackground: (backgroundId, custom) =>
        set((s) => ({ backgroundId, backgroundCustom: custom ?? s.backgroundCustom })),
      setSize: (widthCm) => set({ widthCm }),
      setOn: (on) => set({ on }),
      applyPreset: (p) =>
        set({
          text: p.text,
          fontId: p.fontId,
          colorId: p.colorId,
          colorId2: p.colorId2 ?? "ice",
          brushColorId: p.colorId,
          mode: p.mode ?? "solid",
          letterColors: p.letterColors ?? {},
          flowColors: p.flowColors ?? ["rose", "gold", "ice", "violet"],
          flowSpeed: p.flowSpeed ?? 1,
          cycleColors: p.cycleColors ?? ["rose", "gold", "ice"],
          cycleHold: p.cycleHold ?? 1,
          cycleFade: p.cycleFade ?? 0.8,
          backgroundId: p.backgroundId ?? "brick",
          widthCm: p.widthCm ?? 80,
        }),
    }),
    {
      name: "printoo-neon-draft",
      storage: createJSONStorage(() => localStorage),
      version: 5,
      // migrate older drafts (v3 and below) instead of dropping them
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Record<string, unknown>;
        const next: Record<string, unknown> = { ...DEFAULT_DESIGN };
        for (const key of Object.keys(DEFAULT_DESIGN)) {
          const v = old[key];
          if (v !== undefined && v !== null) next[key] = v;
        }
        // v3 -> v4: gradient second color
        if (typeof old.colorId2 !== "string") next.colorId2 = DEFAULT_DESIGN.colorId2;
        // v4 -> v5: line mode (double outline / single solid)
        if (old.lineMode !== "single" && old.lineMode !== "double") next.lineMode = "double";
        // sanitize the letter-color map
        if (typeof next.letterColors !== "object" || next.letterColors === null || Array.isArray(next.letterColors)) {
          next.letterColors = {};
        }
        return next as DesignState;
      },
      // rehydrate manually after mount — keeps SSR and first client render
      // identical, so React hydration never mismatches on returning users
      skipHydration: true,
    }
  )
);
