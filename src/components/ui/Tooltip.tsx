'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
}

export function Tooltip({ content, children, side = 'right', disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      const spacing = 8;

      let x = 0;
      let y = 0;

      switch (side) {
        case 'right':
          x = rect.right + spacing;
          y = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2;
          break;
        case 'left':
          x = rect.left - (tooltipRect?.width || 0) - spacing;
          y = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2;
          break;
        case 'top':
          x = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2;
          y = rect.top - (tooltipRect?.height || 0) - spacing;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2;
          y = rect.bottom + spacing;
          break;
      }

      setPosition({ x, y });
    }
  }, [isVisible, side]);

  if (disabled) {
    return children;
  }

  const childWithRef = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => setIsVisible(false),
    onFocus: () => setIsVisible(true),
    onBlur: () => setIsVisible(false),
  });

  return (
    <>
      {childWithRef}
      {isVisible &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[10000] px-2 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-md shadow-lg pointer-events-none animate-in fade-in duration-100"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
