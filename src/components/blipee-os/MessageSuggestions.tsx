"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

interface MessageSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function MessageSuggestions({
  suggestions,
  onSelect,
}: MessageSuggestionsProps) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-white/40 light-mode:text-gray-500">
        <Sparkles className="w-3 h-3" />
        <span>Suggested follow-ups</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(suggestion)}
            className={`
              group relative px-4 py-2 rounded-xl text-sm
              backdrop-blur-xl bg-white/[0.02] 
              border border-white/[0.05]
              shadow-[0_4px_16px_rgba(0,0,0,0.08)]
              transition-all duration-300
              hover:bg-white/[0.04] hover:border-white/[0.1]
              hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]
              
              light-mode:bg-white/70
              light-mode:border-gray-200/50
              light-mode:hover:bg-white/90
              light-mode:hover:border-gray-300/50
              light-mode:shadow-[0_2px_8px_rgba(0,0,0,0.04)]
              light-mode:hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]
              
              text-white/70 hover:text-white/90
              light-mode:text-gray-600 light-mode:hover:text-gray-800
            `}
          >
            {/* Gradient overlay on hover */}
            <div
              className={`
              absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
              bg-gradient-to-r from-purple-500/5 to-blue-500/5
              light-mode:from-purple-500/3 light-mode:to-blue-500/3
              transition-opacity duration-300
            `}
            />

            <span className="relative z-10 flex items-center gap-2">
              {suggestion}
              <ArrowRight
                className="w-3 h-3 opacity-0 group-hover:opacity-100 
                                   transform translate-x-0 group-hover:translate-x-1
                                   transition-all duration-300"
              />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
