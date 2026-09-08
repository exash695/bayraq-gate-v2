import React, { useState, useEffect } from 'react';
import { Skeleton } from './ShimmerSkeleton';
import { User, Image as ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: 'user' | 'image';
  fallbackText?: string;
  aspectRatio?: string; // e.g. '1/1', '16/9', '4/3'
  width?: number | string;
  height?: number | string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  containerClassName = '',
  fallbackIcon = 'image',
  fallbackText,
  aspectRatio,
  width,
  height,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const containerStyle: React.CSSProperties = {
    aspectRatio: aspectRatio || undefined,
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  if (!src || hasError) {
    return (
      <div
        style={containerStyle}
        className={`relative flex items-center justify-center bg-slate-800/60 border border-white/5 overflow-hidden ${containerClassName}`}
      >
        {fallbackIcon === 'user' ? (
          fallbackText ? (
            <span className="text-xs font-bold text-slate-300 select-none">
              {fallbackText.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <User className="w-1/2 h-1/2 text-slate-400/60" />
          )
        ) : (
          <ImageIcon className="w-1/2 h-1/2 text-slate-400/60" />
        )}
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className={`relative overflow-hidden ${containerClassName}`}
    >
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const OptimizedAvatar: React.FC<{
  src?: string | null;
  name?: string;
  size?: number | string;
  className?: string;
  borderColor?: string;
}> = ({
  src,
  name = '',
  size = 48,
  className = '',
  borderColor = 'border-white/10',
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      style={{ width: dimension, height: dimension, minWidth: dimension }}
      className={`relative rounded-full overflow-hidden border ${borderColor} shadow-inner bg-slate-800/80 ${className}`}
    >
      <OptimizedImage
        src={src}
        alt={name}
        fallbackIcon="user"
        fallbackText={name}
        containerClassName="w-full h-full rounded-full"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};
