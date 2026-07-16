import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, ChevronRight, CircleDashed, CircleSlash, LayoutGrid, List, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOpinionEvents } from "@/hooks/useOpinionEvents";
import { toast } from "sonner";

type ViewMode = "latest" | "contrast";
type ResponseStatus = "answered" | "checking" | "cannot_answer";

export default function Opinions({ initialView = "latest" }: { initialView?: ViewMode }) {
  const [, setLocation] = useLocation();
  const { language, t } = useLanguage();
  const ja = language === "ja";
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [votingIds, setVotingIds] = useState<Set<number>>(new Set());
  const categoryId = categoryFilter === "all" ? undefined : Number(categoryFilter);
  const listInput = { categoryId, includeFeedback: viewMode === "contrast" };

  const { data: opinions, isLoading } = trpc.opinions.list.useQuery(listInput, { placeholderData: previous => previous });
  const { data: categories } = trpc.opinions.getCategories.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();
  const { data: universityViews } = trpc.universityViews.list.useQuery();
  const utils = trpc.useUtils();
  useOpinionEvents();

  const voteMutation = trpc.opinions.vote.useMutation({
    onSuccess: () => {
      void utils.opinions.list.invalidate();
      toast.success(t("opinions.voteSuccess"));
    },
    onError: () => toast.error(t("opinions.voteError")),
  });

  const vote = (opinionId: number, voteType: "agree" | "disagree") => {
    if (votingIds.has(opinionId)) return;
    setVotingIds(previous => new Set(previous).add(opinionId));
    voteMutation.mutate({ opinionId, voteType }, { onSettled: () => setVotingIds(previous => {
      const next = new Set(previous); next.delete(opinionId); return next;
    }) });
  };

  const opinionByTheme = useMemo(() => {
    const map = new Map<number, NonNullable<typeof opinions>>();
    (themes ?? []).forEach(theme => map.set(theme.id, (opinions ?? []).filter(opinion => opinion.themeId === theme.id)));
    return map;
  }, [opinions, themes]);
  const viewByTheme = useMemo(() => new Map((universityViews ?? []).map(view => [view.themeId, view])), [universityViews]);

  const copy = ja ? {
    latest: "最新順", contrast: "カテゴリー／対照", loading: "読み込み中…", all: "すべてのカテゴリー",
    student: "学生の課題感", university: "大学の見解・説明", ungrouped: "まだテーマにまとめられていない意見",
    empty: "このカテゴリーには、まだ意見がありません。", noView: "このテーマについては、まだ大学の見解が公開されていません。",
    detail: "個別に見る", answered: "回答済み", checking: "確認中", cannot: "回答できない", reason: "事情と動かせる範囲",
  } : {
    latest: "Latest", contrast: "Categories / Contrast", loading: "Loading…", all: "All categories",
    student: "Students' concerns", university: "University view / explanation", ungrouped: "Opinions not yet grouped into a theme",
    empty: "There are no opinions in this category yet.", noView: "No university view has been published for this theme yet.",
    detail: "View individually", answered: "Answered", checking: "Checking", cannot: "Cannot answer now", reason: "Context and room to act",
  };

  const status = (responseStatus: ResponseStatus) => {
    const config = responseStatus === "answered"
      ? { Icon: CheckCircle2, label: copy.answered, className: "border-green-700 bg-green-50 text-green-800" }
      : responseStatus === "checking"
        ? { Icon: CircleDashed, label: copy.checking, className: "border-amber-700 bg-amber-50 text-amber-800" }
        : { Icon: CircleSlash, label: copy.cannot, className: "border-black bg-gray-100 text-black" };
    return config;
  };

  const OpinionCard = ({ opinion }: { opinion: NonNullable<typeof opinions>[number] }) => (
    <article className="border-4 border-black bg-white p-4 sm:p-5">
      <div className="mb-3 text-xs font-bold text-muted-foreground">#{opinion.id} · {new Date(opinion.createdAt).toLocaleDateString(ja ? "ja-JP" : "en-US")}</div>
      {opinion.problemStatement && <p className="mb-2 border-l-4 border-black pl-3 font-bold leading-relaxed">{opinion.problemStatement}</p>}
      <p className="whitespace-pre-wrap leading-relaxed">{opinion.transcription}</p>
      <div className="mt-4 flex gap-5 text-sm font-bold text-muted-foreground" aria-label={ja ? "投票数" : "Vote counts"}>
        <span className="inline-flex items-center gap-1"><ThumbsUp className="size-4" />{opinion.agreeCount}</span>
        <span className="inline-flex items-center gap-1"><ThumbsDown className="size-4" />{opinion.disagreeCount}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="border-2 border-black font-bold" disabled={votingIds.has(opinion.id)} onClick={() => vote(opinion.id, "agree")}><ThumbsUp className="mr-2 size-4" />{t("opinions.agree")}</Button>
        <Button variant="outline" className="border-2 border-black font-bold" disabled={votingIds.has(opinion.id)} onClick={() => vote(opinion.id, "disagree")}><ThumbsDown className="mr-2 size-4" />{t("opinions.disagree")}</Button>
      </div>
      <Button variant="ghost" className="mt-2 w-full font-bold" onClick={() => setLocation(`/opinions/${opinion.id}`)}>{copy.detail}<ChevronRight className="ml-1 size-4" /></Button>
    </article>
  );

  const UniversityPanel = ({ themeId }: { themeId: number }) => {
    const view = viewByTheme.get(themeId);
    if (!view) return <div className="border-4 border-dashed border-gray-300 p-5 font-semibold text-muted-foreground">{copy.noView}</div>;
    const item = status(view.responseStatus as ResponseStatus);
    return <article className="border-4 border-black bg-white p-5">
      <span className={`inline-flex items-center gap-1 border-2 px-2 py-1 text-xs font-black ${item.className}`}><item.Icon className="size-4" />{item.label}</span>
      <p className="mt-4 whitespace-pre-wrap leading-relaxed">{view.body}</p>
      {view.responseStatus === "cannot_answer" && view.reason && <div className="mt-4 border-t-2 border-black pt-3"><p className="mb-1 text-xs font-black uppercase">{copy.reason}</p><p className="whitespace-pre-wrap leading-relaxed">{view.reason}</p></div>}
    </article>;
  };

  const contrastCategories = (categories ?? []).filter(category => !category.isFeedback);
  return <div className="min-h-[100dvh] bg-white">
    <header className="border-b-4 border-black"><div className="container px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Button variant="ghost" className="p-2" onClick={() => setLocation("/")}><ArrowLeft className="size-6" /></Button><h1 className="text-3xl font-black sm:text-5xl">{ja ? "学生の声" : "Student voices"}</h1></div>
        <div className="flex gap-2"><Button variant={viewMode === "latest" ? "default" : "outline"} className="border-2 border-black font-bold" onClick={() => setViewMode("latest")}><List className="mr-1 size-4" />{copy.latest}</Button><Button variant={viewMode === "contrast" ? "default" : "outline"} className="border-2 border-black font-bold" onClick={() => setViewMode("contrast")}><LayoutGrid className="mr-1 size-4" />{copy.contrast}</Button></div>
      </div>
      {viewMode === "latest" && <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="mt-4 w-full border-2 border-black font-bold sm:w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{copy.all}</SelectItem>{contrastCategories.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select>}
    </div></header>
    <main className="container px-4 py-8">
      {isLoading ? <p className="py-24 text-center text-xl font-bold">{copy.loading}</p> : viewMode === "latest" ? <div className="space-y-5">{opinions?.length ? opinions.map(opinion => <OpinionCard key={opinion.id} opinion={opinion} />) : <p className="py-24 text-center font-bold">{t("opinions.noOpinions")}</p>}</div> :
        <Tabs defaultValue={String(contrastCategories[0]?.id ?? "none")}><TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-2 bg-transparent">{contrastCategories.map(category => <TabsTrigger key={category.id} value={String(category.id)} className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">{category.name}</TabsTrigger>)}</TabsList>
          {contrastCategories.map(category => { const categoryThemes = (themes ?? []).filter(theme => theme.categoryId === category.id); const ungrouped = (opinions ?? []).filter(opinion => opinion.categoryId === category.id && !opinion.themeId); return <TabsContent key={category.id} value={String(category.id)} className="space-y-8">{categoryThemes.map(theme => <section key={theme.id}><h2 className="mb-3 border-b-4 border-black pb-2 text-2xl font-black">{theme.title}</h2><div className="grid gap-0 border-4 border-black lg:grid-cols-2"><div className="border-b-4 border-black p-4 lg:border-b-0 lg:border-r-4"><h3 className="mb-4 font-black">{copy.student}</h3><div className="space-y-4">{(opinionByTheme.get(theme.id) ?? []).length ? opinionByTheme.get(theme.id)?.map(opinion => <OpinionCard key={opinion.id} opinion={opinion} />) : <p className="font-semibold text-muted-foreground">{copy.empty}</p>}</div></div><div className="p-4"><h3 className="mb-4 font-black">{copy.university}</h3><UniversityPanel themeId={theme.id} /></div></div></section>)}
            {ungrouped.length > 0 && <section><h2 className="mb-3 border-b-4 border-black pb-2 text-xl font-black">{copy.ungrouped}</h2><div className="space-y-4">{ungrouped.map(opinion => <OpinionCard key={opinion.id} opinion={opinion} />)}</div></section>}
            {!categoryThemes.length && !ungrouped.length && <p className="py-12 text-center font-bold text-muted-foreground">{copy.empty}</p>}</TabsContent>; })}
        </Tabs>}
    </main>
  </div>;
}
