"use client";

import React from "react";

// Animated background component matching the main site
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 bg-pink-300 dark:bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-64 sm:w-80 h-64 sm:h-80 bg-purple-300 dark:bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 left-40 w-64 sm:w-80 h-64 sm:h-80 bg-indigo-300 dark:bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-40 right-40 w-64 sm:w-80 h-64 sm:h-80 bg-violet-300 dark:bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-6000"></div>
    </div>
  );
}