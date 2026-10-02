import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest, changeAdminPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

const changeSchema = z.object({
  current: z.string().min(1).max(200),
  next: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(64, "New password is too long"),
});

/** POST /api/admin/password — change the admin password (auth via token). */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const result = await changeAdminPassword(parsed.data.current, parsed.data.next);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    // the token is tied to the password hash — hand the fresh one over so
    // the admin stays logged in on this device
    return NextResponse.json({ ok: true, token: result.token });
  } catch (e) {
    console.error("[admin] password change error:", e);
    return NextResponse.json({ error: "Could not change the password" }, { status: 500 });
  }
}
