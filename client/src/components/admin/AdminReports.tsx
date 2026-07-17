import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const reasonLabels: Record<string, string> = {
  personal_information: "個人情報",
  harassment_or_hate: "誹謗中傷・ヘイト",
  threat_or_illegal_content: "脅迫・違法",
  other_policy_violation: "その他",
};
const statusLabels: Record<string, string> = {
  open: "未確認",
  reviewed: "確認済み",
  dismissed: "該当なし",
};

/** Isolated report queue so reporting operations do not complicate other admin areas. */
export function AdminReports() {
  const { data: reports, refetch } = trpc.admin.getOpinionReports.useQuery();
  const setStatus = trpc.admin.setOpinionReportStatus.useMutation({
    onSuccess: () => {
      toast.success("報告の状態を更新しました");
      void refetch();
    },
    onError: () => toast.error("更新に失敗しました"),
  });
  return (
    <section className="border-4 border-black p-5">
      <div className="flex items-center gap-2">
        <Flag className="size-6" />
        <h2 className="text-2xl font-black">投稿報告</h2>
      </div>
      <p className="mt-2 text-sm">
        報告者の情報や自由記述は保存されません。投稿ID・理由・時刻だけを確認します。
      </p>
      <div className="mt-4 space-y-2">
        {reports?.length ? (
          reports.map(report => (
            <div
              key={report.id}
              className="flex flex-wrap items-center justify-between gap-3 border-2 border-black p-3 text-sm"
            >
              <span>
                投稿 #{report.opinionId} · {reasonLabels[report.reason]} ·{" "}
                {new Date(report.createdAt).toLocaleDateString("ja-JP")}
              </span>
              <Select
                value={report.status}
                onValueChange={status =>
                  setStatus.mutate({
                    id: report.id,
                    status: status as "open" | "reviewed" | "dismissed",
                  })
                }
              >
                <SelectTrigger className="w-32 border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            まだ報告はありません。
          </p>
        )}
      </div>
    </section>
  );
}
