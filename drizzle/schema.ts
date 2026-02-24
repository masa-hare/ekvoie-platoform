import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Anonymous users identified by UUID stored in HttpOnly cookie
 * UUIDs expire after 90 days to minimize tracking and protect privacy
 */
export const anonymousUsers = mysqlTable("anonymous_users", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt").defaultNow().notNull(), // UUID expires after 90 days (default: now, updated on insert)
});

export type AnonymousUser = typeof anonymousUsers.$inferSelect;
export type InsertAnonymousUser = typeof anonymousUsers.$inferInsert;

/**
 * Categories for organizing opinions
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Student opinions with voice transcription
 */
export const opinions = mysqlTable("opinions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Nullable - for admin users only
  anonymousUserId: int("anonymousUserId"), // For anonymous users
  categoryId: int("categoryId"),
  problemStatement: text("problemStatement"), // "いつ/どこで/誰が困るか" を1文で
  audioUrl: text("audioUrl"), // Nullable for text-only submissions
  audioFileKey: varchar("audioFileKey", { length: 500 }), // Nullable for text-only submissions
  transcription: text("transcription").notNull(),
  language: varchar("language", { length: 10 }),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  isModerated: boolean("isModerated").default(false).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  agreeCount: int("agreeCount").default(0).notNull(),
  disagreeCount: int("disagreeCount").default(0).notNull(),
  passCount: int("passCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Opinion = typeof opinions.$inferSelect;
export type InsertOpinion = typeof opinions.$inferInsert;

/**
 * Vote records for opinions
 */
export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Nullable - for admin users only
  anonymousUserId: int("anonymousUserId"), // For anonymous users
  opinionId: int("opinionId").notNull(),
  voteType: mysqlEnum("voteType", ["agree", "disagree", "pass"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * LLM-generated opinion groups and themes (multilingual)
 */
export const opinionGroups = mysqlTable("opinion_groups", {
  id: int("id").autoincrement().primaryKey(),
  themeJa: varchar("themeJa", { length: 200 }).notNull(),
  themeEn: varchar("themeEn", { length: 200 }).notNull(),
  summaryJa: text("summaryJa").notNull(),
  summaryEn: text("summaryEn").notNull(),
  sentiment: mysqlEnum("sentiment", ["positive", "negative", "neutral", "mixed"]).default("neutral").notNull(),
  opinionIds: text("opinionIds").notNull(), // JSON array of opinion IDs
  opinionCount: int("opinionCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpinionGroup = typeof opinionGroups.$inferSelect;
export type InsertOpinionGroup = typeof opinionGroups.$inferInsert;

/**
 * Solutions proposed for opinions (大学が実行できる行動)
 */
export const solutions = mysqlTable("solutions", {
  id: int("id").autoincrement().primaryKey(),
  opinionId: int("opinionId").notNull(),
  title: varchar("title", { length: 200 }).notNull(), // 解決策のタイトル
  description: text("description").notNull(), // 詳細説明
  createdBy: int("createdBy"), // 提案者（管理者または匿名ユーザー）
  anonymousUserId: int("anonymousUserId"), // 匿名ユーザーの場合
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  supportCount: int("supportCount").default(0).notNull(),
  opposeCount: int("opposeCount").default(0).notNull(),
  passCount: int("passCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Solution = typeof solutions.$inferSelect;
export type InsertSolution = typeof solutions.$inferInsert;

/**
 * Vote records for solutions
 */
export const solutionVotes = mysqlTable("solution_votes", {
  id: int("id").autoincrement().primaryKey(),
  solutionId: int("solutionId").notNull(),
  anonymousUserId: int("anonymousUserId").notNull(),
  voteType: mysqlEnum("voteType", ["support", "oppose", "pass"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SolutionVote = typeof solutionVotes.$inferSelect;
export type InsertSolutionVote = typeof solutionVotes.$inferInsert;

/**
 * Deletion logs for moderation transparency
 * Stores information about hidden/deleted opinions and solutions
 */
export const deletionLogs = mysqlTable("deletion_logs", {
  id: int("id").autoincrement().primaryKey(),
  postType: mysqlEnum("postType", ["opinion", "solution"]).notNull(),
  postId: int("postId").notNull(),
  content: text("content").notNull(),
  reason: text("reason"),
  deletedBy: int("deletedBy"),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
});

export type DeletionLog = typeof deletionLogs.$inferSelect;
export type InsertDeletionLog = typeof deletionLogs.$inferInsert;
