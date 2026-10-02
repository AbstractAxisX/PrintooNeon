import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Custom Neon Sign Designer",
  description:
    "Design a real glass-tube neon sign live: 27 fonts, 23 colors, animated RGB flow, per-letter painting and color-cycle modes, pick your background wall, save a PNG or animated GIF.",
  keywords: [
    "neon sign",
    "custom neon",
    "neon designer",
    "neon sign maker",
    "glass tube neon",
    "rgb neon",
  ],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Custom Neon Sign Designer",
    description: "Real neon, hand-bent glass. Build yours right here.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7F1" },
    { media: "(prefers-color-scheme: dark)", color: "#171310" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* all fonts are self-hosted from /public/fonts — no CDN dependency */}
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
