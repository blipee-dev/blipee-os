import { locales, defaultLocale, type Locale } from '@/i18n';
import { translationUtils } from './utils';
import type { Messages } from '@/types/translations';

interface TranslationEntry {
  key: string;
  en: string;
  pt?: string;
  es?: string;
  metadata: {
    context?: string;
    maxLength?: number;
    tags?: string[];
    lastModified: Date;
    version: number;
  };
}

interface TranslationSet {
  [key: string]: TranslationEntry;
}

interface TranslationStats {
  total: number;
  translated: Record<Locale, number>;
  completion: Record<Locale, number>;
  missing: Record<Locale, string[]>;
}

export class TranslationManager {
  private static instance: TranslationManager;
  private translations: TranslationSet = {};
  private cache = new Map<string, any>();

  static getInstance(): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  // Load translations from JSON files
  async loadTranslations(): Promise<void> {
    try {
      for (const locale of locales) {
        const messages = await import(`../../messages/${locale}.json`);
        this.processMessages(messages.default, locale);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  // Process nested messages into flat translation entries
  private processMessages(messages: any, locale: Locale, prefix = ''): void {
    for (const [key, value] of Object.entries(messages)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        this.processMessages(value, locale, fullKey);
      } else if (typeof value === 'string') {
        if (!this.translations[fullKey]) {
          this.translations[fullKey] = {
            key: fullKey,
            en: locale === 'en' ? value : '',
            metadata: {
              lastModified: new Date(),
              version: 1
            }
          };
        }
        
        if (locale === 'en') {
          this.translations[fullKey].en = value;
        } else {
          this.translations[fullKey][locale] = value;
        }
      }
    }
  }

  // Get translation statistics
  getStats(): TranslationStats {
    const total = Object.keys(this.translations).length;
    const stats: TranslationStats = {
      total,
      translated: {} as Record<Locale, number>,
      completion: {} as Record<Locale, number>,
      missing: {} as Record<Locale, string[]>
    };

    for (const locale of locales) {
      let translated = 0;
      const missing: string[] = [];

      for (const [key, entry] of Object.entries(this.translations)) {
        if (locale === 'en' && entry.en) {
          translated++;
        } else if (locale !== 'en' && entry[locale]) {
          translated++;
        } else {
          missing.push(key);
        }
      }

      stats.translated[locale] = translated;
      stats.completion[locale] = total > 0 ? (translated / total) * 100 : 0;
      stats.missing[locale] = missing;
    }

    return stats;
  }

  // Get missing translations for a locale
  getMissingTranslations(locale: Locale): string[] {
    return this.getStats().missing[locale] || [];
  }

  // Add new translation entry
  addTranslation(
    key: string, 
    englishText: string, 
    options?: {
      context?: string;
      maxLength?: number;
      tags?: string[];
    }
  ): void {
    this.translations[key] = {
      key,
      en: englishText,
      metadata: {
        context: options?.context,
        maxLength: options?.maxLength,
        tags: options?.tags || [],
        lastModified: new Date(),
        version: 1
      }
    };
    this.clearCache();
  }

  // Update translation for a specific locale
  updateTranslation(key: string, locale: Locale, text: string): void {
    if (this.translations[key]) {
      if (locale === 'en') {
        this.translations[key].en = text;
      } else {
        this.translations[key][locale] = text;
      }
      this.translations[key].metadata.lastModified = new Date();
      this.translations[key].metadata.version++;
      this.clearCache();
    }
  }

  // Remove translation entry
  removeTranslation(key: string): void {
    delete this.translations[key];
    this.clearCache();
  }

  // Export translations to JSON format
  exportTranslations(locale: Locale): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const entry of Object.values(this.translations)) {
      const text = locale === 'en' ? entry.en : entry[locale];
      if (text) {
        translationUtils.setNestedValue(result, entry.key, text);
      }
    }
    
    return result;
  }

  // Import translations from external source
  async importTranslations(
    locale: Locale, 
    translations: Record<string, string>,
    overwrite = false
  ): Promise<{success: number; skipped: number; errors: string[]}> {
    let success = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [key, text] of Object.entries(translations)) {
      try {
        if (!this.translations[key]) {
          this.addTranslation(key, locale === 'en' ? text : '');
        }

        if (!this.translations[key][locale] || overwrite) {
          this.updateTranslation(key, locale, text);
          success++;
        } else {
          skipped++;
        }
      } catch (error) {
        errors.push(`Failed to import ${key}: ${error}`);
      }
    }

