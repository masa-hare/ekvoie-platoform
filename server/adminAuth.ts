import { verifySecret } from "./passwordVerifier";

/**
 * Special openId for the admin user — no real OAuth identity, just JWT-based.
 */
export const ADMIN_OPEN_ID = "__svp_admin__";

/**
 * Verify admin password using timing-safe comparison.
 * Prefers the scrypt ADMIN_PASSWORD_HASH environment variable.
 * No personal information is stored or required.
 */
export function verifyAdminPassword(input: string): boolean {
  return verifySecret(input, process.env.ADMIN_PASSWORD, process.env.ADMIN_PASSWORD_HASH);
}
