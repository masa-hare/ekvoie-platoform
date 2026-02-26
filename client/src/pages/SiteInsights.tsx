import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { siteConfig } from "@/siteConfig";
import { useState } from "react";

/** 専門用語の解説エントリー */
type GlossaryEntry = { term: string; simple: string; detail: string };

function GlossaryCard({ entry }: { entry: GlossaryEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-2 border-black p-3">
      <button
        className="w-full text-left flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-black text-sm">{entry.term}</span>
        <span className="text-xs font-bold text-gray-500 ml-2 shrink-0">
          {open ? "▲ 閉じる" : "▼ 詳しく"}
        </span>
      </button>
      <p className="text-sm text-gray-700 mt-1">{entry.simple}</p>
      {open && (
        <p className="text-xs text-gray-500 mt-2 border-t border-gray-200 pt-2 leading-relaxed">
          {entry.detail}
        </p>
      )}
    </div>
  );
}

export default function SiteInsights() {
  const { language } = useLanguage();
  const ja = language === "ja";

  const glossary: GlossaryEntry[] = ja
    ? [
        {
          term: "オープンソース（Open Source）",
          simple: "プログラムの設計図を誰でも見られる・使える・改変できるように公開すること。",
          detail:
            "ソフトウェアは「コード」と呼ばれる指示書で動いています。オープンソースとは、その指示書をインターネット上に公開し、誰でも確認・複製・改変できる状態にすることです。料理で例えるなら「レシピを公開している」ようなイメージです。",
        },
        {
          term: "フロントエンド（Frontend）",
          simple: "あなたが実際に見ている画面（デザイン・ボタン・文字など）を担当する部分。",
          detail:
            "Webサイトを「お店」にたとえると、フロントエンドは「店頭・陳列棚・レジ画面」にあたります。React・TypeScript・Tailwind CSS というツールで作られています。",
        },
        {
          term: "バックエンド（Backend）",
          simple: "投稿の保存・集計など、裏側でデータを処理するプログラムの部分。",
          detail:
            "同じくお店にたとえると「在庫管理・経理・倉庫」にあたります。Node.js（JavaScript実行環境）と Express（サーバー構築ツール）で作られています。",
        },
        {
          term: "データベース（Database）",
          simple: "意見・投票・カテゴリーなどのデータを保存しておく「棚」のようなもの。",
          detail:
            "Excelの表のような構造でデータを管理するシステムです。本サイトでは MySQL を使用しています。データベースがないと、ページを再読み込みするたびに投稿が消えてしまいます。",
        },
        {
          term: "tRPC",
          simple: "フロントエンドとバックエンドが安全・効率的に情報をやりとりするための仕組み。",
          detail:
            "画面とサーバーの「電話回線」のようなものです。型安全（データの形が崩れない）という特徴があり、バグを事前に防ぎやすくなっています。",
        },
        {
          term: "ホスティング / Railway",
          simple: "サイトをインターネット上で動かし続けるためのサービス。",
          detail:
            "Webサイトは誰かのコンピューター（サーバー）上で常時動いている必要があります。本サイトは Railway というクラウドサービス上で動作しており、24時間365日アクセス可能な状態を維持しています。",
        },
        {
          term: "匿名認証（Anonymous Auth）",
          simple: "ログインしなくても投稿・投票ができる仕組み。ただし同じ人が二重投票しないよう管理もしている。",
          detail:
            "ブラウザに「匿名ID」をCookieとして保存することで、アカウント登録なしで本人確認をしています。このIDは90日で失効し、個人を特定できる情報は一切含まれていません。",
        },
        {
          term: "GitHub",
          simple: "プログラムのコードを保存・共有・共同編集するためのウェブサービス。",
          detail:
            "Gitというバージョン管理システムを使ってコードの変更履歴を管理するサービスです。本サイトのコードはGitHubで公開されており、誰でも閲覧・複製できます。",
        },
        {
          term: "MIT ライセンス",
          simple: "「自由に使っていいですよ」という許可証。商用・非商用問わず利用可能。",
          detail:
            "ソフトウェアの利用条件を定めた文書です。MITライセンスは最も自由度の高いライセンスの一つで、改変・再配布・商用利用が認められています。ただし「元の著作権表示を残すこと」という条件があります。",
        },
        {
          term: "レート制限（Rate Limiting）",
          simple: "短時間に大量の操作を繰り返すのを防ぐセキュリティの仕組み。",
          detail:
            "たとえば「1分間に投稿できるのは1回まで」のような制限です。これにより、プログラムを使った大量の不正投稿（スパム）を防いでいます。",
        },
        {
          term: "XSS対策（XSS Protection）",
          simple: "悪意のあるコードを投稿に紛れ込ませる攻撃を防ぐセキュリティ対策。",
          detail:
            "XSS（クロスサイトスクリプティング）は、悪意あるJavaScriptを投稿内容に埋め込んで他のユーザーの情報を盗む攻撃です。本サイトでは入力データを「サニタイズ（無害化）」することでこれを防いでいます。",
        },
      ]
    : [
        {
          term: "Open Source",
          simple: "Making a program's blueprints publicly visible, usable, and modifiable by anyone.",
          detail:
            "Software runs on sets of instructions called 'code'. Open source means publishing that code online so anyone can read, copy, and modify it — like sharing a recipe.",
        },
        {
          term: "Frontend",
          simple: "The part of the site you actually see — design, buttons, text, etc.",
          detail:
            "Think of it as the storefront and display shelves of a shop. Built with React, TypeScript, and Tailwind CSS.",
        },
        {
          term: "Backend",
          simple: "The behind-the-scenes program that saves and processes data like posts and votes.",
          detail:
            "Like the warehouse and accounting department of a shop. Built with Node.js and Express.",
        },
        {
          term: "Database",
          simple: "The storage system that keeps opinions, votes, and categories saved persistently.",
          detail:
            "Similar to a structured spreadsheet. This site uses MySQL. Without a database, all data would disappear on page reload.",
        },
        {
          term: "tRPC",
          simple: "A system for the frontend and backend to exchange data safely and efficiently.",
          detail:
            "Like a phone line between the screen and the server. It's type-safe, meaning data shapes are validated automatically, reducing bugs.",
        },
        {
          term: "Hosting / Railway",
          simple: "A service that keeps the site running 24/7 on the internet.",
          detail:
            "Websites need to run on a computer (server) at all times. This site runs on Railway, a cloud platform that keeps it accessible around the clock.",
        },
        {
          term: "Anonymous Auth",
          simple: "A system that lets you post and vote without logging in, while still preventing double-voting.",
          detail:
            "An anonymous ID is stored as a cookie in your browser. No account needed, no personal data collected. The ID expires after 90 days.",
        },
        {
          term: "GitHub",
          simple: "A web service for storing, sharing, and collaborating on code.",
          detail:
            "Uses Git for version control. This site's code is publicly hosted on GitHub — anyone can view or fork it.",
        },
        {
          term: "MIT License",
          simple: "'Feel free to use this' — a permissive open-source license for any purpose.",
          detail:
            "One of the most permissive licenses. Allows modification, redistribution, and commercial use. Only requirement: keep the original copyright notice.",
        },
        {
          term: "Rate Limiting",
          simple: "A security measure that prevents too many actions in a short period of time.",
          detail:
            "For example, 'only one post per minute'. This prevents bots from flooding the site with spam submissions.",
        },
        {
          term: "XSS Protection",
          simple: "Security that blocks malicious code from being injected through user posts.",
          detail:
            "XSS (Cross-Site Scripting) is an attack where malicious JavaScript is embedded in content to steal user data. This site sanitizes all input to neutralize such attacks.",
        },
      ];

  const techStack = [
    {
      label: ja ? "画面・デザイン" : "UI / Design",
      tech: "React 19 + TypeScript",
      desc: ja
        ? "ボタンや一覧・投票画面など、目に見える部分をすべて担当。型安全な言語で、バグを事前に防ぎやすい構成。"
        : "Handles all visible elements — buttons, lists, vote UI. TypeScript adds type safety to catch bugs early.",
    },
    {
      label: ja ? "スタイル" : "Styling",
      tech: "Tailwind CSS v4",
      desc: ja
        ? "デザインを素早く書けるCSSフレームワーク。ブルータリストデザイン（太い枠線・白黒）をベースにしたスタイル。"
        : "Utility-first CSS framework. Styled with a brutalist aesthetic — thick borders, bold monochrome.",
    },
    {
      label: ja ? "ページ移動" : "Routing",
      tech: "Wouter",
      desc: ja
        ? "URLと画面の対応を管理する軽量ライブラリ。/opinions → 意見一覧、/about → サイトについて、のように動作。"
        : "Lightweight router mapping URLs to pages (e.g. /opinions → list, /about → about page).",
    },
    {
      label: ja ? "API通信" : "API Layer",
      tech: "tRPC + TanStack Query",
      desc: ja
        ? "画面とサーバーのやり取りを型安全に行う仕組み。キャッシュ・再取得・楽観的更新（即時反映）を自動で処理。"
        : "Type-safe API layer. Handles caching, refetching, and optimistic updates automatically.",
    },
    {
      label: ja ? "サーバー" : "Server",
      tech: "Node.js + Express",
      desc: ja
        ? "投稿受付・投票処理・管理者機能などを担当するバックエンド。レート制限・XSS対策も組み込み済み。"
        : "Backend handling post submission, voting, and admin functions. Rate limiting and XSS protection built in.",
    },
    {
      label: ja ? "データベース" : "Database",
      tech: "MySQL + Drizzle ORM",
      desc: ja
        ? "意見・投票・カテゴリー・解決策などすべてのデータを永続保存。Drizzleが型安全なSQL操作を担当。"
        : "Stores all opinions, votes, categories, and solutions. Drizzle provides type-safe SQL operations.",
    },
    {
      label: ja ? "認証" : "Auth",
      tech: "JWT + Anonymous UUID",
      desc: ja
        ? "管理者はJWTトークンでログイン。一般ユーザーはCookieに保存した匿名UUIDで識別（個人情報なし）。"
        : "Admins log in with JWT tokens. Regular users are identified by an anonymous UUID in a cookie — no personal data.",
    },
    {
      label: ja ? "デプロイ" : "Deployment",
      tech: "Railway",
      desc: ja
        ? "GitHubにプッシュするたびに自動でビルド・デプロイ。MySQLデータベースも同一プロジェクト内で管理。"
        : "Auto-deploys on every GitHub push. MySQL database managed in the same Railway project.",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {ja ? "サイトについてに戻る" : "Back to About"}
        </Link>

        <h1 className="text-4xl font-bold mb-2 text-gray-900">
          {ja ? "サイトインサイト" : "Site Insights"}
        </h1>
        <p className="text-gray-500 mb-8">
          {ja
            ? "このサイトの仕組みを、専門知識がなくてもわかるように解説します。"
            : "How this site works — explained without requiring technical knowledge."}
        </p>

        <div className="space-y-8">

          {/* Section 1: このサイトでできること */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {ja ? "このサイトでできること" : "What This Site Does"}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {ja
                ? `${siteConfig.orgName.ja}の学生が、匿名で学内の問題や提案を投稿し、他の学生が「賛成・反対・パス」で意見を表明できるプラットフォームです。`
                : `A platform for ${siteConfig.orgName.en} students to anonymously post campus issues and proposals, with others voting agree, disagree, or pass.`}
            </p>
            <ul className="space-y-2 text-gray-700 text-sm">
              {(ja
                ? [
                    "📝 匿名で意見・解決策を投稿（アカウント不要）",
                    "👍 賛成・反対・パスの3択で投票",
                    "💡 他のユーザーが解決策を追加提案",
                    "📊 投票数・賛成率をリアルタイムで可視化",
                    "🔒 管理者が承認した投稿のみ公開（スパム・誹謗中傷を防止）",
                    "🌐 日本語・英語の2言語に対応",
                  ]
                : [
                    "📝 Post anonymously — no account needed",
                    "👍 Vote: agree, disagree, or pass",
                    "💡 Others can add solution proposals",
                    "📊 Real-time vote counts and approval rates",
                    "🔒 Admin approval required before posts go public",
                    "🌐 Japanese and English bilingual support",
                  ]
              ).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: オープンソースとは */}
          <section className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {ja ? "オープンソースって何？" : "What is Open Source?"}
            </h2>
            <div className="space-y-3 text-gray-700">
              <p className="leading-relaxed">
                {ja
                  ? "ソフトウェアは「コード（プログラムの指示書）」で動いています。オープンソースとは、そのコードをインターネット上に公開し、誰でも読んだり・使ったり・改変したりできる状態にすることです。"
                  : "Software runs on 'code' — sets of instructions. Open source means publishing that code online so anyone can read, use, or modify it."}
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <p className="font-semibold text-sm mb-1">
                  {ja ? "📖 わかりやすいたとえ" : "📖 Simple Analogy"}
                </p>
                <p className="text-sm leading-relaxed">
                  {ja
                    ? "料理のレシピを公開するのに似ています。レシピを見た人は、同じ料理を作れるし、自分好みにアレンジすることもできます。本サイトのコードも同様に、他の大学や団体が自分たちの学生意見プラットフォームとして自由に使えます。"
                    : "It's like publishing a recipe. Anyone can cook the same dish, or adapt it to their taste. Similarly, any university or organization can use this site's code to build their own student voice platform."}
                </p>
              </div>
              <p className="leading-relaxed">
                {ja
                  ? "本サイトのコードは MIT ライセンスのもとで公開されています。これは「商用・非商用を問わず、自由に使っていい（ただし著作権表示は残すこと）」という許可証です。"
                  : "This site's code is published under the MIT License — 'use it freely for any purpose, just keep the copyright notice.'"}
              </p>
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-1 font-semibold text-gray-900 hover:underline border-2 border-black px-4 py-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {ja ? "ソースコードを見る（GitHub）" : "View Source Code (GitHub)"}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </section>

          {/* Section 3: 技術スタック */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              {ja ? "このサイトを支える技術" : "Technologies Behind This Site"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {ja
                ? "各技術のカッコ内は正式名称。平易な言葉で説明しています。"
                : "Plain-language descriptions of each technology used."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {techStack.map((item) => (
                <div key={item.tech} className="border-2 border-black p-3">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                  <p className="font-black text-sm mb-1">{item.tech}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: データの流れ */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {ja ? "投稿からデータが届くまで" : "From Post to Published — Data Flow"}
            </h2>
            <div className="space-y-3">
              {(ja
                ? [
                    { step: "1", title: "投稿", desc: "学生がフォームに意見を入力して送信する。" },
                    { step: "2", title: "サニタイズ", desc: "悪意あるコード（XSS）を除去。安全なテキストのみ保存。" },
                    { step: "3", title: "データベースへ保存", desc: "意見が「承認待ち」状態でMySQLに書き込まれる。" },
                    { step: "4", title: "管理者が確認・承認", desc: "管理者パネルで内容を確認し、問題なければ「承認」する。" },
                    { step: "5", title: "公開", desc: "承認された意見が意見一覧に表示され、他のユーザーが投票できる。" },
                  ]
                : [
                    { step: "1", title: "Submit", desc: "Student fills in the form and submits." },
                    { step: "2", title: "Sanitize", desc: "Malicious code (XSS) is stripped. Only safe text is saved." },
                    { step: "3", title: "Stored in Database", desc: "Opinion is written to MySQL with status 'pending'." },
                    { step: "4", title: "Admin Review", desc: "Admin reviews content and approves if appropriate." },
                    { step: "5", title: "Published", desc: "Approved opinions appear in the list and can be voted on." },
                  ]
              ).map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: 他の組織が使う場合 */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {ja ? "あなたの大学・組織でも使えます" : "Deploy at Your University or Organization"}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {ja
                ? "このサイトのコードは、他の大学や団体が同様のプラットフォームを作るために自由に使えます。必要なカスタマイズは主に1ファイルを編集するだけです。"
                : "This site's code can be freely used by other universities or organizations to build a similar platform. Most customization requires editing just one file."}
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm font-mono mb-4">
              <p className="text-gray-500 mb-1">{ja ? "# カスタマイズはこのファイルを編集" : "# Edit this file to customize"}</p>
              <p className="font-bold">client/src/siteConfig.ts</p>
              <p className="text-gray-600 mt-2">orgName, memberTerm, siteName, contactEmail...</p>
            </div>
            <p className="text-sm text-gray-600">
              {ja
                ? "詳しい導入手順はGitHubのREADMEに記載されています（日本語・英語）。"
                : "Detailed setup instructions are in the GitHub README (Japanese & English)."}
            </p>
          </section>

          {/* Section 6: 専門用語集 */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              {ja ? "専門用語集" : "Glossary"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {ja
                ? "「▼ 詳しく」を押すとより詳しい解説が表示されます。"
                : "Tap '▼ More' for a detailed explanation."}
            </p>
            <div className="space-y-2">
              {glossary.map((entry) => (
                <GlossaryCard key={entry.term} entry={entry} />
              ))}
            </div>
          </section>

        </div>
      </motion.main>
    </div>
  );
}
