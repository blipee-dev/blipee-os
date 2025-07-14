#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need framer-motion imports based on the ESLint output
const filesToFix = [
  'src/app/settings/api-keys/page.tsx',
  'src/app/settings/sso/page.tsx',
  'src/app/settings/webhooks/page.tsx',
  'src/components/BuildingSelector.tsx',
  'src/components/OrganizationSwitcher.tsx',
  'src/components/auth/sso/SSOTestInterface.tsx',
  'src/components/blipee-os/InputArea.tsx',
  'src/components/conversations/ConversationHistory.tsx',
  'src/components/dynamic/Enhanced3DView.tsx',
  'src/components/dynamic/EnhancedReportComponent.tsx',
  'src/components/dynamic/SustainabilityDashboard.tsx',
  'src/components/onboarding/ConversationalOnboarding.tsx',
  'src/components/sustainability/ReportUploader.tsx',
  'src/components/voice/VoiceInput.tsx'
];

function addFramerMotionImport(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if framer-motion is already imported
    if (content.includes("from 'framer-motion'") || content.includes('from "framer-motion"')) {
      console.log(`✓ ${filePath} - already has framer-motion import`);
      return;
    }
    
    // Find the best place to add the import (after other imports)
    const importRegex = /^import\s+.*$/gm;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      // Add after the last import
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertPosition) + 
                "\nimport { motion } from 'framer-motion';" + 
                content.slice(insertPosition);
    } else {
      // Add at the beginning if no imports found
      content = "import { motion } from 'framer-motion';\n\n" + content;
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath} - added framer-motion import`);
  } catch (error) {
    console.error(`❌ ${filePath} - Error: ${error.message}`);
  }
}

console.log('🔧 Fixing missing framer-motion imports...\n');

filesToFix.forEach(file => {
  addFramerMotionImport(file);
});

console.log('\n✨ Done! Fixed framer-motion imports in', filesToFix.length, 'files');