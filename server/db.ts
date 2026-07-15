import { eq, desc, and, sql, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users, opinions, votes, categories, anonymousUsers, deletionLogs, universityViews, InsertOpinion, InsertVote, InsertDeletionLog, InsertUniversityView } from "../drizzle/schema";

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


export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
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

export async function getOpinions(filters?: { categoryId?: number; isVisible?: boolean; userId?: number; approvalStatus?: string; excludeFeedbackCategories?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(opinions);

  const conditions = [];
  if (filters?.categoryId) conditions.push(eq(opinions.categoryId, filters.categoryId));
  if (filters?.isVisible !== undefined) conditions.push(eq(opinions.isVisible, filters.isVisible));
  if (filters?.userId) conditions.push(eq(opinions.userId, filters.userId));
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
  
  const passCounts = await db.select({ count: sql<number>`count(*)` })
    .from(votes)
    .where(and(eq(votes.opinionId, opinionId), eq(votes.voteType, "pass")));
  
  await db.update(opinions).set({
    agreeCount: Number(agreeCounts[0]?.count || 0),
    disagreeCount: Number(disagreeCounts[0]?.count || 0),
    passCount: Number(passCounts[0]?.count || 0),
  }).where(eq(opinions.id, opinionId));
}

// Vote queries
export async function createVote(vote: InsertVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(votes).values(vote);
}

export async function getUserVote(userId: number, opinionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.opinionId, opinionId)))
    .limit(1);
  
  return result[0];
}

export async function getAnonymousUserVote(anonymousUserId: number, opinionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(votes)
    .where(and(eq(votes.anonymousUserId, anonymousUserId), eq(votes.opinionId, opinionId)))
    .limit(1);
  
  return result[0];
}

export async function updateVote(id: number, voteType: "agree" | "disagree" | "pass") {
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


// Delete opinion
export async function deleteOpinion(opinionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First delete related votes
  await db.delete(votes).where(eq(votes.opinionId, opinionId));
  
  // Then delete the opinion
  await db.delete(opinions).where(eq(opinions.id, opinionId));
}
// University view queries (institutional response, tied to a category)
export async function getPublishedUniversityViews() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(universityViews)
    .where(eq(universityViews.approvalStatus, "published"))
    .orderBy(desc(universityViews.updatedAt));
}

export async function getUniversityViewByCategoryId(categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(universityViews)
    .where(and(eq(universityViews.categoryId, categoryId), eq(universityViews.approvalStatus, "published")))
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

// Analytics
export async function getAnalyticsStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const notFeedbackOpinion = sql`(${opinions.categoryId} IS NULL OR ${opinions.categoryId} NOT IN (SELECT id FROM \`categories\` WHERE isFeedback = 1))`;
  const notFeedbackVote = sql`${votes.opinionId} NOT IN (SELECT id FROM \`opinions\` WHERE categoryId IN (SELECT id FROM \`categories\` WHERE isFeedback = 1))`;

  const [opinionAgg, voterCount, categoryStats, weeklyTrend, submitterCount] =
    await Promise.all([
      // Opinion aggregation — フィードバックカテゴリーを除外
      db.select({
        approved:     sql<number>`sum(case when ${opinions.approvalStatus}='approved' and ${opinions.isVisible}=1 then 1 else 0 end)`,
        pending:      sql<number>`sum(case when ${opinions.approvalStatus}='pending' then 1 else 0 end)`,
        totalVotes:   sql<number>`sum(case when ${opinions.approvalStatus}='approved' and ${opinions.isVisible}=1 then ${opinions.agreeCount} + ${opinions.disagreeCount} + ${opinions.passCount} else 0 end)`,
        totalAgree:   sql<number>`sum(case when ${opinions.approvalStatus}='approved' and ${opinions.isVisible}=1 then ${opinions.agreeCount} else 0 end)`,
        totalDisagree: sql<number>`sum(case when ${opinions.approvalStatus}='approved' and ${opinions.isVisible}=1 then ${opinions.disagreeCount} else 0 end)`,
        totalPass:    sql<number>`sum(case when ${opinions.approvalStatus}='approved' and ${opinions.isVisible}=1 then ${opinions.passCount} else 0 end)`,
      }).from(opinions).where(notFeedbackOpinion),

      // Unique voters — フィードバック意見への投票を除外
      db.select({ count: sql<number>`count(distinct ${votes.anonymousUserId})` })
        .from(votes)
        .where(and(isNotNull(votes.anonymousUserId), notFeedbackVote)),

      // Per-category breakdown（分布の俯瞰用。順位付けには使わない）— フィードバックカテゴリーを除外
      db.select({
        categoryId: opinions.categoryId,
        count:      sql<number>`count(*)`,
        totalVotes: sql<number>`sum(${opinions.agreeCount} + ${opinions.disagreeCount} + ${opinions.passCount})`,
        agreeSum:   sql<number>`sum(${opinions.agreeCount})`,
      })
        .from(opinions)
        .where(and(eq(opinions.approvalStatus, "approved"), eq(opinions.isVisible, true), notFeedbackOpinion))
        .groupBy(opinions.categoryId),

      // Weekly submission trend — フィードバック除外
      db.select({
        label: sql<string>`DATE_FORMAT(${opinions.createdAt}, '%m/%d')`,
        count: sql<number>`count(*)`,
      })
        .from(opinions)
        .where(and(sql`${opinions.createdAt} >= DATE_SUB(NOW(), INTERVAL 5 WEEK)`, notFeedbackOpinion))
        .groupBy(sql`DATE(${opinions.createdAt}), DATE_FORMAT(${opinions.createdAt}, '%m/%d')`)
        .orderBy(sql`DATE(${opinions.createdAt})`),

      // Unique submitters — フィードバック除外
      db.select({ count: sql<number>`count(distinct ${opinions.anonymousUserId})` })
        .from(opinions)
        .where(and(isNotNull(opinions.anonymousUserId), notFeedbackOpinion)),
    ]);

  const allCategories = await db.select().from(categories);
  const categoryNameMap = new Map(allCategories.map(c => [c.id, c.name]));

  const totalVotes = Number(opinionAgg[0]?.totalVotes || 0);
  const totalAgree = Number(opinionAgg[0]?.totalAgree || 0);
  const totalDisagree = Number(opinionAgg[0]?.totalDisagree || 0);
  const totalPass = Number(opinionAgg[0]?.totalPass || 0);
  const approvedOpinions = Number(opinionAgg[0]?.approved || 0);

  return {
    opinions: {
      total: approvedOpinions,
      pending: Number(opinionAgg[0]?.pending || 0),
    },
    uniqueVoters: Number(voterCount[0]?.count || 0),
    uniqueSubmitters: Number(submitterCount[0]?.count || 0),
    votes: {
      total: totalVotes,
      agree: totalAgree,
      disagree: totalDisagree,
      pass: totalPass,
    },
    avgAgreeRate: totalVotes > 0 ? Math.round((totalAgree / totalVotes) * 100) : 0,
    categoryBreakdown: categoryStats
      .map(c => ({
        category: categoryNameMap.get(c.categoryId ?? 0) || "未分類",
        count: Number(c.count),
        totalVotes: Number(c.totalVotes),
        agreeRate: Number(c.totalVotes) > 0
          ? Math.round((Number(c.agreeSum) / Number(c.totalVotes)) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count),
    weeklyTrend: weeklyTrend.map(w => ({
      label: w.label,
      count: Number(w.count),
    })),
  };
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

