import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Lightbulb, ChevronDown, ChevronUp, Crown, Flag } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOpinionEvents } from "@/hooks/useOpinionEvents";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";


// Solution vote percentage display
function SolutionVotePercentage({ support, oppose, pass }: { support: number; oppose: number; pass: number }) {
  const total = support + oppose + pass;
  if (total === 0) {
    return <span className="text-xs text-muted-foreground">投票なし</span>;
  }
  
  const supportPercent = Math.round((support / total) * 100);
  const opposePercent = Math.round((oppose / total) * 100);
  const passPercent = Math.round((pass / total) * 100);
  
  return (
    <div className="flex flex-wrap gap-1 text-xs font-bold">
      <span className="text-blue-600">支持 {supportPercent}%</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-orange-600">不支持 {opposePercent}%</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-gray-500">パス {passPercent}%</span>
      <span className="text-muted-foreground ml-1">({total}票)</span>
    </div>
  );
}

export default function OpinionDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const opinionId = parseInt(params.id || "0");
  const { t, language } = useLanguage();
  
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<{ proposerRank: number } | null>(null);
  
  // Fetch opinion details
  const { data: opinion, isLoading, refetch: refetchOpinion } = trpc.opinions.getById.useQuery(
    { id: opinionId },
    {
      enabled: opinionId > 0,
      placeholderData: (previousData) => previousData,
    }
  );

  // Fetch solutions for this opinion
  const { data: solutions, refetch: refetchSolutions } = trpc.solutions.getByOpinionId.useQuery(
    { opinionId },
    {
      enabled: opinionId > 0,
      placeholderData: (previousData) => previousData,
    }
  );

  // Invalidate caches instantly when admin performs a moderation action
  useOpinionEvents();
  
  const utils = trpc.useUtils();
  
  // Vote mutation for solution with optimistic update
  const solutionVoteMutation = trpc.solutions.vote.useMutation({
    onMutate: async ({ solutionId, voteType }) => {
      await utils.solutions.getByOpinionId.cancel({ opinionId });
      const previousSolutions = utils.solutions.getByOpinionId.getData({ opinionId });
      if (previousSolutions) {
        utils.solutions.getByOpinionId.setData({ opinionId }, previousSolutions.map(sol => {
          if (sol.id === solutionId) {
            return {
              ...sol,
              supportCount: voteType === "support" ? sol.supportCount + 1 : sol.supportCount,
              opposeCount: voteType === "oppose" ? sol.opposeCount + 1 : sol.opposeCount,
              passCount: voteType === "pass" ? sol.passCount + 1 : sol.passCount,
            };
          }
          return sol;
        }));
      }
      return { previousSolutions };
    },
    onSuccess: () => {
      toast.success("解決策に投票しました！");
    },
    onError: (error, variables, context) => {
      if (context?.previousSolutions) {
        utils.solutions.getByOpinionId.setData({ opinionId }, context.previousSolutions);
      }
      toast.error(error.message || "投票に失敗しました");
    },
    onSettled: () => {
      utils.solutions.getByOpinionId.invalidate({ opinionId });
    },
  });
  
  // Vote mutation for opinion (original solution) with optimistic update
  const opinionVoteMutation = trpc.opinions.vote.useMutation({
    onMutate: async ({ voteType }) => {
      await utils.opinions.getById.cancel({ id: opinionId });
      const previousOpinion = utils.opinions.getById.getData({ id: opinionId });
      if (previousOpinion) {
        utils.opinions.getById.setData({ id: opinionId }, {
          ...previousOpinion,
          agreeCount: voteType === "agree" ? previousOpinion.agreeCount + 1 : previousOpinion.agreeCount,
          disagreeCount: voteType === "disagree" ? previousOpinion.disagreeCount + 1 : previousOpinion.disagreeCount,
          passCount: voteType === "pass" ? previousOpinion.passCount + 1 : previousOpinion.passCount,
        });
      }
      return { previousOpinion };
    },
    onSuccess: () => {
      toast.success("投稿者の解決策に投票しました！");
    },
    onError: (error, variables, context) => {
      if (context?.previousOpinion) {
        utils.opinions.getById.setData({ id: opinionId }, context.previousOpinion);
      }
      toast.error(error.message || "投票に失敗しました");
    },
    onSettled: () => {
      utils.opinions.getById.invalidate({ id: opinionId });
    },
  });
  
  // ベスト解決策: 支持率が最も高い解決策 (3票以上のもの)
  const bestSolutionId = useMemo(() => {
    if (!solutions || solutions.length === 0) return null;
    let best: { id: number; rate: number } | null = null;
    for (const sol of solutions) {
      const total = sol.supportCount + sol.opposeCount + sol.passCount;
      if (total < 3) continue;
      const rate = sol.supportCount / total;
      if (!best || rate > best.rate) best = { id: sol.id, rate };
    }
    return best?.id ?? null;
  }, [solutions]);

  // Create solution mutation with optimistic update
  const createSolutionMutation = trpc.solutions.create.useMutation({
    onSuccess: () => {
      // 投稿者の順位: 元の投稿者(1) + 承認済み解決策数 + 自分
      const proposerRank = (solutions?.length ?? 0) + 2;
      setSubmittedFeedback({ proposerRank });
      setTimeout(() => setSubmittedFeedback(null), 6000);
      setProposalTitle("");
      setProposalDescription("");
      setIsProposalOpen(false);
      utils.solutions.getByOpinionId.invalidate({ opinionId });
    },
    onError: (error) => {
      toast.error(error.message || "提案に失敗しました");
    },
  });
  
  const handleSolutionVote = (solutionId: number, voteType: "support" | "oppose" | "pass") => {
    solutionVoteMutation.mutate({ solutionId, voteType });
  };
  
  const handleOpinionVote = (voteType: "support" | "oppose" | "pass") => {
    // Map solution vote types to opinion vote types
    const opinionVoteType = voteType === "support" ? "agree" : voteType === "oppose" ? "disagree" : "pass";
    opinionVoteMutation.mutate({ opinionId, voteType: opinionVoteType });
  };
  
  const handleSubmitProposal = async () => {
    if (!proposalTitle.trim() || !proposalDescription.trim()) {
      toast.error("タイトルと説明を入力してください");
      return;
    }
    
    if (proposalTitle.length < 10) {
      toast.error("タイトルは10文字以上で入力してください");
      return;
    }
    
    if (proposalDescription.length < 10) {
      toast.error("説明は10文字以上で入力してください");
      return;
    }
    
    setIsSubmittingProposal(true);
    try {
      await createSolutionMutation.mutateAsync({
        opinionId,
        title: proposalTitle,
        description: proposalDescription,
      });
    } finally {
      setIsSubmittingProposal(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-xl font-bold">読み込み中...</div>
      </div>
    );
  }
  
  if (!opinion) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-xl font-bold">意見が見つかりません</div>
        <Button onClick={() => setLocation("/opinions")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          意見一覧に戻る
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="border-b-4 border-black p-3 sm:p-4">
        <div className="container flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/opinions")}
            className="font-bold"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="hidden sm:inline">意見一覧に戻る</span>
            <span className="sm:hidden">戻る</span>
          </Button>
        </div>
      </header>
      
      <main className="container py-4 sm:py-8 px-3 sm:px-4">
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, layout: { duration: 0.2 } }}
        >
          {/* Topic Card */}
          <div className="border-4 border-black p-4 sm:p-6">
            <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-black mt-2 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase">
                  トピック（問題文）
                </span>
                <h1 className="text-lg sm:text-2xl font-black mt-1">
                  {opinion.problemStatement || opinion.transcription?.substring(0, 100) || "（タイトルなし）"}
                </h1>
              </div>
            </div>
          </div>

          {/* Solutions Section */}
          <div className="border-4 border-black p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-black uppercase">解決策案</h2>
            </div>
            
            {/* Existing solutions */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {/* Original solution from opinion transcription */}
              {opinion.transcription && (
                <div className="border-2 border-black p-3 sm:p-4 bg-blue-50">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-black text-sm sm:text-base">案A（投稿者）:</span>
                    <span className="font-bold text-sm sm:text-base flex-1">{opinion.transcription}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">投稿者による解決策の提案</p>
                  
                  {/* Opinion vote percentage */}
                  <div className="mb-3">
                    <SolutionVotePercentage
                      support={opinion.agreeCount}
                      oppose={opinion.disagreeCount}
                      pass={opinion.passCount}
                    />
                  </div>
                  
                  {/* Opinion vote buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleOpinionVote("support")}
                      disabled={opinionVoteMutation.isPending}
                      size="sm"
                      className="brutalist-border font-bold text-xs"
                      variant="outline"
                    >
                      支持する
                    </Button>
                    <Button
                      onClick={() => handleOpinionVote("oppose")}
                      disabled={opinionVoteMutation.isPending}
                      size="sm"
                      className="brutalist-border font-bold text-xs"
                      variant="outline"
                    >
                      支持しない
                    </Button>
                    <Button
                      onClick={() => handleOpinionVote("pass")}
                      disabled={opinionVoteMutation.isPending}
                      size="sm"
                      className="brutalist-border font-bold text-xs"
                      variant="outline"
                    >
                      パス
                    </Button>
                  </div>
                </div>
              )}
              
              {solutions && solutions.length > 0 ? (
                solutions.map((solution, index) => {
                  const isBest = solution.id === bestSolutionId;
                  return (
                  <div
                    key={solution.id}
                    className={`border-2 p-3 sm:p-4 ${isBest ? "border-yellow-400 border-4 bg-yellow-50" : "border-black"}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="font-black text-sm sm:text-base">案{String.fromCharCode(66 + index)}:</span>
                      <span className="font-bold text-sm sm:text-base flex-1">{solution.title}</span>
                      {isBest && (
                        <span className="flex items-center gap-1 text-xs font-black bg-yellow-400 text-black px-2 py-0.5 border-2 border-black flex-shrink-0">
                          <Crown className="w-3 h-3" />
                          ベスト
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">{solution.description}</p>
                    
                    {/* Solution vote percentage */}
                    <div className="mb-3">
                      <SolutionVotePercentage
                        support={solution.supportCount}
                        oppose={solution.opposeCount}
                        pass={solution.passCount}
                      />
                    </div>
                    
                    {/* Solution vote buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleSolutionVote(solution.id, "support")}
                        disabled={solutionVoteMutation.isPending}
                        size="sm"
                        className="brutalist-border font-bold text-xs"
                        variant="outline"
                      >
                        支持する
                      </Button>
                      <Button
                        onClick={() => handleSolutionVote(solution.id, "oppose")}
                        disabled={solutionVoteMutation.isPending}
                        size="sm"
                        className="brutalist-border font-bold text-xs"
                        variant="outline"
                      >
                        支持しない
                      </Button>
                      <Button
                        onClick={() => handleSolutionVote(solution.id, "pass")}
                        disabled={solutionVoteMutation.isPending}
                        size="sm"
                        className="brutalist-border font-bold text-xs"
                        variant="outline"
                      >
                        パス
                      </Button>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <p className="font-bold text-sm sm:text-base">まだ解決策が提案されていません</p>
                  <p className="text-xs sm:text-sm mt-1">最初の解決策を提案してみましょう！</p>
                </div>
              )}
            </div>
            
            {/* Proposal form (collapsible) */}
            <Collapsible open={isProposalOpen} onOpenChange={setIsProposalOpen}>
              <CollapsibleTrigger asChild>
                <Button className="w-full brutalist-border-thick font-black uppercase">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  解決策を提案する
                  {isProposalOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    解決策タイトル（大学が実行できる行動として）
                  </label>
                  <Input
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="例：ピーク時間はメニュー数を絞らず回転導線を変更"
                    className="brutalist-border font-semibold text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">10文字以上で入力してください</p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">
                    詳細説明
                  </label>
                  <Textarea
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="解決策の詳細を説明してください..."
                    className="brutalist-border font-semibold min-h-[100px] text-sm sm:text-base resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">10文字以上で入力してください</p>
                </div>
                <Button
                  onClick={handleSubmitProposal}
                  disabled={isSubmittingProposal || !proposalTitle.trim() || !proposalDescription.trim()}
                  className="w-full brutalist-border font-black uppercase bg-black text-white hover:bg-black/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmittingProposal ? "送信中..." : "提案を送信"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  ※ 提案は管理者の承認後に公開されます
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* 投稿後フィードバックバナー */}
            <AnimatePresence>
              {submittedFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 border-4 border-black bg-yellow-300 p-4"
                >
                  <p className="text-lg font-black">
                    🎉 あなたで{" "}
                    <span className="underline decoration-4">
                      {submittedFeedback.proposerRank}人目
                    </span>{" "}
                    の提案者です！
                  </p>
                  <p className="text-sm font-bold mt-1 text-black/70">
                    このテーマには現在{" "}
                    <span className="font-black text-black">
                      {(solutions?.length ?? 0) + 1}件
                    </span>{" "}
                    の解決策が集まっています。承認後に公開されます。
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 報告リンク */}
        <div className="mt-6 text-center">
          <a
            href={`mailto:ekvoice0@gmail.com?subject=${encodeURIComponent("不適切な投稿の報告 / Report: Opinion #" + opinionId)}&body=${encodeURIComponent("意見ID: " + opinionId + "\n報告理由:\n")}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors"
          >
            <Flag className="w-3 h-3" />
            {language === "ja" ? "この意見を報告する" : "Report this opinion"}
          </a>
        </div>
      </main>
    </div>
  );
}
