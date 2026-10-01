"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenTool, ShoppingBag, PackageCheck, Footprints } from "lucide-react";

const STEPS = [
  {
    icon: PenTool,
    step: "۱",
    title: "طرحت را بساز",
    desc: "با ابزار طراحی، متن و فونت و رنگ دلخواهت را انتخاب کن و نتیجه را همان لحظه روی دیوار ببین.",
  },
  {
    icon: ShoppingBag,
    step: "۲",
    title: "سفارش را ثبت کن",
    desc: "تصویر طرح را دانلود کن و فرم کوتاه سفارش را پر کن. کارشناس ما قیمت نهایی را با تو هماهنگ می‌کند.",
  },
  {
    icon: PackageCheck,
    step: "۳",
    title: "دست‌ساز تحویل بگیر",
    desc: "استادکارهای ما لوله‌ی شیشه را بر اساس طرحت خم می‌کنند، گاز نئون را روشن می‌کنند و می‌فرستند برایت.",
  },
];

export function Steps() {
  return (
    <section id="steps" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
            <Footprints className="ml-1 h-3 w-3" />
            سه قدم تا نئونِ خودت
          </Badge>
          <h2 className="section-title">مراحل سفارش</h2>
          <div className="section-rule" />
        </div>

        <div className="relative grid gap-4 sm:grid-cols-3 sm:gap-6">
          {/* خط اتصال دسکتاپ */}
          <div
            aria-hidden="true"
            className="absolute inset-x-[16%] top-12 hidden h-px border-t-2 border-dashed border-border sm:block"
          />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Card className="relative h-full rounded-2xl border-border/70 transition-shadow hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30">
                <CardContent className="flex h-full flex-col items-center gap-4 p-6 text-center">
                  <div className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <s.icon className="h-6 w-6" />
                    <span className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-[12px] font-extrabold text-primary-foreground shadow-md shadow-primary/40">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-[16.5px] font-extrabold">{s.title}</h3>
                  <p className="text-[13px] leading-7 text-muted-foreground">
                    {s.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
