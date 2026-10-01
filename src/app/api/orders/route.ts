import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const orderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "نام کوتاه است")
    .max(40, "نام طولانی است"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+98|0)?9\d{9}$/, "شماره تماس معتبر نیست"),
  note: z.string().trim().max(300).optional().nullable(),
  text: z
    .string()
    .trim()
    .min(1, "متن تابلو خالی است")
    .max(120, "متن طولانی است"),
  fontId: z.string().trim().min(1).max(40),
  colorId: z.string().trim().min(1).max(40),
  widthCm: z.number().int().min(20).max(250),
  wallMode: z.enum(["night", "day"]).optional(),
  onState: z.boolean().optional(),
  imageData: z
    .string()
    .startsWith("data:image/")
    .max(4_000_000, "تصویر طرح بزرگ‌تر از حد مجاز است")
    .optional()
    .nullable(),
});

function generateCode(): string {
  return `NE-${Math.floor(1000 + Math.random() * 9000)}`;
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // نرمال‌سازی ارقام فارسی/عربی پیش از اعتبارسنجی
    if (typeof body?.phone === "string") {
      body.phone = body.phone
        .replace(/[۰-۹]/g, (d: string) => String(FA_DIGITS.indexOf(d)))
        .replace(/[٠-٩]/g, (d: string) => String(AR_DIGITS.indexOf(d)))
        .replace(/[\s-]/g, "");
    }

    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "اطلاعات ارسالی نامعتبر است";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const d = parsed.data;

    // تولید کد یکتا با چند تلاش
    let code = generateCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.order.findUnique({ where: { code } });
      if (!exists) break;
      code = generateCode();
    }

    const order = await db.order.create({
      data: {
        code,
        customerName: d.customerName,
        phone: d.phone,
        note: d.note ?? null,
        text: d.text,
        fontId: d.fontId,
        fontName: d.fontId, // به‌روزرسانی در آینده با نام فارسی
        colorId: d.colorId,
        colorName: d.colorId,
        widthCm: d.widthCm,
        wallMode: d.wallMode ?? "night",
        onState: d.onState ?? true,
        imageData: d.imageData ?? null,
      },
      select: { id: true, code: true, createdAt: true },
    });

    return NextResponse.json(
      { ok: true, code: order.code, id: order.id },
      { status: 201 }
    );
  } catch (e) {
    console.error("[orders] POST error:", e);
    return NextResponse.json(
      { error: "ثبت سفارش ناموفق بود؛ لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
