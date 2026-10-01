import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "آتلیه نئون | طراحی آنلاین تابلو نئون واقعی",
  description:
    "تابلوی نئون واقعی با لوله‌های شیشه‌ای و خم‌کاری دست‌ساز. متن دلخواهت را بنویس، فونت و رنگ را انتخاب کن، تصویر طرح را دانلود کن و سفارش ثبت کن.",
  keywords: [
    "تابلو نئون",
    "نئون واقعی",
    "طراحی تابلو",
    "تابلوی نئون دست‌ساز",
    "آتلیه نئون",
  ],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "آتلیه نئون | طراحی آنلاین تابلو نئون واقعی",
    description: "تابلوی نئون واقعی، دست‌ساز. همین‌جا طرحت را بساز.",
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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* فونت رابط (Vazirmatn) + فونت‌های نئون فارسی و لاتین */}
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Bebas+Neue&family=Great+Vibes&family=Lalezar&family=Monoton&family=Noto+Naskh+Arabic:wght@700&family=Pacifico&family=Vazirmatn:wght@400;500;600;700;800&display=swap"
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
          <Toaster position="top-center" richColors dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  );
}
