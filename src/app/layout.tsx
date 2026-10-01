import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon Sign Studio | Design your custom neon sign",
  description:
    "Design a real glass-tube neon sign live: type your text, choose from 16 fonts, 17 colors and 4 color modes, save the image and place your order.",
  keywords: [
    "neon sign",
    "custom neon",
    "neon designer",
    "neon sign maker",
    "glass tube neon",
  ],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Neon Sign Studio | Design your custom neon sign",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* UI font (Inter) + neon display fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Audiowide&family=Bebas+Neue&family=Caveat:wght@700&family=Dancing+Script:wght@700&family=Great+Vibes&family=Kaushan+Script&family=Lobster&family=Monoton&family=Pacifico&family=Passion+One:wght@700&family=Permanent+Marker&family=Playfair+Display:wght@700&family=Righteous&family=Sacramento&family=Satisfy&family=Yellowtail&display=swap"
          rel="stylesheet"
        />
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
