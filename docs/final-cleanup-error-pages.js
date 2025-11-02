const fs = require('fs');

const files = ['403.html', '404.html', '500.html', '503.html'];

files.forEach(filename => {
  console.log(`Final cleanup for ${filename}...`);
  
  let content = fs.readFileSync(filename, 'utf8');
  
  // Simple approach: find and remove everything from "/* Theme Toggle */" to the closing @media block
  const lines = content.split('\n');
  const newLines = [];
  let inToggleCSS = false;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('/* Theme Toggle */')) {
      inToggleCSS = true;
      continue;
    }
    
    if (inToggleCSS) {
      // Count braces to know when we're done with the toggle CSS
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // If we're back to 0 braces and see a closing brace, we're done
      if (braceCount === 0 && line.trim() === '}') {
        inToggleCSS = false;
        continue;
      }
      continue;
    }
    
    newLines.push(line);
  }
  
  content = newLines.join('\n');
  fs.writeFileSync(filename, content, 'utf8');
  console.log(`✓ Cleaned ${filename}`);
});

console.log('\n✅ Error pages cleanup complete!');
