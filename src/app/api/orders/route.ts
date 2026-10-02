import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { NEON_FONTS } from "@/lib/fonts";
import { NEON_COLORS } from "@/lib/colors";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const orderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(40, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number"),
  note: z.string().trim().max(300).optional().nullable(),
  text: z
    .string()
    .trim()
    .min(1, "Sign text is empty")
    .max(120, "Text is too long"),
  fontId: z.string().trim().min(1).max(40),
  colorId: z.string().trim().min(1).max(40),
  colorId2: z.string().trim().min(1).max(40).optional().nullable(),
  mode: z.enum(["solid", "gradient", "flow", "perLetter", "cycle"]).optional(),
  /** tube style: double (outline) or single (text itself is the tube) */
  lineMode: z.enum(["double", "single"]).optional(),
  widthCm: z.number().int().min(20).max(250),
  backgroundId: z.string().trim().max(60).optional().nullable(),
  configJson: z.string().max(20_000).optional().nullable(),
  /** ordered list of colorIds actually used, in order — the full palette
   *  (23 colors) is allowed: per-letter designs can use every one of them */
  colors: z.array(z.string().trim().min(1).max(40)).max(23).optional(),
  imageData: z
    .string()
    .startsWith("data:image/")
    .max(8_000_000, "Design image is too large")
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
    // gentle flood guard: 12 orders per hour per client
    if (!rateLimit(`orders:${clientIp(req)}`, 12, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many orders from this device — try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // normalize Persian/Arabic digits before validation
    if (typeof body?.phone === "string") {
      body.phone = body.phone
        .replace(/[۰-۹]/g, (d: string) => String(FA_DIGITS.indexOf(d)))
        .replace(/[٠-٩]/g, (d: string) => String(AR_DIGITS.indexOf(d)))
        .replace(/[\s-]/g, "");
    }

    // validate the configJson payload shape if present
    if (typeof body?.configJson === "string" && body.configJson.length > 0) {
      try {
        const cfg = JSON.parse(body.configJson) as Record<string, unknown>;
        const validModes = ["solid", "gradient", "flow", "perLetter", "cycle"];
        if (cfg.mode !== undefined && !validModes.includes(String(cfg.mode))) {
          return NextResponse.json({ error: "Invalid color mode" }, { status: 400 });
        }
        const listOk = (v: unknown, max: number) =>
          Array.isArray(v) && v.length <= max && v.every((x) => typeof x === "string" && x.length <= 40);
        if (!listOk(cfg.flowColors, 5) || !listOk(cfg.cycleColors, 8)) {
          return NextResponse.json({ error: "Invalid color list" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid design config" }, { status: 400 });
      }
    }

    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Invalid submission";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const d = parsed.data;

    // resolve human-readable names for admin review
    const font = NEON_FONTS.find((f) => f.id === d.fontId);
    const color = NEON_COLORS.find((c) => c.id === d.colorId);
    const color2 = d.colorId2 ? NEON_COLORS.find((c) => c.id === d.colorId2) : undefined;
    const bg = d.backgroundId ? BACKGROUNDS.find((b) => b.id === d.backgroundId) : undefined;

    // unique short code with retries — and a timestamp fallback that can
    // never collide, so a pathological run of duplicates can't 500
    let code = generateCode();
    for (let i = 0; i < 40; i++) {
      const exists = await db.order.findUnique({ where: { code } });
      if (!exists) break;
      code = generateCode();
    }
    const stillTaken = await db.order.findUnique({ where: { code } });
    if (stillTaken) {
      code = `NE-${10000 + (Date.now() % 89000)}`;
    }

    const order = await db.order.create({
      data: {
        code,
        customerName: d.customerName,
        phone: d.phone,
        note: d.note ?? null,
        text: d.text,
        fontId: d.fontId,
        fontName: font?.name ?? d.fontId,
        colorId: d.colorId,
        colorName: color?.name ?? d.colorId,
        colorId2: d.colorId2 ?? null,
        colorName2: color2?.name ?? null,
        mode: d.mode ?? "solid",
        lineMode: d.lineMode ?? "double",
        widthCm: d.widthCm,
        backgroundId: bg?.id ?? d.backgroundId ?? null,
        configJson: d.configJson ?? null,
        colorsJson:
          d.colors && d.colors.length > 0
            ? JSON.stringify(
                d.colors.map((id) => {
                  const c = NEON_COLORS.find((x) => x.id === id);
                  return { id, name: c?.name ?? id, tube: c?.tube ?? "#FFFFFF" };
                })
              )
            : null,
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
      { error: "Could not place the order — please try again." },
      { status: 500 }
    );
  }
}
