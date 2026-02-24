import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    "home.description": "A bulletin board where Eikei students' opinions are collected and can be responded to with 'Agree / Disagree / Pass.' The opinions and voting results gathered on this site are intended to be used as material for discussions and considerations within the university.",
    "home.viewOpinions": "View Opinions",
    "home.submitOpinion": "Submit Opinion",
    "home.analytics": "Analytics",
    "home.howItWorks": "How It Works →",
    
    // Submit Opinion page
    "submitOpinion.error": "Failed to submit opinion",
    "submitOpinion.fillAllFields": "Please fill in all fields",
    "submitOpinion.textTooLong": "Text exceeds 500 characters",
    "submitOpinion.warning1": "Posts that name and criticize specific individuals or organizations, or that constitute defamation, cannot be published.",
    "submitOpinion.warning2": "This platform aims to collect constructive opinions regarding systems and environments.",
    "submitOpinion.warning3": "Do NOT include personal information (email addresses, phone numbers, student IDs). Posts containing personal information may be hidden or deleted by administrators.",
    "submit.title": "Submit Opinion",
    "submit.textInput": "Text Input",
    "submit.category": "Category",
    "submit.selectCategory": "Select Category",
    "submit.problemStatement": "Problem Statement",
    "submit.problemPlaceholder": "When/Where/Who is experiencing this problem? (e.g., 'Popular menu items sell out early, leaving students with late classes with very limited choices.')",
    "submit.yourSolution": "Your Proposed Solution",
    "submit.solutionNote": "Please describe a solution that the university can implement.",
    "submit.solutionExample": "Example: 'Introduce a pre-order system (morning deadline) for popular items instead of limited quantities.'",
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
    "howItWorks.step2Title": "02 / SOLUTION",
    "howItWorks.step2Subtitle": "Propose Solutions",
    "howItWorks.step2Desc": "For the identified problems, students propose 'solutions that the university could feasibly implement.' Proposed solutions are reviewed by administrators before being published for voting. Example: 'Introduce a pre-order system (morning deadline) for some popular items instead of limited quantities.'",
    "howItWorks.step3Title": "03 / VOTE",
    "howItWorks.step3Subtitle": "Visualize Opinions through Voting",
    "howItWorks.step3Desc": "Users vote on proposed problems and solutions with 'Agree/Disagree/Pass.' Voting results are displayed as percentages, visualizing which opinions are supported and to what extent.",
    "howItWorks.step4Title": "04 / TRANSPARENCY",
    "howItWorks.step4Subtitle": "Ensure Transparency",
    "howItWorks.step4Desc": "If content is judged to be defamatory or violate public order and morals, it may be hidden or deleted at the administrator's discretion. Other posts are published as a rule and displayed in a form accessible to everyone. This site emphasizes maintaining a state where the distribution of opinions and problem awareness on campus is verifiable to users.",
    "howItWorks.processTitle": "PROBLEM → SOLUTION\nSOLUTION → VOTE",
    "howItWorks.processSubtitle": "Process from Problem Identification to Voting",
    "howItWorks.processDesc": "Students identify problems and propose solutions. Participants can vote with agree, disagree, or pass, and the distribution of opinions is visualized. Posts, proposals, and voting results are shared within the site, allowing users to see trends in campus interests and opinions.",
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
    "home.description": "叡啓生の意見を集め、「賛成／反対／パス」で反応できる掲示板です。本サイトに集まった意見や投票結果は、学内での議論や検討の材料として活用されることを想定しています。",
    "home.viewOpinions": "意見を見る",
    "home.submitOpinion": "意見を投稿",
    "home.analytics": "分析",
    "home.howItWorks": "仕組みを見る →",
    
    // Submit Opinion page
    "submitOpinion.error": "投稿に失敗しました",
    "submitOpinion.fillAllFields": "すべてのフィールドを入力してください",
    "submitOpinion.textTooLong": "テキストが500文字を超えています",
    "submitOpinion.warning1": "特定の個人・団体を名指しした批判や、誹謗中傷に該当する投稿は掲載できません。",
    "submitOpinion.warning2": "本プラットフォームは、制度や環境に関する建設的な意見を集めることを目的としています。",
    "submitOpinion.warning3": "個人特定情報（メールアドレス、電話番号、学籍番号など）を絶対に記載しないでください。個人情報を含む投稿は、管理者によって非表示または削除される場合があります。",
    "submit.title": "意見を投稿",
    "submit.textInput": "テキスト入力",
    "submit.category": "カテゴリー",
    "submit.selectCategory": "カテゴリーを選択",
    "submit.problemStatement": "問題文",
    "submit.problemPlaceholder": "いつ/どこで/誰が困っているかを1文で記述してください。（例：「人気メニューが早い時間帯に集中して売り切れるため、授業終了が遅い学生は選択肢が大きく制限されてしまう。」）",
    "submit.yourSolution": "あなたが考える解決策",
    "submit.solutionNote": "大学が実行できる解決策を記入してください。",
    "submit.solutionExample": "例：「人気メニューは数量限定ではなく、事前予約制（当日午前締切）を一部導入する。」",
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
    "howItWorks.step2Title": "02 / SOLUTION",
    "howItWorks.step2Subtitle": "解決策を提案する",
    "howItWorks.step2Desc": "提起された問題に対して、学生が「大学側が実行可能だと考えられる解決策」を提案します。提案された解決策は、管理者が内容を確認したうえで、投票対象として公開されます。例：「人気メニューについて、一部を数量限定ではなく、事前予約制（当日午前締切）とする。」",
    "howItWorks.step3Title": "03 / VOTE",
    "howItWorks.step3Subtitle": "投票で意見を可視化",
    "howItWorks.step3Desc": "提案された問題や解決策に対して、利用者が「賛成／反対／パス」で投票します。投票結果は割合（％）で表示され、どのような意見がどの程度支持されているかが分かる形で可視化されます。",
    "howItWorks.step4Title": "04 / TRANSPARENCY",
    "howItWorks.step4Subtitle": "透明性の確保",
    "howItWorks.step4Desc": "投稿内容が、誹謗中傷や公序良俗に反すると判断された場合には、管理者の判断により非表示または削除されることがあります。それ以外の投稿については、原則として公開され、誰でも閲覧できる形で表示されます。本サイトは、学内の意見や問題意識の分布が利用者にとって確認可能な状態を保つことを重視しています。",
    "howItWorks.processTitle": "PROBLEM → SOLUTION\nSOLUTION → VOTE",
    "howItWorks.processSubtitle": "問題提起から投票までの仕組み",
    "howItWorks.processDesc": "学生が問題を提起し、解決策を提案します。参加者は賛成・反対・パスで投票でき、意見の分布が可視化されます。投稿・提案・投票結果はサイト内で共有され、学内の関心や意見の傾向を確認できます。",
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
