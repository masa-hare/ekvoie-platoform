import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOT_ADMIN_ERR_MSG } from "@shared/const";
import type { TrpcContext } from "./_core/context";

// DB access is mocked: these tests cover routing, validation, authorization,
// and filtering without putting student content into a test database.
vi.mock("./db", () => ({
  getCategories: vi.fn(async () => [
    {
      id: 1,
      name: "学生生活",
      description: null,
      isFeedback: false,
      createdAt: new Date(),
    },
  ]),
  getCategoryUsage: vi.fn(async () => ({ opinions: 0, themes: 0 })),
  getOpinions: vi.fn(async () => []),
  getOpinionById: vi.fn(async () => ({
    id: 1,
    body: "テスト意見",
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
  getAnonymousUserVote: vi.fn(async () => undefined),
  createVote: vi.fn(async () => {}),
  updateVote: vi.fn(async () => {}),
  updateOpinionCounts: vi.fn(async () => {}),
  createDeletionLog: vi.fn(async () => {}),
  getDeletionLogs: vi.fn(async () => []),
  createOpinionReport: vi.fn(async () => ({ insertId: 1 })),
  getOpinionReports: vi.fn(async () => []),
  updateOpinionReportStatus: vi.fn(async () => {}),
  createCategory: vi.fn(async () => ({ insertId: 2 })),
  toggleCategoryFeedback: vi.fn(async () => {}),
  deleteCategory: vi.fn(async () => {}),
  getThemes: vi.fn(async () => []),
  createTheme: vi.fn(async () => ({ insertId: 3 })),
  updateTheme: vi.fn(async () => {}),
  deleteTheme: vi.fn(async () => {}),
  getPublishedUniversityViews: vi.fn(async () => []),
  getUniversityViewByThemeId: vi.fn(async () => null),
  getAllUniversityViews: vi.fn(async () => []),
  createUniversityView: vi.fn(async () => ({ insertId: 4 })),
  updateUniversityView: vi.fn(async () => {}),
  deleteUniversityView: vi.fn(async () => {}),
}));
vi.mock("./sse", () => ({
  broadcastOpinionChange: vi.fn(),
  addSseClient: vi.fn(),
}));
vi.mock("./anonymousAuth", () => ({
  getOrCreateAnonymousUser: vi.fn(async () => 42),
}));

import { appRouter } from "./routers";
import * as db from "./db";

function createContext(admin = false): TrpcContext {
  return {
    user: admin ? { id: 0, role: "admin" } : null,
    anonymousUserId: null,
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as TrpcContext["res"],
  };
}

beforeEach(() => vi.clearAllMocks());

describe("public opinion access", () => {
  it("lists categories without authentication", async () => {
    await expect(
      appRouter.createCaller(createContext()).opinions.getCategories()
    ).resolves.toHaveLength(1);
  });

  it("lists only approved and visible opinions", async () => {
    await appRouter.createCaller(createContext()).opinions.list();
    expect(db.getOpinions).toHaveBeenCalledWith(
      expect.objectContaining({ isVisible: true, approvalStatus: "approved" })
    );
  });
});

describe("anonymous voting", () => {
  it("rejects the removed pass vote type", async () => {
    await expect(
      appRouter
        .createCaller(createContext())
        .opinions.vote({ opinionId: 1, voteType: "pass" as never })
    ).rejects.toThrow();
  });

  it("records a first anonymous vote and returns only two-way counts", async () => {
    const result = await appRouter
      .createCaller(createContext())
      .opinions.vote({ opinionId: 1, voteType: "agree" });
    expect(db.createVote).toHaveBeenCalledWith(
      expect.objectContaining({
        opinionId: 1,
        voteType: "agree",
        anonymousUserId: 42,
      })
    );
    expect(result.counts).toEqual({ agreeCount: 1, disagreeCount: 0 });
  });

  it("updates an existing anonymous vote instead of double-counting", async () => {
    vi.mocked(db.getAnonymousUserVote).mockResolvedValueOnce({
      id: 7,
      anonymousUserId: 42,
      opinionId: 1,
      voteType: "agree",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    await appRouter
      .createCaller(createContext())
      .opinions.vote({ opinionId: 1, voteType: "disagree" });
    expect(db.updateVote).toHaveBeenCalledWith(7, "disagree");
    expect(db.createVote).not.toHaveBeenCalled();
  });
});

describe("opinion submission", () => {
  it.each([
    ["連絡ください test@example.com", "CONTENT_VIOLATION_PII"],
    ["担当の 山田太郎さん の対応が遅い", "CONTENT_VIOLATION_PERSONAL_NAME"],
    ["し★ね", "CONTENT_VIOLATION_HARMFUL"],
  ])("blocks unsafe content before database storage", async (body, code) => {
    await expect(
      appRouter
        .createCaller(createContext())
        .opinions.createTextOpinion({ body, categoryId: 1 })
    ).rejects.toThrow(code);
    expect(db.createOpinion).not.toHaveBeenCalled();
  });

  it("strips HTML and stores one text body only", async () => {
    await appRouter
      .createCaller(createContext())
      .opinions.createTextOpinion({
        body: "食堂が混んでいて<script>alert(1)</script>座れない",
        categoryId: 1,
      });
    expect(db.createOpinion).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "食堂が混んでいてalert(1)座れない",
        approvalStatus: "approved",
        anonymousUserId: 42,
      })
    );
  });
});

describe("opinion reports", () => {
  it("stores only the opinion ID and a fixed reason", async () => {
    await appRouter
      .createCaller(createContext())
      .opinions.report({ opinionId: 1, reason: "personal_information" });
    expect(db.createOpinionReport).toHaveBeenCalledWith({
      opinionId: 1,
      reason: "personal_information",
      status: "open",
    });
  });

  it("rejects free-text report reasons", async () => {
    await expect(
      appRouter
        .createCaller(createContext())
        .opinions.report({ opinionId: 1, reason: "free text" as never })
    ).rejects.toThrow();
  });
});

describe("admin authorization and privacy metadata", () => {
  it("rejects anonymous access to every admin operation", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.admin.exportOpinions()).rejects.toThrow(
      NOT_ADMIN_ERR_MSG
    );
    await expect(
      caller.admin.deleteOpinion({
        opinionId: 1,
        reason: "personal_information",
      })
    ).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    await expect(
      caller.admin_themes.create({ categoryId: 1, title: "テーマ" })
    ).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });

  it("records a fixed reason without keeping a deleted post preview", async () => {
    await appRouter
      .createCaller(createContext(true))
      .admin.deleteOpinion({ opinionId: 1, reason: "personal_information" });
    expect(db.createDeletionLog).toHaveBeenCalledWith({
      postType: "opinion",
      postId: 1,
      reason: "personal_information",
    });
  });

  it("rejects free-text deletion reasons", async () => {
    await expect(
      appRouter
        .createCaller(createContext(true))
        .admin.deleteOpinion({ opinionId: 1, reason: "free text" as never })
    ).rejects.toThrow();
  });

  it("exports the one body column and two-way vote counts", async () => {
    vi.mocked(db.getOpinions).mockResolvedValueOnce([
      {
        id: 1,
        body: "図書館が混む",
        categoryId: 1,
        agreeCount: 3,
        disagreeCount: 1,
        createdAt: new Date(),
      } as never,
    ]);
    const { csv } = await appRouter
      .createCaller(createContext(true))
      .admin.exportOpinions();
    expect(csv).toContain("図書館が混む");
    expect(csv).toContain("賛成数");
    expect(csv).not.toContain("パス");
  });
});
