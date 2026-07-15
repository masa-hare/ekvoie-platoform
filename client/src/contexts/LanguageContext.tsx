import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { siteConfig } from "@/siteConfig";

type Language = "en" | "ja";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    "nav.admin": "Admin",
    
    // Home page
    "home.title": "Making Student Voices Visible",
    "home.tagline": "A platform that visualizes problem awareness and opinion trends on campus through posts and voting.",
    "home.description": `A place where ${siteConfig.memberTerm.en}' opinions are visualized and placed alongside the university's own understanding of the issues, in order to narrow the information gap between the two. Opinions can be responded to with 'Agree / Disagree / Pass' — a signal of resonance, not a vote to rank or select a winner.`,
    "home.viewOpinions": "View Opinions",
    "home.submitOpinion": "Submit Opinion",
    "home.analytics": "Analytics",
    "home.howItWorks": "How It Works →",
    
    // Submit Opinion page
    "submitOpinion.error": "Failed to submit opinion",
    "submitOpinion.fillAllFields": "Please fill in all fields",
    "submitOpinion.textTooLong": "Text exceeds 500 characters",
    "submitOpinion.warning1": "Posts that name and criticize specific individuals or organizations, or that constitute defamation, are subject to removal by administrators.",
    "submitOpinion.warning2": "This platform aims to collect constructive opinions regarding systems and environments.",
    "submitOpinion.warning3": "Do NOT include personal information (email addresses, phone numbers, etc.). Such content is automatically blocked and cannot be submitted.",
    "submit.title": "Submit Opinion",
    "submit.textInput": "Text Input",
    "submit.category": "Category",
    "submit.selectCategory": "Select Category",
    "submit.problemStatement": "Problem Statement",
    "submit.problemPlaceholder": "When/Where/Who is experiencing this problem? (e.g., 'Popular menu items sell out early, leaving students with late classes with very limited choices.')",
    "submit.yourSolution": "Your Opinion",
    "submit.solutionNote": "Describe the problem or concern in your own words.",
    "submit.solutionExample": "Example: 'Popular menu items sell out early, leaving students with late classes very few options.'",
    "submit.characters": "characters",
    "submit.submitButton": "Submit Opinion",
    "submit.submitting": "Submitting...",
    
    // Opinions page
    "opinions.title": "Opinions",
    "opinions.all": "All",
    "opinions.noOpinions": "No opinions yet",
    "opinions.agree": "Agree",
    "opinions.disagree": "Disagree",
    "opinions.pass": "Pass",
    "opinions.voteSuccess": "Vote recorded!",
    "opinions.voteError": "Failed to vote",
    
    // How It Works page
    "howItWorks.title": "How It Works",
    "howItWorks.step1Title": "01 / PROBLEM",
    "howItWorks.step1Subtitle": "Identify the Problem",
    "howItWorks.step1Desc": "Students describe problems occurring on campus, focusing on 'when/where/who is affected' in one concise sentence. Example: 'Popular menu items sell out early, leaving students with late classes with very limited choices.'",
    "howItWorks.step2Title": "02 / VOTE",
    "howItWorks.step2Subtitle": "React with Agree / Disagree / Pass",
    "howItWorks.step2Desc": "Posts are published immediately after passing an automatic content filter. Other students can react with Agree, Disagree, or Pass — a signal of how widely a concern resonates, not a vote that ranks opinions or picks a winner.",
    "howItWorks.step3Title": "03 / CONTRAST",
    "howItWorks.step3Subtitle": "See It Alongside the University's View",
    "howItWorks.step3Desc": "In the by-category view, student opinions are shown side by side with the university's own understanding of the issue for that category — answered, still being checked, or not answerable right now (with the reason why). The site does not interpret what the comparison means; that's left to you.",
    "howItWorks.step4Title": "04 / TRANSPARENCY",
    "howItWorks.step4Subtitle": "Ensure Transparency",
    "howItWorks.step4Desc": "Posts are published immediately after passing an automatic content filter that blocks personal information and harmful language. Administrators read all posts and may hide or delete content that is defamatory or violates community guidelines. This site is committed to keeping the distribution of campus opinions and issues verifiable by users.",
    "howItWorks.processTitle": "OPINION → VOTE\n→ CONTRAST",
    "howItWorks.processSubtitle": "From Submission to Contrast",
    "howItWorks.processDesc": "Students submit an opinion. Others can react with Agree, Disagree, or Pass — visualizing resonance, not ranking opinions. In the by-category view, opinions sit alongside the university's own view of the same issue.",
    "howItWorks.frontend": "Frontend",
    "howItWorks.backend": "Backend",
    "howItWorks.keyFeatures": "Key Features",
    "howItWorks.anonymity": "Anonymity",
    "howItWorks.anonymityDesc": "Students can post opinions anonymously, promoting honest feedback.",
    "howItWorks.realtime": "Real-time",
    "howItWorks.realtimeDesc": "Voting results are instantly aggregated and visualized on the dashboard.",
    "howItWorks.startContributing": "Start Contributing",
    
    // Admin page
    "admin.title": "Admin Panel",
    "admin.managePlatform": "Manage Platform",
    "admin.exportCsv": "Export CSV",
    "admin.totalOpinions": "Total Opinions",
    "admin.visible": "Visible",
    "admin.hidden": "Hidden",
    "admin.hide": "Hide",
    "admin.show": "Show",
    "admin.moderateSuccess": "Opinion visibility updated",
    "admin.moderateError": "Failed to moderate opinion",
    "admin.exportSuccess": "Data exported successfully",
    "admin.delete": "Delete",
    "admin.deleteSuccess": "Opinion deleted successfully",
    "admin.deleteError": "Failed to delete opinion",
    "admin.deleteConfirmTitle": "Delete Opinion",
    "admin.deleteConfirmDescription": "Are you sure you want to delete this opinion? This action cannot be undone.",
    "admin.approveSuccess": "Opinion approved successfully",
    "admin.approveError": "Failed to approve opinion",
    "admin.rejectSuccess": "Opinion rejected successfully",
    "admin.rejectError": "Failed to reject opinion",
    
    // Common
    "common.cancel": "Cancel",
  },
  ja: {
    // Navigation
    "nav.admin": "管理者",
    
    // Home page
    "home.title": "学生の声を、見える形に。",
    "home.tagline": "学内の問題意識や意見の傾向を、投稿と投票を通じて可視化するプラットフォーム。",
    "home.description": `${siteConfig.memberTerm.ja}の意見を可視化し、大学側の課題認識と並べて見えるようにすることで、両者の間の情報の非対称性を縮めるための場です。「賛成／反対／パス」の投票は、順位付けのためではなく、共感の度合いを可視化する信号として位置づけています。`,
    "home.viewOpinions": "意見を見る",
    "home.submitOpinion": "意見を投稿",
    "home.analytics": "分析",
    "home.howItWorks": "仕組みを見る →",
    
    // Submit Opinion page
    "submitOpinion.error": "投稿に失敗しました",
    "submitOpinion.fillAllFields": "すべてのフィールドを入力してください",
    "submitOpinion.textTooLong": "テキストが500文字を超えています",
    "submitOpinion.warning1": "特定の個人・団体を名指しした批判や、誹謗中傷に該当する投稿は管理者が削除します。",
    "submitOpinion.warning2": "本プラットフォームは、制度や環境に関する建設的な意見を集めることを目的としています。",
    "submitOpinion.warning3": "個人情報（メールアドレス・電話番号など）は自動的に検知されブロックされます。含めないでください。",
    "submit.title": "意見を投稿",
    "submit.textInput": "テキスト入力",
    "submit.category": "カテゴリー",
    "submit.selectCategory": "カテゴリーを選択",
    "submit.problemStatement": "問題文",
    "submit.problemPlaceholder": "いつ/どこで/誰が困っているかを1文で記述してください。（例：「人気メニューが早い時間帯に集中して売り切れるため、授業終了が遅い学生は選択肢が大きく制限されてしまう。」）",
    "submit.yourSolution": "あなたの意見",
    "submit.solutionNote": "学内で困っていること・気になっていることを、あなたの言葉で書いてください。",
    "submit.solutionExample": "例：「人気メニューが早い時間帯に売り切れてしまい、授業終了が遅い学生には選べる余地がほとんどない。」",
    "submit.characters": "文字",
    "submit.submitButton": "意見を投稿",
    "submit.submitting": "送信中...",
    
    // Opinions page
    "opinions.title": "意見一覧",
    "opinions.all": "すべて",
    "opinions.noOpinions": "まだ意見がありません",
    "opinions.agree": "賛成",
    "opinions.disagree": "反対",
    "opinions.pass": "パス",
    "opinions.voteSuccess": "投票を記録しました！",
    "opinions.voteError": "投票に失敗しました",
    
    // How It Works page
    "howItWorks.title": "仕組み",
    "howItWorks.step1Title": "01 / PROBLEM",
    "howItWorks.step1Subtitle": "問題を提起する",
    "howItWorks.step1Desc": "学生が、学内で生じている問題について、「いつ／どこで／誰が困っているか」を意識しながら、1文で簡潔に記述します。例：「人気メニューが早い時間帯に集中して売り切れるため、授業終了が遅い学生は選択肢が大きく制限されてしまう。」",
    "howItWorks.step2Title": "02 / VOTE",
    "howItWorks.step2Subtitle": "賛成・反対・パスで反応する",
    "howItWorks.step2Desc": "投稿は自動フィルターを通過すると即時公開されます。他の学生は「賛成・反対・パス」で反応できます。これは意見の優劣を決める投票ではなく、どれだけ広く共感されているかを示す信号です。",
    "howItWorks.step3Title": "03 / CONTRAST",
    "howItWorks.step3Subtitle": "大学の見解と並べて見る",
    "howItWorks.step3Desc": "カテゴリー別（対照）表示では、学生の意見と、そのカテゴリーに対する大学側の見解（回答済み・確認中・回答できない、のいずれか。理由つき）が並べて表示されます。この対照が何を意味するかの解釈は行いません。読む人に委ねられています。",
    "howItWorks.step4Title": "04 / TRANSPARENCY",
    "howItWorks.step4Subtitle": "透明性の確保",
    "howItWorks.step4Desc": "投稿は個人情報・有害表現を自動検知するフィルターを通過後、即時公開されます。管理者はすべての投稿に目を通し、誹謗中傷や公序良俗に反する内容を非表示または削除します。本サイトは、学内の意見や問題意識の分布が利用者にとって確認可能な状態を保つことを重視しています。",
    "howItWorks.processTitle": "OPINION → VOTE\n→ CONTRAST",
    "howItWorks.processSubtitle": "投稿から対照表示までの流れ",
    "howItWorks.processDesc": "学生が意見を投稿します。他の学生は賛成・反対・パスで反応できますが、これは共感の可視化であり、意見の順位付けではありません。カテゴリー別表示では、大学側の見解と並べて確認できます。",
    "howItWorks.frontend": "フロントエンド",
    "howItWorks.backend": "バックエンド",
    "howItWorks.keyFeatures": "主要機能",
    "howItWorks.anonymity": "匿名性",
    "howItWorks.anonymityDesc": "学生は匿名で意見を投稿でき、率直なフィードバックを促進します。",
    "howItWorks.realtime": "リアルタイム",
    "howItWorks.realtimeDesc": "投票結果は即座に集計され、ダッシュボードで可視化されます。",
    "howItWorks.startContributing": "投稿を始める",
    
    // Admin page
    "admin.title": "管理者パネル",
    "admin.managePlatform": "プラットフォーム管理",
    "admin.exportCsv": "CSVエクスポート",
    "admin.totalOpinions": "総意見数",
    "admin.visible": "表示中",
    "admin.hidden": "非表示",
    "admin.hide": "非表示",
    "admin.show": "表示",
    "admin.moderateSuccess": "意見の表示状態を更新しました",
    "admin.moderateError": "モデレーションに失敗しました",
    "admin.exportSuccess": "データをエクスポートしました",
    "admin.delete": "削除",
    "admin.deleteSuccess": "意見を削除しました",
    "admin.deleteError": "削除に失敗しました",
    "admin.deleteConfirmTitle": "意見を削除",
    "admin.deleteConfirmDescription": "この意見を削除してもよろしいですか？この操作は取り消すことができません。",
    "admin.approveSuccess": "意見を承認しました",
    "admin.approveError": "承認に失敗しました",
    "admin.rejectSuccess": "意見を却下しました",
    "admin.rejectError": "却下に失敗しました",
    
    // Common
    "common.cancel": "キャンセル",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "en" || saved === "ja") ? saved : "ja";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ja] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
