import { Zap } from "lucide-react";

/**
 * Site footer — sticks to the bottom of the viewport on short pages and is
 * pushed down naturally by long content (the page root is a min-h-screen
 * flex column, this block has mt-auto).
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center sm:px-6">
        <p className="flex items-center gap-2 text-[14px] font-extrabold tracking-tight text-foreground">
          <Zap className="h-4 w-4 text-primary" aria-hidden />
          PrintooNeon
        </p>
        <p className="text-[12px] leading-5 text-muted-foreground">
          Real glass-tube neon signs, designed live in your browser.
        </p>
        <p className="text-[11.5px] leading-5 text-muted-foreground/70">
          The preview simulates the glow — the final tube layout and size are
          confirmed with you after the design is reviewed.
        </p>
      </div>
    </footer>
  );
}
