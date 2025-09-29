"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, Building2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';

interface AddressSuggestion {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  type: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  country?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing address or building name...",
  country = 'PT',
  disabled = false,
  className = '',
  label = 'Street Address'
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const searchAddresses = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/address/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, country })
        });

        const data = await response.json();
        if (data.success && data.suggestions) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [country]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchAddresses(newValue);
    setSelectedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.address || suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);

    // Call onSelect callback with full suggestion data
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon based on suggestion type
  const getIcon = (type: string) => {
    switch (type) {
      case 'place':
      case 'local':
        return <Building2 className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full px-4 py-2 pr-10
            bg-gray-50 dark:bg-white/5
            border border-gray-200 dark:border-white/10
            rounded-lg
            text-gray-900 dark:text-white
            focus:ring-2 accent-ring focus:accent-border
            disabled:opacity-60 disabled:cursor-not-allowed
            ${className}
          `}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${selectedIndex === index
                    ? 'bg-gray-100 dark:bg-white/10'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${
                    suggestion.type === 'local' ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getIcon(suggestion.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.name}
                    </div>
                    {suggestion.address && suggestion.address !== suggestion.name && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {suggestion.address}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {suggestion.city && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {suggestion.city}
                        </span>
                      )}
                      {suggestion.postalCode && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {suggestion.postalCode}
                        </span>
                      )}
                      {suggestion.type === 'local' && (
                        <span className="text-xs text-purple-500 font-medium">
                          Frequently used
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}