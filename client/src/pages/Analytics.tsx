import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, Users, MessageSquare,
  CheckCircle2, Clock, Lightbulb, ThumbsUp, ArrowLeft,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const L = {
  ja: {
    error: "データの取得に失敗しました",
    back: "← ホームに戻る",
    title: "分析",
    subtitle: "投稿・投票のリアルタイム統計",
    approvedOpinions: "承認済み意見",
    approvedOpinionsSub: "公開中の投稿",
    pending: "承認待ち",
    pendingSub: "審査中の投稿",
    solutions: "解決策提案",
    solutionsSub: "承認済みの提案",
    solutionVotes: "解決策への投票",
    solutionVotesSub: "支持票の合計",
    totalVotes: "総投票数",
    totalVotesSub: "全意見への投票",
    agreeRate: "平均賛成率",
    agreeRateSub: "全投票中の賛成割合",
    uniqueVoters: "ユニーク投票者",
    uniqueVotersSub: "投票した匿名ユーザー数",
    uniqueSubmitters: "ユニーク投稿者",
    uniqueSubmittersSub: "意見を投稿した人数",
    voteDistTitle: "投票分布",
    agree: "賛成",
    disagree: "反対",
    pass: "パス",
    categoryTitle: "カテゴリー別",
    categorySub: "承認済み意見の内訳",
    noData: "データがありません",
    agreeRateLabel: "賛成",
    topTitle: "注目意見 TOP 5",
    topSub: "投票数が多い意見",
    tooltipAgree: "賛成",
    tooltipTotal: "合計投票",
    trendTitle: "投稿トレンド",
    trendSub: "過去5週間の日別投稿数",
    tooltipPosts: "投稿数",
  },
  en: {
    error: "Failed to load data",
    back: "← Back to Home",
    title: "Analytics",
    subtitle: "Real-time post and vote statistics",
    approvedOpinions: "Approved Opinions",
    approvedOpinionsSub: "Published posts",
    pending: "Pending",
    pendingSub: "Awaiting review",
    solutions: "Solutions",
    solutionsSub: "Approved proposals",
    solutionVotes: "Solution Votes",
    solutionVotesSub: "Total support votes",
    totalVotes: "Total Votes",
    totalVotesSub: "Votes on all opinions",
    agreeRate: "Avg. Agree Rate",
    agreeRateSub: "Share of agree votes",
    uniqueVoters: "Unique Voters",
    uniqueVotersSub: "Anonymous users who voted",
    uniqueSubmitters: "Unique Submitters",
    uniqueSubmittersSub: "Users who posted opinions",
    voteDistTitle: "Vote Distribution",
    agree: "Agree",
    disagree: "Disagree",
    pass: "Pass",
    categoryTitle: "By Category",
    categorySub: "Approved opinions breakdown",
    noData: "No data available",
    agreeRateLabel: "Agree",
    topTitle: "Top 5 Opinions",
    topSub: "Most voted opinions",
    tooltipAgree: "Agree",
    tooltipTotal: "Total Votes",
    trendTitle: "Submission Trend",
    trendSub: "Daily posts over the past 5 weeks",
    tooltipPosts: "Posts",
  },
} as const;

