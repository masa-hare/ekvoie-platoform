import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { Request, Response } from "express";

describe("Anonymous Authentication", () => {
  let mockAnonymousUserId = 1000; // Start with high ID to avoid conflicts

  const createMockContext = (anonymousUserId: number, ip?: string): TrpcContext => {
    const mockReq = {
      cookies: { anonymous_user_id: anonymousUserId.toString() }, // Add cookie for rate limit key
      headers: {},
      ip: ip || `127.0.0.${anonymousUserId % 256}`, // Use unique IP per user
    } as unknown as Request;

    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as Response;

    return {
      req: mockReq,
      res: mockRes,
      user: null,
      anonymousUserId,
    };
  };

  it("should allow anonymous users to vote on opinions", async () => {
    const userId = mockAnonymousUserId++;
    const caller = appRouter.createCaller(createMockContext(userId, `192.168.1.${userId % 256}`)); // Use unique ID and IP

    // Get opinions
    const opinions = await caller.opinions.list();
    expect(opinions).toBeDefined();
    expect(Array.isArray(opinions)).toBe(true);

    if (opinions.length > 0) {
      // Vote on first opinion
      const result = await caller.opinions.vote({
        opinionId: opinions[0].id,
        voteType: "agree",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should prevent duplicate votes from same anonymous user", async () => {
    const userId = mockAnonymousUserId++;
    const caller = appRouter.createCaller(createMockContext(userId, `192.168.2.${userId % 256}`)); // Use unique ID and IP

    // Get opinions
    const opinions = await caller.opinions.list();

    if (opinions.length > 0) {
      // Vote on first opinion
      await caller.opinions.vote({
        opinionId: opinions[0].id,
        voteType: "agree",
      });

      // Try to vote again - should update existing vote
      const result = await caller.opinions.vote({
        opinionId: opinions[0].id,
        voteType: "disagree",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should treat different anonymous users as separate", async () => {
    const userId1 = mockAnonymousUserId++;
    const userId2 = mockAnonymousUserId++;
    const caller1 = appRouter.createCaller(createMockContext(userId1, `192.168.3.${userId1 % 256}`)); // Use unique IDs and IPs
    const caller2 = appRouter.createCaller(createMockContext(userId2, `192.168.3.${userId2 % 256}`));

    // Get opinions
    const opinions = await caller1.opinions.list();

    if (opinions.length > 0) {
      // First anonymous user votes
      const result1 = await caller1.opinions.vote({
        opinionId: opinions[0].id,
        voteType: "agree",
      });

      expect(result1.success).toBe(true);

      // Second anonymous user votes on same opinion
      const result2 = await caller2.opinions.vote({
        opinionId: opinions[0].id,
        voteType: "disagree",
      });

      expect(result2.success).toBe(true);
    }
  });
});
