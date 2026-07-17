// Generate a scrypt hash for ADMIN_PASSWORD_HASH / SITE_ACCESS_PASSWORD_HASH.
// Usage: node scripts/hash_secret.mjs "your-password"
// The password itself is never stored anywhere; paste only the printed hash
// into the environment variable.
import crypto from "node:crypto";

const secret = process.argv[2];
if (!secret) {
  console.error('Usage: node scripts/hash_secret.mjs "your-password"');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(secret, salt, 64);
console.log(`scrypt$v1$${salt.toString("base64")}$${derived.toString("base64")}`);
