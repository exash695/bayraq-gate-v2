import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
  width?: string | number;
  height?: string | number;
  glow?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  width,
  height,
  glow = false,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded-md h-4';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
      default:
        return 'rounded-2xl';
    }
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-slate-800/40 border border-white/5 ${getVariantClass()} ${
        glow ? 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''
      } ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-[shimmer-sweep_1.8s_infinite] pointer-events-none" />
    </div>
  );
};

export const PanelHeaderSkeleton: React.FC<{ subtitle?: boolean }> = ({ subtitle = true }) => {
  return (
    <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl mb-6 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="w-14 h-14" />
          <div className="space-y-2">
            <Skeleton variant="rounded" className="w-48 h-6" />
            {subtitle && <Skeleton variant="rounded" className="w-72 h-4" />}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Skeleton variant="rounded" className="w-28 h-10" />
          <Skeleton variant="rounded" className="w-28 h-10" />
        </div>
      </div>
    </div>
  );
};

export const MetricCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4 mb-6`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="rounded" className="w-20 h-4" />
            <Skeleton variant="circular" className="w-8 h-8" />
          </div>
          <Skeleton variant="rounded" className="w-24 h-7 mb-2" />
          <Skeleton variant="rounded" className="w-16 h-3" />
        </div>
      ))}
    </div>
  );
};

export const TableRowsSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 5,
}) => {
  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Table Header */}
      <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} variant="rounded" className="h-5 flex-1 mx-2" />
        ))}
      </div>
      {/* Table Body Rows */}
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton variant="circular" className="w-9 h-9 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="rounded" className="w-3/4 h-4" />
                <Skeleton variant="rounded" className="w-1/2 h-3" />
              </div>
            </div>
            {Array.from({ length: cols - 1 }).map((_, colIdx) => (
              <Skeleton key={colIdx} variant="rounded" className="h-4 flex-1 mx-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton variant="circular" className="w-12 h-12" />
              <Skeleton variant="rounded" className="w-20 h-6" />
            </div>
            <Skeleton variant="rounded" className="w-4/5 h-5" />
            <Skeleton variant="rounded" className="w-full h-12" />
          </div>
          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <Skeleton variant="rounded" className="w-24 h-4" />
            <Skeleton variant="rounded" className="w-20 h-8" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ParentPortalSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050A18] text-white p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Top Banner / Student Selector Skeleton */}
      <div className="p-6 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <Skeleton variant="circular" className="w-20 h-20 border-2 border-blue-500/30" />
            <div className="space-y-2 flex-1">
              <Skeleton variant="rounded" className="w-44 h-7" />
              <div className="flex items-center gap-3">
                <Skeleton variant="rounded" className="w-24 h-5" />
                <Skeleton variant="rounded" className="w-32 h-5" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Skeleton variant="rounded" className="w-32 h-11" />
            <Skeleton variant="rounded" className="w-32 h-11" />
          </div>
        </div>
      </div>

      {/* Quick Nav Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="p-5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3"
          >
            <Skeleton variant="circular" className="w-12 h-12" />
            <Skeleton variant="rounded" className="w-24 h-5" />
            <Skeleton variant="rounded" className="w-16 h-3" />
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Skeleton variant="rounded" className="w-48 h-6" />
          <Skeleton variant="rounded" className="w-32 h-9" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton variant="rounded" className="w-full h-44" />
          <Skeleton variant="rounded" className="w-full h-44" />
        </div>
        <Skeleton variant="rounded" className="w-full h-64" />
      </div>
    </div>
  );
};

export const StudentPortalSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050A18] text-white p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Student Header */}
      <div className="p-6 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Skeleton variant="circular" className="w-18 h-18 border-2 border-amber-500/30" />
          <div className="space-y-2">
            <Skeleton variant="rounded" className="w-40 h-6" />
            <Skeleton variant="rounded" className="w-28 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Skeleton variant="rounded" className="w-36 h-12" />
          <Skeleton variant="rounded" className="w-36 h-12" />
        </div>
      </div>

      {/* XP Level Bar */}
      <div className="p-4 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl space-y-2">
        <div className="flex justify-between">
          <Skeleton variant="rounded" className="w-28 h-4" />
          <Skeleton variant="rounded" className="w-20 h-4" />
        </div>
        <Skeleton variant="rounded" className="w-full h-3" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <CardGridSkeleton count={4} />
        </div>
        <div className="space-y-6">
          <Skeleton variant="rounded" className="w-full h-72" />
          <Skeleton variant="rounded" className="w-full h-48" />
        </div>
      </div>
    </div>
  );
};

export const TeacherPortalSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050A18] text-white p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PanelHeaderSkeleton />
      <MetricCardsSkeleton count={3} />
      <TableRowsSkeleton rows={8} cols={4} />
    </div>
  );
};

export const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050A18] text-white p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PanelHeaderSkeleton />
      <MetricCardsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TableRowsSkeleton rows={6} cols={5} />
        </div>
        <div className="space-y-6">
          <Skeleton variant="rounded" className="w-full h-80" />
          <Skeleton variant="rounded" className="w-full h-56" />
        </div>
      </div>
    </div>
  );
};

export const FinanceSectionSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <MetricCardsSkeleton count={4} />
      <div className="flex items-center justify-between gap-4">
        <Skeleton variant="rounded" className="w-72 h-11" />
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="w-28 h-11" />
          <Skeleton variant="rounded" className="w-28 h-11" />
        </div>
      </div>
      <TableRowsSkeleton rows={6} cols={6} />
    </div>
  );
};

export const ScheduleSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Skeleton variant="rounded" className="w-48 h-6" />
        <Skeleton variant="rounded" className="w-36 h-10" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="p-4 bg-white/5 rounded-2xl space-y-3">
            <Skeleton variant="rounded" className="w-full h-6 mb-2" />
            <Skeleton variant="rounded" className="w-full h-16" />
            <Skeleton variant="rounded" className="w-full h-16" />
            <Skeleton variant="rounded" className="w-full h-16" />
          </div>
        ))}
      </div>
    </div>
  );
};
