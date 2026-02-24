import mysql from "mysql2/promise";

const conn = await mysql.createConnection(
  "mysql://svp_user:svp_local_pass@localhost:3306/student_voice"
);

const steps = [
  // === 新規テーブル ===
  `CREATE TABLE IF NOT EXISTS \`anonymous_users\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`uuid\` varchar(36) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`lastSeenAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    \`expiresAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`anonymous_users_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`anonymous_users_uuid_unique\` UNIQUE(\`uuid\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`solutions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`opinionId\` int NOT NULL,
    \`title\` varchar(200) NOT NULL,
    \`description\` text NOT NULL,
    \`createdBy\` int,
    \`anonymousUserId\` int,
    \`approvalStatus\` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    \`isVisible\` boolean NOT NULL DEFAULT true,
    \`supportCount\` int NOT NULL DEFAULT 0,
    \`opposeCount\` int NOT NULL DEFAULT 0,
    \`passCount\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`solutions_id\` PRIMARY KEY(\`id\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`solution_votes\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`solutionId\` int NOT NULL,
    \`anonymousUserId\` int NOT NULL,
    \`voteType\` enum('support','oppose','pass') NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`solution_votes_id\` PRIMARY KEY(\`id\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`deletion_logs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`postType\` enum('opinion','solution') NOT NULL,
    \`postId\` int NOT NULL,
    \`content\` text NOT NULL,
    \`reason\` text,
    \`deletedBy\` int,
    \`deletedAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`deletion_logs_id\` PRIMARY KEY(\`id\`)
  )`,

];

// ALTER TABLE ステートメント (列が存在しない場合のみ実行)
const alterSteps = [
  ["opinions",      "anonymousUserId", "int"],
  ["opinions",      "problemStatement", "text"],
  ["opinions",      "approvalStatus",   "enum('pending','approved','rejected') NOT NULL DEFAULT 'pending'"],
  ["votes",         "anonymousUserId",  "int"],
  ["opinion_groups","themeJa",          "varchar(200)"],
  ["opinion_groups","themeEn",          "varchar(200)"],
  ["opinion_groups","summaryJa",        "text"],
  ["opinion_groups","summaryEn",        "text"],
  ["opinion_groups","sentiment",        "enum('positive','negative','neutral','mixed') NOT NULL DEFAULT 'neutral'"],
  ["opinion_groups","opinionCount",     "int NOT NULL DEFAULT 0"],
];

for (const sql of steps) {
  const label = sql.match(/`(\w+)`/)?.[1] ?? sql.slice(0, 60);
  try {
    await conn.query(sql);
    console.log("✓", label);
  } catch (e) {
    console.error("✗", label, "→", e.message);
  }
}

// ALTER TABLE: 列が既に存在するかチェックしてから追加
for (const [table, column, type] of alterSteps) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'student_voice' AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length > 0) {
    console.log("- skip (already exists):", table, column);
    continue;
  }
  try {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}`);
    console.log("✓ ALTER", table, column);
  } catch (e) {
    console.error("✗ ALTER", table, column, "→", e.message);
  }
}

await conn.end();
console.log("\nDone.");
