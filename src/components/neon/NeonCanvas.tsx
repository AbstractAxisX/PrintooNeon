"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  drawNeon,
  ensureFontsLoaded,
  flickerLevel,
  NEON_FONTS,
  type NeonSpec,
  type NeonLayout,
} from "@/lib/neon";
import { cn } from "@/lib/utils";

interface NeonCanvasProps {
  spec: NeonSpec;
  className?: string;
  aspect?: number; // نسبت عرض به ارتفاع
  onLayout?: (layout: NeonLayout) => void;
}

/**
 * بوم پیش‌نمایش نئون — یک مسیر رندر مشترک با خروجی PNG
 * (WYSIWYG تضمین‌شده چون هر دو از drawNeon استفاده می‌کنند)
 */
export function NeonCanvas({
  spec,
  className,
  aspect = 1.6,
  onLayout,
}: NeonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // بارگذاری فونت‌ها یک بار در عمر کامپوننت
  useEffect(() => {
    let alive = true;
    ensureFontsLoaded(NEON_FONTS).then(() => {
      if (alive) setFontsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // اندازه‌گیری واکنش‌گرا
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

  const render = useCallback(
    (time?: number) => {
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

      const brightness =
        spec.flicker && spec.on && time !== undefined
          ? flickerLevel(time)
          : undefined;

      const layout = drawNeon(ctx, s.w, s.h, spec, {
        time,
        brightness,
      });
      onLayout?.(layout);
    },
    [spec, size, onLayout]
  );

  // رسم مجدد با هر تغییر + پس از آماده شدن فونت
  useEffect(() => {
    if (!fontsReady || !size) return;
    cancelAnimationFrame(rafRef.current);

    if (spec.flicker && spec.on) {
      const loop = (t: number) => {
        render(t);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } else {
      render();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [render, fontsReady, size, spec.flicker, spec.on]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${aspect}` }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "h-full w-full transition-opacity duration-500",
          fontsReady ? "opacity-100" : "opacity-0"
        )}
        aria-label="پیش‌نمایش زنده تابلوی نئون"
        role="img"
      />
      {!fontsReady && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      )}
    </div>
  );
}
