import React, { useState, useRef } from "react";

export interface VerticalScrollPickerProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  label: string;
}

export const VerticalScrollPicker: React.FC<VerticalScrollPickerProps> = ({
  value,
  onChange,
  min,
  max,
  label,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.clientY;
    const step = Math.round(deltaY / 15);
    let newValue = startValue.current + step;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startValue.current = value;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.touches[0].clientY;
    const step = Math.round(deltaY / 15);
    let newValue = startValue.current + step;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      if (value < max) onChange(value + 1);
    } else {
      if (value > min) onChange(value - 1);
    }
  };

  const getVisibleNumbers = () => {
    const nums = [];
    for (let i = -2; i <= 2; i++) {
      const v = value + i;
      if (v >= min && v <= max) {
        nums.push({ val: v, offset: i });
      } else {
        nums.push({ val: null, offset: i });
      }
    }
    return nums;
  };

  return (
    <div
      className="flex flex-col items-center select-none"
      onWheel={handleWheel}
    >
      <span className="text-[10px] font-black text-white/40 mb-1">{label}</span>
      <div
        className={`w-20 h-28 bg-[#090D1E]/90 border ${
          isDragging
            ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
            : "border-white/5"
        } rounded-2xl flex flex-col items-center justify-between py-1 relative overflow-hidden transition-all touch-none cursor-ns-resize`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#090D1E] to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#090D1E] to-transparent pointer-events-none z-10" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            increment();
          }}
          className="text-white/30 hover:text-purple-400 p-1 transition-colors z-20 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>

        <div className="flex-1 flex flex-col justify-center items-center relative h-12 w-full">
          <div className="absolute inset-y-2 inset-x-1 border-y border-purple-500/30 bg-purple-500/5 pointer-events-none rounded" />

          <div className="flex flex-col items-center justify-center gap-1 py-0.5">
            {getVisibleNumbers().map((item, idx) => {
              if (item.val === null) {
                return <div key={`empty-${idx}`} className="h-4 w-4" />;
              }
              const isActive = item.offset === 0;
              return (
                <div
                  key={`num-${item.val}-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(item.val as number);
                  }}
                  className={`text-center transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "text-purple-400 font-extrabold text-sm scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      : "text-white/20 font-bold text-[10px]"
                  }`}
                >
                  {item.val}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            decrement();
          }}
          className="text-white/30 hover:text-purple-400 p-1 transition-colors z-20 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VerticalScrollPicker;
