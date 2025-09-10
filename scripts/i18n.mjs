#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const messagesDir = path.join(projectRoot, 'src', 'messages');

const locales = ['en', 'pt', 'es'];
const defaultLocale = 'en';

class I18nTool {
  constructor() {
    this.translations = {};
  }

  // Load all translation files
  async loadTranslations() {
    for (const locale of locales) {
      try {
        const filePath = path.join(messagesDir, `${locale}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        this.translations[locale] = JSON.parse(content);
      } catch (error) {
        console.warn(`Warning: Could not load ${locale}.json:`, error.message);
        this.translations[locale] = {};
      }
    }
  }

  // Flatten nested object into dot notation
  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }

  // Unflatten dot notation back to nested object
  unflattenObject(flattened) {
    const result = {};
    
    for (const [key, value] of Object.entries(flattened)) {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
    }
    
    return result;
  }

  // Get missing translations
  getMissingTranslations() {
    const baseTranslations = this.flattenObject(this.translations[defaultLocale]);
    const missing = {};

    for (const locale of locales) {
      if (locale === defaultLocale) continue;
      
      missing[locale] = [];
      const localeTranslations = this.flattenObject(this.translations[locale]);
      
      for (const key of Object.keys(baseTranslations)) {
        if (!localeTranslations[key]) {
          missing[locale].push(key);
        }
      }
    }

    return missing;
  }

  // Get unused translations
  getUnusedTranslations() {
    // This would require AST parsing to find actual usage
    // For now, just return empty arrays
    const unused = {};
    for (const locale of locales) {
      unused[locale] = [];
    }
    return unused;
  }

  // Generate statistics
  getStats() {
    const baseTranslations = this.flattenObject(this.translations[defaultLocale]);
    const totalKeys = Object.keys(baseTranslations).length;
    const stats = {};

    for (const locale of locales) {
      const localeTranslations = this.flattenObject(this.translations[locale]);
      const translatedKeys = Object.keys(localeTranslations).length;
      const completion = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;

      stats[locale] = {
        total: totalKeys,
        translated: translatedKeys,
        missing: totalKeys - translatedKeys,
        completion: Math.round(completion * 100) / 100
      };
    }

    return stats;
  }

  // Add new translation key
  async addTranslation(key, englishText, options = {}) {
    const flattened = this.flattenObject(this.translations[defaultLocale]);
    flattened[key] = englishText;
    
    this.translations[defaultLocale] = this.unflattenObject(flattened);
    await this.saveTranslations(defaultLocale);
    
    console.log(`✅ Added translation key: ${key}`);
  }

  // Update translation
  async updateTranslation(key, locale, text) {
    const flattened = this.flattenObject(this.translations[locale]);
    flattened[key] = text;
    
    this.translations[locale] = this.unflattenObject(flattened);
    await this.saveTranslations(locale);
    
    console.log(`✅ Updated ${locale} translation for: ${key}`);
  }

  // Remove translation key
  async removeTranslation(key) {
    for (const locale of locales) {
      const flattened = this.flattenObject(this.translations[locale]);
      delete flattened[key];
      this.translations[locale] = this.unflattenObject(flattened);
      await this.saveTranslations(locale);
    }
    
    console.log(`✅ Removed translation key: ${key}`);
  }

  // Save translations to file
  async saveTranslations(locale) {
    const filePath = path.join(messagesDir, `${locale}.json`);
    const content = JSON.stringify(this.translations[locale], null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  // Validate all translations
  validateTranslations() {
    const issues = [];
    const baseTranslations = this.flattenObject(this.translations[defaultLocale]);

    for (const [key, value] of Object.entries(baseTranslations)) {
      // Check for empty values
      if (!value || typeof value !== 'string' || value.trim() === '') {
        issues.push({
          key,
          locale: defaultLocale,
          issue: 'Empty translation',
          severity: 'error'
        });
      }

      // Check for placeholder consistency (only for string values)
      if (typeof value !== 'string') continue;
      const placeholders = (value.match(/\{[^}]+\}/g) || []);
      
      for (const locale of locales) {
        if (locale === defaultLocale) continue;
        
        const localeTranslations = this.flattenObject(this.translations[locale]);
        const localeValue = localeTranslations[key];
        
        if (localeValue) {
          const localePlaceholders = (localeValue.match(/\{[^}]+\}/g) || []);
          
          if (placeholders.length !== localePlaceholders.length) {
            issues.push({
              key,
              locale,
              issue: 'Placeholder count mismatch',
              severity: 'error'
            });
          }

          // Check for specific placeholders
          for (const placeholder of placeholders) {
            if (!localePlaceholders.includes(placeholder)) {
              issues.push({
                key,
                locale,
                issue: `Missing placeholder: ${placeholder}`,
                severity: 'error'
              });
            }
          }
        }
      }
    }

    return issues;
  }

  // Export to different formats
  async exportTo(format, outputPath) {
    const data = this.translations;
    
    switch (format) {
      case 'csv':
        await this.exportToCsv(outputPath);
        break;
      case 'xlsx':
        console.log('XLSX export would require additional dependency');
        break;
      case 'json':
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Export to CSV
  async exportToCsv(outputPath) {
    const baseTranslations = this.flattenObject(this.translations[defaultLocale]);
    const rows = [['Key', ...locales]];

    for (const key of Object.keys(baseTranslations)) {
      const row = [key];
      for (const locale of locales) {
        const localeTranslations = this.flattenObject(this.translations[locale]);
        row.push(localeTranslations[key] || '');
      }
      rows.push(row);
    }

    const csv = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    await fs.writeFile(outputPath, csv);
  }
}

// CLI Interface
async function main() {
  const [,, command, ...args] = process.argv;
  const tool = new I18nTool();
  
  await tool.loadTranslations();

  switch (command) {
    case 'stats':
      console.log('📊 Translation Statistics\\n');
      const stats = tool.getStats();
      for (const [locale, stat] of Object.entries(stats)) {
        const flag = locale === 'en' ? '🇬🇧' : locale === 'pt' ? '🇵🇹' : '🇪🇸';
        console.log(`${flag} ${locale.toUpperCase()}: ${stat.translated}/${stat.total} (${stat.completion}%)`);
      }
      break;

    case 'missing':
      console.log('❌ Missing Translations\\n');
      const missing = tool.getMissingTranslations();
      for (const [locale, keys] of Object.entries(missing)) {
        if (keys.length > 0) {
          console.log(`\\n${locale.toUpperCase()} (${keys.length} missing):`);
          keys.forEach(key => console.log(`  - ${key}`));
        }
      }
      break;

    case 'validate':
      console.log('🔍 Validation Results\\n');
      const issues = tool.validateTranslations();
      if (issues.length === 0) {
        console.log('✅ No issues found!');
      } else {
        issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : '⚠️';
          console.log(`${icon} [${issue.locale}] ${issue.key}: ${issue.issue}`);
        });
      }
      break;

    case 'add':
      const [key, text] = args;
      if (!key || !text) {
        console.error('Usage: npm run i18n add <key> <english_text>');
        process.exit(1);
      }
      await tool.addTranslation(key, text);
      break;

    case 'update':
      const [updateKey, locale, updateText] = args;
      if (!updateKey || !locale || !updateText) {
        console.error('Usage: npm run i18n update <key> <locale> <text>');
        process.exit(1);
      }
      await tool.updateTranslation(updateKey, locale, updateText);
      break;

    case 'remove':
      const [removeKey] = args;
      if (!removeKey) {
        console.error('Usage: npm run i18n remove <key>');
        process.exit(1);
      }
      await tool.removeTranslation(removeKey);
      break;

    case 'export':
      const [format, outputPath] = args;
      if (!format || !outputPath) {
        console.error('Usage: npm run i18n export <format> <output_path>');
        process.exit(1);
      }
      await tool.exportTo(format, outputPath);
      console.log(`✅ Exported to ${outputPath}`);
      break;

    default:
      console.log(`
🌍 blipee Translation Tool

Usage:
  npm run i18n <command> [options]

Commands:
  stats              Show translation completion statistics
  missing            Show missing translations for each locale
  validate           Check for translation issues
  add <key> <text>   Add new translation key
  update <key> <locale> <text>  Update translation for specific locale
  remove <key>       Remove translation key from all locales
  export <format> <path>        Export translations (json, csv)

Examples:
  npm run i18n stats
  npm run i18n missing
  npm run i18n add "common.loading" "Loading..."
  npm run i18n update "common.loading" "pt" "Carregando..."
  npm run i18n export csv translations.csv
      `);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}