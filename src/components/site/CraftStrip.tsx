"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Recycle, Clock3, Sparkle, ArrowLeft } from "lucide-react";

const FEATURES = [
  {
    icon: Clock3,
    title: "عمر ۸ تا ۱۵ ساله",
    desc: "گاز نئون کم‌مصرف با ده‌ها هزار ساعت روشنایی پیوسته.",
  },
  {
    icon: Recycle,
    title: "قابل تعمیر",
    desc: "برخلاف پنل‌های LED، لوله‌ی شیشه تعمیر و تعویض مجدد دارد.",
  },
  {
    icon: Sparkle,
    title: "نورِ عمیق و گرم",
    desc: "هاله‌ی واقعی گاز، نه نور خشک و نقطه‌ای دیودها.",
  },
];

export function CraftStrip() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* تصویر کارگاه */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl shadow-xl shadow-black/10 ring-1 ring-black/10 dark:ring-white/10">
              <Image
                src="/images/workshop.jpg"
                alt="کارگاه نئون‌سازی؛ خم‌کاری دستی لوله‌ی شیشه‌ای با مشعل"
                width={1344}
                height={768}
                className="h-auto w-full object-cover"
                priority={false}
              />
            </div>
            <div className="absolute -bottom-4 right-4 rounded-xl border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur">
              <p className="text-[12px] font-bold">خم‌کاری دست با مشعل</p>
              <p className="text-[10.5px] text-muted-foreground">
                دمای کارِ بالای ۱۲۰۰ درجه
              </p>
            </div>
          </motion.div>

          {/* متن */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            <Badge variant="outline" className="w-fit rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
              چرا نئونِ واقعی؟
            </Badge>
            <h2 className="section-title text-right">
              نئون واقعی یعنی
              <span className="text-primary"> شیشه، گاز و دستِ </span>
              استادکار
            </h2>
            <p className="max-w-lg text-[14px] leading-8 text-muted-foreground">
              هر تابلوی ما از یک لوله‌ی شیشه‌ی خالی شروع می‌شود؛ با مشعل نرم
              می‌شود، با قالب و چشم خم می‌شود، گاز نئون یا آرگون در آن تخلیه
              می‌شود و برق کمِ قابل‌اعتماد، رنگش را روشن می‌کند. هیچ نوار LED و
              هیچ چاپی در کار نیست.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="rounded-xl border-border/70 bg-muted/40">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <f.icon className="h-5 w-5 text-primary" />
                    <span className="text-[13px] font-bold">{f.title}</span>
                    <span className="text-[11.5px] leading-6 text-muted-foreground">
                      {f.desc}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              asChild
              variant="outline"
              className="group w-fit gap-2 rounded-xl px-5 font-semibold"
            >
              <Link href="#designer">
                برو و طرح خودت را بساز
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
