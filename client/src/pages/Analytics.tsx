import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, Users, MessageSquare,
  CheckCircle2, Clock, Lightbulb, ThumbsUp, ArrowLeft,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function StatCard({
  title, value, sub, icon: Icon, accent = "black",
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
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

function Bar2({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold truncate max-w-[60%]">{label}</span>
        <span className="text-sm text-gray-500">{value.toLocaleString()} 票（{pct}%）</span>
      </div>
      <div className="w-full bg-gray-100 h-2 border border-black">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading, error } = trpc.analytics.getStats.useQuery();

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
          <p className="font-bold text-lg mb-4">データの取得に失敗しました</p>
          <button onClick={() => setLocation("/")} className="underline font-bold">← ホームに戻る</button>
        </div>
      </div>
    );
  }

  const totalVotes = stats.votes.total;
  const agreeRate = totalVotes > 0 ? Math.round((stats.votes.agree / totalVotes) * 100) : 0;
  const disagreeRate = totalVotes > 0 ? Math.round((stats.votes.disagree / totalVotes) * 100) : 0;
  const passRate = totalVotes > 0 ? Math.round((stats.votes.pass / totalVotes) * 100) : 0;

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setLocation("/")} className="hover:opacity-60 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black uppercase">分析</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8 ml-9">投稿・投票のリアルタイム統計</p>

        {/* 1列目: 投稿・解決策・人数系 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-4">
          <StatCard
            title="承認済み意見"
            value={stats.opinions.total.toLocaleString()}
            sub="公開中の投稿"
            icon={MessageSquare}
          />
          <StatCard
            title="承認待ち"
            value={stats.opinions.pending.toLocaleString()}
            sub="審査中の投稿"
            icon={Clock}
          />
          <StatCard
            title="解決策提案"
            value={stats.solutions.total.toLocaleString()}
            sub="承認済みの提案"
            icon={Lightbulb}
          />
          <StatCard
            title="解決策への投票"
            value={stats.solutions.totalSupportVotes.toLocaleString()}
            sub="支持票の合計"
            icon={CheckCircle2}
          />
        </div>

        {/* 2列目: 投票・参加者系 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-10">
          <StatCard
            title="総投票数"
            value={totalVotes.toLocaleString()}
            sub="全意見への投票"
            icon={BarChart3}
          />
          <StatCard
            title="平均賛成率"
            value={`${agreeRate}%`}
            sub="全投票中の賛成割合"
            icon={ThumbsUp}
          />
          <StatCard
            title="ユニーク投票者"
            value={stats.uniqueVoters.toLocaleString()}
            sub="投票した匿名ユーザー数"
            icon={Users}
          />
          <StatCard
            title="ユニーク投稿者"
            value={stats.uniqueSubmitters.toLocaleString()}
            sub="意見を投稿した人数"
            icon={TrendingUp}
          />
        </div>

        {/* 詳細グラフ 2×2 */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* 投票分布 */}
          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">投票分布</h2>
            <p className="text-xs text-gray-500 mb-5">全意見への投票内訳（{totalVotes.toLocaleString()} 票）</p>
            <div className="space-y-4">
              <Bar2 label="賛成" value={stats.votes.agree} max={totalVotes} color="bg-black" />
              <Bar2 label="反対" value={stats.votes.disagree} max={totalVotes} color="bg-gray-400" />
              <Bar2 label="パス" value={stats.votes.pass} max={totalVotes} color="bg-gray-200" />
            </div>
          </div>

          {/* カテゴリー別集計 */}
          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">カテゴリー別</h2>
            <p className="text-xs text-gray-500 mb-5">承認済み意見の内訳</p>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400">データがありません</p>
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
                        <span className="text-sm text-gray-500">{item.count} 件（{pct}%）</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-gray-100 h-2 border border-black">
                          <div className="bg-black h-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right">賛成 {item.agreeRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 注目意見 TOP 5 */}
          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">注目意見 TOP 5</h2>
            <p className="text-xs text-gray-500 mb-5">投票数が多い意見</p>
            {stats.topOpinions.length === 0 ? (
              <p className="text-sm text-gray-400">データがありません</p>
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
                      [v, name === "agreeCount" ? "賛成" : "合計投票"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="totalVotes" name="合計投票" fill="#d1d5db">
                    {stats.topOpinions.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#000" : i === 1 ? "#374151" : "#9ca3af"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 週別投稿トレンド */}
          <div className="brutalist-border p-6 bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">投稿トレンド</h2>
            <p className="text-xs text-gray-500 mb-5">過去5週間の日別投稿数</p>
            {stats.weeklyTrend.length === 0 ? (
              <p className="text-sm text-gray-400">データがありません</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.weeklyTrend} margin={{ left: -20, right: 8 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v, "投稿数"]} />
                  <Bar dataKey="count" name="投稿数" fill="#000" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
