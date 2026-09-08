import React from "react";
import { ModularErrorBoundary } from "../shared/ModularErrorBoundary";

export interface TeacherViewWrapperProps {
  children: React.ReactNode;
  title?: string;
  onReset?: () => void;
}

export const TeacherViewWrapper: React.FC<TeacherViewWrapperProps> = ({
  children,
  title = "لوحة الأستاذ",
  onReset,
}) => {
  return (
    <ModularErrorBoundary
      fallbackTitle={`تعذر تحميل ${title}`}
      fallbackSubtitle="تمت حماية لوحة الأستاذ وعزل الخطأ بنجاح، يمكنك النقر لإعادة المحاولة بأمان."
      onReset={onReset}
    >
      <div className="w-full relative transition-all duration-300">
        {children}
      </div>
    </ModularErrorBoundary>
  );
};

export default TeacherViewWrapper;
