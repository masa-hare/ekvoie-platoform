import crypto from "crypto";

/**
 * Special openId for the admin user — no real OAuth identity, just JWT-based.
 */
export const ADMIN_OPEN_ID = "__svp_admin__";

/**
 * Verify admin password using timing-safe comparison.
 * Reads ADMIN_PASSWORD from environment variables.
 * No personal information is stored or required.
 */
export function verifyAdminPassword(input: string): boolean {
  const stored = process.env.ADMIN_PASSWORD ?? "";
  if (!stored || !input) return false;

  // Use fixed-length buffers for constant-time comparison (prevent timing attacks)
  const inputBuf = Buffer.alloc(256);
  const storedBuf = Buffer.alloc(256);
  Buffer.from(input, "utf8").copy(inputBuf);
  Buffer.from(stored, "utf8").copy(storedBuf);

  return crypto.timingSafeEqual(inputBuf, storedBuf) && input.length === stored.length;
}
