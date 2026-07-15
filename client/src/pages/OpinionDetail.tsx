import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOpinionEvents } from "@/hooks/useOpinionEvents";

// Neutral vote breakdown — a signal of resonance, not a ranking or a winner.
function VoteBreakdown({ agree, disagree, pass }: { agree: number; disagree: number; pass: number }) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const total = agree + disagree + pass;
  if (total === 0) {
    return <span className="text-xs text-muted-foreground">{ja ? "投票なし" : "No votes yet"}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 text-xs font-bold">
      <span className="text-blue-600">{ja ? "賛成" : "Agree"} {agree}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-orange-600">{ja ? "反対" : "Disagree"} {disagree}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-gray-500">{ja ? "パス" : "Pass"} {pass}</span>
      <span className="text-muted-foreground ml-1">({total}{ja ? "票" : " votes"})</span>
    </div>
  );
}

export default function OpinionDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const opinionId = parseInt(params.id || "0");
  const { language } = useLanguage();
  const ja = language === "ja";

  const { data: opinion, isLoading } = trpc.opinions.getById.useQuery(
    { id: opinionId },
    {
      enabled: opinionId > 0,
      placeholderData: (previousData) => previousData,
    }
  );

  // Invalidate caches instantly when admin performs a moderation action
  useOpinionEvents();

  const utils = trpc.useUtils();

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
      toast.success(ja ? "投票しました" : "Vote recorded");
    },
    onError: (error, _variables, context) => {
      if (context?.previousOpinion) {
        utils.opinions.getById.setData({ id: opinionId }, context.previousOpinion);
      }
      toast.error(error.message || (ja ? "投票に失敗しました" : "Vote failed"));
    },
    onSettled: () => {
      utils.opinions.getById.invalidate({ id: opinionId });
    },
  });

  const handleVote = (voteType: "agree" | "disagree" | "pass") => {
    opinionVoteMutation.mutate({ opinionId, voteType });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-xl font-bold">{ja ? "読み込み中..." : "Loading..."}</div>
      </div>
    );
  }

  if (!opinion) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-xl font-bold">{ja ? "意見が見つかりません" : "Opinion not found"}</div>
        <Button onClick={() => setLocation("/opinions")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {ja ? "意見一覧に戻る" : "Back to Opinions"}
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
            <span className="hidden sm:inline">{ja ? "意見一覧に戻る" : "Back to Opinions"}</span>
            <span className="sm:hidden">{ja ? "戻る" : "Back"}</span>
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
          {opinion.problemStatement && (
            <div className="border-4 border-black border-b-0 p-4 sm:p-6">
              <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase">
                {ja ? "背景" : "Context"}
              </span>
              <p className="font-bold mt-1">{opinion.problemStatement}</p>
            </div>
          )}

          <div className="border-4 border-black p-4 sm:p-6">
            <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase">
              {ja ? "意見" : "Opinion"}
            </span>
            <p className="text-lg sm:text-xl font-black mt-1 mb-4 sm:mb-6">
              {opinion.transcription}
            </p>

            <div className="mb-3 sm:mb-4">
              <VoteBreakdown
                agree={opinion.agreeCount}
                disagree={opinion.disagreeCount}
                pass={opinion.passCount}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleVote("agree")}
                disabled={opinionVoteMutation.isPending}
                size="sm"
                className="brutalist-border font-bold text-xs"
                variant="outline"
              >
                {ja ? "賛成" : "Agree"}
              </Button>
              <Button
                onClick={() => handleVote("disagree")}
                disabled={opinionVoteMutation.isPending}
                size="sm"
                className="brutalist-border font-bold text-xs"
                variant="outline"
              >
                {ja ? "反対" : "Disagree"}
              </Button>
              <Button
                onClick={() => handleVote("pass")}
                disabled={opinionVoteMutation.isPending}
                size="sm"
                className="brutalist-border font-bold text-xs"
                variant="outline"
              >
                {ja ? "パス" : "Pass"}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
