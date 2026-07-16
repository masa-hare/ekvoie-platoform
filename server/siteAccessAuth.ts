import { verifySecret } from "./passwordVerifier";

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
 * Prefers the scrypt SITE_ACCESS_PASSWORD_HASH environment variable.
 */
export function verifySitePassword(input: string): boolean {
  return verifySecret(input, process.env.SITE_ACCESS_PASSWORD, process.env.SITE_ACCESS_PASSWORD_HASH);
}
