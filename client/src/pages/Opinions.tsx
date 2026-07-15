import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown, Minus, LayoutGrid, List, ChevronRight, CheckCircle2, CircleDashed, CircleSlash } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOpinionEvents } from "@/hooks/useOpinionEvents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "latest" | "contrast";
type ResponseStatus = "answered" | "checking" | "cannot_answer";

export default function Opinions() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const ja = language === "ja";
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("latest");
  const [votingOpinionIds, setVotingOpinionIds] = useState<Set<number>>(new Set());

  const { data: opinions, isLoading } = trpc.opinions.list.useQuery(
    {
      categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
      includeFeedback: viewMode === "contrast",
    },
    {
      placeholderData: (previousData) => previousData,
    }
  );

  const { data: categories } = trpc.opinions.getCategories.useQuery();
  const { data: universityViews } = trpc.universityViews.list.useQuery(undefined, {
    enabled: viewMode === "contrast",
  });
  const utils = trpc.useUtils();

  // Invalidate opinion cache instantly when admin performs a moderation action
  useOpinionEvents();

  const listQueryKey = {
    categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
    includeFeedback: viewMode === "contrast",
  };

  const voteMutation = trpc.opinions.vote.useMutation({
    onMutate: async ({ opinionId, voteType }) => {
      await utils.opinions.list.cancel(listQueryKey);
      const previousOpinions = utils.opinions.list.getData(listQueryKey);
      if (previousOpinions) {
        utils.opinions.list.setData(
          listQueryKey,
          previousOpinions.map(op => {
            if (op.id === opinionId) {
              return {
                ...op,
                agreeCount: voteType === "agree" ? op.agreeCount + 1 : op.agreeCount,
                disagreeCount: voteType === "disagree" ? op.disagreeCount + 1 : op.disagreeCount,
                passCount: voteType === "pass" ? op.passCount + 1 : op.passCount,
              };
            }
            return op;
          })
        );
      }
      return { previousOpinions };
    },
    onSuccess: (data, variables) => {
      const previousOpinions = utils.opinions.list.getData(listQueryKey);
      if (previousOpinions && data.counts) {
        utils.opinions.list.setData(
          listQueryKey,
          previousOpinions.map(op => {
            if (op.id === variables.opinionId) {
              return {
                ...op,
                agreeCount: data.counts.agreeCount,
                disagreeCount: data.counts.disagreeCount,
                passCount: data.counts.passCount,
              };
            }
            return op;
          })
        );
      }
      toast.success(t("opinions.voteSuccess"));
    },
    onError: (error, _variables, context) => {
      if (context?.previousOpinions) {
        utils.opinions.list.setData(listQueryKey, context.previousOpinions);
      }
      console.error("Vote error:", error);
      toast.error(t("opinions.voteError"));
    },
  });

  // Group opinions by category — used only for the contrast (side-by-side) view,
  // never for ranking. Order within a group stays chronological (server order).
  const opinionsByCategory = useMemo(() => {
    if (!opinions || !categories) return {};
    const grouped: Record<number, typeof opinions> = {};
    categories.forEach(cat => {
      grouped[cat.id] = opinions.filter(op => op.categoryId === cat.id);
    });
    grouped[0] = opinions.filter(op => !op.categoryId);
    return grouped;
  }, [opinions, categories]);

  const universityViewByCategory = useMemo(() => {
    const map = new Map<number, NonNullable<typeof universityViews>[number]>();
    universityViews?.forEach(v => map.set(v.categoryId, v));
    return map;
  }, [universityViews]);

  const handleVote = (opinionId: number, voteType: "agree" | "disagree" | "pass") => {
    if (votingOpinionIds.has(opinionId)) return;
    setVotingOpinionIds(prev => new Set(prev).add(opinionId));
    voteMutation.mutate({ opinionId, voteType }, {
      onSettled: () => {
        setVotingOpinionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(opinionId);
          return newSet;
        });
      },
    });
  };

  const translations = {
    en: {
      loading: "Loading...",
      viewLatest: "LATEST",
      viewContrast: "BY CATEGORY",
      uncategorized: "Uncategorized",
      noOpinionsInCategory: "No opinions in this category",
      topicLabel: "Context",
      opinionLabel: "Opinion",
      detailButton: "View Details",
      studentVoice: "Student Voice",
      universityView: "University's View",
      noUniversityView: "No response has been published for this category yet.",
      statusAnswered: "Answered",
      statusChecking: "Checking",
      statusCannotAnswer: "Cannot Answer Right Now",
    },
    ja: {
      loading: "読み込み中...",
      viewLatest: "最新順",
      viewContrast: "カテゴリー別（対照表示）",
      uncategorized: "未分類",
      noOpinionsInCategory: "このカテゴリーには意見がありません",
      topicLabel: "背景",
      opinionLabel: "意見",
      detailButton: "詳細を見る",
      studentVoice: "学生の声",
      universityView: "大学の見解",
      noUniversityView: "このカテゴリーについては、まだ大学からの見解が公開されていません。",
      statusAnswered: "回答済み",
      statusChecking: "確認中",
      statusCannotAnswer: "回答できない",
    },
  };

  const tt = translations[language];

  const statusMeta: Record<ResponseStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
    answered: { icon: CheckCircle2, label: tt.statusAnswered, className: "text-green-700 bg-green-50 border-green-700" },
    checking: { icon: CircleDashed, label: tt.statusChecking, className: "text-amber-700 bg-amber-50 border-amber-700" },
    cannot_answer: { icon: CircleSlash, label: tt.statusCannotAnswer, className: "text-gray-700 bg-gray-100 border-gray-700" },
  };

  const OpinionCard = ({ opinion }: { opinion: any }) => (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0 }}
      className="brutalist-border-thick p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3 sm:gap-0">
        <div className="flex-1">
          <div className="text-xs sm:text-sm font-bold text-muted-foreground mb-2">
            #{opinion.id} · {new Date(opinion.createdAt).toLocaleDateString(ja ? "ja-JP" : "en-US")}
          </div>
          {opinion.categoryId && (
            <div className="inline-block px-2 py-1 sm:px-3 border-2 border-black font-bold text-xs sm:text-sm mb-2">
              {categories?.find((c) => c.id === opinion.categoryId)?.name ?? "…"}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        {opinion.problemStatement && (
          <div className="mb-3">
            <div className="text-xs sm:text-sm font-bold text-muted-foreground mb-1">{tt.topicLabel}</div>
            <p className="text-base font-bold leading-relaxed border-l-4 border-black pl-3">
              {opinion.problemStatement}
            </p>
          </div>
        )}
        {opinion.transcription && (
          <div className="mt-3">
            <div className="text-xs sm:text-sm font-bold text-muted-foreground mb-1">{tt.opinionLabel}</div>
            <p className="text-sm sm:text-base font-semibold leading-relaxed">
              {opinion.transcription}
            </p>
          </div>
        )}
      </div>

      {/* Vote counts — neutral, not used for ordering or emphasis */}
      <div className="flex gap-6 mb-4 text-sm font-bold text-muted-foreground">
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4" />
          <span>{opinion.agreeCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsDown className="w-4 h-4" />
          <span>{opinion.disagreeCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Minus className="w-4 h-4" />
          <span>{opinion.passCount}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
        <Button
          onClick={() => handleVote(opinion.id, "agree")}
          disabled={votingOpinionIds.has(opinion.id)}
          className="brutalist-border font-black uppercase flex-1 py-3 text-sm sm:text-base"
          variant="outline"
          size="sm"
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          {t("opinions.agree")}
        </Button>
        <Button
          onClick={() => handleVote(opinion.id, "disagree")}
          disabled={votingOpinionIds.has(opinion.id)}
          className="brutalist-border font-black uppercase flex-1 py-3 text-sm sm:text-base"
          variant="outline"
          size="sm"
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          {t("opinions.disagree")}
        </Button>
        <Button
          onClick={() => handleVote(opinion.id, "pass")}
          disabled={votingOpinionIds.has(opinion.id)}
          className="brutalist-border font-black uppercase flex-1 py-3 text-sm sm:text-base"
          variant="outline"
          size="sm"
        >
          <Minus className="w-4 h-4 mr-2" />
          {t("opinions.pass")}
        </Button>
      </div>

      <Button
        onClick={() => setLocation(`/opinions/${opinion.id}`)}
        className="w-full brutalist-border font-bold text-sm"
        variant="ghost"
      >
        {tt.detailButton}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );

  const UniversityViewPanel = ({ categoryId }: { categoryId: number }) => {
    const view = universityViewByCategory.get(categoryId);
    if (!view) {
      return (
        <div className="border-4 border-dashed border-gray-300 p-4 sm:p-6 text-sm text-muted-foreground font-semibold">
          {tt.noUniversityView}
        </div>
      );
    }
    const meta = statusMeta[view.responseStatus as ResponseStatus];
    const StatusIcon = meta.icon;
    return (
      <div className="border-4 border-black p-4 sm:p-6">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 border-2 font-bold text-xs sm:text-sm mb-3 ${meta.className}`}>
          <StatusIcon className="w-4 h-4" />
          {meta.label}
        </div>
        <p className="text-sm sm:text-base font-semibold leading-relaxed whitespace-pre-wrap">{view.body}</p>
        {view.responseStatus === "cannot_answer" && view.reason && (
          <div className="mt-3 pt-3 border-t-2 border-gray-200">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{view.reason}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="container py-4 md:py-6 px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                onClick={() => setLocation("/")}
                variant="ghost"
                className="font-bold p-2"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-4xl md:text-5xl font-black uppercase">{t("opinions.title")}</h2>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewMode("latest")}
                variant={viewMode === "latest" ? "default" : "outline"}
                className="brutalist-border font-bold"
                size="sm"
              >
                <List className="w-4 h-4 mr-2" />
                {tt.viewLatest}
              </Button>
              <Button
                onClick={() => setViewMode("contrast")}
                variant={viewMode === "contrast" ? "default" : "outline"}
                className="brutalist-border font-bold"
                size="sm"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                {tt.viewContrast}
              </Button>
            </div>
          </div>

          {/* Category filter — filtering only, never re-ordering by support */}
          {viewMode === "latest" && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="brutalist-border font-bold w-full sm:w-44">
                  <SelectValue placeholder={t("opinions.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("opinions.all")}</SelectItem>
                  {categories?.filter(cat => !cat.isFeedback).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 sm:py-8 px-4">
        {viewMode === "latest" ? (
          // Latest view — single reverse-chronological feed. No ranking, no
          // vote-based ordering or emphasis (see redesign spec §4).
          <>
            {isLoading ? (
              <div className="text-center py-24">
                <p className="text-xl font-bold">{tt.loading}</p>
              </div>
            ) : !opinions || opinions.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl font-black mb-4">[ EMPTY ]</div>
                <p className="text-xl font-semibold">{t("opinions.noOpinions")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {opinions.map((opinion) => (
                  <OpinionCard key={opinion.id} opinion={opinion} />
                ))}
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="text-center py-24">
            <p className="text-xl font-bold">{tt.loading}</p>
          </div>
        ) : (
          // Contrast view — student voice and university view placed side by
          // side, grouped by category. The pairing stops at "same category";
          // any interpretation of what the juxtaposition means is left to the
          // reader (see redesign spec §5).
          <Tabs defaultValue={categories?.[0]?.id.toString() || "0"} className="w-full">
            <TabsList className="w-full flex flex-wrap justify-start gap-2 bg-transparent h-auto mb-8">
              {categories?.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id.toString()}
                  className="brutalist-border font-bold uppercase data-[state=active]:bg-black data-[state=active]:text-white px-4 py-2"
                >
                  {cat.name}
                  <span className="ml-2 text-xs">
                    ({opinionsByCategory[cat.id]?.length || 0})
                  </span>
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="0"
                className="brutalist-border font-bold uppercase data-[state=active]:bg-black data-[state=active]:text-white px-4 py-2"
              >
                {tt.uncategorized}
                <span className="ml-2 text-xs">
                  ({opinionsByCategory[0]?.length || 0})
                </span>
              </TabsTrigger>
            </TabsList>

            {categories?.map((cat) => (
              <TabsContent key={cat.id} value={cat.id.toString()}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <h3 className="text-lg font-black uppercase mb-4">{tt.studentVoice}</h3>
                    <div className="space-y-6">
                      {opinionsByCategory[cat.id]?.length ? (
                        opinionsByCategory[cat.id].map((opinion) => (
                          <OpinionCard key={opinion.id} opinion={opinion} />
                        ))
                      ) : (
                        <p className="text-muted-foreground font-semibold">{tt.noOpinionsInCategory}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase mb-4">{tt.universityView}</h3>
                    <UniversityViewPanel categoryId={cat.id} />
                  </div>
                </div>
              </TabsContent>
            ))}

            {/* Uncategorized */}
            <TabsContent value="0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <h3 className="text-lg font-black uppercase mb-4">{tt.studentVoice}</h3>
                  <div className="space-y-6">
                    {opinionsByCategory[0]?.length ? (
                      opinionsByCategory[0].map((opinion) => (
                        <OpinionCard key={opinion.id} opinion={opinion} />
                      ))
                    ) : (
                      <p className="text-muted-foreground font-semibold">{tt.noOpinionsInCategory}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase mb-4">{tt.universityView}</h3>
                  <UniversityViewPanel categoryId={0} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Geometric decoration */}
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-5 gap-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 ${i % 2 === 0 ? "bg-black" : "border-2 border-black"}`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
