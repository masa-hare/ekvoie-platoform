import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        toast.success("ログインしました");
        // Force reload to refresh auth state
        window.location.href = "/admin";
      } else {
        toast.error("パスワードが正しくありません");
        setPassword("");
      }
    } catch {
      toast.error("ログインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="brutalist-border-thick p-8">
          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-6 h-6" />
            <h1 className="text-2xl font-black uppercase">管理者ログイン</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                className="w-full border-4 border-black px-4 py-3 font-bold text-lg focus:outline-none focus:ring-0"
                placeholder="••••••••••••••••"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password}
              className="brutalist-border-thick font-black uppercase w-full py-4 text-lg bg-black text-white hover:bg-black/90"
            >
              {isLoading ? "確認中..." : "ログイン"}
            </Button>
          </form>

          <button
            onClick={() => setLocation("/")}
            className="mt-6 text-sm font-bold text-muted-foreground hover:text-black transition-colors w-full text-center"
          >
            ← トップに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
