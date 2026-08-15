import React from "react";
import { ShieldCheck } from "lucide-react";

interface WatermarkLayerProps {
  schoolLogo?: string;
  className?: string;
  opacity?: number;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({
  schoolLogo,
  className = "",
  opacity = 0.10,
}) => {
  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {schoolLogo ? (
        <img 
          src={schoolLogo} 
          alt="School Logo Watermark" 
          className="max-w-[75%] max-h-[60%] w-64 h-64 object-contain pointer-events-none select-none"
          style={{
            pointerEvents: 'none',
            opacity: opacity,
            objectFit: 'contain',
            width: '256px',
            height: '256px',
          }}
          referrerPolicy="no-referrer" 
        />
      ) : (
        <ShieldCheck 
          size={280} 
          strokeWidth={0.5} 
          className="text-gray-950/5 select-none pointer-events-none"
          style={{
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
