import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOT_ADMIN_ERR_MSG } from "@shared/const";
import type { TrpcContext } from "./_core/context";

// All DB access is mocked: these tests exercise routing, validation,
// authorization, and content filtering — not MySQL.
vi.mock("./db", () => ({
  getCategories: vi.fn(async () => [
    { id: 1, name: "学生生活", description: null, isFeedback: false, createdAt: new Date() },
  ]),
  getCategoryUsage: vi.fn(async () => ({ opinions: 0, themes: 0 })),
  getOpinions: vi.fn(async () => []),
  getOpinionById: vi.fn(async () => ({
    id: 1,
    transcription: "テスト意見",
    problemStatement: null,
    categoryId: 1,
    themeId: null,
    approvalStatus: "approved",
    isVisible: true,
    agreeCount: 1,
    disagreeCount: 0,
    createdAt: new Date(),
  })),
  createOpinion: vi.fn(async () => ({ insertId: 10 })),
  updateOpinion: vi.fn(async () => {}),
  deleteOpinion: vi.fn(async () => {}),
  getUserVote: vi.fn(async () => undefined),
  getAnonymousUserVote: vi.fn(async () => undefined),
  createVote: vi.fn(async () => {}),
  updateVote: vi.fn(async () => {}),
  updateOpinionCounts: vi.fn(async () => {}),
  createDeletionLog: vi.fn(async () => {}),
  getDeletionLogs: vi.fn(async () => []),
  createCategory: vi.fn(async () => ({ insertId: 2 })),
  toggleCategoryFeedback: vi.fn(async () => {}),
  deleteCategory: vi.fn(async () => {}),
  getThemes: vi.fn(async () => []),
  createTheme: vi.fn(async () => ({ insertId: 3 })),
  updateTheme: vi.fn(async () => {}),
  deleteTheme: vi.fn(async () => {}),
  assignOpinionToTheme: vi.fn(async () => {}),
  getPublishedUniversityViews: vi.fn(async () => []),
  getUniversityViewByThemeId: vi.fn(async () => null),
  getAllUniversityViews: vi.fn(async () => []),
  createUniversityView: vi.fn(async () => ({ insertId: 4 })),
  updateUniversityView: vi.fn(async () => {}),
  deleteUniversityView: vi.fn(async () => {}),
}));
vi.mock("./sse", () => ({ broadcastOpinionChange: vi.fn(), addSseClient: vi.fn() }));
vi.mock("./anonymousAuth", () => ({ getOrCreateAnonymousUser: vi.fn(async () => 42) }));

import { appRouter } from "./routers";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role?: "user" | "admin"): TrpcContext {
  const user: AuthenticatedUser | null = role
    ? {
        id: 1,
        openId: "test-user",
        email: null,
        name: "Test User",
        loginMethod: "password",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    anonymousUserId: null,
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as TrpcContext["res"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public opinion access", () => {
  it("lists categories without authentication", async () => {
    const caller = appRouter.createCaller(createContext());
    const categories = await caller.opinions.getCategories();
    expect(Array.isArray(categories)).toBe(true);
  });

  it("lists only approved & visible opinions", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.opinions.list();
    expect(db.getOpinions).toHaveBeenCalledWith(
      expect.objectContaining({ isVisible: true, approvalStatus: "approved" })
    );
  });
});

describe("voting (agree / disagree only)", () => {
  it("rejects the removed 'pass' vote type at input validation", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.opinions.vote({ opinionId: 1, voteType: "pass" as never })
    ).rejects.toThrow();
    expect(db.createVote).not.toHaveBeenCalled();
    expect(db.updateVote).not.toHaveBeenCalled();
  });

  it("records a first anonymous vote and returns two-way counts", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.opinions.vote({ opinionId: 1, voteType: "agree" });

    expect(db.createVote).toHaveBeenCalledWith(
      expect.objectContaining({ opinionId: 1, voteType: "agree", anonymousUserId: 42 })
    );
    expect(db.updateOpinionCounts).toHaveBeenCalledWith(1);
    expect(result.counts).toEqual({ agreeCount: 1, disagreeCount: 0 });
    expect(result.counts).not.toHaveProperty("passCount");
  });

  it("updates the existing vote instead of double-counting", async () => {
    vi.mocked(db.getAnonymousUserVote).mockResolvedValueOnce({
      id: 7,
      userId: null,
      anonymousUserId: 42,
      opinionId: 1,
      voteType: "agree",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(createContext());
    await caller.opinions.vote({ opinionId: 1, voteType: "disagree" });

    expect(db.updateVote).toHaveBeenCalledWith(7, "disagree");
    expect(db.createVote).not.toHaveBeenCalled();
  });
});

