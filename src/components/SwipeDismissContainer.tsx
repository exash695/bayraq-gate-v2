import React, { useState, useRef } from 'react';

interface SwipeDismissContainerProps {
  onDismiss: () => void;
  children: React.ReactNode;
}

export const SwipeDismissContainer: React.FC<SwipeDismissContainerProps> = ({ onDismiss, children }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diffX = e.touches[0].clientX - startXRef.current;
    
    // To allow natural feel, we trace the finger movement 1:1
    setOffsetX(diffX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // If swiped more than 70px to either left or right, trigger dynamic dismiss
    if (Math.abs(offsetX) > 70) {
      const exitDir = offsetX > 0 ? 400 : -400;
      setOffsetX(exitDir);
      setTimeout(() => {
        onDismiss();
      }, 150);
    } else {
      setOffsetX(0);
    }
  };

  // Support Mouse Dragging on Desktops too for perfect UX
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diffX = moveEvent.clientX - startXRef.current;
      setOffsetX(diffX);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      const distance = upEvent.clientX - startXRef.current;
      if (Math.abs(distance) > 70) {
        const exitDir = distance > 0 ? 400 : -400;
        setOffsetX(exitDir);
        setTimeout(() => {
          onDismiss();
        }, 150);
      } else {
        setOffsetX(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const style: React.CSSProperties = {
    transform: `translateX(${offsetX}px)`,
    opacity: Math.max(0.1, 1 - Math.abs(offsetX) / 250),
    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    touchAction: 'pan-y',
    willChange: 'transform, opacity',
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={style}
      className="cursor-grab active:cursor-grabbing select-none"
    >
      {children}
    </div>
  );
};
