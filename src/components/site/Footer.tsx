import Link from "next/link";
import { Phone, Instagram, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = [
  { href: "#designer", label: "ابزار طراحی" },
  { href: "#gallery", label: "نمونه‌ها" },
  { href: "#steps", label: "مراحل سفارش" },
  { href: "#faq", label: "سوالات متداول" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-7 md:flex-row md:items-start md:justify-between">
          {/* برند */}
          <div className="flex max-w-xs flex-col items-center gap-3 text-center md:items-start md:text-right">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1a1520]">
                <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true">
                  <path
                    d="M20 44 V22 c0-3 2.4-5 5-5 3 0 5 2.2 5 5.4 V34 c0 3.4 2.6 6 6 6 3.4 0 6-2.6 6-6 V22 c0-3 2.4-5 5-5"
                    fill="none"
                    stroke="#FF4E6E"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[15.5px] font-extrabold">آتلیه نئون</span>
            </div>
            <p className="text-[12.5px] leading-7 text-muted-foreground">
              تابلوی نئون واقعی با لوله‌ی شیشه‌ای و خم‌کاری دست‌ساز. طرحت را
              بساز، سفارشت را ثبت کن، ما نورش می‌کنیم.
            </p>
          </div>

          {/* ناوبری */}
          <nav
            className="flex flex-col items-center gap-2.5 md:items-start"
            aria-label="لینک‌های پاورقی"
          >
            <span className="mb-1 text-[12px] font-bold text-foreground/60">
              دسترسی سریع
            </span>
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* تماس */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <span className="mb-1 text-[12px] font-bold text-foreground/60">
              تماس با آتلیه
            </span>
            <a
              href="tel:+989123456789"
              className="flex items-center gap-2 text-[13.5px] font-semibold transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4 text-primary/70" />
              <span dir="ltr">۰۹۱۲ ۳۴۵ ۶۷۸۹</span>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13.5px] font-semibold transition-colors hover:text-primary"
            >
              <Instagram className="h-4 w-4 text-primary/70" />
              atelier.neon@
            </a>
            <span className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary/70" />
              تهران، بازار تابلو سازها
            </span>
          </div>
        </div>

        <Separator className="my-7" />

        <div className="flex flex-col items-center justify-between gap-3 text-[11.5px] text-muted-foreground sm:flex-row">
          <p>© ۱۴۰۴ آتلیه نئون — تمام حقوق محفوظ است.</p>
          <p>
            ساخته‌شده با ❤️ و کمی گاز نئون
          </p>
        </div>
      </div>
    </footer>
  );
}
