import { drizzle } from "drizzle-orm/mysql2";
import { categories } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const initialCategories = [
  { name: "学生生活", description: "キャンパスライフ、施設、サービスに関する意見" },
  { name: "授業・カリキュラム", description: "授業内容、教育方法、カリキュラムに関する意見" },
  { name: "課外活動", description: "サークル、イベント、ボランティアに関する意見" },
  { name: "キャリア・就職", description: "就職支援、インターンシップに関する意見" },
  { name: "その他", description: "その他の意見・提案" },
];

async function seed() {
  console.log("Seeding categories...");
  
  for (const category of initialCategories) {
    await db.insert(categories).values(category);
    console.log(`Added category: ${category.name}`);
  }
  
  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
