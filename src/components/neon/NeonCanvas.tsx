"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  drawNeon,
  ensureFontsLoaded,
  isAnimatedSpec,
  getMode,
  ensureBackgroundLoaded,
  resolveBackground,
  type NeonSpec,
  type NeonLayout,
  type GlyphBox,
} from "@/lib/neon";
import { cn } from "@/lib/utils";

interface NeonCanvasProps {
  spec: NeonSpec;
  className?: string;
  aspect?: number;
  onLayout?: (layout: NeonLayout) => void;
  /** enable per-letter painting (perLetter mode) */
  interactive?: boolean;
  onGlyphClick?: (index: number) => void;
  onGlyphHover?: (index: number | null) => void;
}

/**
 * Live neon canvas — one shared render path with the PNG/GIF export
 * (WYSIWYG guaranteed: everything goes through drawNeon).
 * Animated modes (flow / cycle) run a rAF loop; static modes re-render
 * on change only. Pauses itself when scrolled out of view.
 */
export function NeonCanvas({
  spec,
  className,
  aspect = 1.5,
  onLayout,
  interactive = false,
  onGlyphClick,
  onGlyphHover,
}: NeonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const layoutRef = useRef<NeonLayout | null>(null);
  const visibleRef = useRef(true);
  const hoverRef = useRef<number | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [bgVersion, setBgVersion] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // load all self-hosted fonts once
  useEffect(() => {
    let alive = true;
    ensureFontsLoaded().then(() => {
      if (alive) setAssetsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // preload the active background image; bump bgVersion when ready
  const bgKey = spec.background?.id ?? "brick";
  const bgCustom = spec.background?.customColor;
  useEffect(() => {
    let alive = true;
    const def = resolveBackground(spec.background ?? { id: "brick" });
    ensureBackgroundLoaded(def).then(() => {
      if (alive) setBgVersion((v) => v + 1);
    });
    return () => {
      alive = false;
    };
  }, [bgKey, bgCustom]);

  // responsive sizing
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setSize({ w: width, h: width / aspect });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  // pause rendering when scrolled out of view (battery + CPU friendly)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "80px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const render = useCallback(
    (tSec?: number) => {
      const canvas = canvasRef.current;
      const s = size;
      if (!canvas || !s || s.w <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(s.w * dpr)) {
        canvas.width = Math.round(s.w * dpr);
        canvas.height = Math.round(s.h * dpr);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const layout = drawNeon(ctx, s.w, s.h, spec, { tSec, dpr });
      layoutRef.current = layout;

      // hover highlight for per-letter painting
      if (interactive && hoverRef.current !== null && getMode(spec.mode) === "perLetter" && spec.on) {
        const gb = layout.glyphs.find((g) => g.index === hoverRef.current);
        if (gb) {
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.55)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(gb.x - 2, gb.y - 1, gb.w + 4, gb.h + 2);
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fillRect(gb.x - 2, gb.y - 1, gb.w + 4, gb.h + 2);
          ctx.restore();
        }
      }

      onLayout?.(layout);
    },
    [spec, size, onLayout, interactive]
  );

  // re-render on change + rAF loop for animated modes
  useEffect(() => {
    if (!assetsReady || !size) return;
    cancelAnimationFrame(rafRef.current);

    if (isAnimatedSpec(spec) && spec.on) {
      // cap around ~40fps — color motion stays silky, CPU/GPU saved
      let last = 0;
      const loop = (now: number) => {
        if (visibleRef.current && now - last >= 24) {
          last = now;
          render(now / 1000);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } else {
      render();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [render, assetsReady, bgVersion, size, spec]);

  /* ---- per-letter interaction (hit-testing) ---- */
  const findGlyph = useCallback(
    (clientX: number, clientY: number): GlyphBox | null => {
      const canvas = canvasRef.current;
      const layout = layoutRef.current;
      if (!canvas || !layout) return null;
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      const pad = 4;
      for (const g of layout.glyphs) {
        if (g.ch.trim() === "") continue;
        if (x >= g.x - pad && x <= g.x + g.w + pad && y >= g.y - pad && y <= g.y + g.h + pad) {
          return g;
        }
      }
      return null;
    },
    []
  );

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive || getMode(spec.mode) !== "perLetter" || !spec.on) return;
      const g = findGlyph(e.clientX, e.clientY);
      const idx = g ? g.index : null;
      if (idx !== hoverRef.current) {
        hoverRef.current = idx;
        onGlyphHover?.(idx);
        if (!isAnimatedSpec(spec)) render();
      }
      canvasRef.current?.style.setProperty("cursor", g ? "pointer" : "default");
    },
    [interactive, spec, findGlyph, onGlyphHover, render]
  );

  const handleLeave = useCallback(() => {
    if (hoverRef.current !== null) {
      hoverRef.current = null;
      onGlyphHover?.(null);
      if (!isAnimatedSpec(spec)) render();
    }
    canvasRef.current?.style.setProperty("cursor", "default");
  }, [spec, onGlyphHover, render]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || getMode(spec.mode) !== "perLetter" || !spec.on) return;
      const g = findGlyph(e.clientX, e.clientY);
      if (g) onGlyphClick?.(g.index);
    },
    [interactive, spec, findGlyph, onGlyphClick]
  );

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${aspect}` }}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onClick={handleClick}
        className={cn(
          "h-full w-full transition-opacity duration-500",
          assetsReady ? "opacity-100" : "opacity-0"
        )}
        aria-label="Live neon sign preview"
        role="img"
      />
      {!assetsReady && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}
    </div>
  );
}
