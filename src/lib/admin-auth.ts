import { createHash, timingSafeEqual } from "crypto";
import { db } from "./db";

/**
 * Admin auth: ONE shared password, stored as a salted sha256 hash in the
 * DB (AdminConfig row), changeable from the admin panel itself.
 *
 *  - On first use the row is seeded from the ADMIN_PASSWORD env var
 *    (or the dev default). After that the DB value is the source of truth.
 *  - Login exchanges the password for a token derived from the stored hash,
 *    so every password change immediately invalidates old sessions.
 *  - Simple by design — this is a small shop's order inbox, not a bank.
 */

const HASH_SALT = "printoo-neon-admin::v2::";
const TOKEN_SALT = "printoo-neon-token::v1::";
const DEV_DEFAULT_PASSWORD = "printoo-dev-admin";

function sha(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function hashPassword(password: string): string {
  return sha(HASH_SALT + password);
}

function tokenForHash(hash: string): string {
  return sha(TOKEN_SALT + hash);
}

function safeEqualHex(a: string, b: string): boolean {
  const A = Buffer.from(a, "utf8");
  const B = Buffer.from(b, "utf8");
  return A.length === B.length && timingSafeEqual(A, B);
}

async function getConfigRow() {
  const existing = await db.adminConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  // seed on first use (env value wins once, then the DB row owns it)
  const seed = process.env.ADMIN_PASSWORD?.trim() || DEV_DEFAULT_PASSWORD;
  try {
    return await db.adminConfig.create({ data: { id: 1, passwordHash: hashPassword(seed) } });
  } catch {
    // concurrent first-touch — the row exists now, read it back
    const again = await db.adminConfig.findUnique({ where: { id: 1 } });
    if (again) return again;
    throw new Error("admin config unavailable");
  }
}

/** verify a candidate password against the stored hash */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const row = await getConfigRow();
  return safeEqualHex(hashPassword(password), row.passwordHash);
}

/** login: correct password -> session token (tied to the current hash) */
export async function issueAdminToken(password: string): Promise<string | null> {
  const row = await getConfigRow();
  if (!safeEqualHex(hashPassword(password), row.passwordHash)) return null;
  return tokenForHash(row.passwordHash);
}

/** verify the x-admin-token header of a request */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const got = req.headers.get("x-admin-token") ?? "";
  if (!got) return false;
  const row = await getConfigRow();
  return safeEqualHex(got, tokenForHash(row.passwordHash));
}

/** change the admin password from inside the panel (requires the current one) */
export async function changeAdminPassword(
  current: string,
  next: string
): Promise<{ token: string } | { error: string }> {
  const row = await getConfigRow();
  if (!safeEqualHex(hashPassword(current), row.passwordHash)) {
    return { error: "The current password is wrong." };
  }
  if (safeEqualHex(hashPassword(next), row.passwordHash)) {
    return { error: "The new password must be different." };
  }
  const hash = hashPassword(next);
  await db.adminConfig.update({ where: { id: 1 }, data: { passwordHash: hash } });
  return { token: tokenForHash(hash) };
}
