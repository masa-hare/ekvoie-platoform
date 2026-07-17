export function UniversityViewFreshness({
  updatedAt,
  nextReviewAt,
  ja,
}: {
  updatedAt: Date;
  nextReviewAt?: Date | null;
  ja: boolean;
}) {
  const date = (value: Date) =>
    new Intl.DateTimeFormat(ja ? "ja-JP" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
  return (
    <p className="mt-4 border-t-2 border-black pt-3 text-xs font-semibold text-muted-foreground">
      {ja ? "最終更新" : "Last updated"}: {date(updatedAt)}
      {nextReviewAt
        ? `　/　${ja ? "次回確認予定" : "Next review planned"}: ${date(nextReviewAt)}`
        : ""}
    </p>
  );
}
