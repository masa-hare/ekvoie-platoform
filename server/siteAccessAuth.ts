import crypto from "crypto";

/**
 * Sentinel openId for the site-wide access-gate session — not a real user,
 * just a JWT payload marking "this browser passed the shared password gate".
 * Separate from ADMIN_OPEN_ID: passing this gate does not grant admin rights,
 * and having admin rights (which is checked after this gate) does not imply
 * this gate was passed by the same route.
 */
export const SITE_ACCESS_OPEN_ID = "__svp_site_access__";

/**
 * Verify the shared site-access password using timing-safe comparison.
 * Reads SITE_ACCESS_PASSWORD from environment variables.
 */
export function verifySitePassword(input: string): boolean {
  const stored = process.env.SITE_ACCESS_PASSWORD ?? "";
  if (!stored || !input) return false;

  const inputBuf = Buffer.alloc(256);
  const storedBuf = Buffer.alloc(256);
  Buffer.from(input, "utf8").copy(inputBuf);
  Buffer.from(stored, "utf8").copy(storedBuf);

  return crypto.timingSafeEqual(inputBuf, storedBuf) && input.length === stored.length;
}
