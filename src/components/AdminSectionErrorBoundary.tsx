import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw, LayoutGrid } from "lucide-react";

interface Props {
  children?: ReactNode;
  sectionName?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminSectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[AdminSectionErrorBoundary] Caught error in section ${this.props.sectionName || 'unknown'}:`, error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      const sectionTitle = this.props.sectionName || "هذا القسم";
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center space-y-6 my-auto max-w-lg mx-auto" dir="rtl">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
            <AlertCircle size={38} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black">
              <span>تنبيه القسم الإداري</span>
            </div>
            <h3 className="text-xl font-black text-white">
              تعذر تحميل محتوى {sectionTitle}
            </h3>
            <p className="text-xs text-white/60 leading-relaxed px-4">
              حدث خطأ مؤقت أثناء عرض بيانات هذا القسم. يمكنك الضغط على زر إعادة المحاولة لاسترجاع المحتوى فوراً دون مغادرة اللوحة.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
            >
              <RotateCcw size={15} />
              <span>إعادة المحاولة</span>
            </button>

            {this.props.onGoHome && (
              <button
                onClick={this.props.onGoHome}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <LayoutGrid size={15} className="text-amber-400" />
                <span>العودة للرئيسية</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
