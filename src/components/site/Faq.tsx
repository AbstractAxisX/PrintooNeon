"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "نئون واقعی با تابلوی LED چه فرقی دارد؟",
    a: "نئون واقعی از لوله‌ی شیشه‌ای خم‌شده و گاز درون آن نور می‌گیرد؛ نتیجه‌اش نور پیوسته، عمیق و «گرم» است که LED با هزار دیود ریز نمی‌تواند شبیه‌سازی‌اش کند. تابلوهای ما فقط نئون واقعی‌اند — همان چیزهایی که بوتیک‌ها و کافه‌های کلاسیک دهه‌هاست روشن‌شان نگه داشته‌اند.",
  },
  {
    q: "قیمت سفارش را چطور می‌فهمم؟",
    a: "در این نسخه، قیمت‌گذاری آنلاین نداریم. سفارشت را ثبت می‌کنی، کارشناس ما طرح، ابعاد و جزئیاتش را می‌بیند و قیمت دقیق را همان روز با تو هماهنگ می‌کند.",
  },
  {
    q: "متن من می‌تواند فارسی یا لاتین باشد؟",
    a: "بله. فونت‌های فارسی (لاله‌زار، نسخ، امیری و وزیر) و لاتین (اسکریپت، رترو و بولد) در ابزار طراحی موجودند. حتی ترکیب دوزبانه هم با خط دوم قابل ساخت است.",
  },
  {
    q: "عمر تابلوی نئون واقعی چقدر است؟",
    a: "لوله‌های نئون با کیفیت معمولاً بین ۸ تا ۱۵ سال (معادل ده‌ها هزار ساعت روشنایی) دوام می‌آورند و برخلاف LED، رنگ و شدت نورشان با گذر زمان افت محسوسی ندارد. در صورت خرابی، لوله قابل تعمیر و تعویض است.",
  },
  {
    q: "بعد از ثبت سفارش چه اتفاقی می‌افتد؟",
    a: "طرح و تصویرش پیش ما ثبت می‌شود. کارشناس برای تأیید ابعاد، رنگ و قیمت با تماس یا پیام همراهت درمی‌گیرد و بعد از تأیید نهایی، ساخت دستی شروع می‌شود. زمان ساخت معمول ۷ تا ۱۲ روز کاری است.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-3 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary">
            <HelpCircle className="ml-1 h-3 w-3" />
            پاسخ سوال‌های پرتکرار
          </Badge>
          <h2 className="section-title">سوالات متداول</h2>
          <div className="section-rule" />
        </div>

        <Accordion type="single" collapsible defaultValue="faq-0" className="rounded-2xl border bg-card px-4 shadow-sm sm:px-6">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border/70">
              <AccordionTrigger className="py-5 text-right text-[14.5px] font-bold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[13.5px] leading-8 text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
