import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function About() {
  const { t, language } = useLanguage();

  const content = {
    ja: {
      title: "サイトについて",
      purpose: {
        heading: "サイトの目的",
        content:
          "本サイトは、叡啓大学の学生を主な対象として、学内に関する意見を匿名で投稿・共有することを目的とした掲示板型サイトです。本サイトは、特定の個人や団体を攻撃する場ではなく、学内の課題や提案を可視化することを目的としています。",
      },
      ai: {
        heading: "AIの利用について",
        content1:
          "本サイトでは、投稿内容の分析・分類・評価等に人工知能（AI）は使用していません。投稿された内容は、そのままの形で表示・集計されます。",
        content2:
          "投稿は原則、管理者承認後に公開されます。",
        content3:
          "なお、本サイトの開発・保守の過程においては、開発者がコード作成や修正の補助としてAIツールを利用する場合がありますが、利用者の投稿データが開発用AIに送信されることはありません。",
      },
      prohibited: {
        heading: "禁止事項と対応",
        intro: "以下の内容を含む投稿は禁止します。",
        items: [
          "特定の個人が識別できる情報（氏名・連絡先・住所等）",
          "個人や団体への誹謗中傷、差別的・侮辱的表現",
          "特定の属性（人種・性別・宗教・性的指向等）に基づくヘイトスピーチ",
          "自傷・自殺・摂食障害を助長・美化する内容",
          "過激な暴力・流血等のグラフィック表現",
          "薬物・危険物の乱用を促す内容",
          "違法行為の実行を煽動・指示する内容",
        ],
        action:
          "これらに該当すると判断された投稿は、事前の通知なく非表示または削除される場合があります。",
      },
      age: {
        heading: "利用対象年齢",
        content: "本サービスは、原則として18歳以上の利用を想定しています。",
      },
      management: {
        heading: "運営・管理について",
        content1:
          "本サイトは、叡啓大学の学生有志により運営されています。",
        content2:
          "投稿内容の非表示・削除等は、運営方針に基づき管理者が行います。",
      },
      disclaimer: {
        heading: "補足",
        content1:
          "本サイトは大学の公式な意思決定機関ではありません。",
        content2:
          "掲載内容や投票結果は、大学の方針や決定を示すものではありません。",
      },
      appeals: {
        heading: "非表示・削除に対する異議申し立て",
        content:
          "投稿が非表示または削除された場合で、対応に誤りがあると思われる場合は、以下のメールアドレスまでご連絡ください。投稿IDと理由を記載のうえお送りいただければ、運営が内容を確認し、適切に対応します。",
      },
      contact: {
        heading: "お問い合わせ・問題の報告",
        content:
          "不適切な投稿の報告、本サイトの内容・運営に関するお問い合わせは、以下のメールアドレスまでお願いします。",
        email: "ekvoice0@gmail.com",
        note: "（本サイトに関するお問い合わせ専用）",
      },
      back: "ホームに戻る",
    },
    en: {
      title: "About This Site",
      purpose: {
        heading: "Purpose of This Site",
        content:
          "This site is a bulletin board platform primarily for students of Eikei University to anonymously post and share opinions about campus matters. It is not a place to attack specific individuals or groups, but rather to visualize campus issues and proposals.",
      },
      ai: {
        heading: "Use of AI",
        content1:
          "This site does not use artificial intelligence (AI) for analyzing, classifying, or evaluating posted content. Posted content is displayed and aggregated as-is.",
        content2:
          "Posts are generally published after administrator approval.",
        content3:
          "During the development and maintenance of this site, developers may use AI tools to assist with code creation and modification, but user-posted data is never sent to development AI systems.",
      },
      prohibited: {
        heading: "Prohibited Content and Actions",
        intro: "Posts containing the following are prohibited:",
        items: [
          "Information that can identify specific individuals (name, contact details, address, etc.)",
          "Defamatory or insulting expressions toward individuals or groups",
          "Hate speech based on specific attributes (race, gender, religion, sexual orientation, etc.)",
          "Content that promotes, glorifies, or instructs self-harm, suicide, or eating disorders",
          "Extremely graphic depictions of violence or gore",
          "Content that encourages drug misuse or use of dangerous substances",
          "Content that incites or instructs illegal activities",
        ],
        action:
          "Posts deemed to fall under these categories may be hidden or deleted without prior notice.",
      },
      age: {
        heading: "Target Age",
        content: "This service is intended for users aged 18 and above.",
      },
      management: {
        heading: "Management and Administration",
        content1:
          "This site is operated by student volunteers from Eikei University.",
        content2:
          "Hiding or deleting posted content is performed by administrators based on operational policies.",
      },
      disclaimer: {
        heading: "Disclaimer",
        content1:
          "This site is not an official decision-making body of the university.",
        content2:
          "The content and voting results posted on this site do not represent the university's policies or decisions.",
      },
      appeals: {
        heading: "Appeals for Hidden or Deleted Posts",
        content:
          "If your post was hidden or deleted and you believe this was an error, please contact us at the email address below. Include your post ID and the reason for your appeal. Our team will review the matter and respond appropriately.",
      },
      contact: {
        heading: "Contact & Report Harmful Content",
        content:
          "To report inappropriate content or for general inquiries about this site, please contact us at the following email address:",
        email: "ekvoice0@gmail.com",
        note: "(For inquiries related to this site only)",
      },
      back: "Back to Home",
    },
  };

  const text = content[language];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {text.back}
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-gray-900">{text.title}</h1>

        <div className="space-y-8">
          {/* サイトの目的 */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.purpose.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {text.purpose.content}
            </p>
          </section>

          {/* AIの利用について */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.ai.heading}
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed font-medium">
                {text.ai.content1}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {text.ai.content2}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {text.ai.content3}
              </p>
            </div>
          </section>

          {/* 禁止事項と対応 */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.prohibited.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {text.prohibited.intro}
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
              {text.prohibited.items.map((item, index) => (
                <li key={index} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed font-medium">
              {text.prohibited.action}
            </p>
          </section>

          {/* 利用対象年齢 */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.age.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed">{text.age.content}</p>
          </section>

          {/* 運営・管理について */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.management.heading}
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {text.management.content1}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {text.management.content2}
              </p>
            </div>
          </section>

          {/* 補足 */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.disclaimer.heading}
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {text.disclaimer.content1}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {text.disclaimer.content2}
              </p>
            </div>
          </section>

          {/* 異議申し立て */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.appeals.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {text.appeals.content}
            </p>
          </section>

          {/* お問い合わせ */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {text.contact.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {text.contact.content}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <a
                href={`mailto:${text.contact.email}`}
                className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {text.contact.email}
              </a>
              <p className="text-sm text-gray-600 mt-2">{text.contact.note}</p>
            </div>
          </section>
        </div>
      </motion.main>
    </div>
  );
}