describe("opinion submission", () => {
  it("blocks contact-information PII before anything reaches the database", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.opinions.createTextOpinion({
        solutionProposal: "連絡ください test@example.com",
        categoryId: 1,
      })
    ).rejects.toThrow("CONTENT_VIOLATION_PII");
    expect(db.createOpinion).not.toHaveBeenCalled();
  });

  it("blocks explicit personal names", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.opinions.createTextOpinion({
        solutionProposal: "担当の 山田太郎さん の対応が遅い",
        categoryId: 1,
      })
    ).rejects.toThrow("CONTENT_VIOLATION_PERSONAL_NAME");
    expect(db.createOpinion).not.toHaveBeenCalled();
  });

  it("blocks clearly abusive language, including symbol-evasion variants", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.opinions.createTextOpinion({ solutionProposal: "し★ね", categoryId: 1 })
    ).rejects.toThrow("CONTENT_VIOLATION_HARMFUL");
    expect(db.createOpinion).not.toHaveBeenCalled();
  });

  it("strips HTML and publishes immediately (post-moderation model)", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.opinions.createTextOpinion({
      solutionProposal: "食堂が混んでいて<script>alert(1)</script>座れない",
      categoryId: 1,
    });

    expect(db.createOpinion).toHaveBeenCalledWith(
      expect.objectContaining({
        transcription: "食堂が混んでいてalert(1)座れない",
        approvalStatus: "approved",
        anonymousUserId: 42,
      })
    );
  });
});

describe("admin authorization boundary", () => {
  const adminOnlyCalls: Array<[string, (caller: ReturnType<typeof appRouter.createCaller>) => Promise<unknown>]> = [
    ["admin.getAllOpinions", caller => caller.admin.getAllOpinions()],
    ["admin.exportOpinions", caller => caller.admin.exportOpinions()],
    ["admin.deleteOpinion", caller => caller.admin.deleteOpinion({ opinionId: 1 })],
    ["admin.addCategory", caller => caller.admin.addCategory({ name: "新カテゴリ" })],
    ["admin_themes.create", caller => caller.admin_themes.create({ categoryId: 1, title: "テーマ" })],
    [
      "admin_universityViews.create",
      caller =>
        caller.admin_universityViews.create({ themeId: 1, body: "見解", responseStatus: "checking" }),
    ],
  ];

  for (const [name, invoke] of adminOnlyCalls) {
    it(`${name} rejects anonymous users`, async () => {
      const caller = appRouter.createCaller(createContext());
      await expect(invoke(caller)).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });

    it(`${name} rejects non-admin users`, async () => {
      const caller = appRouter.createCaller(createContext("user"));
      await expect(invoke(caller)).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });
  }

  it("allows an admin to export CSV — two-way vote columns only", async () => {
    vi.mocked(db.getOpinions).mockResolvedValueOnce([
      {
        id: 1,
        transcription: "テスト",
        problemStatement: "図書館が混む",
        categoryId: 1,
        themeId: null,
        agreeCount: 3,
        disagreeCount: 1,
        approvalStatus: "approved",
        isVisible: true,
        createdAt: new Date(),
      } as never,
    ]);

    const caller = appRouter.createCaller(createContext("admin"));
    const { csv } = await caller.admin.exportOpinions();

    expect(csv).toContain("賛成数");
    expect(csv).toContain("反対数");
    expect(csv).not.toContain("パス");
  });
});

describe("university views (draft → offline approval → publish)", () => {
  it("requires a reason when the status is cannot_answer", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(
      caller.admin_universityViews.create({
        themeId: 1,
        body: "現在の大学の事情では答えられません",
        responseStatus: "cannot_answer",
      })
    ).rejects.toThrow("REASON_REQUIRED_FOR_CANNOT_ANSWER");
    expect(db.createUniversityView).not.toHaveBeenCalled();
  });

  it("always creates new views as drafts, never directly published", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await caller.admin_universityViews.create({
      themeId: 1,
      body: "時間割は少人数制とのバランスで組んでいる",
      responseStatus: "checking",
    });

    expect(db.createUniversityView).toHaveBeenCalledWith(
      expect.objectContaining({ approvalStatus: "draft" })
    );
  });
});
