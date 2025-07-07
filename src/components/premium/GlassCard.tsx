"use client";

import { ReactNode, MouseEvent } from "react";
import { premiumTheme, glassmorphism } from "@/lib/design/theme";

interface GlassCardProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined";
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

export function GlassCard({
  children,
  variant = "default",
  onClick,
  className = "",
}: GlassCardProps) {
  const baseStyles = {
    borderRadius: premiumTheme.borderRadius.lg,
    padding: "1.5rem",
    transition: premiumTheme.transitions.base,
    cursor: onClick ? "pointer" : "default",
  };

  const variants = {
    default: {
      ...glassmorphism,
      "&:hover": onClick
        ? {
            transform: "translateY(-2px)",
            boxShadow: premiumTheme.shadows.lg,
            borderColor: "rgba(139, 92, 246, 0.3)",
          }
        : {},
    },
    elevated: {
      ...glassmorphism,
      background: "rgba(255, 255, 255, 0.04)",
      boxShadow: `${premiumTheme.shadows.lg}, ${premiumTheme.shadows.glow}`,
      "&:hover": onClick
        ? {
            transform: "translateY(-4px)",
            boxShadow: `${premiumTheme.shadows.lg}, 0 0 48px rgba(139, 92, 246, 0.35)`,
          }
        : {},
    },
    outlined: {
      background: "transparent",
      border: `2px solid ${premiumTheme.colors.background.glassBorder}`,
      "&:hover": onClick
        ? {
            borderColor: "rgba(139, 92, 246, 0.5)",
            background: "rgba(139, 92, 246, 0.05)",
          }
        : {},
    },
  };

  const variantStyles = variants[variant];

  return (
    <div
      onClick={onClick}
      className={`glass-card glass-card-${variant} ${className}`}
      style={{
        ...baseStyles,
        ...variantStyles,
      }}
    >
      {children}
    </div>
  );
}
