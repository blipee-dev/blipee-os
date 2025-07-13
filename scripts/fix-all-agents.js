const fs = require('fs');
const path = require('path');

// List of agent files that need fixing
const agentFiles = [
  'compliance-guardian.ts',
  'supply-chain-investigator.ts', 
  'swarm-intelligence.ts',
  'cost-saving-finder.ts',
  'predictive-maintenance.ts',
  'self-improvement-loops.ts'
];

const agentsDir = path.join(__dirname, '..', 'src', 'lib', 'ai', 'autonomous-agents');

// Fix each file
agentFiles.forEach(file => {
  const filePath = path.join(agentsDir, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace logEvent with console.log
    content = content.replace(/await this\.logEvent\(/g, 'console.log(');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n✅ All agent files fixed!');