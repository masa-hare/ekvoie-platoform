import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown, Minus, Play, Trophy, TrendingUp, LayoutGrid, List, ChevronRight } from "lucide-react";
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

type SortType = "newest" | "mostVotes" | "highestApproval";

export default function Opinions() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "category">("list");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [votingOpinionIds, setVotingOpinionIds] = useState<Set<number>>(new Set());

  const { data: opinions, refetch } = trpc.opinions.list.useQuery(
    {
      categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
    },
    {
      placeholderData: (previousData) => previousData,
    }
  );

  const { data: categories } = trpc.opinions.getCategories.useQuery();
  const utils = trpc.useUtils();

  // Invalidate opinion cache instantly when admin performs a moderation action
  useOpinionEvents();
  
  const voteMutation = trpc.opinions.vote.useMutation({
    onMutate: async ({ opinionId, voteType }) => {
      await utils.opinions.list.cancel({ categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined });
      const previousOpinions = utils.opinions.list.getData({ categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined });
      if (previousOpinions) {
        utils.opinions.list.setData(
          { categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined },
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
      // サーバーから返された確定値でキャッシュを更新
      const previousOpinions = utils.opinions.list.getData({ categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined });
      if (previousOpinions && data.counts) {
        utils.opinions.list.setData(
          { categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined },
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
    onError: (error, variables, context) => {
      if (context?.previousOpinions) {
        utils.opinions.list.setData(
          { categoryId: categoryFilter && categoryFilter !== "all" ? parseInt(categoryFilter) : undefined },
          context.previousOpinions
        );
      }
      console.error("Vote error:", error);
      toast.error(t("opinions.voteError"));
    },
  });

  const isAdmin = user?.role === "admin";

  // Group opinions by category
  const opinionsByCategory = useMemo(() => {
    if (!opinions || !categories) return {};
    const grouped: Record<number, typeof opinions> = {};
    categories.forEach(cat => {
      grouped[cat.id] = opinions.filter(op => op.categoryId === cat.id);
    });
    // Add uncategorized
    grouped[0] = opinions.filter(op => !op.categoryId);
    return grouped;
  }, [opinions, categories]);

  // Sort opinions
  const sortedOpinions = useMemo(() => {
    if (!opinions) return [];
    const sorted = [...opinions];
    switch (sortType) {
      case "mostVotes":
        return sorted.sort((a, b) => 
          (b.agreeCount + b.disagreeCount + b.passCount) - (a.agreeCount + a.disagreeCount + a.passCount)
        );
      case "highestApproval":
        return sorted.sort((a, b) => {
          const totalA = a.agreeCount + a.disagreeCount;
          const totalB = b.agreeCount + b.disagreeCount;
          const rateA = totalA > 0 ? a.agreeCount / totalA : 0;
          const rateB = totalB > 0 ? b.agreeCount / totalB : 0;
          return rateB - rateA;
        });
      case "newest":
      default:
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [opinions, sortType]);

  // Get ranking for a category
  const getCategoryRanking = (categoryId: number) => {
    const categoryOpinions = categoryId === 0 
      ? opinions?.filter(op => !op.categoryId) || []
      : opinions?.filter(op => op.categoryId === categoryId) || [];
    
    return [...categoryOpinions].sort((a, b) => {
      const totalA = a.agreeCount + a.disagreeCount;
      const totalB = b.agreeCount + b.disagreeCount;
      const rateA = totalA > 0 ? a.agreeCount / totalA : 0;
      const rateB = totalB > 0 ? b.agreeCount / totalB : 0;
      return rateB - rateA;
    }).slice(0, 5);
  };

  const handleVote = (opinionId: number, voteType: "agree" | "disagree" | "pass") => {
    // 二重送信防止
    if (votingOpinionIds.has(opinionId)) {
      return;
    }
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

  const getApprovalRate = (opinion: { agreeCount: number; disagreeCount: number }) => {
    const total = opinion.agreeCount + opinion.disagreeCount;
    if (total === 0) return 0;
    return Math.round((opinion.agreeCount / total) * 100);
  };

  const translations = {
    en: {
      viewList: "LIST VIEW",
      viewCategory: "BY CATEGORY",
      sortNewest: "Newest",
      sortMostVotes: "Most Votes",
      sortHighestApproval: "Highest Approval",
      ranking: "RANKING",
      topOpinions: "TOP OPINIONS",
      approvalRate: "Approval Rate",
      uncategorized: "Uncategorized",
      noOpinionsInCategory: "No opinions in this category",
      topicLabel: "Topic (Problem Statement)",
      detailButton: "Details & Solutions",
    },
    ja: {
      viewList: "リスト表示",
      viewCategory: "カテゴリー別",
      sortNewest: "新着順",
      sortMostVotes: "投票数順",
      sortHighestApproval: "賛成率順",
      ranking: "ランキング",
      topOpinions: "トップ意見",
      approvalRate: "賛成率",
      uncategorized: "未分類",
      noOpinionsInCategory: "このカテゴリーには意見がありません",
      topicLabel: "トピック（問題文）",
      detailButton: "詳細・解決策を見る",
    },
  };

  const tt = translations[language];

  const OpinionCard = ({ opinion, index, showRank = false }: { opinion: any; index: number; showRank?: boolean }) => (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0 }}
      className="brutalist-border-thick p-4 sm:p-6"
    >
      {/* Opinion header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3 sm:gap-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            {showRank && (
              <div className="flex items-center gap-1 text-base sm:text-lg font-black">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                #{index + 1}
              </div>
            )}
            <div className="text-xs sm:text-sm font-bold text-muted-foreground">
              #{opinion.id} · {new Date(opinion.createdAt).toLocaleDateString("ja-JP")}
            </div>
          </div>
          {opinion.categoryId && (
            <div className="inline-block px-2 py-1 sm:px-3 border-2 border-black font-bold text-xs sm:text-sm mb-2">
              {categories?.find((c) => c.id === opinion.categoryId)?.name ?? "…"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-black">{getApprovalRate(opinion)}%</div>
            <div className="text-xs font-bold text-muted-foreground">{tt.approvalRate}</div>
          </div>

        </div>
      </div>

      {/* Topic (Problem Statement) */}
      <div className="mb-4 sm:mb-6">
        {opinion.problemStatement && (
          <div className="mb-3">
            <div className="text-xs sm:text-sm font-bold text-muted-foreground mb-1">{tt.topicLabel}</div>
            <p className="text-base sm:text-lg font-bold leading-relaxed border-l-4 border-black pl-3">
              {opinion.problemStatement}
            </p>
          </div>
        )}

      </div>

      {/* Vote counts */}
      <div className="flex gap-6 mb-4 text-base font-bold">
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

      {/* Vote buttons */}
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
      
      {/* Detail link */}
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
                onClick={() => setViewMode("list")}
                variant={viewMode === "list" ? "default" : "outline"}
                className="brutalist-border font-bold"
                size="sm"
              >
                <List className="w-4 h-4 mr-2" />
                {tt.viewList}
              </Button>
              <Button
                onClick={() => setViewMode("category")}
                variant={viewMode === "category" ? "default" : "outline"}
                className="brutalist-border font-bold"
                size="sm"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                {tt.viewCategory}
              </Button>
            </div>
          </div>

          {/* Filters */}
          {viewMode === "list" && (
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="brutalist-border font-bold w-48">
                  <SelectValue placeholder={t("opinions.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("opinions.all")}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortType} onValueChange={(v) => setSortType(v as SortType)}>
                <SelectTrigger className="brutalist-border font-bold w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{tt.sortNewest}</SelectItem>
                  <SelectItem value="mostVotes">{tt.sortMostVotes}</SelectItem>
                  <SelectItem value="highestApproval">{tt.sortHighestApproval}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8">
        {viewMode === "list" ? (
          // List view
          <>
            {!sortedOpinions || sortedOpinions.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl font-black mb-4">[ EMPTY ]</div>
                <p className="text-xl font-semibold">{t("opinions.noOpinions")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedOpinions.map((opinion, index) => (
                  <OpinionCard 
                    key={opinion.id} 
                    opinion={opinion} 
                    index={index}
                    showRank={sortType === "highestApproval" || sortType === "mostVotes"}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // Category view with tabs
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
                {/* Category Ranking */}
                <div className="mb-8 p-6 border-4 border-black bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-6 h-6" />
                    <h3 className="text-2xl font-black uppercase">{tt.ranking}: {cat.name}</h3>
                  </div>
                  <div className="space-y-3">
                    {getCategoryRanking(cat.id).length > 0 ? (
                      getCategoryRanking(cat.id).map((opinion, idx) => (
                        <div key={opinion.id} className="flex items-center gap-4 p-3 bg-white border-2 border-black">
                          <div className="text-2xl font-black w-8">#{idx + 1}</div>
                          <div className="flex-1">
                            <p className="font-semibold line-clamp-1">{opinion.problemStatement || opinion.transcription}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black">{getApprovalRate(opinion)}%</div>
                            <div className="text-xs text-muted-foreground">
                              {opinion.agreeCount + opinion.disagreeCount + opinion.passCount} votes
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground font-semibold">{tt.noOpinionsInCategory}</p>
                    )}
                  </div>
                </div>

                {/* All opinions in category */}
                <div className="space-y-6">
                  {opinionsByCategory[cat.id]?.map((opinion, index) => (
                    <OpinionCard key={opinion.id} opinion={opinion} index={index} />
                  ))}
                </div>
              </TabsContent>
            ))}

            {/* Uncategorized */}
            <TabsContent value="0">
              <div className="mb-8 p-6 border-4 border-black bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6" />
                  <h3 className="text-2xl font-black uppercase">{tt.ranking}: {tt.uncategorized}</h3>
                </div>
                <div className="space-y-3">
                  {getCategoryRanking(0).length > 0 ? (
                    getCategoryRanking(0).map((opinion, idx) => (
                      <div key={opinion.id} className="flex items-center gap-4 p-3 bg-white border-2 border-black">
                        <div className="text-2xl font-black w-8">#{idx + 1}</div>
                        <div className="flex-1">
                          <p className="font-semibold line-clamp-1">{opinion.problemStatement || opinion.transcription}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black">{getApprovalRate(opinion)}%</div>
                          <div className="text-xs text-muted-foreground">
                            {opinion.agreeCount + opinion.disagreeCount + opinion.passCount} votes
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground font-semibold">{tt.noOpinionsInCategory}</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {opinionsByCategory[0]?.map((opinion, index) => (
                  <OpinionCard key={opinion.id} opinion={opinion} index={index} />
                ))}
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
