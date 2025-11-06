#!/usr/bin/env node

/**
 * Consolidate Marketing Translations
 *
 * This script merges marketing.json and landing.json from i18n/locales
 * into the main messages/{locale}.json files for next-intl
 */

const fs = require('fs');
const path = require('path');

const LOCALES = ['pt', 'en', 'es', 'fr', 'de'];
const LOCALE_MAP = {
  pt: 'pt-PT',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE'
};

const SOURCE_DIR = path.join(__dirname, '..', 'blipee-v2', 'apps', 'blipee-v2', 'src', 'i18n', 'locales');
const TARGET_DIR = path.join(__dirname, '..', 'src', 'messages');

function consolidateTranslations() {
  console.log('🔄 Consolidating marketing translations...\n');

  LOCALES.forEach(locale => {
    const sourceLocale = LOCALE_MAP[locale];
    const targetFile = path.join(TARGET_DIR, `${locale}.json`);

    console.log(`📝 Processing ${locale} (${sourceLocale})...`);

    // Read target file (main messages)
    let targetData = {};
    if (fs.existsSync(targetFile)) {
      try {
        targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
        console.log(`  ✅ Loaded existing ${locale}.json`);
      } catch (e) {
        console.error(`  ❌ Failed to parse ${locale}.json:`, e.message);
        return;
      }
    } else {
      console.log(`  ⚠️  ${locale}.json doesn't exist, creating new file`);
    }

    // Read marketing.json
    const marketingFile = path.join(SOURCE_DIR, sourceLocale, 'marketing.json');
    if (fs.existsSync(marketingFile)) {
      try {
        const marketingData = JSON.parse(fs.readFileSync(marketingFile, 'utf8'));
        targetData.marketing = marketingData;
        console.log(`  ✅ Merged marketing.json`);
      } catch (e) {
        console.error(`  ❌ Failed to parse marketing.json:`, e.message);
      }
    } else {
      console.log(`  ⚠️  marketing.json not found at ${marketingFile}`);
    }

    // Read landing.json
    const landingFile = path.join(SOURCE_DIR, sourceLocale, 'landing.json');
    if (fs.existsSync(landingFile)) {
      try {
        const landingData = JSON.parse(fs.readFileSync(landingFile, 'utf8'));

        // Merge landing data into root level
        if (landingData.landing) {
          // If landing.json has a "landing" key, merge it
          Object.assign(targetData, landingData);
        } else {
          // If not, wrap it in a "landing" key
          targetData.landing = landingData;
        }
        console.log(`  ✅ Merged landing.json`);
      } catch (e) {
        console.error(`  ❌ Failed to parse landing.json:`, e.message);
      }
    } else {
      console.log(`  ⚠️  landing.json not found at ${landingFile}`);
    }

    // Read and merge other translation files
    const otherFiles = ['common', 'auth', 'dashboard', 'profile', 'settings'];
    otherFiles.forEach(fileName => {
      const filePath = path.join(SOURCE_DIR, sourceLocale, `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          targetData[fileName] = fileData[fileName] || fileData;
          console.log(`  ✅ Merged ${fileName}.json`);
        } catch (e) {
          console.error(`  ❌ Failed to parse ${fileName}.json:`, e.message);
        }
      } else {
        console.log(`  ⚠️  ${fileName}.json not found at ${filePath}`);
      }
    });

    // Write back to target file
    try {
      fs.writeFileSync(
        targetFile,
        JSON.stringify(targetData, null, 2),
        'utf8'
      );
      console.log(`  ✅ Wrote consolidated ${locale}.json\n`);
    } catch (e) {
      console.error(`  ❌ Failed to write ${locale}.json:`, e.message);
    }
  });

  console.log('✅ Consolidation complete!');
}

// Run if called directly
if (require.main === module) {
  consolidateTranslations();
}

module.exports = { consolidateTranslations };
