"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string | number;
  label: string;
  renderLabel?: () => React.ReactNode;
}

interface CustomDropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  disabled = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative min-w-fit ${className || ''}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center justify-between w-full min-w-[4rem] px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111111] border border-gray-300 dark:border-white/[0.05] rounded-lg focus:outline-none focus:ring-2 focus:accent-ring focus:accent-border transition-all hover:border-gray-400 dark:hover:border-white/[0.1] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="whitespace-nowrap pr-2">
          {selectedOption ? (selectedOption.renderLabel ? selectedOption.renderLabel() : selectedOption.label) : placeholder}
        </span>
        <ChevronDown 
          className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg overflow-hidden"
          >
            <div className="py-1 max-h-60 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-xs sm:text-sm transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.05] ${
                    value === option.value
                      ? "accent-bg text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.renderLabel ? option.renderLabel() : option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}