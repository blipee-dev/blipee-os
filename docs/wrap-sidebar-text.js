const fs = require('fs');

let content = fs.readFileSync('energy-dashboard.html', 'utf8');

// Replace sidebar item texts with span-wrapped versions
content = content.replace(/(<a href="#" class="sidebar-item[^>]*>[\s\S]*?<\/svg>\s*)(\w+[\s\w]*?)(\s*<\/a>)/g, '$1<span>$2</span>$3');

fs.writeFileSync('energy-dashboard.html', content, 'utf8');
console.log('✓ Wrapped sidebar text in span tags');
