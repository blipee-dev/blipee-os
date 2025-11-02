const fs = require('fs');

const files = ['index.html', 'example.html'];

files.forEach(file => {
  console.log(`Processing ${file}...`);
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix btn-primary color
  content = content.replace(
    /(\.btn-primary\s*\{[\s\S]*?)color:\s*#ffffff;/g,
    '$1color: #ffffff !important;'
  );
  content = content.replace(
    /(\.btn-primary\s*\{[\s\S]*?)color:\s*var\(--white\);/g,
    '$1color: #ffffff !important;'
  );
  
  // Add to hover if missing
  if (content.includes('.btn-primary:hover') && !content.match(/\.btn-primary:hover[\s\S]*?color.*!important/)) {
    content = content.replace(
      /(\.btn-primary:hover\s*\{[\s\S]*?)(})/,
      '$1  color: #ffffff !important;\n      $2'
    );
  }
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✓ Updated ${file}`);
});
