import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getOrCreateAnonymousUser } from "./anonymousAuth";

import { TRPCError } from "@trpc/server";

import { opinionSubmitLimiter, voteLimiter } from "./rateLimit";
import { broadcastOpinionChange } from "./sse";
import { sanitizeInput, checkContent } from "./security";

const deletionReasons = [
  "personal_information",
  "harassment_or_hate",
  "threat_or_illegal_content",
  "off_topic_or_spam",
  "other_policy_violation",
] as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  opinions: router({
    // Get all categories
    getCategories: publicProcedure.query(async () => {
      return await db.getCategories();
    }),

    // Create a new opinion with text input
    createTextOpinion: publicProcedure
      .input(
        z.object({
          body: z.string().trim().min(1).max(500),
          categoryId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Apply rate limiting (skip in test environment)
        if (process.env.NODE_ENV !== "test") {
          await new Promise<void>((resolve, reject) => {
            opinionSubmitLimiter(ctx.req as any, ctx.res as any, (err?: any) => {
              if (err) reject(new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many submissions. Please wait 1 minute before submitting again." }));
              else resolve();
            });
          });
        }

        // Get or create anonymous user
        const anonymousUserId = await getOrCreateAnonymousUser(ctx.req, ctx.res);

        // Strip HTML tags before storage
        const cleanBody = sanitizeInput(input.body);

        // Pre-submission content check
        const check = checkContent(cleanBody);
        if (!check.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: check.type === "pii" ? "CONTENT_VIOLATION_PII" : check.type === "personal_name" ? "CONTENT_VIOLATION_PERSONAL_NAME" : "CONTENT_VIOLATION_HARMFUL",
          });
        }

        // Create opinion — published immediately (post-moderation model)
        const opinion = await db.createOpinion({
          body: cleanBody,
          categoryId: input.categoryId,
          anonymousUserId: anonymousUserId,
          approvalStatus: "approved",
        });

        broadcastOpinionChange();
        return opinion;
      }),

    // Get all opinions with filters (only approved ones for public)
    list: publicProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          themeId: z.number().optional(),
          includeFeedback: z.boolean().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await db.getOpinions({
          categoryId: input?.categoryId,
          themeId: input?.themeId,
          isVisible: true,
          approvalStatus: "approved",
          // リスト表示ではフィードバックカテゴリーを除外。カテゴリービューまたは直接指定時は含む
          excludeFeedbackCategories: !input?.includeFeedback && !input?.categoryId,
        });
      }),

    // Get single opinion by ID
    getById: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const opinion = await db.getOpinionById(input.id);
        if (!opinion || opinion.approvalStatus !== "approved" || !opinion.isVisible) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Opinion not found",
          });
        }
        return opinion;
      }),

    // Vote on an opinion (allow anonymous)
    vote: publicProcedure
      .input(
        z.object({
          opinionId: z.number().int().positive(),
          voteType: z.enum(["agree", "disagree"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Apply rate limiting (skip in test environment)
        if (process.env.NODE_ENV !== "test") {
          await new Promise<void>((resolve, reject) => {
            voteLimiter(ctx.req as any, ctx.res as any, (err?: any) => {
              if (err) reject(new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many votes. Please slow down." }));
              else resolve();
            });
          });
        }

        // Get or create anonymous user ID for voting (only creates on vote action)
        let anonymousUserId = ctx.anonymousUserId;
        if (!anonymousUserId) {
          anonymousUserId = await getOrCreateAnonymousUser(ctx.req, ctx.res);
        }

        // Check if user already voted
        const existingVote = await db.getAnonymousUserVote(anonymousUserId, input.opinionId);

        if (existingVote) {
          // Update existing vote
          await db.updateVote(existingVote.id, input.voteType);
        } else {
          // Create new vote
          await db.createVote({
            anonymousUserId,
            opinionId: input.opinionId,
            voteType: input.voteType,
          });
        }

        // Update opinion counts
        await db.updateOpinionCounts(input.opinionId);

        // Get updated opinion with latest counts
        const opinion = await db.getOpinionById(input.opinionId);
        if (!opinion) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Opinion not found" });
        }
        return {
          success: true,
          counts: {
            agreeCount: opinion.agreeCount,
            disagreeCount: opinion.disagreeCount,
          }
        };
      }),

  }),

  // Admin procedures
  admin: router({
    // Get all opinions including hidden ones
    getAllOpinions: adminProcedure.query(async () => {
      return await db.getOpinions({});
    }),

    // Moderate opinion (hide/show)
    moderateOpinion: adminProcedure
      .input(
        z.object({
          opinionId: z.number(),
          isVisible: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOpinion(input.opinionId, {
          isVisible: input.isVisible,
          isModerated: true,
        });
        broadcastOpinionChange();
        return { success: true };
      }),

    // Approve opinion (admin only)
    approveOpinion: adminProcedure
      .input(
        z.object({
          opinionId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOpinion(input.opinionId, {
          approvalStatus: "approved",
        });
        broadcastOpinionChange();
        return { success: true };
      }),

    // Reject opinion (admin only)
    rejectOpinion: adminProcedure
      .input(
        z.object({
          opinionId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOpinion(input.opinionId, {
          approvalStatus: "rejected",
        });
        broadcastOpinionChange();
        return { success: true };
      }),

    // Delete opinion (admin only)
    deleteOpinion: adminProcedure
      .input(
        z.object({
          opinionId: z.number(),
          reason: z.enum(deletionReasons),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 削除前に意見内容を取得
        const opinion = await db.getOpinionById(input.opinionId);
        if (!opinion) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Opinion not found",
          });
        }

        await db.createDeletionLog({
          postType: "opinion",
          postId: input.opinionId,
          reason: input.reason,
        });

        await db.deleteOpinion(input.opinionId);
        broadcastOpinionChange();
        return { success: true };
      }),

    // Get deletion logs (admin only)
    getDeletionLogs: adminProcedure.query(async () => {
      return await db.getDeletionLogs();
    }),

    // Add category (admin only)
    addCategory: adminProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(100),
          description: z.string().trim().max(500).optional(),
          isFeedback: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await db.createCategory(input.name, input.description, input.isFeedback);
        return { success: true, insertId: result.insertId };
      }),

    // Toggle feedback flag on a category (admin only)
    toggleCategoryFeedback: adminProcedure
      .input(z.object({ id: z.number().int().positive(), isFeedback: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.toggleCategoryFeedback(input.id, input.isFeedback);
        return { success: true };
      }),

    // Delete category (admin only)
    deleteCategory: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const usage = await db.getCategoryUsage(input.id);
        if (usage.opinions || usage.themes) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CATEGORY_IN_USE" });
        }
        await db.deleteCategory(input.id);
        return { success: true };
      }),

    // Export opinions to CSV (admin only)
    exportOpinions: adminProcedure
      .query(async () => {
        const opinions = await db.getOpinions();
        const categories = await db.getCategories();
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        // Generate CSV content
        const headers = ["ID", "問題文", "カテゴリー", "賛成数", "反対数", "作成日時"];
        const rows = opinions.map(opinion => {
          const categoryName = opinion.categoryId ? categoryMap.get(opinion.categoryId) || "未分類" : "未分類";
          
          const opinionText = opinion.body.replace(/\r?\n/g, " ");
          // Prevent spreadsheet formula injection when a CSV is opened locally.
          const csvEscape = (s: string) => {
            const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
            return `"${safe.replace(/"/g, '""')}"`;
          };
          return [
            opinion.id.toString(),
            csvEscape(opinionText),
            csvEscape(categoryName),
            opinion.agreeCount.toString(),
            opinion.disagreeCount.toString(),
            new Date(opinion.createdAt).toISOString().split('T')[0]
          ];
        });

        const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        return { csv };
      }),
  }),

  themes: router({
    list: publicProcedure
      .input(z.object({ categoryId: z.number().int().positive().optional() }).optional())
      .query(async ({ input }) => db.getThemes(input?.categoryId)),
  }),

  // 大学見解（テーマ単位）。承認はオフライン運用 — 管理者が大学側からのOKを
  // サイト外で得たうえで draft→published をトグルする。アプリ内承認フローは持たない。
  universityViews: router({
    // Published views for the public contrast view, keyed by manually created theme.
    list: publicProcedure.query(async () => {
      return await db.getPublishedUniversityViews();
    }),

    getByThemeId: publicProcedure
      .input(z.object({ themeId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return await db.getUniversityViewByThemeId(input.themeId);
      }),
  }),

  // Admin procedures for university views (draft authoring + publish toggle)
  admin_universityViews: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUniversityViews();
    }),

    create: adminProcedure
      .input(
        z.object({
          themeId: z.number().int().positive(),
          body: z.string().trim().min(1).max(2000),
          responseStatus: z.enum(["answered", "checking", "cannot_answer"]),
          reason: z.string().trim().max(1000).optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.responseStatus === "cannot_answer" && !input.reason?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "REASON_REQUIRED_FOR_CANNOT_ANSWER" });
        }
        const result = await db.createUniversityView({
          themeId: input.themeId,
          body: input.body,
          responseStatus: input.responseStatus,
          reason: input.reason || null,
          approvalStatus: "draft",
        });
        return { success: true, insertId: result.insertId };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          body: z.string().trim().min(1).max(2000).optional(),
          responseStatus: z.enum(["answered", "checking", "cannot_answer"]).optional(),
          reason: z.string().trim().max(1000).optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateUniversityView(id, updates);
        return { success: true };
      }),

    // Toggle draft/published — flip this only after the university side has
    // confirmed the content off-site (email, meeting, internal chat, etc.)
    setApprovalStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), approvalStatus: z.enum(["draft", "published"]) }))
      .mutation(async ({ input }) => {
        await db.updateUniversityView(input.id, { approvalStatus: input.approvalStatus });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteUniversityView(input.id);
        return { success: true };
      }),
  }),

  // Manual, conservative grouping only. Do not automate classification.
  admin_themes: router({
    list: adminProcedure.query(async () => db.getThemes()),
    create: adminProcedure
      .input(z.object({ categoryId: z.number().int().positive(), title: z.string().trim().min(1).max(200) }))
      .mutation(async ({ input }) => db.createTheme(input)),
    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(1).max(200) }))
      .mutation(async ({ input }) => { await db.updateTheme(input.id, { title: input.title }); return { success: true }; }),
    remove: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => { await db.deleteTheme(input.id); return { success: true }; }),
    assignOpinion: adminProcedure
      .input(z.object({ opinionId: z.number().int().positive(), themeId: z.number().int().positive().nullable() }))
      .mutation(async ({ input }) => { await db.updateOpinion(input.opinionId, { themeId: input.themeId }); return { success: true }; }),
  }),
});

export type AppRouter = typeof appRouter;
