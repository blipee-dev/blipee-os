#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fix 1: Motion alias issue
function fixMotionAlias(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix the import alias
    if (content.includes('motion as _motion')) {
      content = content.replace(/motion as _motion/g, 'motion');
      modified = true;
    }
    
    // Fix usage of _motion to motion
    if (content.includes('<_motion.')) {
      content = content.replace(/<_motion\./g, '<motion.');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed motion alias in: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error fixing motion in ${filePath}: ${error.message}`);
  }
  return false;
}

// Fix 2: Undefined error variables
function fixUndefinedErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: console.error(error) without error being defined
    const consoleErrorPattern = /console\.(log|error)\((['"`])(.+?)\2,\s*error\)/g;
    if (consoleErrorPattern.test(content)) {
      content = content.replace(consoleErrorPattern, (match, method, quote, message) => {
        return `console.${method}(${quote}${message}${quote})`;
      });
      modified = true;
    }
    
    // Pattern 2: catch block with error not being used properly
    const catchPattern = /catch\s*\(\s*(\w+)\s*\)\s*\{([^}]*?)console\.(log|error)\((.+?),\s*error\)/g;
    content = content.replace(catchPattern, (match, errorVar, beforeConsole, method, message) => {
      return `catch (${errorVar}) {${beforeConsole}console.${method}(${message}, ${errorVar})`;
    });
    
    // Pattern 3: Reference to 'error' that should be '_error' or another variable
    const errorReferencePattern = /\berror\b(?!['"`:])/g;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if this line has 'error' but it's not in a catch block or defined
      if (line.match(errorReferencePattern) && 
          !line.includes('catch') && 
          !line.includes('const error') && 
          !line.includes('let error') &&
          !line.includes('import')) {
        // Check if there's a nearby catch with a different variable name
        for (let j = Math.max(0, i - 10); j < i; j++) {
          const catchMatch = lines[j].match(/catch\s*\(\s*(\w+)\s*\)/);
          if (catchMatch && catchMatch[1] !== 'error') {
            lines[i] = lines[i].replace(errorReferencePattern, catchMatch[1]);
            modified = true;
            break;
          }
        }
      }
    }
    
    if (modified) {
      content = lines.join('\n');
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed undefined errors in: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error fixing undefined errors in ${filePath}: ${error.message}`);
  }
  return false;
}

// Files with motion issues
const motionFiles = [
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

// Files with undefined error issues
const errorFiles = [
  'src/app/api/documents/sustainability-report/route.ts',
  'src/app/auth/callback/page.tsx',
  'src/lib/webhooks/event-publisher.ts',
  'src/lib/webhooks/webhook-service.ts'
];

console.log('🔧 Fixing common TypeScript/ESLint errors...\n');

// Fix motion alias issues
console.log('📦 Fixing motion alias issues...');
let motionFixed = 0;
motionFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (fixMotionAlias(fullPath)) motionFixed++;
  }
});
console.log(`Fixed ${motionFixed} files with motion alias issues\n`);

// Fix undefined error variables
console.log('🚨 Fixing undefined error variables...');
let errorsFixed = 0;
errorFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (fixUndefinedErrors(fullPath)) errorsFixed++;
  }
});
console.log(`Fixed ${errorsFixed} files with undefined error issues\n`);

console.log('✨ Done! Fixed', motionFixed + errorsFixed, 'files total');