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
  isFeedback: boolean("isFeedback").default(false).notNull(),
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
 * Deletion logs for moderation transparency
 * Stores information about hidden/deleted opinions
 */
export const deletionLogs = mysqlTable("deletion_logs", {
  id: int("id").autoincrement().primaryKey(),
  postType: mysqlEnum("postType", ["opinion"]).notNull(),
  postId: int("postId").notNull(),
  content: text("content").notNull(),
  reason: text("reason"),
  deletedBy: int("deletedBy"),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
});

export type DeletionLog = typeof deletionLogs.$inferSelect;
export type InsertDeletionLog = typeof deletionLogs.$inferInsert;

/**
 * University's stated position on a category of student opinions.
 * Tied to a category (not individual opinions) so the matching between
 * student voice and institutional response stays at the coarse,
 * disclosable granularity of category design rather than an arbitrary
 * per-opinion pairing.
 */
export const universityViews = mysqlTable("university_views", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  body: text("body").notNull(), // 大学側の課題認識・制約の説明
  responseStatus: mysqlEnum("responseStatus", ["answered", "checking", "cannot_answer"])
    .default("checking")
    .notNull(),
  reason: text("reason"), // cannot_answer のとき必須（構造上の制約と動かせる余地）
  approvalStatus: mysqlEnum("approvalStatus", ["draft", "published"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UniversityView = typeof universityViews.$inferSelect;
export type InsertUniversityView = typeof universityViews.$inferInsert;
