#!/usr/bin/env tsx
import { readFile } from 'fs/promises';
import { WorkflowRunner } from './workflows/workflow-runner';
import type { WorkflowConfig } from './workflows/types';

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Usage: run-workflow <workflow.json>');
    process.exit(1);
  }

  const raw = await readFile(configPath, 'utf8');
  const config = JSON.parse(raw) as WorkflowConfig;

  const runner = new WorkflowRunner(config);
  const results = await runner.run({ verbose: true });

  console.log('\n=== Workflow Summary ===');
  results.forEach((result) => {
    console.log(`- ${result.step.id}: ${result.status}`);
    if (result.lastMessage) {
      console.log(`  Last message: ${result.lastMessage.slice(0, 120).trim()}…`);
    }
    if (result.error) {
      console.error('  Error:', result.error);
    }
  });
}

main().catch((error) => {
  console.error('Workflow execution failed:', error);
  process.exit(1);
});
