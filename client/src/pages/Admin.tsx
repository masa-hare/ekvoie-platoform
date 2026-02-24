import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Download, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
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
  const { data: pendingSolutions, refetch: refetchSolutions } = trpc.admin.getPendingSolutions.useQuery();
  const moderateMutation = trpc.admin.moderateOpinion.useMutation();
  const deleteMutation = trpc.admin.deleteOpinion.useMutation();
  const approveMutation = trpc.admin.approveOpinion.useMutation();
  const rejectMutation = trpc.admin.rejectOpinion.useMutation();
  const approveSolutionMutation = trpc.solutions.approve.useMutation();
  const rejectSolutionMutation = trpc.solutions.reject.useMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opinionToDelete, setOpinionToDelete] = useState<number | null>(null);


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

  const handleApprove = async (opinionId: number) => {
    try {
      await approveMutation.mutateAsync({ opinionId });
      toast.success(t("admin.approveSuccess"));
      refetch();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(t("admin.approveError"));
    }
  };

  const handleReject = async (opinionId: number) => {
    try {
      await rejectMutation.mutateAsync({ opinionId });
      toast.success(t("admin.rejectSuccess"));
      refetch();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error(t("admin.rejectError"));
    }
  };

  const handleApproveSolution = async (solutionId: number) => {
    try {
      await approveSolutionMutation.mutateAsync({ solutionId });
      toast.success(ja ? "解決策を承認しました" : "Solution approved");
      refetchSolutions();
    } catch (error) {
      console.error("Approve solution error:", error);
      toast.error(ja ? "解決策の承認に失敗しました" : "Failed to approve solution");
    }
  };

  const handleRejectSolution = async (solutionId: number) => {
    try {
      await rejectSolutionMutation.mutateAsync({ solutionId });
      toast.success(ja ? "解決策を非公開にしました" : "Solution hidden");
      refetchSolutions();
    } catch (error) {
      console.error("Reject solution error:", error);
      toast.error(ja ? "解決策の非公開に失敗しました" : "Failed to hide solution");
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

        {/* Pending Solutions */}
        {pendingSolutions && pendingSolutions.length > 0 && (
          <div className="brutalist-border-thick p-4 sm:p-8 mb-6 md:mb-12">
            <div className="brutalist-underline inline-block mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-3xl font-black uppercase">{ja ? "未承認の解決策" : "Pending Solutions"}</h3>
            </div>
            <div className="space-y-6">
              {pendingSolutions.map((solution: any) => (
                <div
                  key={solution.id}
                  className="border-4 border-black p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-1">
                        <div className="text-xs sm:text-sm font-bold text-muted-foreground mb-2">
                          #{solution.id} · {ja ? "意見ID" : "Opinion"}: {solution.opinionId} ·{" "}
                          {new Date(solution.createdAt).toLocaleDateString(ja ? "ja-JP" : "en-US")}
                        </div>
                        <div className="inline-block px-3 py-1 bg-yellow-500 text-black font-bold text-sm mb-3">
                          {ja ? "承認待ち" : "Pending"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveSolution(solution.id)}
                        className="brutalist-border font-black uppercase text-xs sm:text-sm bg-green-500 hover:bg-green-600 text-white"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {ja ? "承認" : "Approve"}
                      </Button>
                      <Button
                        onClick={() => handleRejectSolution(solution.id)}
                        className="brutalist-border font-black uppercase text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {ja ? "非公開" : "Hide"}
                      </Button>
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-base sm:text-lg font-black mb-1">{solution.title}</p>
                    <p className="text-sm sm:text-base text-muted-foreground">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                        {opinion.approvalStatus === "pending" && (
                          <div className="inline-block px-3 py-1 bg-yellow-500 text-black font-bold text-sm">
                            {ja ? "承認待ち" : "Pending"}
                          </div>
                        )}
                        {opinion.approvalStatus === "approved" && (
                          <div className="inline-block px-3 py-1 bg-green-500 text-white font-bold text-sm">
                            {ja ? "承認済み" : "Approved"}
                          </div>
                        )}
                        {opinion.approvalStatus === "rejected" && (
                          <div className="inline-block px-3 py-1 bg-red-500 text-white font-bold text-sm">
                            {ja ? "却下" : "Rejected"}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {opinion.approvalStatus === "pending" && (
                        <>
                          <Button
                            onClick={() => handleApprove(opinion.id)}
                            variant="outline"
                            className="brutalist-border font-bold bg-green-100"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {ja ? "承認" : "Approve"}
                          </Button>
                          <Button
                            onClick={() => handleReject(opinion.id)}
                            variant="outline"
                            className="brutalist-border font-bold bg-red-100"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-1" />
                            {ja ? "却下" : "Reject"}
                          </Button>
                        </>
                      )}
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
