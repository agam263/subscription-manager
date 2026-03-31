import React, { useRef, useState } from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

export const MagneticButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const element = internalRef.current;
      if (!element) return;
      const { left, top, width, height } = element.getBoundingClientRect();
      const x = (e.clientX - (left + width / 2)) * 0.3; // 0.3 controls the magnetic pull strength
      const y = (e.clientY - (top + height / 2)) * 0.3;
      setPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    return (
      <Button
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          internalRef.current = node;
        }}
        className={cn("will-change-transform z-10", className)}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: position.x === 0 && position.y === 0 ? 'transform 0.5s ease-out' : 'transform 0.1s linear',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
MagneticButton.displayName = 'MagneticButton';
