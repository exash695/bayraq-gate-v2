import React from 'react';

interface KeepAliveTabProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * KeepAliveTab maintains rendered tab contents in the DOM using CSS visibility / display toggling.
 * This prevents unmounting and remounting heavy components (e.g. Finance, Grades, Attendance, Transport),
 * ensuring zero lag and instantaneous tab switching with preserved scroll position and inputs.
 */
export const KeepAliveTab: React.FC<KeepAliveTabProps> = ({
  isActive,
  children,
  className = '',
}) => {
  return (
    <div
      className={`w-full transition-opacity duration-200 ${
        isActive ? 'block opacity-100' : 'hidden opacity-0'
      } ${className}`}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
};
