"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Zap, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#designer", label: "ابزار طراحی" },
  { href: "#gallery", label: "نمونه‌ها" },
  { href: "#steps", label: "مراحل سفارش" },
  { href: "#faq", label: "سوالات" },
];

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border/70 bg-background/85 shadow-sm backdrop-blur-lg"
          : "border-transparent bg-background/60 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* لوگو */}
        <Link href="/" className="group flex items-center gap-2.5" aria-label="آتلیه نئون - صفحه اصلی">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#1a1520] shadow-inner">
            <svg
              viewBox="0 0 64 64"
              className="h-7 w-7 animate-neon-pulse"
              aria-hidden="true"
            >
              <path
                d="M20 44 V22 c0-3 2.4-5 5-5 3 0 5 2.2 5 5.4 V34 c0 3.4 2.6 6 6 6 3.4 0 6-2.6 6-6 V22 c0-3 2.4-5 5-5"
                fill="none"
                stroke="#FF4E6E"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 44 V22 c0-3 2.4-5 5-5 3 0 5 2.2 5 5.4 V34 c0 3.4 2.6 6 6 6 3.4 0 6-2.6 6-6 V22 c0-3 2.4-5 5-5"
                fill="none"
                stroke="#ffd9df"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[16.5px] font-extrabold tracking-tight">
              آتلیه نئون
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              تابلو نئون واقعی · دست‌ساز
            </span>
          </span>
        </Link>

        {/* لینک‌ها */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="منوی اصلی">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* اکشن‌ها */}
        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "حالت روشن" : "حالت تیره"}
              className="rounded-lg"
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-lg px-4 font-bold shadow-md shadow-primary/25"
          >
            <Link href="#designer">
              <PenTool className="h-4 w-4" />
              ساخت تابلو
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
