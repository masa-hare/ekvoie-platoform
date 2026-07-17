import { eq, desc, and, sql, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { anonymousUsers, opinions, votes, categories, deletionLogs, themes, universityViews, InsertOpinion, InsertVote, InsertDeletionLog, InsertTheme, InsertUniversityView } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}


// Opinion queries
export async function createOpinion(opinion: InsertOpinion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(opinions).values(opinion);
  // MySqlRawQueryResult is [ResultSetHeader, FieldPacket[]]
  const insertId = Number((result as any)[0].insertId);
  return { insertId };
}

export async function getOpinions(filters?: { categoryId?: number; themeId?: number; isVisible?: boolean; approvalStatus?: string; excludeFeedbackCategories?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(opinions);

  const conditions = [];
  if (filters?.categoryId) conditions.push(eq(opinions.categoryId, filters.categoryId));
  if (filters?.themeId) conditions.push(eq(opinions.themeId, filters.themeId));
  if (filters?.isVisible !== undefined) conditions.push(eq(opinions.isVisible, filters.isVisible));
  if (filters?.approvalStatus) conditions.push(eq(opinions.approvalStatus, filters.approvalStatus as any));
  if (filters?.excludeFeedbackCategories) {
    conditions.push(
      sql`(${opinions.categoryId} IS NULL OR ${opinions.categoryId} NOT IN (SELECT id FROM \`categories\` WHERE isFeedback = 1))`
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(desc(opinions.createdAt));
  return result;
}

export async function getOpinionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(opinions).where(eq(opinions.id, id)).limit(1);
  return result[0];
}

export async function updateOpinion(id: number, data: Partial<InsertOpinion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(opinions).set(data).where(eq(opinions.id, id));
}

export async function updateOpinionCounts(opinionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const agreeCounts = await db.select({ count: sql<number>`count(*)` })
    .from(votes)
    .where(and(eq(votes.opinionId, opinionId), eq(votes.voteType, "agree")));
  
  const disagreeCounts = await db.select({ count: sql<number>`count(*)` })
    .from(votes)
    .where(and(eq(votes.opinionId, opinionId), eq(votes.voteType, "disagree")));
  
  await db.update(opinions).set({
    agreeCount: Number(agreeCounts[0]?.count || 0),
    disagreeCount: Number(disagreeCounts[0]?.count || 0),
  }).where(eq(opinions.id, opinionId));
}

// Vote queries
export async function createVote(vote: InsertVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(votes).values(vote);
}

export async function getAnonymousUserVote(anonymousUserId: number, opinionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(votes)
    .where(and(eq(votes.anonymousUserId, anonymousUserId), eq(votes.opinionId, opinionId)))
    .limit(1);
  
  return result[0];
}

export async function updateVote(id: number, voteType: "agree" | "disagree") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(votes).set({ voteType }).where(eq(votes.id, id));
}

// Category queries
export async function getCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(name: string, description?: string, isFeedback?: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values({ name, description: description || null, isFeedback: isFeedback ?? false });
  return { insertId: Number((result as any)[0].insertId) };
}

export async function toggleCategoryFeedback(id: number, isFeedback: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories).set({ isFeedback }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categories).where(eq(categories.id, id));
}

export async function getCategoryUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [opinionCount] = await db.select({ count: sql<number>`count(*)` }).from(opinions).where(eq(opinions.categoryId, id));
  const [themeCount] = await db.select({ count: sql<number>`count(*)` }).from(themes).where(eq(themes.categoryId, id));
  return { opinions: Number(opinionCount?.count ?? 0), themes: Number(themeCount?.count ?? 0) };
}


// Delete opinion
export async function deleteOpinion(opinionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First delete related votes
  await db.delete(votes).where(eq(votes.opinionId, opinionId));
  
  // Then delete the opinion
  await db.delete(opinions).where(eq(opinions.id, opinionId));
}
// Themes are made and assigned by administrators only. No automatic/AI grouping.
export async function getThemes(categoryId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = db.select().from(themes);
  return categoryId
    ? await query.where(eq(themes.categoryId, categoryId)).orderBy(themes.createdAt)
    : await query.orderBy(themes.createdAt);
}

/**
 * Physically removes expired pseudonymous identifiers. Votes and posts remain
 * only as unlinked aggregate records, so they can no longer be tied to a
 * browser after the 30-day retention period.
 */
export async function purgeExpiredAnonymousData(now = new Date()) {
  const db = await getDb();
  if (!db) return { purged: 0 };

  const expired = await db
    .select({ id: anonymousUsers.id })
    .from(anonymousUsers)
    .where(lt(anonymousUsers.expiresAt, now));

  const ids = expired.map(row => row.id);
  if (!ids.length) return { purged: 0 };

  // No foreign keys are used in this legacy schema, so remove links before
  // deleting the identifiers themselves.
  for (const id of ids) {
    await db.update(opinions).set({ anonymousUserId: null }).where(eq(opinions.anonymousUserId, id));
    await db.update(votes).set({ anonymousUserId: null }).where(eq(votes.anonymousUserId, id));
  }
  await db.delete(anonymousUsers).where(lt(anonymousUsers.expiresAt, now));
  return { purged: ids.length };
}

export async function createTheme(theme: InsertTheme) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(themes).values(theme);
  return { insertId: Number((result as any)[0].insertId) };
}

export async function updateTheme(id: number, updates: Partial<InsertTheme>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(themes).set(updates).where(eq(themes.id, id));
}

export async function deleteTheme(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(opinions).set({ themeId: null }).where(eq(opinions.themeId, id));
  await db.delete(universityViews).where(eq(universityViews.themeId, id));
  await db.delete(themes).where(eq(themes.id, id));
}

// University views are explicitly linked to themes, never inferred from text.
export async function getPublishedUniversityViews() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(universityViews)
    .where(eq(universityViews.approvalStatus, "published"))
    .orderBy(desc(universityViews.updatedAt));
}

export async function getUniversityViewByThemeId(themeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(universityViews)
    .where(and(eq(universityViews.themeId, themeId), eq(universityViews.approvalStatus, "published")))
    .limit(1);

  return result[0] || null;
}

export async function getAllUniversityViews() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(universityViews).orderBy(desc(universityViews.updatedAt));
}

export async function createUniversityView(view: InsertUniversityView) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(universityViews).values(view);
  return { insertId: Number((result as any)[0].insertId) };
}

export async function updateUniversityView(id: number, updates: Partial<InsertUniversityView>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(universityViews).set(updates).where(eq(universityViews.id, id));
}

export async function deleteUniversityView(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(universityViews).where(eq(universityViews.id, id));
}

// Deletion log queries
export async function createDeletionLog(log: InsertDeletionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(deletionLogs).values(log);
}

export async function getDeletionLogs() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(deletionLogs).orderBy(desc(deletionLogs.deletedAt));
}

