import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminPassword, adminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    if (parsed.data.password !== adminPassword()) {
      // small delay to slow brute force
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, token: adminToken(parsed.data.password) });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
