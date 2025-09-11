import React from "react";
import { cn } from "@/lib/utils";

interface AccentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function AccentButton({ 
  children, 
  className, 
  variant = "solid",
  size = "md",
  ...props 
}: AccentButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  const variantClasses = {
    solid: "accent-gradient-lr text-white hover:opacity-90",
    outline: "border-2 accent-border accent-text bg-transparent hover:accent-bg hover:text-white",
    ghost: "accent-text hover:accent-bg-hover"
  };

  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-all",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}