import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getOrCreateAnonymousUser } from "./anonymousAuth";

import { TRPCError } from "@trpc/server";

import { opinionSubmitLimiter, voteLimiter } from "./rateLimit";
import { broadcastOpinionChange } from "./sse";
import { sanitizeInput, scrubPII, checkContent } from "./security";

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
          problemStatement: z.string().trim().max(500).optional(),
          solutionProposal: z.string().trim().min(1).max(500),
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
        const cleanProblem = sanitizeInput(input.problemStatement);
        const cleanSolution = sanitizeInput(input.solutionProposal);

        // Pre-submission content check
        const check = checkContent(cleanProblem, cleanSolution);
        if (!check.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: check.type === "pii" ? "CONTENT_VIOLATION_PII" : "CONTENT_VIOLATION_HARMFUL",
          });
        }

        // Create opinion — published immediately (post-moderation model)
        const opinion = await db.createOpinion({
          problemStatement: cleanProblem,
          transcription: cleanSolution,
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
          userId: z.number().optional(),
          includeFeedback: z.boolean().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await db.getOpinions({
          categoryId: input?.categoryId,
          userId: input?.userId,
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
          voteType: z.enum(["agree", "disagree", "pass"]),
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

        const userId = ctx.user?.id || null;
        
        // Get or create anonymous user ID for voting (only creates on vote action)
        let anonymousUserId = ctx.anonymousUserId;
        if (!userId && !anonymousUserId) {
          anonymousUserId = await getOrCreateAnonymousUser(ctx.req, ctx.res);
        }

        // Check if user already voted
        let existingVote = null;
        if (userId) {
          // For logged-in users, check by userId
          existingVote = await db.getUserVote(userId, input.opinionId);
        } else if (anonymousUserId) {
          // For anonymous users, check by anonymousUserId
          existingVote = await db.getAnonymousUserVote(anonymousUserId, input.opinionId);
        }

        if (existingVote) {
          // Update existing vote
          await db.updateVote(existingVote.id, input.voteType);
        } else {
          // Create new vote
          await db.createVote({
            userId,
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
        const totalVotes = opinion.agreeCount + opinion.disagreeCount + opinion.passCount;
        
        return {
          success: true,
          counts: {
            agreeCount: opinion.agreeCount,
            disagreeCount: opinion.disagreeCount,
            passCount: opinion.passCount,
          }
        };
      }),

    // Get user's vote for an opinion
    getUserVote: protectedProcedure
      .input(z.object({ opinionId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserVote(ctx.user.id, input.opinionId);
      }),
  }),

  analytics: router({
    getStats: publicProcedure.query(async () => {
      return await db.getAnalyticsStats();
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

    // Get pending solutions (admin only)
    getPendingSolutions: adminProcedure.query(async () => {
      return await db.getPendingSolutions();
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
          reason: z.string().optional(),
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

        const opinionPreview = scrubPII(
          (opinion.problemStatement || opinion.transcription || "").slice(0, 50)
        );
        await db.createDeletionLog({
          postType: "opinion",
          postId: input.opinionId,
          content: JSON.stringify({ preview: opinionPreview, categoryId: opinion.categoryId }),
          reason: input.reason || null,
          deletedBy: ctx.user.id,
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
        const headers = ["ID", "問題文", "カテゴリー", "賛成数", "反対数", "パス数", "賛成率(%)", "作成日時"];
        const rows = opinions.map(opinion => {
          const total = opinion.agreeCount + opinion.disagreeCount + opinion.passCount;
          const agreeRate = total > 0 ? ((opinion.agreeCount / total) * 100).toFixed(1) : "0.0";
          const categoryName = opinion.categoryId ? categoryMap.get(opinion.categoryId) || "未分類" : "未分類";
          
          const problemText = (opinion.problemStatement || "").replace(/\r?\n/g, " ");
          const csvEscape = (s: string) => `"${s.replace(/"/g, '""')}"`;
          return [
            opinion.id.toString(),
            csvEscape(problemText),
            csvEscape(categoryName),
            opinion.agreeCount.toString(),
            opinion.disagreeCount.toString(),
            opinion.passCount.toString(),
            agreeRate,
            new Date(opinion.createdAt).toISOString().split('T')[0]
          ];
        });

        const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        return { csv };
      }),
  }),

  solutions: router({
    // Create a new solution proposal
    create: publicProcedure
      .input(
        z.object({
          opinionId: z.number().int().positive(),
          title: z.string().trim().min(10).max(200),
          description: z.string().trim().min(10).max(1000),
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

        // Get or create anonymous user ID for solution creation
        let anonymousUserId = ctx.anonymousUserId;
        if (!anonymousUserId) {
          anonymousUserId = await getOrCreateAnonymousUser(ctx.req, ctx.res);
        }

        // Strip HTML tags before storage
        const cleanTitle = sanitizeInput(input.title);
        const cleanDescription = sanitizeInput(input.description);

        // Pre-submission content check
        const check = checkContent(cleanTitle, cleanDescription);
        if (!check.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: check.type === "pii" ? "CONTENT_VIOLATION_PII" : "CONTENT_VIOLATION_HARMFUL",
          });
        }

        await db.createSolution({
          opinionId: input.opinionId,
          title: cleanTitle,
          description: cleanDescription,
          anonymousUserId,
          approvalStatus: "approved",
        });

        return { success: true };
      }),

    // Get solutions for an opinion
    getByOpinionId: publicProcedure
      .input(
        z.object({
          opinionId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await db.getSolutionsByOpinionId(input.opinionId);
      }),

    // Vote on a solution
    vote: publicProcedure
      .input(
        z.object({
          solutionId: z.number().int().positive(),
          voteType: z.enum(["support", "oppose", "pass"]),
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

        // Get or create anonymous user ID for solution voting (only creates on vote action)
        let anonymousUserId = ctx.anonymousUserId;
        if (!anonymousUserId) {
          anonymousUserId = await getOrCreateAnonymousUser(ctx.req, ctx.res);
        }

        // Check if user has already voted
        const existingVote = await db.getSolutionVoteByUserAndSolution(
          anonymousUserId,
          input.solutionId
        );

        if (existingVote) {
          // Update existing vote
          await db.updateSolutionVote(existingVote.id, input.voteType);
        } else {
          // Create new vote
          await db.createSolutionVote({
            solutionId: input.solutionId,
            anonymousUserId,
            voteType: input.voteType,
          });
        }

        // Update vote counts
        await db.updateSolutionVoteCount(input.solutionId);

        return { success: true };
      }),

    // Approve solution (admin only)
    approve: adminProcedure
      .input(
        z.object({
          solutionId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateSolution(input.solutionId, {
          approvalStatus: "approved",
        });

        return { success: true };
      }),

    // Reject solution (admin only)
    reject: adminProcedure
      .input(
        z.object({
          solutionId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateSolution(input.solutionId, {
          approvalStatus: "rejected",
        });

        return { success: true };
      }),

    // Delete solution (admin only)
    delete: adminProcedure
      .input(
        z.object({
          solutionId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 削除前に解決策内容を取得
        const solution = await db.getSolutionById(input.solutionId);
        if (!solution) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Solution not found",
          });
        }

        const solutionPreview = scrubPII(
          (solution.title || solution.description || "").slice(0, 50)
        );
        await db.createDeletionLog({
          postType: "solution",
          postId: input.solutionId,
          content: JSON.stringify({ preview: solutionPreview, opinionId: solution.opinionId }),
          reason: input.reason || null,
          deletedBy: ctx.user.id,
        });

        await db.deleteSolution(input.solutionId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
