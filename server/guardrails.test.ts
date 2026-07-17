import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// Design guardrails from the redesign spec (§13) pinned as executable checks,
// so a future change can't quietly reintroduce what was deliberately removed:
// no ranking, no solutions, no pass vote, no AI classification.

vi.mock("./db", () => ({}));
vi.mock("./sse", () => ({ broadcastOpinionChange: vi.fn(), addSseClient: vi.fn() }));
vi.mock("./anonymousAuth", () => ({ getOrCreateAnonymousUser: vi.fn(async () => 1) }));

import * as schema from "../drizzle/schema";
import { appRouter } from "./routers";

const serverDir = path.resolve(import.meta.dirname);
const readSource = (relative: string) =>
  fs.readFileSync(path.resolve(serverDir, relative), "utf-8");

describe("votes are a two-way signal, never a ranking", () => {
  it("the votes enum is exactly agree/disagree — pass must not come back", () => {
    expect((schema.votes.voteType as { enumValues?: string[] }).enumValues).toEqual([
      "agree",
      "disagree",
    ]);
  });

  it("opinions carry no pass counter column", () => {
    expect("passCount" in schema.opinions).toBe(false);
  });

  it("no server query orders opinions by vote counts", () => {
    const source = readSource("db.ts");
    expect(source).not.toMatch(/orderBy[^;]{0,200}(agreeCount|disagreeCount)/s);
  });
});

describe("solution proposals stay removed", () => {
  it("the schema defines no solutions / solution_votes / opinion_groups tables", () => {
    expect("solutions" in schema).toBe(false);
    expect("solutionVotes" in schema).toBe(false);
    expect("opinionGroups" in schema).toBe(false);
  });

  it("the API surface exposes no solutions procedures", () => {
    const procedures = Object.keys((appRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def.procedures);
    expect(procedures.length).toBeGreaterThan(0);
    expect(procedures.filter(name => name.toLowerCase().includes("solution"))).toEqual([]);
  });
});

describe("no AI/LLM touches opinion content", () => {
  it("the server imports no LLM SDKs", () => {
    const files = fs
      .readdirSync(serverDir, { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts"));
    for (const entry of files) {
      const source = fs.readFileSync(path.join(entry.parentPath, entry.name), "utf-8");
      expect(source, `${entry.name} must not import an LLM SDK`).not.toMatch(
        /from\s+["'](@anthropic-ai\/|openai|@google\/generative)/
      );
    }
  });

  it("themes are created by admins only — there is no automatic grouping endpoint", () => {
    const procedures = Object.keys((appRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def.procedures);
    const themeWriters = procedures.filter(
      name => name.includes("theme") && !name.startsWith("themes.list") && !name.includes("getBy")
    );
    for (const name of themeWriters) {
      expect(name, `theme mutation ${name} must live under the admin router`).toMatch(/^admin_/);
    }
  });
});

describe("privacy: data minimization stays intact", () => {
  it("anonymous users consist of a UUID and timestamps only", () => {
    const columns = Object.keys(schema.anonymousUsers);
    for (const column of columns) {
      expect(["id", "uuid", "createdAt", "lastSeenAt", "expiresAt", "enableRLS", "_"]).toContain(column);
    }
  });

  it("opinions store no direct identifier columns", () => {
    const columns = Object.keys(schema.opinions);
    expect(columns).not.toContain("email");
    expect(columns).not.toContain("name");
    expect(columns).not.toContain("ipAddress");
  });
});
