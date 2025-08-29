#!/usr/bin/env tsx

/**
 * Comprehensive Security Test Suite
 * Run with: npm run test:security:all
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  details?: string;
}

const tests = [
  {
    name: 'CSRF Protection',
    command: 'npm',
    args: ['run', 'test:csrf'],
  },
  {
    name: 'XSS Protection',
    command: 'npm',
    args: ['run', 'test:xss'],
  },
  {
    name: 'Session Security',
    command: 'npm',
    args: ['run', 'test:session-security'],
  },
  {
    name: 'Security Headers',
    command: 'curl',
    args: ['-I', 'http://localhost:3000'],
    validate: (output: string) => {
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
      ];
      return requiredHeaders.every(header => 
        output.toLowerCase().includes(header.toLowerCase())
      );
    },
  },
];

async function runTest(test: typeof tests[0]): Promise<TestResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const process = spawn(test.command, test.args);
    let output = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      let status: TestResult['status'] = 'failed';
      if (code === 0) {
        // Additional validation if provided
        if (test.validate) {
          status = test.validate(output) ? 'passed' : 'failed';
        } else {
          status = 'passed';
        }
      }
      
      resolve({
        name: test.name,
        status,
        duration,
        details: status === 'failed' ? output.slice(-500) : undefined,
      });
    });
    
    process.on('error', (err) => {
      resolve({
        name: test.name,
        status: 'failed',
        duration: Date.now() - startTime,
        details: err.message,
      });
    });
  });
}

async function runSecurityTestSuite() {
  console.log(chalk.bold('\n🔐 Security Test Suite\n'));
  console.log('Running comprehensive security tests...\n');
  
  const results: TestResult[] = [];
  
  // Check if development server is running
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (!response.ok) {
      console.log(chalk.yellow('⚠️  Development server not responding. Some tests may fail.\n'));
    }
  } catch {
    console.log(chalk.yellow('⚠️  Development server not running. Starting server...\n'));
    console.log(chalk.gray('Please ensure the development server is running: npm run dev\n'));
  }
  
  // Run tests sequentially
  for (const test of tests) {
    process.stdout.write(`Running ${test.name}... `);
    const result = await runTest(test);
    results.push(result);
    
    if (result.status === 'passed') {
      console.log(chalk.green(`✓ Passed (${result.duration}ms)`));
    } else {
      console.log(chalk.red(`✗ Failed (${result.duration}ms)`));
      if (result.details) {
        console.log(chalk.gray(`  Details: ${result.details.slice(0, 200)}...`));
      }
    }
  }
  
  // Summary
  console.log('\n' + chalk.bold('Test Summary'));
  console.log('─'.repeat(50));
  
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`${chalk.green('Passed')}: ${passed}`);
  console.log(`${chalk.red('Failed')}: ${failed}`);
  console.log(`Duration: ${totalDuration}ms\n`);
  
  // Security score
  const score = Math.round((passed / results.length) * 100);
  const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
  console.log(chalk.bold('Security Score: ') + scoreColor(`${score}%`));
  
  // Recommendations
  if (failed > 0) {
    console.log('\n' + chalk.bold('Recommendations:'));
    results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`- Fix ${r.name} issues`);
      });
  } else {
    console.log('\n' + chalk.green('✨ All security tests passed!'));
  }
  
  // Exit code based on results
  process.exit(failed > 0 ? 1 : 0);
}

// Run the test suite
runSecurityTestSuite().catch(console.error);