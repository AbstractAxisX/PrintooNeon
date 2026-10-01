"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowDown, Flame, GlassWater, HandHeart } from "lucide-react";
import { NeonCanvas } from "@/components/neon/NeonCanvas";
import type { NeonSpec } from "@/lib/neon";

const HERO_SPEC: NeonSpec = {
  lines: ["خوش آمدی"],
  fontId: "lalezar",
  colorId: "rose",
  on: true,
  wall: "night",
};

const TRUST_ITEMS = [
  { icon: GlassWater, label: "لوله‌ی شیشه‌ای واقعی" },
  { icon: HandHeart, label: "خم‌کاری دست‌ساز" },
  { icon: Flame, label: "نور خالص و پرقدرت" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* هاله‌ی پس‌زمینه */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-60 dark:opacity-80"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, hsl(347 70% 55% / 0.10), transparent 70%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        {/* متن هیرو */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-start gap-6"
        >
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3.5 py-1.5 text-[12px] font-semibold text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            آتلیه‌ی ساخت تابلوی نئون واقعی
          </Badge>

          <h1 className="text-[34px] font-extrabold leading-[1.25] tracking-tight sm:text-[46px] sm:leading-[1.2]">
            تابلوی نئونت را
            <br />
            <span className="relative inline-block text-primary">
              خودت طراحی کن
              <svg
                viewBox="0 0 200 12"
                aria-hidden="true"
                className="absolute -bottom-1.5 right-0 h-2.5 w-full text-primary/60"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 6 Q 25 0 50 6 T 100 6 T 150 6 T 198 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="max-w-md text-[15px] leading-8 text-muted-foreground">
            نئونِ واقعی؛ با لوله‌های شیشه‌ای که استادکارها با دست خم می‌کنند.
            متن دلخواهت را بنویس، رنگ و فونتش را انتخاب کن، تصویرش را دانلود کن و
            سفارشت را ثبت کن تا برات بسازیم.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl px-7 text-[15px] font-bold shadow-lg shadow-primary/30"
            >
              <Link href="#designer">
                شروع طراحی
                <ArrowDown className="mr-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-6 text-[14.5px] font-semibold"
            >
              <Link href="#gallery">دیدن نمونه‌ها</Link>
            </Button>
          </div>

          {/* نشان‌های اعتماد */}
          <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
            {TRUST_ITEMS.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground"
              >
                <t.icon className="h-4 w-4 text-primary/70" />
                {t.label}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* دیوار نئون هیرو — زنده و درخشان حتی در تم روشن */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="relative flex flex-col items-end gap-3"
        >
          <div className="animate-floaty w-full">
            <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-black/10 dark:ring-white/10">
              <NeonCanvas spec={HERO_SPEC} aspect={1.35} />
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -inset-6 -z-10 rounded-[32px] opacity-50 blur-2xl"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, hsl(347 80% 55% / 0.25), transparent 75%)",
            }}
          />
          <p className="flex items-center gap-2 text-[11.5px] font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            پیش‌نمایش زنده · خم لوله‌ی شیشه‌ای
          </p>
        </motion.div>
      </div>
    </section>
  );
}
