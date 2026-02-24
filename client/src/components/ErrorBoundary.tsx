import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details to console for debugging
    console.error("ErrorBoundary caught an error:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Component stack:", errorInfo.componentStack);
    
    // Suppress ResizeObserver loop limit exceeded errors
    // This is a benign error that doesn't affect functionality
    if (error.message && error.message.includes("ResizeObserver loop")) {
      console.warn("ResizeObserver loop limit exceeded (suppressed)");
      // Reset error state to prevent showing error boundary
      this.setState({ hasError: false, error: null });
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[100dvh] p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4 font-bold">予期しないエラーが発生しました</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              ページを再読み込みしてください。問題が解決しない場合は、管理者にお問い合わせください。
            </p>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6 max-h-64">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
