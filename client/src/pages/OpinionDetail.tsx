import { ArrowLeft, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { OpinionReportButton } from "@/components/opinions/OpinionReportButton";

export default function OpinionDetail() {
  const [, params] = useRoute("/opinions/:id");
  const [, setLocation] = useLocation();
  const { language, t } = useLanguage();
  const opinionId = Number(params?.id);
  const { data: opinion, isLoading } = trpc.opinions.getById.useQuery(
    { id: opinionId },
    { enabled: Number.isFinite(opinionId) }
  );
  const utils = trpc.useUtils();
  const [voting, setVoting] = useState(false);
  const voteMutation = trpc.opinions.vote.useMutation({
    onSuccess: () => {
      void utils.opinions.getById.invalidate({ id: opinionId });
      toast.success(t("opinions.voteSuccess"));
    },
    onError: () => toast.error(t("opinions.voteError")),
    onSettled: () => setVoting(false),
  });
  const vote = (voteType: "agree" | "disagree") => {
    setVoting(true);
    voteMutation.mutate({ opinionId, voteType });
  };
  if (isLoading)
    return (
      <div className="min-h-screen bg-white p-12 text-center font-bold">
        Loading…
      </div>
    );
  if (!opinion)
    return (
      <div className="min-h-screen bg-white p-12 text-center font-bold">
        Not found
      </div>
    );
  const ja = language === "ja";
  return (
    <div className="min-h-[100dvh] bg-white">
      <header className="border-b-4 border-black">
        <div className="container flex items-center gap-3 px-4 py-5">
          <Button variant="ghost" onClick={() => setLocation("/opinions")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-black">
            {ja ? "意見の詳細" : "Opinion"}
          </h1>
        </div>
      </header>
      <main className="container max-w-3xl px-4 py-8">
        <article className="border-4 border-black p-6">
          <p className="mb-4 text-sm font-bold text-muted-foreground">
            #{opinion.id} ·{" "}
            {new Date(opinion.createdAt).toLocaleDateString(
              ja ? "ja-JP" : "en-US"
            )}
          </p>
          <p className="whitespace-pre-wrap text-lg leading-relaxed">
            {opinion.body}
          </p>
          <div className="mt-6 flex gap-5 font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="size-4" />
              {opinion.agreeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsDown className="size-4" />
              {opinion.disagreeCount}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {ja
              ? "数は順位や表示順には使われません。"
              : "These counts never affect ranking or display order."}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-2 border-black font-bold"
              disabled={voting}
              onClick={() => vote("agree")}
            >
              <ThumbsUp className="mr-2 size-4" />
              {t("opinions.agree")}
            </Button>
            <Button
              variant="outline"
              className="border-2 border-black font-bold"
              disabled={voting}
              onClick={() => vote("disagree")}
            >
              <ThumbsDown className="mr-2 size-4" />
              {t("opinions.disagree")}
            </Button>
          </div>
          <OpinionReportButton opinionId={opinion.id} ja={ja} />
        </article>
      </main>
    </div>
  );
}
