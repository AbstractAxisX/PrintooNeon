"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WallMode } from "@/lib/neon";

export const MAX_LINES = 3;
export const MAX_CHARS_PER_LINE = 30;
export const SIZE_OPTIONS = [40, 60, 80, 100, 125, 150] as const;

export interface DesignState {
  text: string;
  fontId: string;
  colorId: string;
  widthCm: number;
  on: boolean;
  wall: WallMode;
  flicker: boolean;

  setText: (t: string) => void;
  setFont: (id: string) => void;
  setColor: (id: string) => void;
  setSize: (cm: number) => void;
  setOn: (v: boolean) => void;
  setWall: (w: WallMode) => void;
  setFlicker: (v: boolean) => void;
  applyPreset: (p: {
    text: string;
    fontId: string;
    colorId: string;
    widthCm?: number;
  }) => void;
}

export function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.slice(0, MAX_CHARS_PER_LINE))
    .slice(0, MAX_LINES);
}

export const useDesign = create<DesignState>()(
  persist(
    (set) => ({
      text: "کافه آرام",
      fontId: "lalezar",
      colorId: "rose",
      widthCm: 80,
      on: true,
      wall: "night",
      flicker: false,

      setText: (t) => set({ text: t }),
      setFont: (fontId) => set({ fontId }),
      setColor: (colorId) => set({ colorId }),
      setSize: (widthCm) => set({ widthCm }),
      setOn: (on) => set({ on }),
      setWall: (wall) => set({ wall }),
      setFlicker: (flicker) => set({ flicker }),
      applyPreset: (p) =>
        set({
          text: p.text,
          fontId: p.fontId,
          colorId: p.colorId,
          widthCm: p.widthCm ?? 80,
        }),
    }),
    {
      name: "atelier-neon-draft",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
