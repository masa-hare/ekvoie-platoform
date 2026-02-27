import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Download, Trash2, X, History, Tag, Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const ja = language === "ja";

  const { data: opinions, refetch } = trpc.admin.getAllOpinions.useQuery();
  const { data: deletionLogs } = trpc.admin.getDeletionLogs.useQuery();
  const { data: categories, refetch: refetchCategories } = trpc.opinions.getCategories.useQuery();
  const [newCategoryName, setNewCategoryName] = useState("");
  const addCategoryMutation = trpc.admin.addCategory.useMutation();
  const deleteCategoryMutation = trpc.admin.deleteCategory.useMutation();
  const toggleFeedbackMutation = trpc.admin.toggleCategoryFeedback.useMutation();
  const moderateMutation = trpc.admin.moderateOpinion.useMutation();
  const deleteMutation = trpc.admin.deleteOpinion.useMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opinionToDelete, setOpinionToDelete] = useState<number | null>(null);
  const [historyTab, setHistoryTab] = useState<"hidden" | "deleted">("hidden");


  if (!isAuthenticated || user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const handleModerate = async (opinionId: number, isVisible: boolean) => {
    try {
      await moderateMutation.mutateAsync({ opinionId, isVisible });
      toast.success(t("admin.moderateSuccess"));
      refetch();
    } catch (error) {
      console.error("Moderation error:", error);
      toast.error(t("admin.moderateError"));
    }
  };

  const handleDelete = async () => {
    if (opinionToDelete === null) return;
    try {
      await deleteMutation.mutateAsync({ opinionId: opinionToDelete });
      toast.success(t("admin.deleteSuccess"));
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("admin.deleteError"));
    } finally {
      setDeleteDialogOpen(false);
      setOpinionToDelete(null);
    }
  };

  const openDeleteDialog = (opinionId: number) => {
    setOpinionToDelete(opinionId);
    setDeleteDialogOpen(true);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await addCategoryMutation.mutateAsync({ name });
      toast.success(ja ? "カテゴリーを追加しました" : "Category added");
      setNewCategoryName("");
      refetchCategories();
    } catch (error) {
      console.error("Add category error:", error);
      toast.error(ja ? "カテゴリーの追加に失敗しました" : "Failed to add category");
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(ja ? `「${name}」を削除しますか？` : `Delete category "${name}"?`)) return;
    try {
      await deleteCategoryMutation.mutateAsync({ id });
      toast.success(ja ? "カテゴリーを削除しました" : "Category deleted");
      refetchCategories();
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error(ja ? "カテゴリーの削除に失敗しました" : "Failed to delete category");
    }
  };

  const handleToggleFeedback = async (id: number, isFeedback: boolean) => {
    try {
      await toggleFeedbackMutation.mutateAsync({ id, isFeedback });
      toast.success(isFeedback
        ? (ja ? "フィードバックカテゴリーに設定しました" : "Set as feedback category")
        : (ja ? "通常カテゴリーに戻しました" : "Reset to normal category"));
      refetchCategories();
    } catch (error) {
      console.error("Toggle feedback error:", error);
      toast.error(ja ? "設定の変更に失敗しました" : "Failed to update category");
    }
  };

  const exportQuery = trpc.admin.exportOpinions.useQuery(undefined, { enabled: false });

  const handleExport = async () => {
    try {
      const result = await exportQuery.refetch();
      if (!result.data) {
        toast.error(ja ? "エクスポートに失敗しました" : "Export failed");
        return;
      }

      const blob = new Blob(["\ufeff" + result.data.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `opinions_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(t("admin.exportSuccess"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(ja ? "エクスポートに失敗しました" : "Export failed");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="container py-4 md:py-6 px-4">
          <div className="flex items-center gap-2 md:gap-4 mb-4">
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              className="font-bold p-2"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase">{t("admin.title")}</h2>
          </div>

          {/* Manage Platform section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="text-lg sm:text-2xl font-black uppercase">{t("admin.managePlatform")}</div>
            <Button
              onClick={handleExport}
              className="brutalist-border font-black uppercase text-sm"
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("admin.exportCsv")}
            </Button>

            {user && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm">{user.name || user.email}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 md:py-12 px-4">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutalist-border-thick p-4 sm:p-6"
          >
            <div className="text-2xl sm:text-4xl font-black mb-2">{opinions?.length || 0}</div>
            <div className="text-lg font-bold uppercase">{t("admin.totalOpinions")}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="brutalist-border-thick p-4 sm:p-6"
          >
            <div className="text-2xl sm:text-4xl font-black mb-2">
              {opinions?.filter((op) => op.isVisible).length || 0}
            </div>
            <div className="text-lg font-bold uppercase">{t("admin.visible")}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="brutalist-border-thick p-4 sm:p-6"
          >
            <div className="text-2xl sm:text-4xl font-black mb-2">
              {opinions?.filter((op) => !op.isVisible).length || 0}
            </div>
            <div className="text-lg font-bold uppercase">{t("admin.hidden")}</div>
          </motion.div>
        </div>

        {/* Category Management */}
        <div className="brutalist-border-thick p-4 sm:p-8 mb-6 md:mb-12">
          <div className="brutalist-underline inline-flex items-center gap-3 mb-6 sm:mb-8">
            <Tag className="w-6 h-6" />
            <h3 className="text-xl sm:text-3xl font-black uppercase">
              {ja ? "カテゴリー管理" : "Category Management"}
            </h3>
          </div>

          {/* Add new category */}
          <div className="flex gap-2 mb-6">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder={ja ? "新しいカテゴリー名" : "New category name"}
              className="brutalist-border font-bold max-w-xs"
              maxLength={100}
            />
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || addCategoryMutation.isPending}
              className="brutalist-border font-black uppercase"
            >
              <Plus className="w-4 h-4 mr-1" />
              {ja ? "追加" : "Add"}
            </Button>
          </div>

          {/* Category list */}
          {!categories || categories.length === 0 ? (
            <p className="text-muted-foreground font-bold">
              {ja ? "カテゴリーがありません" : "No categories yet"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2 border-4 px-3 py-2 font-bold ${cat.isFeedback ? "border-blue-500 bg-blue-50" : "border-black"}`}
                >
                  {cat.isFeedback && (
                    <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 font-black">
                      {ja ? "FB" : "FB"}
                    </span>
                  )}
                  <span>{cat.name}</span>
                  <button
                    onClick={() => handleToggleFeedback(cat.id, !cat.isFeedback)}
                    className={`text-xs font-bold px-1.5 py-0.5 border-2 ${cat.isFeedback ? "border-blue-500 text-blue-600 hover:bg-blue-100" : "border-gray-400 text-gray-500 hover:bg-gray-100"}`}
                    title={cat.isFeedback ? (ja ? "通常カテゴリーに戻す" : "Reset to normal") : (ja ? "フィードバックに設定" : "Set as feedback")}
                  >
                    {cat.isFeedback ? (ja ? "解除" : "Unset") : (ja ? "FB設定" : "Set FB")}
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="text-red-500 hover:text-red-700 ml-1"
                    title={ja ? "削除" : "Delete"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Opinions list */}
        <div className="brutalist-border-thick p-4 sm:p-8">
          <div className="brutalist-underline inline-block mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-3xl font-black uppercase">{ja ? "すべての意見" : "All Opinions"}</h3>
          </div>

          {!opinions || opinions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl font-semibold">{ja ? "意見がありません" : "No opinions yet"}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {opinions.map((opinion) => (
                <div
                  key={opinion.id}
                  className={`border-4 border-black p-4 sm:p-6 ${!opinion.isVisible ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-1">
                        <div className="text-xs sm:text-sm font-bold text-muted-foreground mb-2">
                          #{opinion.id} · {opinion.userId ? `User ${opinion.userId}` : (ja ? "匿名" : "Anonymous")} ·{" "}
                          {new Date(opinion.createdAt).toLocaleDateString(ja ? "ja-JP" : "en-US")}
                        </div>
                        <div className="flex gap-2">
                          {!opinion.isVisible && (
                            <div className="inline-block px-3 py-1 bg-black text-white font-bold text-sm">
                              {ja ? "非表示" : "Hidden"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleModerate(opinion.id, !opinion.isVisible)}
                        variant="outline"
                        className="brutalist-border font-bold"
                        size="sm"
                      >
                        {opinion.isVisible ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            {t("admin.hide")}
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            {t("admin.show")}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => openDeleteDialog(opinion.id)}
                        variant="outline"
                        className="brutalist-border font-bold text-red-600 hover:bg-red-600 hover:text-white"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("admin.delete")}
                      </Button>
                    </div>
                  </div>

                  {/* Problem Statement (Topic) */}
                  {opinion.problemStatement && (
                    <div className="mb-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{ja ? "トピック（問題文）" : "Topic (Problem)"}</span>
                      <p className="text-base sm:text-lg font-bold mt-1">{opinion.problemStatement}</p>
                    </div>
                  )}
                  
                  {/* Solution */}
                  <div className="mb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{ja ? "解決策" : "Solution"}</span>
                    <p className="text-base sm:text-lg font-semibold mt-1">{opinion.transcription}</p>
                  </div>

                  <div className="flex gap-6 text-sm font-bold">
                    <span>{ja ? "賛成" : "Agree"}: {opinion.agreeCount}</span>
                    <span>{ja ? "反対" : "Disagree"}: {opinion.disagreeCount}</span>
                    <span>{ja ? "パス" : "Pass"}: {opinion.passCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Moderation History */}
        <div className="brutalist-border-thick p-4 sm:p-8 mt-6 md:mt-12">
          <div className="brutalist-underline inline-flex items-center gap-3 mb-6 sm:mb-8">
            <History className="w-6 h-6" />
            <h3 className="text-xl sm:text-3xl font-black uppercase">
              {ja ? "モデレーション履歴" : "Moderation History"}
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 border-b-4 border-black">
            {(["hidden", "deleted"] as const).map((tab) => {
              const label =
                tab === "hidden"
                  ? ja ? `非表示中 (${opinions?.filter(op => !op.isVisible).length ?? 0})` : `Hidden (${opinions?.filter(op => !op.isVisible).length ?? 0})`
                  : ja ? `削除済み (${deletionLogs?.length ?? 0})` : `Deleted (${deletionLogs?.length ?? 0})`;
              return (
                <button
                  key={tab}
                  onClick={() => setHistoryTab(tab)}
                  className={`px-4 py-2 font-black uppercase text-sm border-t-4 border-x-4 border-black transition-colors ${
                    historyTab === tab ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Hidden */}
          {historyTab === "hidden" && (
            <div className="space-y-4">
              {!opinions?.filter(op => !op.isVisible).length ? (
                <p className="text-muted-foreground font-bold">{ja ? "非表示の意見はありません" : "No hidden opinions"}</p>
              ) : (
                opinions!.filter(op => !op.isVisible).map((op) => (
                  <div key={op.id} className="border-2 border-black p-4 opacity-75">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-muted-foreground mb-1">
                          #{op.id} · {new Date(op.createdAt).toLocaleDateString(ja ? "ja-JP" : "en-US")}
                        </div>
                        <p className="font-bold text-sm mb-1">{op.problemStatement || "—"}</p>
                        <p className="text-sm text-muted-foreground">{op.transcription}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="brutalist-border font-bold shrink-0"
                        onClick={() => handleModerate(op.id, true)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {ja ? "再表示" : "Restore"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Deleted */}
          {historyTab === "deleted" && (
            <div className="space-y-4">
              {!deletionLogs?.length ? (
                <p className="text-muted-foreground font-bold">{ja ? "削除済みの記録はありません" : "No deletion records"}</p>
              ) : (
                deletionLogs.map((log) => {
                  let preview = "";
                  try {
                    const parsed = JSON.parse(log.content);
                    preview = parsed.preview || "";
                  } catch {
                    preview = "";
                  }
                  return (
                    <div key={log.id} className="border-2 border-black p-4 bg-gray-50">
                      <div className="text-xs font-bold text-muted-foreground mb-1">
                        {log.postType === "opinion" ? (ja ? "意見" : "Opinion") : (ja ? "解決策" : "Solution")} #{log.postId}
                        {" · "}
                        {new Date(log.deletedAt).toLocaleDateString(ja ? "ja-JP" : "en-US")}
                      </div>
                      {preview && (
                        <p className="text-sm font-bold mb-1 text-gray-700">「{preview}…」</p>
                      )}
                      {log.reason && (
                        <p className="text-xs text-muted-foreground">
                          {ja ? "理由: " : "Reason: "}{log.reason}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Geometric decoration */}
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-3 gap-4">
            <div className="w-16 h-16 bg-black" />
            <div className="w-16 h-16 border-4 border-black" />
            <div className="w-16 h-16 bg-black" />
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("admin.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
