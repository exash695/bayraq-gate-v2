import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  private reloadAttempted = false;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Internal recovery initiated:", error, errorInfo);
    
    // Check if we've already tried to reload recently to avoid infinite loops
    const lastReload = sessionStorage.getItem('last_error_reload');
    const now = Date.now();
    
    if (!lastReload || (now - parseInt(lastReload) > 10000)) {
      sessionStorage.setItem('last_error_reload', now.toString());
      
      // Attempt silent recovery after a brief delay
      setTimeout(() => {
        this.handleReset();
      }, 2000);
    }
  }

  private handleReset = () => {
    try {
      // Only clear critical UI state to avoid losing all user data if possible,
      // but clear cache if it looks like a persistent error
      localStorage.removeItem('active_tab'); 
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[9999] overflow-hidden" dir="rtl">
          {/* Background Splashes & Effects (matching Premium Loading/Auth) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0A1024] to-[#050A18] pointer-events-none" />
          <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle at center, rgba(212,175,55,0.8) 1px, transparent 1px)', 
                 backgroundSize: '40px 40px'
               }} 
          />
          <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/15 via-transparent to-transparent opacity-80" />
          
          <div className="relative flex flex-col items-center justify-center w-full h-full z-10 p-6 text-center">
            {/* Premium Logo Presentation */}
            <div className="relative mb-12 flex flex-col items-center">
              <div className="absolute inset-0 bg-[#D4AF37]/10 blur-[60px] rounded-full scale-150 pointer-events-none" />
              <img 
                src="https://raw.githubusercontent.com/Arkan-M/Resources/main/Gate6/berq_logo.png" 
                alt="بوابة بيرق" 
                className="w-48 h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.3)] z-10 rounded-[25px] animate-pulse"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                style={{ 
                  maskImage: 'radial-gradient(circle at center, black 55%, transparent 100%)', 
                  WebkitMaskImage: 'radial-gradient(circle at center, black 55%, transparent 100%)' 
                }}
              />
              
              <div className="mt-12 space-y-4">
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#F59E0B] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
                  جاري تحسين تجربة التعلم...
                </h1>
                <p className="text-[#D4AF37]/60 text-sm font-bold tracking-wide">
                  نقوم الآن بضبط إعدادات "بوابة بيرق" لضمان أفضل أداء لك.
                </p>
              </div>

              {/* Elegant Loading Spinner */}
              <div className="mt-10 flex items-center justify-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-bounce" />
              </div>
            </div>

            {/* Bottom Golden Text */}
            <div className="absolute bottom-16 text-center w-full px-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
                <h2 className="text-xl md:text-2xl font-black text-white/40 tracking-widest uppercase">
                  GATE 6 - RECOVERY MODE
                </h2>
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
                
                <button
                  onClick={this.handleReset}
                  className="mt-4 text-[10px] text-white/10 hover:text-white/30 transition-colors uppercase tracking-widest cursor-pointer"
                >
                  إعادة التشغيل يدوياً
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

