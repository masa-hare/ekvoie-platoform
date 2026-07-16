import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Download, Eye, EyeOff, History, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Status = "answered" | "checking" | "cannot_answer";
const statusLabels: Record<Status, string> = { answered: "回答済み", checking: "確認中", cannot_answer: "回答できない" };

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: categories, refetch: refetchCategories } = trpc.opinions.getCategories.useQuery();
  const { data: opinions, refetch: refetchOpinions } = trpc.admin.getAllOpinions.useQuery();
  const { data: themes, refetch: refetchThemes } = trpc.admin_themes.list.useQuery();
  const { data: views, refetch: refetchViews } = trpc.admin_universityViews.list.useQuery();
  const { data: deletionLogs, refetch: refetchLogs } = trpc.admin.getDeletionLogs.useQuery();
  const addCategory = trpc.admin.addCategory.useMutation();
  const deleteCategory = trpc.admin.deleteCategory.useMutation();
  const toggleFeedback = trpc.admin.toggleCategoryFeedback.useMutation();
  const createTheme = trpc.admin_themes.create.useMutation();
  const updateTheme = trpc.admin_themes.update.useMutation();
  const removeTheme = trpc.admin_themes.remove.useMutation();
  const assignOpinion = trpc.admin_themes.assignOpinion.useMutation();
  const moderateOpinion = trpc.admin.moderateOpinion.useMutation();
  const deleteOpinion = trpc.admin.deleteOpinion.useMutation();
  const exportOpinions = trpc.admin.exportOpinions.useQuery(undefined, { enabled: false });
  const createView = trpc.admin_universityViews.create.useMutation();
  const updateView = trpc.admin_universityViews.update.useMutation();
  const publishView = trpc.admin_universityViews.setApprovalStatus.useMutation();
  const removeView = trpc.admin_universityViews.delete.useMutation();
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [themeTitle, setThemeTitle] = useState("");
  const [editingTheme, setEditingTheme] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingView, setEditingView] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("checking");
  const [reason, setReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [historyTab, setHistoryTab] = useState<"hidden" | "deleted">("hidden");
  const viewByTheme = useMemo(() => new Map((views ?? []).map(view => [view.themeId, view])), [views]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) navigate("/admin/login");
  }, [isAuthenticated, loading, navigate, user?.role]);
  if (loading) return <main className="grid min-h-screen place-items-center bg-white font-black">認証を確認中…</main>;
  if (!isAuthenticated || user?.role !== "admin") return null;

  const refresh = () => { void refetchCategories(); void refetchOpinions(); void refetchThemes(); void refetchViews(); void refetchLogs(); };
  const run = async (action: () => Promise<unknown>, message: string) => { try { await action(); toast.success(message); refresh(); } catch { toast.error("操作に失敗しました"); } };
  const beginView = (themeId: number) => { const view = viewByTheme.get(themeId); setEditingView(themeId); setBody(view?.body ?? ""); setStatus((view?.responseStatus as Status) ?? "checking"); setReason(view?.reason ?? ""); };
  const saveView = async () => {
    if (!editingView || !body.trim()) return toast.error("大学の見解・説明を入力してください");
    if (status === "cannot_answer" && !reason.trim()) return toast.error("「回答できない」には理由が必要です");
    const existing = viewByTheme.get(editingView);
    await run(() => existing ? updateView.mutateAsync({ id: existing.id, body: body.trim(), responseStatus: status, reason: status === "cannot_answer" ? reason.trim() : null }) : createView.mutateAsync({ themeId: editingView, body: body.trim(), responseStatus: status, reason: status === "cannot_answer" ? reason.trim() : undefined }), "大学の見解を下書き保存しました");
    setEditingView(null);
  };
  const downloadCsv = async () => { try { const result = await exportOpinions.refetch(); if (!result.data) throw new Error("No CSV data"); const url = URL.createObjectURL(new Blob(["\uFEFF" + result.data.csv], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "ekvoice-opinions.csv"; a.click(); URL.revokeObjectURL(url); } catch { toast.error("CSVの出力に失敗しました"); } };

  return <main className="min-h-screen bg-white p-4 sm:p-8"><div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black pb-5"><div><Button variant="ghost" className="px-0" onClick={() => navigate("/")}>← サイトへ戻る</Button><h1 className="mt-2 text-4xl font-black">管理画面</h1></div><Button className="border-2 border-black font-bold" variant="outline" onClick={() => void downloadCsv()}><Download className="mr-2 size-4" />CSV出力</Button></header>

    <section className="border-4 border-black p-5"><h2 className="text-2xl font-black">カテゴリー管理</h2><div className="mt-4 flex flex-wrap gap-2"><Input className="max-w-sm border-2 border-black" value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="新しいカテゴリー名" /><Button onClick={() => { if (categoryName.trim()) void run(() => addCategory.mutateAsync({ name: categoryName.trim() }), "カテゴリーを追加しました").then(() => setCategoryName("")); }}><Plus className="mr-1 size-4" />追加</Button></div><div className="mt-4 flex flex-wrap gap-2">{categories?.map(category => <div key={category.id} className="flex items-center gap-2 border-2 border-black px-3 py-2 text-sm font-bold"><span>{category.name}</span><button className="text-xs underline" onClick={() => void run(() => toggleFeedback.mutateAsync({ id: category.id, isFeedback: !category.isFeedback }), "カテゴリーを更新しました")}>{category.isFeedback ? "通常へ" : "フィードバック"}</button><button className="text-red-700" title="カテゴリーを削除" onClick={() => { if (confirm(`「${category.name}」を削除しますか？`)) void run(() => deleteCategory.mutateAsync({ id: category.id }), "カテゴリーを削除しました"); }}>×</button></div>)}</div></section>

    <section className="border-4 border-black p-5"><h2 className="text-2xl font-black">テーマ管理</h2><p className="mt-2 text-sm">大学の見解はテーマ単位で書き込みます。まずカテゴリーを選び、テーマを作成してください。</p><div className="mt-4 flex flex-wrap gap-2"><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="w-56 border-2 border-black"><SelectValue placeholder="カテゴリーを選択" /></SelectTrigger><SelectContent>{categories?.filter(category => !category.isFeedback).map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select><Input className="max-w-sm border-2 border-black" value={themeTitle} onChange={event => setThemeTitle(event.target.value)} placeholder="テーマ名" /><Button onClick={() => { if (categoryId && themeTitle.trim()) void run(() => createTheme.mutateAsync({ categoryId: Number(categoryId), title: themeTitle.trim() }), "テーマを作成しました").then(() => setThemeTitle("")); }}>作成</Button></div><div className="mt-5 space-y-2">{themes?.map(theme => <div key={theme.id} className="flex flex-wrap items-center gap-2 border-2 border-black p-3"><span className="text-xs text-muted-foreground">{categories?.find(category => category.id === theme.categoryId)?.name}</span>{editingTheme === theme.id ? <><Input className="max-w-sm border-2 border-black" value={editingTitle} onChange={event => setEditingTitle(event.target.value)} /><Button size="sm" onClick={() => void run(() => updateTheme.mutateAsync({ id: theme.id, title: editingTitle.trim() }), "テーマを更新しました").then(() => setEditingTheme(null))}>保存</Button></> : <><strong>{theme.title}</strong><Button size="sm" variant="outline" onClick={() => { setEditingTheme(theme.id); setEditingTitle(theme.title); }}>名前を編集</Button></>}<Button size="sm" variant="outline" className="text-red-700" onClick={() => { if (confirm("テーマを削除しますか？紐づく大学見解も削除され、意見は未分類に戻ります。")) void run(() => removeTheme.mutateAsync({ id: theme.id }), "テーマを削除しました"); }}><Trash2 className="size-4" /></Button></div>)}</div></section>

    <section className="border-4 border-black p-5"><h2 className="text-2xl font-black">大学側の見解・説明</h2><p className="mt-2 text-sm">テーマの「見解を書く」から下書きを作成します。公開は大学側からサイト外でOKを得た後に行ってください。</p><div className="mt-5 space-y-4">{themes?.map(theme => { const view = viewByTheme.get(theme.id); return <article key={theme.id} className="border-2 border-black p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{theme.title}</p><p className="text-xs text-muted-foreground">{categories?.find(category => category.id === theme.categoryId)?.name}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => beginView(theme.id)}>{view ? "編集" : "見解を書く"}</Button>{view && <Button variant="outline" size="sm" onClick={() => { if (view.approvalStatus === "draft" && !confirm("大学側から公開OKを得ていますか？")) return; void run(() => publishView.mutateAsync({ id: view.id, approvalStatus: view.approvalStatus === "draft" ? "published" : "draft" }), view.approvalStatus === "draft" ? "公開しました" : "下書きに戻しました"); }}>{view.approvalStatus === "draft" ? "公開する" : "下書きに戻す"}</Button>} {view && <Button variant="outline" size="sm" className="text-red-700" onClick={() => { if (confirm("この大学見解を削除しますか？")) void run(() => removeView.mutateAsync({ id: view.id }), "大学見解を削除しました"); }}><Trash2 className="size-4" /></Button>}</div></div>{editingView === theme.id ? <div className="mt-4 space-y-3"><Textarea className="min-h-32 border-2 border-black" value={body} onChange={event => setBody(event.target.value)} placeholder="大学が確認した現時点での説明・見解" /><Select value={status} onValueChange={value => setStatus(value as Status)}><SelectTrigger className="w-52 border-2 border-black"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(statusLabels) as Status[]).map(item => <SelectItem key={item} value={item}>{statusLabels[item]}</SelectItem>)}</SelectContent></Select>{status === "cannot_answer" && <Textarea className="border-2 border-black" value={reason} onChange={event => setReason(event.target.value)} placeholder="何が事情で、どこまで動けるか（必須）" />}<div className="flex gap-2"><Button onClick={() => void saveView()}>下書きを保存</Button><Button variant="outline" onClick={() => setEditingView(null)}>キャンセル</Button></div></div> : view ? <div className="mt-4"><span className="border-2 border-black px-2 py-1 text-xs font-bold">{view.approvalStatus === "published" ? "公開中" : "下書き"} · {statusLabels[view.responseStatus as Status]}</span><p className="mt-3 whitespace-pre-wrap leading-relaxed">{view.body}</p>{view.reason && <p className="mt-3 border-l-4 border-black pl-3 text-sm whitespace-pre-wrap">{view.reason}</p>}</div> : <p className="mt-3 text-sm text-muted-foreground">まだ大学見解はありません。</p>}</article>; })}</div></section>

    <section className="border-4 border-black p-5"><h2 className="text-2xl font-black">すべての意見・モデレーション</h2><div className="mt-5 space-y-3">{opinions?.map(opinion => <article key={opinion.id} className={`border-2 border-black p-4 ${!opinion.isVisible ? "opacity-50" : ""}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-2xl"><p className="text-xs font-bold text-muted-foreground">#{opinion.id} · {new Date(opinion.createdAt).toLocaleDateString("ja-JP")}</p>{opinion.problemStatement && <p className="mt-2 font-bold">{opinion.problemStatement}</p>}<p className="mt-2 whitespace-pre-wrap">{opinion.transcription}</p><p className="mt-3 text-sm font-bold">賛成: {opinion.agreeCount}　反対: {opinion.disagreeCount}</p></div><div className="flex flex-wrap gap-2"><Select value={opinion.themeId ? String(opinion.themeId) : "none"} onValueChange={value => void run(() => assignOpinion.mutateAsync({ opinionId: opinion.id, themeId: value === "none" ? null : Number(value) }), "テーマを割り当てました")}><SelectTrigger className="w-52 border-2 border-black"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">テーマなし</SelectItem>{themes?.filter(theme => theme.categoryId === opinion.categoryId).map(theme => <SelectItem key={theme.id} value={String(theme.id)}>{theme.title}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => void run(() => moderateOpinion.mutateAsync({ opinionId: opinion.id, isVisible: !opinion.isVisible }), opinion.isVisible ? "非表示にしました" : "再表示しました")}>{opinion.isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{opinion.isVisible ? " 非表示" : " 再表示"}</Button><Button size="sm" variant="outline" className="text-red-700" onClick={() => setDeleteTarget(opinion.id)}><Trash2 className="mr-1 size-4" />削除</Button></div></div></article>)}</div></section>

    <section className="border-4 border-black p-5"><div className="flex items-center gap-2"><History className="size-6" /><h2 className="text-2xl font-black">モデレーション履歴</h2></div><div className="mt-4 flex gap-2"><Button variant={historyTab === "hidden" ? "default" : "outline"} onClick={() => setHistoryTab("hidden")}>非表示中 ({opinions?.filter(opinion => !opinion.isVisible).length ?? 0})</Button><Button variant={historyTab === "deleted" ? "default" : "outline"} onClick={() => setHistoryTab("deleted")}>削除済み ({deletionLogs?.length ?? 0})</Button></div>{historyTab === "hidden" ? <div className="mt-4 space-y-2">{opinions?.filter(opinion => !opinion.isVisible).map(opinion => <div key={opinion.id} className="border-2 border-black p-3">#{opinion.id}　{opinion.transcription}</div>)}</div> : <div className="mt-4 space-y-2">{deletionLogs?.map(log => <div key={log.id} className="border-2 border-black p-3 text-sm">意見 #{log.postId} · {new Date(log.deletedAt).toLocaleDateString("ja-JP")} {log.reason ? `· ${log.reason}` : ""}</div>)}</div>}</section>
  </div><AlertDialog open={deleteTarget !== null} onOpenChange={open => !open && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>意見を削除しますか？</AlertDialogTitle><AlertDialogDescription>削除すると元に戻せません。削除履歴には記録が残ります。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction className="bg-red-700" onClick={() => { if (deleteTarget) void run(() => deleteOpinion.mutateAsync({ opinionId: deleteTarget }), "意見を削除しました").then(() => setDeleteTarget(null)); }}>削除する</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></main>;
}
