import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./_core/sdk";
import { ADMIN_OPEN_ID } from "./adminAuth";
import { SITE_ACCESS_OPEN_ID } from "./siteAccessAuth";

// JWT_SECRET is provided via vitest.config.ts test env.
describe("session token round-trip", () => {
  it("verifies a token it signed", async () => {
    const token = await sdk.createSessionToken(ADMIN_OPEN_ID, { name: "Administrator" });
    const session = await sdk.verifySession(token);
    expect(session?.openId).toBe(ADMIN_OPEN_ID);
  });

  it("rejects a tampered token", async () => {
    const token = await sdk.createSessionToken(ADMIN_OPEN_ID, { name: "Administrator" });
    const [header, payload, signature] = token.split(".");
    const forged = [header, payload, signature.slice(0, -2) + "xx"].join(".");
    expect(await sdk.verifySession(forged)).toBeNull();
  });

  it("rejects garbage and empty values", async () => {
    expect(await sdk.verifySession("not-a-jwt")).toBeNull();
    expect(await sdk.verifySession("")).toBeNull();
    expect(await sdk.verifySession(undefined)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await sdk.createSessionToken(ADMIN_OPEN_ID, {
      name: "Administrator",
      expiresInMs: -1000,
    });
    expect(await sdk.verifySession(token)).toBeNull();
  });
});

describe("admin session privacy", () => {
  it("authenticates the admin as a synthetic user with no personal data and no DB row", async () => {
    const token = await sdk.createSessionToken(ADMIN_OPEN_ID, { name: "Administrator" });
    const req = { headers: { cookie: `${COOKIE_NAME}=${token}` } } as Request;

    const user = await sdk.authenticateRequest(req);
    expect(user.role).toBe("admin");
    expect(user.id).toBe(0); // synthetic — never persisted
    expect(user.email).toBeNull();
  });

  it("does not let a site-access gate session pass as an authenticated user", async () => {
    // The shared gate cookie and the admin session are separate credentials;
    // a gate token in the session cookie slot must not authenticate anyone.
    const gateToken = await sdk.createSessionToken(SITE_ACCESS_OPEN_ID, { name: "site-access" });
    const req = { headers: { cookie: `${COOKIE_NAME}=${gateToken}` } } as Request;

    await expect(sdk.authenticateRequest(req)).rejects.toThrow();
  });
});
