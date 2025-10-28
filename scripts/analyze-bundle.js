#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 *
 * Analyzes the production build output and reports on bundle sizes
 * Helps identify large dependencies and opportunities for optimization
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dir, prefix = '') {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...analyzeDirectory(fullPath, path.join(prefix, item)));
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.css'))) {
        files.push({
          name: path.join(prefix, item),
          size: stat.size,
          type: item.endsWith('.js') ? 'JavaScript' : 'CSS'
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

function main() {
  console.log('\n📦 Analyzing Bundle Sizes...\n');

  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  if (!fs.existsSync(STATIC_DIR)) {
    console.error('❌ Static directory not found. Build may have failed.');
    process.exit(1);
  }

  // Analyze all JS and CSS files
  const files = analyzeDirectory(STATIC_DIR);

  if (files.length === 0) {
    console.log('No files found to analyze.');
    return;
  }

  // Sort by size (largest first)
  files.sort((a, b) => b.size - a.size);

  // Calculate totals
  const jsFiles = files.filter(f => f.type === 'JavaScript');
  const cssFiles = files.filter(f => f.type === 'CSS');

  const totalJsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
  const totalCssSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
  const totalSize = totalJsSize + totalCssSize;

  // Report summary
  console.log('📊 Summary:\n');
  console.log(`Total Bundle Size: ${formatBytes(totalSize)}`);
  console.log(`  JavaScript: ${formatBytes(totalJsSize)} (${jsFiles.length} files)`);
  console.log(`  CSS: ${formatBytes(totalCssSize)} (${cssFiles.length} files)`);
  console.log();

  // Show largest files
  console.log('🔍 Largest Files:\n');
  const topFiles = files.slice(0, 15);

  for (const file of topFiles) {
    const icon = file.type === 'JavaScript' ? '📜' : '🎨';
    console.log(`${icon} ${formatBytes(file.size).padEnd(12)} ${file.name}`);
  }

  console.log();

  // Warnings
  const largeFiles = files.filter(f => f.size > 200 * 1024); // > 200KB
  if (largeFiles.length > 0) {
    console.log('⚠️  Large Files (>200KB):\n');
    for (const file of largeFiles) {
      console.log(`   ${file.name}: ${formatBytes(file.size)}`);
    }
    console.log();
  }

  // Check for common optimization opportunities
  console.log('💡 Optimization Tips:\n');

  const hasFramework = files.some(f => f.name.includes('framework'));
  const hasUI = files.some(f => f.name.includes('ui'));
  const hasCommons = files.some(f => f.name.includes('commons'));

  if (hasFramework) {
    console.log('✅ Framework chunk is separated (good for caching)');
  } else {
    console.log('⚠️  Consider separating framework code (React, Next.js)');
  }

  if (hasUI) {
    console.log('✅ UI libraries chunk is separated');
  }

  if (hasCommons) {
    console.log('✅ Common code is deduplicated');
  }

  const avgFileSize = totalSize / files.length;
  if (avgFileSize > 100 * 1024) {
    console.log('⚠️  Average file size is large. Consider more aggressive code splitting.');
  }

  console.log();

  // Mobile performance assessment
  console.log('📱 Mobile Performance Assessment:\n');

  if (totalJsSize < 200 * 1024) {
    console.log('✅ Excellent - Total JS < 200KB (gzipped would be ~50-60KB)');
  } else if (totalJsSize < 500 * 1024) {
    console.log('✅ Good - Total JS < 500KB (gzipped would be ~125-150KB)');
  } else if (totalJsSize < 1024 * 1024) {
    console.log('⚠️  Fair - Total JS < 1MB but could be optimized further');
  } else {
    console.log('❌ Poor - Total JS > 1MB, significant optimization needed');
  }

  console.log();

  // Additional recommendations
  console.log('📝 Recommendations:\n');
  console.log('1. Use lazy loading for large components (React.lazy + Suspense)');
  console.log('2. Implement route-based code splitting');
  console.log('3. Use dynamic imports for non-critical features');
  console.log('4. Consider using tree-shaking for large libraries');
  console.log('5. Monitor bundle size with each deployment');
  console.log();

  console.log('For detailed analysis, run: npm run build:analyze');
  console.log();
}

main();
