import { Flag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ReportReason =
  | "personal_information"
  | "harassment_or_hate"
  | "threat_or_illegal_content"
  | "other_policy_violation";

const labels: Record<ReportReason, string> = {
  personal_information: "個人情報が含まれている",
  harassment_or_hate: "誹謗中傷・ヘイトが含まれている",
  threat_or_illegal_content: "脅迫・違法行為の助長が含まれている",
  other_policy_violation: "その他の運営方針違反",
};

/** A report records only a post ID and a fixed reason — never reporter data or free text. */
export function OpinionReportButton({
  opinionId,
  compact = false,
  ja = true,
}: {
  opinionId: number;
  compact?: boolean;
  ja?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("personal_information");
  const report = trpc.opinions.report.useMutation({
    onSuccess: () => {
      toast.success(
        ja
          ? "報告を受け付けました。運営が確認します。"
          : "Your report has been received."
      );
      setOpen(false);
    },
    onError: () =>
      toast.error(
        ja
          ? "報告を送信できませんでした。時間をおいて再度お試しください。"
          : "Could not send the report. Please try again later."
      ),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="mr-1 size-4" />
          {compact
            ? ja
              ? "報告"
              : "Report"
            : ja
              ? "この投稿を報告"
              : "Report this opinion"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {ja ? "投稿を報告" : "Report an opinion"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {ja
              ? "理由だけを送信します。あなたの名前・連絡先・自由記述は保存しません。"
              : "Only the selected reason is sent. We do not store your name, contact details, or free-text report."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Select
          value={reason}
          onValueChange={value => setReason(value as ReportReason)}
        >
          <SelectTrigger className="border-2 border-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(labels) as ReportReason[]).map(item => (
              <SelectItem key={item} value={item}>
                {labels[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AlertDialogFooter>
          <AlertDialogCancel>{ja ? "キャンセル" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            disabled={report.isPending}
            onClick={() => report.mutate({ opinionId, reason })}
          >
            {ja ? "報告を送信" : "Send report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
