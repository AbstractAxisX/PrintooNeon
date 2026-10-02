import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** GET /api/admin/orders — metadata only (images are fetched per order) */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        customerName: true,
        phone: true,
        note: true,
        text: true,
        fontId: true,
        fontName: true,
        colorId: true,
        colorName: true,
        colorId2: true,
        colorName2: true,
        mode: true,
        lineMode: true,
        widthCm: true,
        backgroundId: true,
        colorsJson: true,
        configJson: true,
        status: true,
        createdAt: true,
      },
    });
    // attach lightweight image flags without pulling the (potentially big) data
    const withFlags = await Promise.all(
      orders.map(async (o) => {
        const img = await db.order.findUnique({
          where: { id: o.id },
          select: { imageData: true },
        });
        return {
          ...o,
          hasImage: !!img?.imageData,
          isGif: !!img?.imageData?.startsWith("data:image/gif"),
        };
      })
    );
    return NextResponse.json({ orders: withFlags });
  } catch (e) {
    console.error("[admin] list error:", e);
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  }
}
