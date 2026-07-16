import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type Status = "answered" | "checking" | "cannot_answer";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: categories } = trpc.opinions.getCategories.useQuery();
  const { data: opinions, refetch: refreshOpinions } = trpc.admin.getAllOpinions.useQuery();
  const { data: themes, refetch: refreshThemes } = trpc.admin_themes.list.useQuery();
  const { data: views, refetch: refreshViews } = trpc.admin_universityViews.list.useQuery();
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [activeTheme, setActiveTheme] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("checking");
  const [reason, setReason] = useState("");
  const createTheme = trpc.admin_themes.create.useMutation();
  const deleteTheme = trpc.admin_themes.remove.useMutation();
  const assign = trpc.admin_themes.assignOpinion.useMutation();
  const moderate = trpc.admin.moderateOpinion.useMutation();
  const createView = trpc.admin_universityViews.create.useMutation();
  const updateView = trpc.admin_universityViews.update.useMutation();
  const setApproval = trpc.admin_universityViews.setApprovalStatus.useMutation();

  if (!isAuthenticated || user?.role !== "admin") { navigate("/admin/login"); return null; }
  const refresh = () => { void refreshThemes(); void refreshViews(); void refreshOpinions(); };
  const existing = activeTheme ? views?.find(view => view.themeId === activeTheme) : undefined;
  const start = (themeId: number) => { const view = views?.find(item => item.themeId === themeId); setActiveTheme(themeId); setBody(view?.body ?? ""); setStatus((view?.responseStatus as Status) ?? "checking"); setReason(view?.reason ?? ""); };
  const save = async () => { if (!activeTheme || !body.trim() || (status === "cannot_answer" && !reason.trim())) return; const input = { body: body.trim(), responseStatus: status, reason: status === "cannot_answer" ? reason.trim() : null }; if (existing) await updateView.mutateAsync({ id: existing.id, ...input }); else await createView.mutateAsync({ themeId: activeTheme, body: input.body, responseStatus: input.responseStatus, reason: input.reason ?? undefined }); setActiveTheme(null); refresh(); };

  return <main className="min-h-screen bg-white p-4 sm:p-8"><div className="mx-auto max-w-5xl space-y-8"><Button variant="outline" className="border-2 border-black" onClick={() => navigate("/")}>← 戻る</Button><h1 className="text-4xl font-black">管理</h1>
    <section className="border-4 border-black p-5"><h2 className="text-2xl font-black">テーマ（人手での保守的なまとめ）</h2><p className="mt-2 text-sm">AIは使いません。近い意見だけをまとめ、個々の意見は公開されたまま残ります。</p><div className="mt-4 flex flex-wrap gap-2"><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="w-52 border-2 border-black"><SelectValue placeholder="カテゴリー" /></SelectTrigger><SelectContent>{categories?.filter(c => !c.isFeedback).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><Input className="max-w-sm border-2 border-black" value={title} onChange={e => setTitle(e.target.value)} placeholder="テーマ名" /><Button onClick={() => { if (categoryId && title.trim()) void createTheme.mutateAsync({ categoryId: Number(categoryId), title: title.trim() }).then(() => { setTitle(""); refresh(); }); }}>作成</Button></div></section>
    <section className="space-y-4"><h2 className="text-2xl font-black">大学の見解・説明</h2><p className="text-sm">下書きを大学側がサイト外で確認した後だけ公開してください。公式な決定・約束ではありません。</p>{themes?.map(theme => { const view = views?.find(item => item.themeId === theme.id); return <article key={theme.id} className="border-4 border-black p-4"><div className="flex flex-wrap justify-between gap-3"><div><b>{theme.title}</b><p className="text-xs">{categories?.find(c => c.id === theme.categoryId)?.name}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => start(theme.id)}>{view ? "編集" : "下書き"}</Button>{view && <Button variant="outline" onClick={() => { if (view.approvalStatus === "draft" && !confirm("大学側から公開OKを得ていますか？")) return; void setApproval.mutateAsync({ id: view.id, approvalStatus: view.approvalStatus === "draft" ? "published" : "draft" }).then(refresh); }}>{view.approvalStatus === "draft" ? "公開" : "下書きへ"}</Button>}<Button variant="outline" className="text-red-700" onClick={() => { if (confirm("テーマを削除しますか？")) void deleteTheme.mutateAsync({ id: theme.id }).then(refresh); }}>削除</Button></div></div>{activeTheme === theme.id ? <div className="mt-4 space-y-3"><Textarea className="min-h-28 border-2 border-black" value={body} onChange={e => setBody(e.target.value)} placeholder="大学が確認した現時点での説明・見解" /><Select value={status} onValueChange={value => setStatus(value as Status)}><SelectTrigger className="w-48 border-2 border-black"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="answered">回答済み</SelectItem><SelectItem value="checking">確認中</SelectItem><SelectItem value="cannot_answer">回答できない</SelectItem></SelectContent></Select>{status === "cannot_answer" && <Textarea className="border-2 border-black" value={reason} onChange={e => setReason(e.target.value)} placeholder="何が事情で、どこまで動けるか（必須）" />}<Button onClick={() => void save()}>下書きを保存</Button></div> : view && <p className="mt-3 whitespace-pre-wrap">{view.body}</p>}</article>; })}</section>
    <section className="border-4 border-black p-5"><h2 className="text-2xl font-black">意見のテーマ割り当て・事後モデレーション</h2><div className="mt-4 space-y-3">{opinions?.map(opinion => <article key={opinion.id} className="border-2 border-black p-3"><p className="font-bold">{opinion.transcription}</p><div className="mt-3 flex flex-wrap gap-2"><Select value={opinion.themeId ? String(opinion.themeId) : "none"} onValueChange={value => void assign.mutateAsync({ opinionId: opinion.id, themeId: value === "none" ? null : Number(value) }).then(refresh)}><SelectTrigger className="w-56 border-2 border-black"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">テーマなし</SelectItem>{themes?.filter(theme => theme.categoryId === opinion.categoryId).map(theme => <SelectItem key={theme.id} value={String(theme.id)}>{theme.title}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => void moderate.mutateAsync({ opinionId: opinion.id, isVisible: !opinion.isVisible }).then(refresh)}>{opinion.isVisible ? "非表示" : "再表示"}</Button></div></article>)}</div></section>
  </div></main>;
}
