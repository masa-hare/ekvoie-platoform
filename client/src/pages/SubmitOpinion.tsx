import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SubmitOpinion() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [problemStatement, setProblemStatement] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);



  const { data: categories } = trpc.opinions.getCategories.useQuery();

  const createOpinionMutation = trpc.opinions.createTextOpinion.useMutation();

  const handleTextSubmit = async () => {
    if (!categoryId) {
      toast.error(language === "ja" ? "カテゴリーを選択してください" : "Please select a category");
      return;
    }
    if (!problemStatement.trim()) {
      toast.error(t("submitOpinion.fillAllFields"));
      return;
    }
    if (!solutionText.trim()) {
      toast.error(t("submitOpinion.fillAllFields"));
      return;
    }

    if (problemStatement.length > 500 || solutionText.length > 500) {
      toast.error(t("submitOpinion.textTooLong"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOpinionMutation.mutateAsync({
        problemStatement: problemStatement.trim(),
        solutionProposal: solutionText.trim(),
        categoryId: parseInt(categoryId),
      });
      const id = Number((result as any).insertId);
      setSubmittedId(id);
      setProblemStatement("");
      setSolutionText("");
      setCategoryId("");
    } catch (error: any) {
      console.error("Submit error:", error);
      if (error?.data?.code === "TOO_MANY_REQUESTS") {
        toast.error(
          language === "ja"
            ? "少し時間をおいてからお試しください（1分に1回まで）"
            : "Please wait a moment before submitting again (1 per minute)"
        );
      } else {
        toast.error(t("submitOpinion.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  if (submittedId !== null) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col">
        <header className="border-b-4 border-black">
          <div className="container py-4 md:py-6 flex items-center gap-2 md:gap-4">
            <Button onClick={() => setLocation("/")} variant="ghost" className="font-bold p-2">
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase">{t("submit.title")}</h2>
          </div>
        </header>
        <main className="container py-12 px-4 flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg w-full text-center"
          >
            <div className="brutalist-border-thick p-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-2xl sm:text-3xl font-black mb-2">
                {language === "ja" ? "投稿を受け付けました" : "Submission Received"}
              </h3>
              <p className="text-gray-600 mb-6 font-semibold">
                {language === "ja"
                  ? "管理者の承認後に公開されます。"
                  : "Your post will be published after admin approval."}
              </p>

              {/* Post ID display */}
              <div className="border-4 border-black bg-yellow-50 p-4 mb-6">
                <p className="text-sm font-bold text-gray-600 mb-1">
                  {language === "ja" ? "あなたの投稿番号" : "Your Post ID"}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-black">#{submittedId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(submittedId));
                      toast.success(language === "ja" ? "IDをコピーしました" : "ID copied");
                    }}
                    className="p-2 hover:bg-yellow-100 rounded transition-colors"
                    title={language === "ja" ? "コピー" : "Copy"}
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-semibold">
                  {language === "ja"
                    ? "このIDを控えておくと、問い合わせや異議申し立ての際に役立ちます。"
                    : "Keep this ID for reference if you need to contact us about your post."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setLocation("/opinions")}
                  className="brutalist-border font-black uppercase bg-black text-white hover:bg-black/90"
                >
                  {language === "ja" ? "意見一覧へ" : "View Opinions"}
                </Button>
                <Button
                  onClick={() => setSubmittedId(null)}
                  variant="outline"
                  className="brutalist-border font-black uppercase"
                >
                  {language === "ja" ? "続けて投稿する" : "Submit Another"}
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="container py-4 md:py-6 flex items-center gap-2 md:gap-4">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="font-bold p-2"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase">{t("submit.title")}</h2>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Text input section (Main) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutalist-border-thick p-4 sm:p-8 mb-8 md:mb-12"
          >
            <div className="brutalist-underline inline-block mb-4 md:mb-6">
              <h3 className="text-xl sm:text-3xl font-black uppercase">{t("submit.textInput")}</h3>
            </div>
            
            {/* Warning notice */}
            <div className="border-2 border-red-600 bg-red-50 p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-black text-lg">⚠️</span>
                <div className="space-y-2">
                  <p className="text-sm sm:text-base font-bold text-red-900">
                    {t("submitOpinion.warning1")}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-red-900">
                    {t("submitOpinion.warning2")}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-red-900">
                    {t("submitOpinion.warning3")}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-red-900 mt-2">
                    <Link href="/about" className="underline hover:text-red-700 transition-colors">
                      {language === "ja" ? "詳しくは「サイトについて」をご覧ください" : "See 'About' for details"}
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-base sm:text-lg font-bold mb-2 md:mb-3">{t("submit.category")}</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="brutalist-border font-bold">
                    <SelectValue placeholder={t("submit.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories && categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold mb-2 md:mb-3">
                  {t("submit.problemStatement")}
                </label>
                <Textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder={t("submit.problemPlaceholder")}
                  className="brutalist-border font-semibold min-h-[80px] sm:min-h-[100px] text-base sm:text-lg resize-none"
                />
                <div className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
                  {language === "ja" ? "任意：大学が実行できる解決策を提案しやすくなります" : "Optional: helps proposers suggest actionable solutions."}
                </div>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold mb-2 md:mb-3">
                  {t("submit.yourSolution")}
                </label>
                <Textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder={t("submit.solutionExample")}
                  className="brutalist-border font-semibold min-h-[150px] sm:min-h-[200px] text-base sm:text-lg resize-none"
                />
                <div className="text-xs sm:text-sm font-bold text-red-600 mt-2 mb-1">
                  {t("submit.solutionNote")}
                </div>
                <div className="text-sm font-bold text-muted-foreground">
                  {solutionText.length} {t("submit.characters")}
                </div>
              </div>

              <Button
                onClick={handleTextSubmit}
                disabled={isSubmitting || !categoryId || !problemStatement.trim() || !solutionText.trim()}
                className="brutalist-border-thick font-black uppercase w-full py-4 sm:py-6 text-lg sm:text-xl bg-black text-white hover:bg-black/90"
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                {isSubmitting ? t("submit.submitting") : t("submit.submitButton")}
              </Button>

              {/* Inline hints — shown only when button is disabled */}
              {(!categoryId || !problemStatement.trim() || !solutionText.trim()) && (
                <div className="mt-2 space-y-1">
                  {!categoryId && (
                    <p className="text-sm font-bold text-red-600">
                      {language === "ja" ? "・カテゴリーを選択してください" : "· Please select a category"}
                    </p>
                  )}
                  {!problemStatement.trim() && (
                    <p className="text-sm font-bold text-red-600">
                      {language === "ja" ? "・問題文を入力してください" : "· Please enter a problem statement"}
                    </p>
                  )}
                  {!solutionText.trim() && (
                    <p className="text-sm font-bold text-red-600">
                      {language === "ja" ? "・解決策を入力してください" : "· Please enter a proposed solution"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>


        </div>
      </main>
    </div>
  );
}
