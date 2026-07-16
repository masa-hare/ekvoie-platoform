import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const ja = language === "ja";
  const sections = ja ? [
    ["この場がすること", "学生の課題感と、それに対する大学の見解を、カテゴリーとテーマごとに対応させて並べます。"],
    ["この場がしないこと", "解決策の投稿や、投票による順位づけは行いません。対比が「どちらが正しい／何を意味する」かの解釈もしません。意味づけは読む人に委ねます。"],
    ["投票について", "「賛成・反対」は、意見の順位づけや優劣を決めるためのものではありません。同じ思いが広がっているのか、学生の間でも見方が分かれているのかを示す目印です。数は表示の大小や並び順には使わず、各意見に参考情報として添えるだけです。"],
    ["大学の見解・説明について", "大学の見解は、大学が確認した現時点での説明・見解であり、公式な決定や約束ではありません。回答済み／確認中／回答できない、の状態を表示します。「回答できない」には、何が事情で、どこまでなら動けるかをできる範囲で添えます。すべての論点に見解が付くわけではなく、投票の多さで扱う順番を決めることもしません。"],
    ["AIの利用について", "本サイトでは、投稿内容の評価・順位づけ・検閲・書き換えにAIを使いません。似た意見をテーマごとにまとめる作業も、運営が手作業で行います。個々の意見はそのまま残ります。"],
    ["公開と運営", "学生投稿は、個人情報・有害表現のフィルターを通過すると即時公開され、運営が事後モデレーションを行います。大学の見解は、大学側からサイト外でOKを得た後に公開します。本サイトは、叡啓大学の学生有志が、大学教員の監督のもとで運営しています。学生の意見や投票は大学の方針や決定そのものではありません。"],
    ["アクセスについて", "本サイトは、学内で配布する共有パスワードにより、実務上の学内限定を担保しています。学外から絶対にアクセスできないことを保証するものではありません。URLやパスワードが学外に漏れたと運営が判断した場合、予告なくアクセスを一時的に停止することがあります。"],
  ] : [
    ["What this place does", "It places student concerns alongside the university's current views, by category and manually maintained theme."],
    ["What it does not do", "It does not accept solution proposals or rank opinions by votes. It does not interpret which side is right or what a contrast means."],
    ["Voting", "Agree and Disagree do not decide merit or rank. They only show whether students share a view or differ on it. Counts never change size or order."],
    ["University views", "These are university-confirmed current explanations, not official decisions or promises. Status is shown as Answered, Checking, or Cannot answer now; the last includes context and possible room to act where possible."],
    ["AI use", "AI is not used to evaluate, rank, censor, rewrite, classify, or group posts. Themes are created manually and individual posts remain visible."],
    ["Publishing and operation", "Student posts are published immediately after the safety filter and moderated afterwards. University views are published only after off-site confirmation. The site is run by student volunteers under faculty supervision."],
    ["Access", "A shared password distributed within the university provides practical internal-only access; it cannot guarantee that no one outside can access it. Access may be paused without notice if a leak is suspected."],
  ];
  return <div className="min-h-screen bg-white"><header className="border-b-4 border-black"><div className="container flex items-center gap-3 px-4 py-5"><Button variant="ghost" onClick={() => setLocation("/")}><ArrowLeft /></Button><h1 className="text-3xl font-black">{ja ? "サイトについて" : "About"}</h1></div></header><main className="container max-w-3xl space-y-5 px-4 py-8"><p className="border-l-4 border-black pl-4 text-xl font-bold">{ja ? "学生が感じている課題と、それに対する大学側の考えや事情を、同じ画面に並べて見られる場です。" : "A place to see student concerns and the university's current explanations on the same screen."}</p>{sections.map(([title, body]) => <section key={title} className="border-4 border-black p-5"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 leading-relaxed">{body}</p></section>)}</main></div>;
}