function StatCard({
  title, value, sub, icon: Icon,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="brutalist-border p-5 bg-white">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</p>
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function Bar2({
  label, value, max, color, language,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  language: "ja" | "en";
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const formatted = language === "ja"
    ? `${value.toLocaleString()} 票（${pct}%）`
    : `${value.toLocaleString()} votes (${pct}%)`;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold truncate max-w-[60%]">{label}</span>
        <span className="text-sm text-gray-500">{formatted}</span>
      </div>
      <div className="w-full bg-gray-100 h-2 border border-black">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { data: stats, isLoading, error } = trpc.analytics.getStats.useQuery();
  const l = L[language];

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-10" />
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-10">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="brutalist-border p-8 text-center">
          <p className="font-bold text-lg mb-4">{l.error}</p>
          <button onClick={() => setLocation("/")} className="underline font-bold">{l.back}</button>
        </div>
      </div>
    );
  }

  const totalVotes = stats.votes.total;
  const agreeRate = totalVotes > 0 ? Math.round((stats.votes.agree / totalVotes) * 100) : 0;

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-5xl mx-auto px-4 py-10">

        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setLocation("/")} className="hover:opacity-60 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black uppercase">{l.title}</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8 ml-9">{l.subtitle}</p>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-4">
          <StatCard title={l.approvedOpinions} value={stats.opinions.total.toLocaleString()} sub={l.approvedOpinionsSub} icon={MessageSquare} />
          <StatCard title={l.pending} value={stats.opinions.pending.toLocaleString()} sub={l.pendingSub} icon={Clock} />
          <StatCard title={l.solutions} value={stats.solutions.total.toLocaleString()} sub={l.solutionsSub} icon={Lightbulb} />
          <StatCard title={l.solutionVotes} value={stats.solutions.totalSupportVotes.toLocaleString()} sub={l.solutionVotesSub} icon={CheckCircle2} />
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-10">
          <StatCard title={l.totalVotes} value={totalVotes.toLocaleString()} sub={l.totalVotesSub} icon={BarChart3} />
          <StatCard title={l.agreeRate} value={`${agreeRate}%`} sub={l.agreeRateSub} icon={ThumbsUp} />
          <StatCard title={l.uniqueVoters} value={stats.uniqueVoters.toLocaleString()} sub={l.uniqueVotersSub} icon={Users} />
          <StatCard title={l.uniqueSubmitters} value={stats.uniqueSubmitters.toLocaleString()} sub={l.uniqueSubmittersSub} icon={TrendingUp} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">{l.voteDistTitle}</h2>
            <p className="text-xs text-gray-500 mb-5">
              {language === "ja"
                ? `全意見への投票内訳（${totalVotes.toLocaleString()} 票）`
                : `Breakdown of all votes (${totalVotes.toLocaleString()} total)`}
            </p>
            <div className="space-y-4">
              <Bar2 label={l.agree} value={stats.votes.agree} max={totalVotes} color="bg-black" language={language} />
              <Bar2 label={l.disagree} value={stats.votes.disagree} max={totalVotes} color="bg-gray-400" language={language} />
              <Bar2 label={l.pass} value={stats.votes.pass} max={totalVotes} color="bg-gray-200" language={language} />
            </div>
          </div>

          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">{l.categoryTitle}</h2>
            <p className="text-xs text-gray-500 mb-5">{l.categorySub}</p>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400">{l.noData}</p>
            ) : (
              <div className="space-y-4">
                {stats.categoryBreakdown.map((item) => {
                  const pct = stats.opinions.total > 0
                    ? Math.round((item.count / stats.opinions.total) * 100)
                    : 0;
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold truncate max-w-[60%]">{item.category}</span>
                        <span className="text-sm text-gray-500">
                          {language === "ja" ? `${item.count} 件（${pct}%）` : `${item.count} (${pct}%)`}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-gray-100 h-2 border border-black">
                          <div className="bg-black h-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {l.agreeRateLabel} {item.agreeRate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">{l.topTitle}</h2>
            <p className="text-xs text-gray-500 mb-5">{l.topSub}</p>
            {stats.topOpinions.length === 0 ? (
              <p className="text-sm text-gray-400">{l.noData}</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.topOpinions} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="text"
                    width={120}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) =>
                      [v, name === "agreeCount" ? l.tooltipAgree : l.tooltipTotal]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="totalVotes" name={l.tooltipTotal} fill="#d1d5db">
                    {stats.topOpinions.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#000" : i === 1 ? "#374151" : "#9ca3af"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">{l.trendTitle}</h2>
            <p className="text-xs text-gray-500 mb-5">{l.trendSub}</p>
            {stats.weeklyTrend.length === 0 ? (
              <p className="text-sm text-gray-400">{l.noData}</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.weeklyTrend} margin={{ left: -20, right: 8 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v, l.tooltipPosts]} />
                  <Bar dataKey="count" name={l.tooltipPosts} fill="#000" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
