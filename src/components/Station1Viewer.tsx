import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Zap, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface Station1ViewerProps {
  pageData?: any;
  onStartChallenge?: (customQuiz?: any[]) => void;
  currentPageIndex?: number;
  setCurrentPageIndex?: (index: number) => void;
  isTeacherEditMode?: boolean;
}

export const Station1Viewer: React.FC<Station1ViewerProps> = ({
  pageData,
  onStartChallenge,
  currentPageIndex = 0,
  setCurrentPageIndex,
  isTeacherEditMode
}) => {
  const hasPages = Array.isArray(pageData?.pages) && pageData.pages.length > 0;
  const activePageContent = hasPages ? pageData.pages[currentPageIndex] : pageData;

  const handleStartChallenge = () => {
    if (onStartChallenge) {
      onStartChallenge(); 
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {pageData?.title || 'Station Content'}
            </h2>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-10 text-gray-600 dark:text-gray-300">
            {activePageContent?.content ? (
              <div dangerouslySetInnerHTML={{ __html: activePageContent.content }} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-gray-400" />
                <p className="text-lg text-gray-500 dark:text-gray-400">Content modules are currently unavailable.</p>
              </div>
            )}
          </div>

          {onStartChallenge && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChallenge}
              className="group relative w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-white font-medium shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <div className="relative flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                <span>Start Challenge</span>
                <Sparkles className="w-4 h-4 ml-1 opacity-70" />
              </div>
            </motion.button>
          )}

          {isTeacherEditMode && (
            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-400">
              <Lock className="w-5 h-5" />
              <p className="text-sm font-medium">Teacher Edit Mode Active. Content is locked for editing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
