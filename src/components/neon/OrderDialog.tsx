"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  Loader2,
  MessageSquareText,
  Phone,
  User,
} from "lucide-react";
import { NeonCanvas } from "./NeonCanvas";
import {
  downloadNeonPng,
  normalizeDigits,
  getColor,
  getFont,
  type NeonSpec,
} from "@/lib/neon";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  spec: NeonSpec;
  text: string;
  widthCm: number;
}

interface SuccessState {
  code: string;
}

export function OrderDialog({
  open,
  onOpenChange,
  spec,
  text,
  widthCm,
}: OrderDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [copied, setCopied] = useState(false);

  const color = getColor(spec.colorId);
  const font = getFont(spec.fontId);
  const displayText = useMemo(
    () => text.trim() || "NEON",
    [text]
  );

  const phoneValid = /^(\+98|0)?9\d{9}$/.test(normalizeDigits(phone).replace(/[\s-]/g, ""));
  const nameValid = name.trim().length >= 2;
  const canSubmit = phoneValid && nameValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      if (!nameValid) toast.error("نام را کامل بنویسید.");
      else if (!phoneValid) toast.error("شماره تماس معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).");
      return;
    }

    // تصویر پیش‌نمایش JPEG سبک برای ارسال همراه سفارش
    const { exportNeonImage } = await import("@/lib/neon");
    const shot = exportNeonImage(spec, {
      width: 1200,
      height: 750,
      type: "image/jpeg",
      quality: 0.85,
    });

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: normalizeDigits(phone).replace(/[\s-]/g, ""),
          note: note.trim() || null,
          text: displayText,
          fontId: font.id,
          colorId: color.id,
          widthCm,
          wallMode: spec.wall,
          onState: spec.on,
          imageData: shot?.dataUrl ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "خطا در ثبت سفارش");
      setSuccess({ code: data.code });
      toast.success("سفارش شما ثبت شد 🎉");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ثبت سفارش ناموفق بود، دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyCode() {
    if (!success) return;
    navigator.clipboard.writeText(success.code).then(() => {
      setCopied(true);
      toast.success("کد سفارش کپی شد.");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const ok = downloadNeonPng(spec, displayText);
    if (ok) toast.success("تصویر طرح دانلود شد.");
    else toast.error("دانلود تصویر ممکن نشد.");
  }

  function reset() {
    setSuccess(null);
    setName("");
    setPhone("");
    setNote("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v && success) setTimeout(reset, 300);
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl p-0 sm:max-w-md">
        {!success ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-lg font-extrabold">
                ثبت سفارش این طرح
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[13px] leading-6">
                فرم کوتاه زیر را پر کنید؛ کارشناس ما طرح را می‌بیند، قیمت نهایی و
                جزئیات ساخت را با شما هماهنگ می‌کند.
              </DialogDescription>
            </DialogHeader>

            {/* خلاصه طرح */}
            <div className="px-6 pt-4">
              <div className="overflow-hidden rounded-xl border">
                <NeonCanvas spec={spec} aspect={1.7} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="font-medium">
                  {displayText.split("\n").join(" · ").slice(0, 30)}
                </Badge>
                <Badge variant="secondary" className="font-medium">
                  {font.name}
                </Badge>
                <Badge variant="secondary" className="font-medium">
                  <span
                    className="ml-1 inline-block h-2 w-2 rounded-full"
                    style={{ background: color.tube, boxShadow: `0 0 6px ${color.glow}` }}
                  />
                  {color.name}
                </Badge>
                <Badge variant="secondary" className="font-medium">
                  عرض {widthCm} سانتی‌متر
                </Badge>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ord-name" className="flex items-center gap-1.5 text-[13px] font-semibold">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  نام و نام خانوادگی
                </Label>
                <Input
                  id="ord-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: سارا محمدی"
                  maxLength={40}
                  autoComplete="name"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="ord-phone" className="flex items-center gap-1.5 text-[13px] font-semibold">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  شماره تماس
                </Label>
                <Input
                  id="ord-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  inputMode="tel"
                  dir="ltr"
                  className={`text-left ${phone && !phoneValid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {phone && !phoneValid && (
                  <p className="text-[12px] text-destructive">
                    شماره موبایل معتبر وارد کنید (۱۱ رقم، با ۰۹ شروع شود).
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="ord-note" className="flex items-center gap-1.5 text-[13px] font-semibold">
                  <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
                  توضیحات (اختیاری)
                </Label>
                <Textarea
                  id="ord-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثلاً: محل نصب ویترین است، رنگ حاشیه مهم نیست…"
                  rows={3}
                  maxLength={300}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full rounded-xl font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ثبت سفارش…
                  </>
                ) : (
                  "ثبت سفارش"
                )}
              </Button>
              <p className="text-center text-[11.5px] leading-5 text-muted-foreground">
                این نسخه بدون قیمت‌گذاری آنلاین است؛ قیمت پس از بررسی طرح اعلام می‌شود.
              </p>
            </form>
          </>
        ) : (
          /* ---------- نمای موفقیت ---------- */
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="relative mb-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
            </div>
            <h3 className="text-xl font-extrabold">سفارشت ثبت شد!</h3>
            <p className="mt-2 max-w-xs text-[13px] leading-6 text-muted-foreground">
              کارشناس ما طرح و تصویرش را می‌بیند و برای هماهنگی قیمت و جزئیات با
              شما تماس می‌گیرد.
            </p>

            <Separator className="my-5" />

            <div className="flex w-full max-w-xs items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
              <div className="flex flex-col items-start">
                <span className="text-[11px] text-muted-foreground">کد سفارش</span>
                <span dir="ltr" className="text-lg font-extrabold tracking-wider text-primary">
                  {success.code}
                </span>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyCode} aria-label="کپی کد سفارش">
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="mt-4 w-full max-w-xs rounded-xl"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              دانلود تصویر طرح
            </Button>

            <Button
              variant="ghost"
              className="mt-2 text-muted-foreground"
              onClick={() => {
                onOpenChange(false);
                setTimeout(reset, 300);
              }}
            >
              بستن
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
