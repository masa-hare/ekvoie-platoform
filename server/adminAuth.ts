import { verifySecret } from "./passwordVerifier";

/**
 * Special openId for the admin user — no real OAuth identity, just JWT-based.
 */
export const ADMIN_OPEN_ID = "__svp_admin__";

/**
 * Verify admin password using scrypt and a timing-safe comparison.
 * No personal information is stored or required.
 */
export function verifyAdminPassword(input: string): boolean {
  return verifySecret(input, process.env.ADMIN_PASSWORD_HASH);
}
