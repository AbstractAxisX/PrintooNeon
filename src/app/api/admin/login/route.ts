import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueAdminToken } from "@/lib/admin-auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    // brute-force guard: 10 attempts per 10 minutes per client
    if (!rateLimit(`admin-login:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts — try again in a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const token = await issueAdminToken(parsed.data.password);
    if (!token) {
      // small delay to slow brute force
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
