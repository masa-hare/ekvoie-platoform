import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeletionReason =
  | "personal_information"
  | "harassment_or_hate"
  | "threat_or_illegal_content"
  | "off_topic_or_spam"
  | "other_policy_violation";

const deletionReasonLabels: Record<DeletionReason, string> = {
  personal_information: "個人情報の掲載",
  harassment_or_hate: "誹謗中傷・ヘイト",
  threat_or_illegal_content: "脅迫・違法行為の助長",
  off_topic_or_spam: "趣旨外・スパム",
  other_policy_violation: "その他の運営方針違反",
};

type ModerationOpinion = { id: number; body: string; isVisible: boolean };
type DeletionLog = {
  id: number;
  postId: number;
  reason: string | null;
  deletedAt: Date;
};

/** Kept separate from the editing controls so the audit view stays read-only. */
export function AdminModerationHistory({
  opinions,
  deletionLogs,
}: {
  opinions?: ModerationOpinion[];
  deletionLogs?: DeletionLog[];
}) {
  const [tab, setTab] = useState<"hidden" | "deleted">("hidden");
  const hiddenOpinions = opinions?.filter(opinion => !opinion.isVisible) ?? [];

  return (
    <section className="border-4 border-black p-5">
      <div className="flex items-center gap-2">
        <History className="size-6" />
        <h2 className="text-2xl font-black">モデレーション履歴</h2>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant={tab === "hidden" ? "default" : "outline"}
          onClick={() => setTab("hidden")}
        >
          非表示中 ({hiddenOpinions.length})
        </Button>
        <Button
          variant={tab === "deleted" ? "default" : "outline"}
          onClick={() => setTab("deleted")}
        >
          削除済み ({deletionLogs?.length ?? 0})
        </Button>
      </div>
      {tab === "hidden" ? (
        <div className="mt-4 space-y-2">
          {hiddenOpinions.map(opinion => (
            <div key={opinion.id} className="border-2 border-black p-3">
              #{opinion.id}　{opinion.body}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {deletionLogs?.map(log => (
            <div key={log.id} className="border-2 border-black p-3 text-sm">
              意見 #{log.postId} ·{" "}
              {new Date(log.deletedAt).toLocaleDateString("ja-JP")}
              {log.reason
                ? ` · ${deletionReasonLabels[log.reason as DeletionReason]}`
                : ""}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
