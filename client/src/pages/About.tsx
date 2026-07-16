import { ArrowLeft, BookOpen, ExternalLink, Github } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { siteConfig } from "@/siteConfig";

type Section = { title: string; body?: string; items?: string[]; note?: string };

const jaSections = (): Section[] => [
  { title: "サイト開設について", body: "学生が感じている課題と、大学側の考えや事情を、同じ画面に並べて見られる場をつくるために開設しました。学生の声を可視化し、互いに何を見ているのかを知るきっかけにすることを目指します。特定の個人や団体を攻撃する場ではありません。" },
  { title: "この場がすること", body: "学生の課題感と、それに対する大学の見解・説明を、カテゴリーと運営が手作業でまとめたテーマごとに対応させて並べます。" },
  { title: "この場がしないこと", items: ["解決策の投稿や、投票による順位づけは行いません。", "投票数を表示順・文字の大きさ・強調には使いません。", "対比が『どちらが正しい／何を意味する』かの解釈は自動で行いません。意味づけは読む人に委ねます。"] },
  { title: "投票について", body: "「賛成・反対」は、意見の優劣や学生の総意を決めるためのものではありません。同じ思いが広がっているのか、学生の間でも見方が分かれているのかを示す参考情報です。数は各意見に添えるだけで、順位や表示順には使いません。" },
  { title: "AIの利用について", body: "本サイトでは、投稿内容の評価・順位づけ・検閲・書き換え・分類・グルーピングにAIを使いません。似た意見をテーマごとにまとめる作業は運営が手作業で行い、個々の意見はそのまま残ります。開発・保守でAIツールを補助的に使う場合も、利用者の投稿データを開発用AIへ送信しません。" },
  { title: "投稿の公開とモデレーション", body: "学生投稿は、個人情報や有害表現を検知するフィルターを通過すると即時公開されます。その後、運営が内容を確認し、運営方針に反する投稿を非表示または削除することがあります。大学の見解は、大学側からサイト外で内容の確認・公開OKを得た後に公開します。" },
  { title: "禁止事項と対応", items: ["特定の個人を識別できる情報（氏名・連絡先・住所等）", "個人・団体への誹謗中傷、差別的・侮辱的表現", "人種・性別・宗教・性的指向などの属性に基づくヘイトスピーチ", "自傷・自殺・摂食障害を助長・美化する内容", "過激な暴力・流血等のグラフィック表現", "薬物・危険物の乱用を促す内容", "違法行為の実行を煽動・指示する内容"], note: "該当すると判断した投稿は、事前の通知なく非表示または削除する場合があります。具体的な個人特定情報はフィルターだけでは拾いきれないため、事後モデレーションでも対応します。" },
  { title: "利用対象年齢", body: "本サイトは、原則として18歳以上の利用を想定しています。" },
  { title: "大学の見解・説明のステータス", items: ["回答済み：大学側がそのテーマについて説明を出している状態です。", "確認中：論点は認識しており、説明を準備している状態です。", "回答できない：現在の大学の事情ではすぐに答えられない状態です。何が事情で、どこまでなら動けるかをできる範囲で添えます。『無視』ではなく、事情の所在を示すためのラベルです。"], note: "すべての論点に見解が付くわけではありません。どの論点に扱うかを投票の多さで決めることはしません。大学と相談し、答えられるものから順に扱います。大学の見解は公式な決定や約束ではありません。" },
  { title: "アクセス制限について", body: "本サイトは、学内で配布する共有パスワードにより、実務上の学内限定を担保しています。共有パスワード方式には限界があり、学外から絶対にアクセスできないことを保証するものではありません。URLやパスワードが学外に漏れたと運営が判断した場合、予告なくアクセスを一時停止することがあります。" },
  { title: "運営・免責", body: `本サイトは、${siteConfig.orgName.ja}の学生有志が、大学教員の監督のもとで運営しています。学生の意見や投票は、大学の方針や決定そのものではありません。本サイトは大学の公式な意思決定機関ではありません。` },
  { title: "非表示・削除に対する異議申し立て", body: "投稿が非表示または削除され、対応に誤りがあると思われる場合は、投稿IDと理由を添えてお問い合わせください。運営が内容を確認し、適切に対応します。" },
];

