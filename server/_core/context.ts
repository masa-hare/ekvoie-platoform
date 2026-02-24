import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getAnonymousUserId } from "../anonymousAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  anonymousUserId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Get anonymous user ID (read-only, does not create new user)
  const anonymousUserId = await getAnonymousUserId(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
    anonymousUserId,
  };
}
