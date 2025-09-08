"use client";

import { motion } from "framer-motion";

interface MessageSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function MessageSuggestions({
  suggestions,
  onSelect,
}: MessageSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 
            bg-white dark:bg-[#757575] hover:bg-gray-50 dark:hover:bg-gray-600 
            border border-gray-200 dark:border-gray-600 rounded-lg 
            transition-colors"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}