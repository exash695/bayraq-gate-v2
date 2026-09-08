import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModularErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ModularErrorBoundary Caught]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-[#080d1e]/80 border border-amber-500/20 rounded-2xl backdrop-blur-md text-center text-white"
          dir="rtl"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-black text-amber-300 mb-1">
            {this.props.fallbackTitle || "حدث تعذر مؤقت في تحميل هذا القسم"}
          </h3>
          <p className="text-xs text-white/60 max-w-md mb-5 leading-relaxed font-medium">
            {this.props.fallbackSubtitle ||
              "تم عزل الخطأ بنجاح للحفاظ على سلامة باقي المنصة وبياناتك."}
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <RefreshCw size={14} />
            <span>إعادة تحميل القسم</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ModularErrorBoundary;
