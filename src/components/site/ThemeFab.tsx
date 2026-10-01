"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

/** Floating light/dark toggle — no navbar, so it lives in the corner */
export function ThemeFab() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  // keep the label stable before mount so SSR and client always match
  const label = !mounted
    ? "Toggle color theme"
    : theme === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={label}
      className="fixed top-4 right-4 z-40 h-11 w-11 rounded-full border-border/70 bg-background/85 shadow-md shadow-black/5 backdrop-blur"
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun className="h-[18px] w-[18px]" />
        ) : (
          <Moon className="h-[18px] w-[18px]" />
        )
      ) : (
        <Moon className="h-[18px] w-[18px] opacity-0" />
      )}
    </Button>
  );
}
