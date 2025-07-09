const fs = require('fs');
const path = require('path');
const gzipSize = require('gzip-size');
const prettyBytes = require('pretty-bytes');

// Analyze build output
async function analyzeBuild() {
  const buildDir = path.join(process.cwd(), '.next');
  const results = {
    pages: {},
    chunks: {},
    totalSize: 0,
    totalGzipSize: 0,
  };

  // Check if build exists
  if (!fs.existsSync(buildDir)) {
    console.error('Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Analyze page bundles
  const pagesDir = path.join(buildDir, 'static', 'chunks', 'pages');
  if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath);
        const size = content.length;
        const gzipped = await gzipSize(content);
        
        results.pages[file] = {
          size,
          gzipped,
          sizeFormatted: prettyBytes(size),
          gzippedFormatted: prettyBytes(gzipped),
        };
        
        results.totalSize += size;
        results.totalGzipSize += gzipped;
      }
    }
  }

  // Print results
  console.log('\n📦 Bundle Size Analysis\n');
  console.log('Pages:');
  Object.entries(results.pages).forEach(([file, data]) => {
    console.log(`  ${file}: ${data.sizeFormatted} (${data.gzippedFormatted} gzipped)`);
  });
  
  console.log('\nTotal:');
  console.log(`  Size: ${prettyBytes(results.totalSize)}`);
  console.log(`  Gzipped: ${prettyBytes(results.totalGzipSize)}`);

  // Performance recommendations
  console.log('\n💡 Optimization Recommendations:\n');
  
  const recommendations = [];
  
  // Check for large pages
  Object.entries(results.pages).forEach(([file, data]) => {
    if (data.size > 300000) {
      recommendations.push(`⚠️  ${file} is larger than 300KB. Consider code splitting.`);
    }
  });

  if (results.totalSize > 1000000) {
    recommendations.push('⚠️  Total bundle size exceeds 1MB. Review dependencies and remove unused code.');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Bundle sizes look good!');
  }

  recommendations.forEach(rec => console.log(rec));
  
  // Generate report file
  const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Detailed report saved to: ${reportPath}`);
}

// Check for common optimization issues
function checkOptimizations() {
  console.log('\n🔍 Checking optimizations...\n');
  
  const checks = [];
  
  // Check if source maps are disabled in production
  const nextConfig = require('../next.config.js');
  if (nextConfig.productionBrowserSourceMaps) {
    checks.push('⚠️  Source maps are enabled in production. Disable for smaller bundles.');
  }
  
  // Check package.json for heavy dependencies
  const packageJson = require('../package.json');
  const heavyDeps = ['moment', 'lodash'];
  
  heavyDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      checks.push(`⚠️  Found heavy dependency: ${dep}. Consider lighter alternatives.`);
    }
  });
  
  // Check for tree-shaking opportunities
  if (!packageJson.sideEffects === false) {
    checks.push('💡 Add "sideEffects": false to package.json for better tree-shaking.');
  }
  
  if (checks.length === 0) {
    checks.push('✅ No obvious optimization issues found!');
  }
  
  checks.forEach(check => console.log(check));
}

// Run analysis
analyzeBuild().then(() => {
  checkOptimizations();
}).catch(console.error);