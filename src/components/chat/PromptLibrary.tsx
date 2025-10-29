'use client';

import { useState, useMemo } from 'react';
import { X, Search, Sparkles } from 'lucide-react';
import { PROMPT_LIBRARY, searchPrompts, getTotalPromptCount, type PromptCategory } from '@/data/prompt-library';
import { useLanguage } from '@/providers/LanguageProvider';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export function PromptLibrary({ isOpen, onClose, onSelectPrompt }: PromptLibraryProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchPrompts(searchQuery);
  }, [searchQuery]);

  // Handle prompt selection
  const handlePromptClick = (prompt: string) => {
    onSelectPrompt(prompt);
    onClose();
  };

  // Get current category
  const currentCategory = selectedCategory
    ? PROMPT_LIBRARY.find(c => c.id === selectedCategory)
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('conversation.promptLibrary.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('conversation.promptLibrary.subtitle', { count: getTotalPromptCount() })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('conversation.promptLibrary.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {searchResults ? (
            /* Search Results */
            <div className="p-6">
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('conversation.promptLibrary.empty.noResults', { query: searchQuery })}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(result.prompt.prompt)}
                      className="w-full text-left p-4 bg-gray-50 dark:bg-zinc-800 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-green-500/30 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">{result.category.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">
                            {result.prompt.prompt}
                          </p>
                          {result.prompt.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {result.prompt.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {result.category.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : currentCategory ? (
            /* Category View */
            <div className="p-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 mb-4 flex items-center gap-1"
              >
                {t('conversation.promptLibrary.navigation.backToCategories')}
              </button>
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{currentCategory.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentCategory.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentCategory.description}
                </p>
              </div>
              <div className="space-y-2">
                {currentCategory.prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(prompt.prompt)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-green-500/30 transition-all group"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">
                      {prompt.prompt}
                    </p>
                    {prompt.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {prompt.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Categories Grid */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROMPT_LIBRARY.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="text-left p-4 bg-gray-50 dark:bg-zinc-800 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-green-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{category.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {category.description}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          {t('conversation.promptLibrary.category.promptsCount', { count: category.prompts.length })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('conversation.promptLibrary.footer.instruction')}
          </p>
        </div>
      </div>
    </div>
  );
}
