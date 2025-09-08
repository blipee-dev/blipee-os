"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export default function Tooltip({ 
  children, 
  content, 
  position = "top", 
  delay = 500,
  className = ""
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    let x = 0;
    let y = 0;
    
    switch (position) {
      case "top":
        x = rect.left + rect.width / 2 + scrollX;
        y = rect.top - 8 + scrollY;
        break;
      case "bottom":
        x = rect.left + rect.width / 2 + scrollX;
        y = rect.bottom + 8 + scrollY;
        break;
      case "left":
        x = rect.left - 8 + scrollX;
        y = rect.top + rect.height / 2 + scrollY;
        break;
      case "right":
        x = rect.right + 8 + scrollX;
        y = rect.top + rect.height / 2 + scrollY;
        break;
    }
    
    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "none"
    };
    
    switch (position) {
      case "top":
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(-50%, -100%)"
        };
      case "bottom":
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(-50%, 0)"
        };
      case "left":
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(-100%, -50%)"
        };
      case "right":
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: "translate(0, -50%)"
        };
      default:
        return baseStyles;
    }
  };

  const getArrowStyles = () => {
    const baseStyles = "absolute w-2 h-2 bg-[#212121] dark:bg-[#212121] transform rotate-45";
    
    switch (position) {
      case "top":
        return `${baseStyles} -bottom-1 left-1/2 -translate-x-1/2`;
      case "bottom":
        return `${baseStyles} -top-1 left-1/2 -translate-x-1/2`;
      case "left":
        return `${baseStyles} -right-1 top-1/2 -translate-y-1/2`;
      case "right":
        return `${baseStyles} -left-1 top-1/2 -translate-y-1/2`;
      default:
        return baseStyles;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={getTooltipStyles()}
            className={className}
          >
            <div className="relative px-2 py-1.5 bg-[#212121] dark:bg-[#212121] text-white text-xs rounded-lg shadow-lg whitespace-nowrap max-w-xs">
              {content}
              <div className={getArrowStyles()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Simple tooltip wrapper for quick use
export function SimpleTooltip({ children, content, ...props }: TooltipProps) {
  return (
    <Tooltip content={content} {...props}>
      {children}
    </Tooltip>
  );
}