const enSections = (): Section[] => [
  { title: "Why this site was created", body: "This site was created so student concerns and the university's current explanations can be seen on the same screen. It aims to make it easier to understand what each side is seeing; it is not a place to attack individuals or groups." },
  { title: "What this place does", body: "It places student concerns alongside the university's current views, by category and manually maintained theme." },
  { title: "What this place does not do", items: ["It does not accept solution proposals or rank opinions by votes.", "Vote counts never affect order, size, or emphasis.", "It does not interpret which side is right or what a contrast means."] },
  { title: "Voting", body: "Agree and Disagree do not decide merit or a student consensus. They are reference signals of whether students share a view or differ on it, and never affect display order." },
  { title: "AI use", body: "AI is not used to evaluate, rank, censor, rewrite, classify, or group posts. Themes are made manually and individual posts remain visible. Development tools may use AI to assist with code, but user posts are not sent to development AI systems." },
  { title: "Publishing and moderation", body: "Student posts are published immediately after the safety filter and are moderated afterwards. University views are published only after off-site confirmation by the university." },
  { title: "Prohibited content", items: ["Personally identifying information", "Defamatory, discriminatory, or insulting language", "Hate speech", "Content that promotes self-harm, suicide, or eating disorders", "Graphic violence", "Drug misuse or dangerous substances", "Incitement or instruction of illegal acts"], note: "Posts may be hidden or deleted without prior notice. Moderators also review posts because a filter cannot catch every identifying detail." },
  { title: "Target age", body: "This service is intended for users aged 18 and above." },
  { title: "University-view status", items: ["Answered: an explanation is available.", "Checking: the issue is recognised and an explanation is being prepared.", "Cannot answer now: the current circumstances prevent an immediate answer. Where possible, it explains the constraint and remaining room to act."], note: "Not every theme receives a view, and vote count does not decide what is addressed. These are current explanations, not official decisions or promises." },
  { title: "Access restriction", body: "A shared password distributed within the university provides practical internal-only access; it cannot guarantee that no one outside can access it. Access may be paused without notice if a leak is suspected." },
  { title: "Operation and disclaimer", body: `This site is run by student volunteers from ${siteConfig.orgName.en} under faculty supervision. Student posts and votes are not university policy or decisions, and this site is not an official university decision-making body.` },
  { title: "Appeals", body: "If your post was hidden or deleted in error, contact us with the post ID and reason. The team will review it." },
];

export default function About() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const ja = language === "ja";
  const sections = ja ? jaSections() : enSections();
  const contact = siteConfig.contactEmail;

  return <div className="min-h-screen bg-white"><header className="border-b-4 border-black"><div className="container flex items-center gap-3 px-4 py-5"><Button variant="ghost" onClick={() => setLocation("/")}><ArrowLeft /></Button><h1 className="text-3xl font-black">{ja ? "サイトについて" : "About"}</h1></div></header><main className="container max-w-3xl space-y-5 px-4 py-8">
    {sections.map(section => <section key={section.title} className="border-4 border-black p-5"><h2 className="text-xl font-black">{section.title}</h2>{section.body && <p className="mt-3 leading-relaxed">{section.body}</p>}{section.items && <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}{section.note && <p className="mt-4 border-l-4 border-black pl-3 text-sm leading-relaxed">{section.note}</p>}</section>)}
    <section className="border-4 border-black p-5"><h2 className="text-xl font-black">{ja ? "オープンソースについて" : "Open source"}</h2><p className="mt-3 leading-relaxed">{ja ? "本サイトのコードはオープンソースとして公開しています。他大学や団体が同様の学生意見可視化プラットフォームを構築・運用する際に、自由に活用・改変できます。導入、カスタマイズ、共同開発に関心のある方はお問い合わせください。" : "The source code is openly available. Other universities and organizations are welcome to use and adapt it for their own student-voice platforms."}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border-2 border-black p-3 font-bold hover:bg-gray-100"><Github className="size-5" />{ja ? "ソースコードを見る" : "View source code"}<ExternalLink className="ml-auto size-4" /></a><Link href="/site-insights" className="flex items-center gap-2 border-2 border-black p-3 font-bold hover:bg-gray-100"><BookOpen className="size-5" />{ja ? "サイト簡単解説" : "Site guide"}</Link></div></section>
    <section className="border-4 border-black p-5"><h2 className="text-xl font-black">{ja ? "お問い合わせ・問題の報告" : "Contact and reports"}</h2><p className="mt-3 leading-relaxed">{ja ? "不適切な投稿の報告、本サイトの内容・運営に関するお問い合わせは、以下のメールアドレスまでお願いします。" : "For harmful-content reports or inquiries about this site, contact us at:"}</p><a className="mt-4 inline-block border-2 border-black px-3 py-2 font-bold underline" href={`mailto:${contact}`}>{contact}</a></section>
  </main></div>;
}
