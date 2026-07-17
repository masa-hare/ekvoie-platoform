import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifySecret } from "./passwordVerifier";

function makeHash(secret: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(secret, salt, 64);
  return `scrypt$v1$${salt.toString("base64")}$${derived.toString("base64")}`;
}

describe("verifySecret — plaintext migration path", () => {
  it("accepts the exact secret", () => {
    expect(verifySecret("correct horse", "correct horse", undefined)).toBe(true);
  });

  it.each([
    ["wrong value", "correct horse"],
    ["correct hors", "correct horse"],
    ["correct horse ", "correct horse"],
  ])("rejects %s against %s", (input, stored) => {
    expect(verifySecret(input, stored, undefined)).toBe(false);
  });

  it("rejects empty input and missing configuration", () => {
    expect(verifySecret("", "anything", undefined)).toBe(false);
    expect(verifySecret("anything", undefined, undefined)).toBe(false);
    expect(verifySecret("anything", "", undefined)).toBe(false);
  });
});

describe("verifySecret — scrypt hash path", () => {
  it("accepts the correct secret against its hash", () => {
    expect(verifySecret("s3cret-passphrase", undefined, makeHash("s3cret-passphrase"))).toBe(true);
  });

  it("rejects a wrong secret against a valid hash", () => {
    expect(verifySecret("not-the-secret", undefined, makeHash("s3cret-passphrase"))).toBe(false);
  });

  it.each([
    "plainly-not-a-hash",
    "scrypt$v1$short$short",
    "bcrypt$v1$AAAA$BBBB",
    "scrypt$v2$" + Buffer.alloc(16).toString("base64") + "$" + Buffer.alloc(64).toString("base64"),
  ])("rejects malformed or unsupported hash: %s", hash => {
    expect(verifySecret("anything", undefined, hash)).toBe(false);
  });

  it("prefers the hash over the plain secret when both are set", () => {
    const hash = makeHash("the-hashed-secret");
    expect(verifySecret("the-plain-secret", "the-plain-secret", hash)).toBe(false);
    expect(verifySecret("the-hashed-secret", "the-plain-secret", hash)).toBe(true);
  });
});
