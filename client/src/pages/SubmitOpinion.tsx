import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, Copy, Send } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { checkContent, type ContentViolation } from "@shared/contentFilter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const violationMessage = (type: ContentViolation, ja: boolean) => {
  if (!ja) return type === "harmful" ? "This post contains abusive or defamatory language." : type === "personal_name" ? "This post appears to include a person's name." : "This post appears to include personal information.";
  return type === "harmful" ? "明らかな誹謗中傷・侮辱表現が含まれています。" : type === "personal_name" ? "個人名と思われる表現が含まれています。" : "メールアドレス・電話番号などの個人情報が含まれています。";
};

export default function SubmitOpinion() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const ja = language === "ja";
  const [categoryId, setCategoryId] = useState("");
  const [opinionText, setOpinionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const { data: categories } = trpc.opinions.getCategories.useQuery();
  const createOpinion = trpc.opinions.createTextOpinion.useMutation();
  const filterResult = useMemo(() => checkContent(opinionText), [opinionText]);
  const violation = filterResult.ok ? null : filterResult.type;

  const submit = async () => {
    if (!categoryId) return toast.error(ja ? "カテゴリーを選択してください" : "Please select a category");
    if (!opinionText.trim()) return toast.error(ja ? "意見を入力してください" : "Please enter your opinion");
    if (opinionText.length > 500) return toast.error(ja ? "500文字以内で入力してください" : "Please keep it within 500 characters");
    if (violation) return toast.error(ja ? "この内容は投稿できないよ。" : "This content cannot be submitted.");
    setIsSubmitting(true);
    try {
      const result = await createOpinion.mutateAsync({ problemStatement: "", solutionProposal: opinionText.trim(), categoryId: Number(categoryId) });
      setSubmittedId(Number((result as any).insertId));
      setOpinionText(""); setCategoryId("");
    } catch (error: any) {
      const message = String(error?.message ?? "");
      if (message.includes("CONTENT_VIOLATION_PERSONAL_NAME")) toast.error(ja ? "個人名と思われる表現が含まれているため、投稿できません。" : "A possible personal name was found.");
      else if (message.includes("CONTENT_VIOLATION_PII")) toast.error(ja ? "個人情報が含まれているため、投稿できません。" : "Personal information cannot be submitted.");
      else if (message.includes("CONTENT_VIOLATION_HARMFUL")) toast.error(ja ? "明らかな誹謗中傷・侮辱表現が含まれているため、投稿できません。" : "Abusive or defamatory language cannot be submitted.");
      else if (error?.data?.code === "TOO_MANY_REQUESTS") toast.error(ja ? "少し時間をおいてからお試しください。" : "Please wait before trying again.");
      else toast.error(ja ? "投稿に失敗しました" : "Submission failed");
    } finally { setIsSubmitting(false); }
  };

  if (submittedId !== null) return <div className="min-h-screen bg-white"><header className="border-b-4 border-black"><div className="container flex items-center gap-3 px-4 py-5"><Button variant="ghost" onClick={() => navigate("/")}><ArrowLeft /></Button><h1 className="text-3xl font-black">{ja ? "意見を投稿" : "Submit opinion"}</h1></div></header><main className="container flex min-h-[70vh] max-w-xl items-center justify-center px-4"><section className="w-full border-4 border-black p-8 text-center"><CheckCircle className="mx-auto mb-4 size-14 text-green-700" /><h2 className="text-2xl font-black">{ja ? "投稿しました" : "Posted"}</h2><p className="mt-2">{ja ? "意見一覧にすぐ反映されます。" : "Your post is now visible."}</p><div className="my-6 border-2 border-black p-3"><p className="text-sm font-bold">{ja ? "投稿番号" : "Post ID"}</p><div className="flex items-center justify-center gap-2"><strong className="text-3xl">#{submittedId}</strong><button onClick={() => { void navigator.clipboard.writeText(String(submittedId)); toast.success(ja ? "コピーしました" : "Copied"); }}><Copy className="size-5" /></button></div></div><div className="flex flex-wrap justify-center gap-2"><Button onClick={() => navigate("/opinions")}>{ja ? "意見一覧へ" : "View opinions"}</Button><Button variant="outline" onClick={() => setSubmittedId(null)}>{ja ? "続けて投稿" : "Submit another"}</Button></div></section></main></div>;

  return <div className="min-h-screen bg-white"><header className="border-b-4 border-black"><div className="container flex items-center gap-3 px-4 py-5"><Button variant="ghost" onClick={() => navigate("/")}><ArrowLeft /></Button><h1 className="text-3xl font-black">{ja ? "意見を投稿" : "Submit opinion"}</h1></div></header><main className="container max-w-4xl px-4 py-8"><section className="border-4 border-black p-5 sm:p-8"><h2 className="text-2xl font-black">{ja ? "学内の課題・意見" : "Campus concern or opinion"}</h2><p className="mt-2 leading-relaxed">{ja ? "解決策を書く必要はありません。あなたが感じている課題や意見を、そのまま一つ書いてください。" : "You do not need to propose a solution. Write one concern or opinion in your own words."}</p><div className="mt-5 border-2 border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-950">{ja ? "特定の個人が分かる名前・連絡先、明らかな誹謗中傷や侮辱表現は投稿できません。入力時と投稿時にルールベースで確認します。" : "Personal names or contact details, and clearly abusive or defamatory language, cannot be submitted."} <Link className="underline" href="/about">{ja ? "詳しく見る" : "Learn more"}</Link></div><div className="mt-6 space-y-5"><div><label className="mb-2 block font-bold">{ja ? "カテゴリー" : "Category"}</label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="border-2 border-black"><SelectValue placeholder={ja ? "カテゴリーを選択" : "Select category"} /></SelectTrigger><SelectContent>{categories?.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></div><div><label className="mb-2 block font-bold">{ja ? "内容" : "Your post"}</label><Textarea value={opinionText} onChange={event => setOpinionText(event.target.value)} className="min-h-48 border-2 border-black text-base" placeholder={ja ? "例：昼休みは食堂が混んでいて、次の授業までに食事を取りづらい。" : "Example: The cafeteria is too crowded during lunch."} /><p className="mt-1 text-right text-sm text-muted-foreground">{opinionText.length} / 500</p>{violation && <div role="alert" className="mt-3 border-2 border-red-700 bg-red-50 p-4 font-bold text-red-900"><p className="text-lg">{ja ? "この内容は投稿できないよ。" : "This content cannot be submitted."}</p><p className="mt-1 text-sm">{violationMessage(violation, ja)} {ja ? "個人が特定されない・攻撃にならない表現に直してください。" : "Please rewrite it without identifying or attacking anyone."}</p></div>}</div><Button disabled={isSubmitting || !categoryId || !opinionText.trim() || Boolean(violation)} onClick={() => void submit()} className="w-full border-2 border-black bg-black py-6 text-lg font-black text-white"><Send className="mr-2 size-5" />{isSubmitting ? (ja ? "投稿中…" : "Posting…") : (ja ? "意見を投稿" : "Submit opinion")}</Button></div></section></main></div>;
}