    return { success, skipped, errors };
  }

  // Auto-translate missing entries using AI
  async autoTranslate(
    fromLocale: Locale, 
    toLocale: Locale,
    aiTranslateFunction: (text: string, from: string, to: string) => Promise<string>
  ): Promise<{success: number; errors: string[]}> {
    let success = 0;
    const errors: string[] = [];
    const missing = this.getMissingTranslations(toLocale);

    for (const key of missing) {
      try {
        const sourceText = this.translations[key]?.[fromLocale];
        if (sourceText) {
          const translatedText = await aiTranslateFunction(
            sourceText, 
            fromLocale, 
            toLocale
          );
          this.updateTranslation(key, toLocale, translatedText);
          success++;
        }
      } catch (error) {
        errors.push(`Failed to translate ${key}: ${error}`);
      }
    }

    return { success, errors };
  }

  // Validate translation consistency
  validateTranslations(): {
    issues: Array<{
      key: string;
      issue: string;
      severity: 'error' | 'warning';
    }>;
  } {
    const issues: Array<{
      key: string;
      issue: string;
      severity: 'error' | 'warning';
    }> = [];

    for (const [key, entry] of Object.entries(this.translations)) {
      // Check for missing English text (required)
      if (!entry.en || entry.en.trim() === '') {
        issues.push({
          key,
          issue: 'Missing English translation (required)',
          severity: 'error'
        });
      }

      // Check for length constraints
      if (entry.metadata.maxLength) {
        for (const locale of locales) {
          const text = locale === 'en' ? entry.en : entry[locale];
          if (text && text.length > entry.metadata.maxLength) {
            issues.push({
              key,
              issue: `Translation too long for ${locale} (${text.length} > ${entry.metadata.maxLength})`,
              severity: 'warning'
            });
          }
        }
      }

      // Check for placeholder consistency
      const placeholderRegex = /\{([^}]+)\}/g;
      const englishPlaceholders = (entry.en.match(placeholderRegex) || []);
      
      for (const locale of locales) {
        if (locale === 'en') continue;
        
        const text = entry[locale];
        if (text) {
          const localePlaceholders = (text.match(placeholderRegex) || []);
          
          if (englishPlaceholders.length !== localePlaceholders.length) {
            issues.push({
              key,
              issue: `Placeholder mismatch in ${locale}`,
              severity: 'error'
            });
          }
        }
      }
    }

    return { issues };
  }

  // Search translations
  searchTranslations(query: string, options?: {
    locale?: Locale;
    includeKeys?: boolean;
    caseSensitive?: boolean;
  }): TranslationEntry[] {
    const { 
      locale, 
      includeKeys = true, 
      caseSensitive = false 
    } = options || {};

    const searchTerm = caseSensitive ? query : query.toLowerCase();
    
    return Object.values(this.translations).filter(entry => {
      // Search in key
      if (includeKeys) {
        const keyMatch = caseSensitive 
          ? entry.key.includes(searchTerm)
          : entry.key.toLowerCase().includes(searchTerm);
        if (keyMatch) return true;
      }

      // Search in specific locale or all locales
      if (locale) {
        const text = locale === 'en' ? entry.en : entry[locale];
        if (text) {
          return caseSensitive 
            ? text.includes(searchTerm)
            : text.toLowerCase().includes(searchTerm);
        }
      } else {
        // Search in all locales
        for (const loc of locales) {
          const text = loc === 'en' ? entry.en : entry[loc];
          if (text) {
            const match = caseSensitive 
              ? text.includes(searchTerm)
              : text.toLowerCase().includes(searchTerm);
            if (match) return true;
          }
        }
      }

      return false;
    });
  }

  // Clear translation cache
  private clearCache(): void {
    this.cache.clear();
  }

  // Get translation entry
  getTranslation(key: string): TranslationEntry | undefined {
    return this.translations[key];
  }

  // Generate translation report
  generateReport(): {
    summary: TranslationStats;
    validation: ReturnType<typeof this.validateTranslations>;
    recentChanges: TranslationEntry[];
  } {
    const summary = this.getStats();
    const validation = this.validateTranslations();
    
    // Get entries modified in the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentChanges = Object.values(this.translations)
      .filter(entry => entry.metadata.lastModified > weekAgo)
      .sort((a, b) => b.metadata.lastModified.getTime() - a.metadata.lastModified.getTime());

    return {
      summary,
      validation,
      recentChanges
    };
  }
}