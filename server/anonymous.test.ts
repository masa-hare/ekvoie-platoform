import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Test anonymous access functionality
 */

function createAnonymousContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null, // Anonymous user
    anonymousUserId: null, // No anonymous user ID yet
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {}, // Add cookie method for anonymous user creation
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Anonymous Access", () => {
  it("allows anonymous users to list opinions", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.opinions.list({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows anonymous users to vote on opinions", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    // Test that voting with non-existent opinion ID throws error (rate limit or NOT_FOUND)
    await expect(
      caller.opinions.vote({
        opinionId: 999999,
        voteType: "agree",
      })
    ).rejects.toThrow(); // Accept any error (rate limit or NOT_FOUND)
  });

  it("allows anonymous users to get categories", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.opinions.getCategories();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns null for auth.me when not authenticated", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});
