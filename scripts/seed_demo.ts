import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import { categories, opinions, themes, universityViews } from "../drizzle/schema.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const url = new URL(databaseUrl.replace(/^mysql:\/\//, "http://"));
const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
});
const db = drizzle(pool);

// Clearly labelled sample content for checking the contrast-view layout.
// It intentionally creates no votes, so the demo does not resemble real support.
const samples = [
  ["自習スペースの混雑", "試験前は静かに作業できる席がすぐ埋まり、空席の場所も分かりにくい。", "checking", "利用状況を把握し、混雑の見える化を準備しています。"],
  ["図書館の開館時間", "平日の授業後にも使えるよう、試験期間だけでも開館時間を延ばしてほしい。", "cannot_answer", "現在の大学の事情では、常時の延長には人員配置の調整が必要です。ただし試験期間の延長開館は検討できる範囲です。"],
  ["食堂の混雑", "昼休みは列が長く、次の授業までに食事を取れないことがある。", "answered", "混雑する時間帯は認識しています。メニュー表示と提供導線を見直し、待ち時間を減らせないか確認します。"],
  ["履修情報の分かりやすさ", "履修登録の締切や必修の条件が複数のページに分かれていて確認しづらい。", "answered", "案内が分散している点を把握しています。次年度の履修案内では、必要な情報を一つの導線にまとめる方法を検討します。"],
  ["授業資料へのアクセス", "授業ごとに資料の置き場所が違い、欠席後に追いつくのが難しい。", "checking", "授業ごとの運用差を確認中です。共通の案内方法を示せるか、担当教員と相談します。"],
  ["学生相談の入口", "困ったときに、どこへ相談すればよいかが最初に分かりにくい。", "answered", "相談窓口の案内が見つけにくいという声を受けています。入口となる案内ページと学内掲示の整理を進めます。"],
  ["課外活動の情報", "新しく参加できるサークルやイベントを探す場所がまとまっていない。", "checking", "情報の掲載先が分かれている状況を確認しています。既存の発信をまとめる方法を検討します。"],
  ["キャリア相談の予約", "就職相談の予約枠が自分の授業時間と合わないことがある。", "cannot_answer", "現在の大学の事情では、相談担当の配置をすぐに増やすことは難しいです。ただしオンライン相談や時間帯の調整余地を確認します。"],
  ["学内Wi-Fi", "特定の教室では接続が不安定で、授業中の資料閲覧に支障が出る。", "answered", "接続状況の報告を受けています。該当場所の通信状況を確認し、設備業者と対応方法を検討します。"],
  ["大学からの連絡", "大事な連絡がメール・ポータル・チャットに分かれ、見落としやすい。", "checking", "連絡経路が複数あることは認識しています。緊急度ごとの使い分けを分かりやすく示せるか検討中です。"],
] as const;

async function seed() {
  const availableCategories = await db.select().from(categories).where(eq(categories.isFeedback, false));
  if (availableCategories.length === 0) throw new Error("No non-feedback categories found");

  let created = 0;
  for (const [index, [title, opinionText, responseStatus, explanation]] of samples.entries()) {
    const category = availableCategories[index % availableCategories.length];
    const demoTitle = `【デモ】${title}`;
    const existing = await db.select().from(themes).where(eq(themes.title, demoTitle)).limit(1);
    if (existing[0]) continue;

    const themeResult = await db.insert(themes).values({ categoryId: category.id, title: demoTitle });
    const themeId = Number((themeResult as any)[0].insertId);
    await db.insert(opinions).values({
      categoryId: category.id,
      themeId,
      problemStatement: "【デモ表示】学生の意見の見え方を確認するためのサンプルです。",
      transcription: opinionText,
      approvalStatus: "approved",
      isVisible: true,
      isModerated: false,
      agreeCount: 0,
      disagreeCount: 0,
      language: "ja",
    });
    await db.insert(universityViews).values({
      themeId,
      body: `【デモ表示】${explanation}`,
      responseStatus,
      reason: responseStatus === "cannot_answer" ? `【デモ表示】${explanation}` : null,
      approvalStatus: "published",
    });
    created += 1;
  }
  console.log(`Created ${created} demo themes, opinions, and university views.`);
}

seed().then(() => pool.end()).catch(error => { console.error(error); process.exit(1); });
