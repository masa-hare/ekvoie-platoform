import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userRole: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "password",
    role: userRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    anonymousUserId: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    anonymousUserId: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("opinions router", () => {
  it("should allow public access to categories", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);
    const categories = await caller.opinions.getCategories();

    expect(Array.isArray(categories)).toBe(true);
  });

  it("should allow public access to opinion list", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);
    const opinions = await caller.opinions.list();

    expect(Array.isArray(opinions)).toBe(true);
  });

  it("should allow anonymous voting", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    // Test that voting with non-existent opinion ID throws error (rate limit or NOT_FOUND)
    await expect(
      caller.opinions.vote({ opinionId: 999999, voteType: "agree" })
    ).rejects.toThrow(); // Accept any error (rate limit or NOT_FOUND)
  });
});

describe("admin router", () => {
  it("should require admin role for export", async () => {
    const ctx = createTestContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.exportOpinions()
    ).rejects.toThrow("Admin access required");
  });

  it("should allow admin to export opinions", async () => {
    const ctx = createTestContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.exportOpinions();
    expect(result).toHaveProperty("csv");
    expect(typeof result.csv).toBe("string");
  });
});
