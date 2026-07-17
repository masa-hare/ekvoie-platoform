import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Anonymous users identified by UUID stored in HttpOnly cookie
 * UUIDs expire after 30 days to minimize tracking and protect privacy
 */
export const anonymousUsers = mysqlTable("anonymous_users", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt").defaultNow().notNull(), // UUID expires after 30 days (default: now, updated on insert)
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
 * Student opinions. Posts are text-only so that the service does not retain
 * voice recordings or an unnecessary second copy of the same opinion.
 */
export const opinions = mysqlTable("opinions", {
  id: int("id").autoincrement().primaryKey(),
  // A short-lived pseudonymous ID used only to prevent duplicate votes.
  // It is cleared when the anonymous-user record expires.
  anonymousUserId: int("anonymousUserId"),
  categoryId: int("categoryId"),
  // A conservative, administrator-created grouping. NULL means ungrouped.
  themeId: int("themeId"),
  body: text("body").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", [
    "pending",
    "approved",
    "rejected",
  ])
    .default("pending")
    .notNull(),
  isModerated: boolean("isModerated").default(false).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  agreeCount: int("agreeCount").default(0).notNull(),
  disagreeCount: int("disagreeCount").default(0).notNull(),
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
  anonymousUserId: int("anonymousUserId"), // For anonymous users
  opinionId: int("opinionId").notNull(),
  voteType: mysqlEnum("voteType", ["agree", "disagree"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * Themes are created and assigned manually by administrators. No AI/LLM-based
 * grouping or automatic classification is used by this platform.
 */
export const themes = mysqlTable("themes", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = typeof themes.$inferInsert;

/**
 * Deletion logs for moderation transparency
 * Stores only non-content moderation metadata. It intentionally does not keep
 * a preview or copy of a deleted post.
 */
export const deletionLogs = mysqlTable("deletion_logs", {
  id: int("id").autoincrement().primaryKey(),
  postType: mysqlEnum("postType", ["opinion"]).notNull(),
  postId: int("postId").notNull(),
  reason: mysqlEnum("reason", [
    "personal_information",
    "harassment_or_hate",
    "threat_or_illegal_content",
    "off_topic_or_spam",
    "other_policy_violation",
  ]).notNull(),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
});

export type DeletionLog = typeof deletionLogs.$inferSelect;
export type InsertDeletionLog = typeof deletionLogs.$inferInsert;

/**
 * A minimal report submitted by a reader. It intentionally contains no
 * reporter identifier, free text, IP address, or copy of the post body.
 */
export const opinionReports = mysqlTable("opinion_reports", {
  id: int("id").autoincrement().primaryKey(),
  opinionId: int("opinionId").notNull(),
  reason: mysqlEnum("reason", [
    "personal_information",
    "harassment_or_hate",
    "threat_or_illegal_content",
    "other_policy_violation",
  ]).notNull(),
  status: mysqlEnum("status", ["open", "reviewed", "dismissed"])
    .default("open")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OpinionReport = typeof opinionReports.$inferSelect;
export type InsertOpinionReport = typeof opinionReports.$inferInsert;

/**
 * A university-confirmed current explanation/view for a manually-created theme.
 * This is not an official decision, commitment, or automated interpretation.
 */
export const universityViews = mysqlTable("university_views", {
  id: int("id").autoincrement().primaryKey(),
  themeId: int("themeId").notNull(),
  body: text("body").notNull(), // 大学側の課題認識・制約の説明
  responseStatus: mysqlEnum("responseStatus", [
    "answered",
    "checking",
    "cannot_answer",
  ])
    .default("checking")
    .notNull(),
  reason: text("reason"), // cannot_answer のとき必須（構造上の制約と動かせる余地）
  approvalStatus: mysqlEnum("approvalStatus", ["draft", "published"])
    .default("draft")
    .notNull(),
  // An optional operational checkpoint, not a promise or deadline.
  nextReviewAt: timestamp("nextReviewAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UniversityView = typeof universityViews.$inferSelect;
export type InsertUniversityView = typeof universityViews.$inferInsert;
