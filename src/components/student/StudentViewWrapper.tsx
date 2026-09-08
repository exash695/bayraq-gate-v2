import React from "react";
import { ModularErrorBoundary } from "../shared/ModularErrorBoundary";

export interface StudentViewWrapperProps {
  children: React.ReactNode;
  title?: string;
  onReset?: () => void;
}

export const StudentViewWrapper: React.FC<StudentViewWrapperProps> = ({
  children,
  title = "لوحة الطالب",
  onReset,
}) => {
  return (
    <ModularErrorBoundary
      fallbackTitle={`تعذر تحميل ${title}`}
      fallbackSubtitle="تمت حماية لوحة الطالب وعزل الخطأ بنجاح، يمكنك النقر لإعادة المحاولة بأمان."
      onReset={onReset}
    >
      <div className="w-full relative transition-all duration-300">
        {children}
      </div>
    </ModularErrorBoundary>
  );
};

export default StudentViewWrapper;
