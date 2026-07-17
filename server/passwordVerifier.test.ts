import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifySecret } from "./passwordVerifier";

function makeHash(secret: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(secret, salt, 64);
  return `scrypt$v1$${salt.toString("base64")}$${derived.toString("base64")}`;
}

describe("verifySecret — scrypt hash only", () => {
  it("accepts the correct secret against its hash", () => {
    expect(verifySecret("s3cret-passphrase", makeHash("s3cret-passphrase"))).toBe(true);
  });

  it("rejects a wrong secret against a valid hash", () => {
    expect(verifySecret("not-the-secret", makeHash("s3cret-passphrase"))).toBe(false);
  });

  it.each([
    "plainly-not-a-hash",
    "scrypt$v1$short$short",
    "bcrypt$v1$AAAA$BBBB",
    "scrypt$v2$" + Buffer.alloc(16).toString("base64") + "$" + Buffer.alloc(64).toString("base64"),
  ])("rejects malformed or unsupported hash: %s", hash => {
    expect(verifySecret("anything", hash)).toBe(false);
  });

  it("rejects missing hashes and empty input", () => {
    expect(verifySecret("anything", undefined)).toBe(false);
    expect(verifySecret("", makeHash("anything"))).toBe(false);
  });
});
