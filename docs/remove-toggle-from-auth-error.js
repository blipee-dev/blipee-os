const fs = require('fs');

// Pages without footers - should NOT have toggle button
const files = ['signin.html', 'signup.html', 'forgot-password.html', 'reset-password.html', '403.html', '404.html', '500.html', '503.html'];

files.forEach(filename => {
  console.log(`Removing toggle button from ${filename}...`);
  
  let content = fs.readFileSync(filename, 'utf8');
  
  // Remove theme toggle HTML
  const toggleHTMLRegex = /<div class="theme-toggle-container">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\n/;
  content = content.replace(toggleHTMLRegex, '');
  
  // Remove theme toggle CSS
  const toggleCSSRegex = /\/\* Theme Toggle \*\/[\s\S]*?(@media \(max-width: 768px\) \{\s*\.theme-toggle-container \{[\s\S]*?\}\s*\})\s*/;
  content = content.replace(toggleCSSRegex, '');
  
  fs.writeFileSync(filename, content, 'utf8');
  console.log(`✓ Removed toggle from ${filename}`);
});

console.log('\n✅ Toggle buttons removed from auth and error pages!');
console.log('These pages will still respect the theme selection from localStorage.');
