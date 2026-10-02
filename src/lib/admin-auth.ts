import { createHash, timingSafeEqual } from "crypto";

/**
 * Minimal admin auth: one shared password (env var, set on the server),
 * exchanged for a derived token that admin API routes verify.
 * Simple by design — this is a small shop's order inbox, not a bank.
 */

const SALT = "::printoo-neon-admin::v1";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "printoo-dev-admin";
}

export function adminToken(password: string): string {
  return createHash("sha256").update(password + SALT).digest("hex");
}

/** expected token for the configured password */
export function expectedToken(): string {
  return adminToken(adminPassword());
}

/** verify the x-admin-token header of a request */
export function isAdminRequest(req: Request): boolean {
  const got = req.headers.get("x-admin-token") ?? "";
  if (!got) return false;
  const want = expectedToken();
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}
