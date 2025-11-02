const fs = require('fs');

let content = fs.readFileSync('carbon-dashboard.html', 'utf8');

// 1. Update title
content = content.replace('<title>Energy Dashboard - Blipee</title>', '<title>Carbon Dashboard - Blipee</title>');

// 2. Update navigation active link
content = content.replace(
  /<li><a href="energy-dashboard\.html" class="nav-link active">Energy<\/a><\/li>/,
  '<li><a href="energy-dashboard.html" class="nav-link">Energy</a></li>'
);
content = content.replace(
  /<li><a href="#" class="nav-link">Carbon<\/a><\/li>/,
  '<li><a href="carbon-dashboard.html" class="nav-link active">Carbon</a></li>'
);

// 3. Update logo link
content = content.replace(
  /<a href="energy-dashboard\.html" class="logo">blipee<\/a>/,
  '<a href="index.html" class="logo">blipee</a>'
);

// 4. Update dashboard icon and title
content = content.replace(
  /<svg class="energy-icon" viewBox="0 0 24 24"[\s\S]*?<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"\/>/,
  `<svg class="carbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v12M6 12h12"/>`
);

content = content.replace(
  /<h1>Energy Dashboard<\/h1>/,
  '<h1>Carbon Dashboard</h1>'
);

content = content.replace(
  'Monitor and analyze energy consumption across your organization',
  'Track and reduce carbon emissions across your organization'
);

// 5. Update CSS for carbon icon
content = content.replace(
  /\.energy-icon \{[\s\S]*?\}/,
  `.carbon-icon {
        width: 32px;
        height: 32px;
        color: var(--green);
      }`
);

// Write the modified content
fs.writeFileSync('carbon-dashboard.html', content, 'utf8');
console.log('✅ Carbon dashboard basic structure updated');
