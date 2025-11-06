/**
 * blipee Landing Page i18n System
 * Handles multi-language support for static HTML pages
 */

class LandingI18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = null;
    this.fallbackLang = 'en-US';
  }

  /**
   * Detect user's preferred language
   */
  detectLanguage() {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam) {
      localStorage.setItem('blipee-lang', langParam);
      return langParam;
    }

    // Check localStorage
    const savedLang = localStorage.getItem('blipee-lang');
    if (savedLang) return savedLang;

    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;

    // Map browser language to our supported languages
    if (browserLang.startsWith('pt')) return 'pt-PT';
    if (browserLang.startsWith('es')) return 'es-ES';
    return 'en-US';
  }

  /**
   * Load translation file
   */
  async loadTranslations(lang = this.currentLang) {
    try {
      // Try to load from blipee-v2 structure
      const paths = [
        `/blipee-v2/apps/blipee-v2/src/i18n/locales/${lang}/landing.json`,
        `./i18n/${lang}/landing.json`,
        `/i18n/${lang}/landing.json`
      ];

      for (const path of paths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const data = await response.json();
            this.translations = data.landing || data;
            console.log(`✅ Loaded translations for ${lang} from ${path}`);
            return this.translations;
          }
        } catch (e) {
          continue;
        }
      }

      // Fallback to English if main language fails
      if (lang !== this.fallbackLang) {
        console.warn(`⚠️ Could not load ${lang}, falling back to ${this.fallbackLang}`);
        return this.loadTranslations(this.fallbackLang);
      }

      throw new Error('Could not load translations');
    } catch (error) {
      console.error('Failed to load translations:', error);
      return null;
    }
  }

  /**
   * Get nested translation value using dot notation
   */
  get(key) {
    if (!this.translations) return key;

    const keys = key.replace('landing.', '').split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return value;
  }

  /**
   * Translate all elements with data-i18n attribute
   */
  translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.get(key);

      if (translation && translation !== key) {
        // Handle different element types
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          if (element.placeholder) {
            element.placeholder = translation;
          } else {
            element.value = translation;
          }
        } else {
          // Preserve HTML structure if needed
          if (element.innerHTML.includes('<')) {
            // Has HTML tags, try to replace text nodes only
            this.replaceTextContent(element, translation);
          } else {
            element.textContent = translation;
          }
        }
      }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.get(key);
      if (translation && translation !== key) {
        element.placeholder = translation;
      }
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.get(key);
      if (translation && translation !== key) {
        element.title = translation;
      }
    });

    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      const translation = this.get(key);
      if (translation && translation !== key) {
        element.setAttribute('aria-label', translation);
      }
    });

    console.log(`✅ Translated ${elements.length} elements to ${this.currentLang}`);
  }

  /**
   * Replace text content while preserving child elements
   */
  replaceTextContent(element, newText) {
    // Create a temporary div to parse the new text
    const temp = document.createElement('div');
    temp.innerHTML = newText;
    element.innerHTML = temp.innerHTML;
  }

  /**
   * Change language and reload translations
   */
  async setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('blipee-lang', lang);

    await this.loadTranslations(lang);
    this.translatePage();

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: lang }
    }));
  }

  /**
   * Initialize i18n system
   */
  async init() {
    await this.loadTranslations();

    if (this.translations) {
      this.translatePage();
      document.documentElement.lang = this.currentLang;
    } else {
      console.error('❌ Failed to initialize i18n system');
    }

    return this;
  }

  /**
   * Create language selector
   */
  createLanguageSelector(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const languages = [
      { code: 'pt-PT', name: 'Português', flag: '🇵🇹' },
      { code: 'en-US', name: 'English', flag: '🇺🇸' },
      { code: 'es-ES', name: 'Español', flag: '🇪🇸' }
    ];

    const selector = document.createElement('div');
    selector.className = 'language-selector';
    selector.style.cssText = `
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 0.5rem;
      padding: 0.5rem;
      backdrop-filter: blur(10px);
    `;

    languages.forEach(lang => {
      const button = document.createElement('button');
      button.className = 'lang-btn';
      button.innerHTML = `${lang.flag} <span class="lang-name">${lang.name}</span>`;
      button.style.cssText = `
        background: ${this.currentLang === lang.code ? 'var(--gradient-primary)' : 'transparent'};
        color: ${this.currentLang === lang.code ? '#ffffff' : 'var(--text-secondary)'};
        border: none;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      `;

      button.addEventListener('click', () => {
        this.setLanguage(lang.code);
        // Update button styles
        selector.querySelectorAll('.lang-btn').forEach(btn => {
          btn.style.background = 'transparent';
          btn.style.color = 'var(--text-secondary)';
        });
        button.style.background = 'var(--gradient-primary)';
        button.style.color = '#ffffff';
      });

      button.addEventListener('mouseover', () => {
        if (this.currentLang !== lang.code) {
          button.style.background = 'var(--glass-bg)';
        }
      });

      button.addEventListener('mouseout', () => {
        if (this.currentLang !== lang.code) {
          button.style.background = 'transparent';
        }
      });

      selector.appendChild(button);
    });

    container.appendChild(selector);
  }
}

// Global instance
window.i18n = new LandingI18n();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.i18n.init());
} else {
  window.i18n.init();
}
