import crypto from "crypto";

const HASH_PREFIX = "scrypt$v1";

/**
 * Verifies a secret without ever storing it in application data. Hashes use
 * scrypt with a per-secret random salt. A plain environment variable is only
 * supported during migration; hash values always take precedence.
 */
export function verifySecret(input: string, plainSecret: string | undefined, hashedSecret: string | undefined): boolean {
  if (!input) return false;
  if (hashedSecret) {
    const [algorithm, version, saltBase64, expectedBase64] = hashedSecret.split("$");
    if (`${algorithm}$${version}` !== HASH_PREFIX || !saltBase64 || !expectedBase64) return false;
    try {
      const salt = Buffer.from(saltBase64, "base64");
      const expected = Buffer.from(expectedBase64, "base64");
      if (salt.length < 16 || expected.length !== 64) return false;
      const actual = crypto.scryptSync(input, salt, 64);
      return crypto.timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  if (!plainSecret) return false;
  const inputBuffer = Buffer.alloc(256);
  const storedBuffer = Buffer.alloc(256);
  Buffer.from(input, "utf8").copy(inputBuffer);
  Buffer.from(plainSecret, "utf8").copy(storedBuffer);
  return crypto.timingSafeEqual(inputBuffer, storedBuffer) && input.length === plainSecret.length;
}
