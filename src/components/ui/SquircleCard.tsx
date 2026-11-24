import React, { useRef, useEffect } from 'react';
import { applySmoothCorners } from '../../scripts/squircle';

export interface SquircleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: number;
  smoothing?: number;
  as?: React.ElementType;
  children?: React.ReactNode;
}

export const SquircleCard: React.FC<SquircleCardProps> = ({
  radius = 28,
  smoothing = 60,
  as: Component = 'div',
  className = '',
  style,
  children,
  ...props
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    const cleanup = applySmoothCorners(elementRef.current, radius, smoothing);
    return () => {
      if (cleanup) cleanup();
    };
  }, [radius, smoothing]);

  return (
    <Component
      ref={elementRef}
      className={className}
      style={style}
      data-squircle-radius={radius}
      data-squircle-smoothing={smoothing}
      {...props}
    >
      {children}
    </Component>
  );
};

export default SquircleCard;
