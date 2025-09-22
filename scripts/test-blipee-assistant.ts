#!/usr/bin/env node

/**
 * Blipee Assistant Test Runner
 * Run comprehensive tests on the Blipee Assistant system
 */

import { exec } from 'child_process';
import { promisify } from 'util';
// Simple colors and spinner for testing
const chalk = {
  blue: { bold: (text: string) => `\x1b[34m\x1b[1m${text}\x1b[0m` },
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  magenta: { bold: (text: string) => `\x1b[35m\x1b[1m${text}\x1b[0m` },
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`
};

// Simple spinner implementation
class SimpleSpinner {
  private text: string = '';
  private interval: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private frameIndex = 0;

  start(text: string): SimpleSpinner {
    this.text = text;
    this.frameIndex = 0;
    process.stdout.write('\x1B[?25l'); // Hide cursor
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.frameIndex]} ${this.text}`);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, 80);
    return this;
  }

  succeed(text: string): void {
    this.stop();
    console.log(`\r✅ ${text}`);
  }

  fail(text: string): void {
    this.stop();
    console.log(`\r❌ ${text}`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r\x1B[K'); // Clear line
    process.stdout.write('\x1B[?25h'); // Show cursor
  }
}

const ora = (text: string) => new SimpleSpinner().start(text);

const execAsync = promisify(exec);

const API_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';
const TEST_ENDPOINT = `${API_URL}/api/ai/assistant/test`;

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
  details?: any;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: string;
  successRate: string;
}

async function runTests() {
  console.log(chalk.blue.bold('\n🤖 Blipee Assistant Test Suite\n'));
  console.log(chalk.gray('Testing comprehensive assistant functionality...\n'));

  const spinner = ora('Initializing tests...').start();

  try {
    // Check if server is running
    spinner.text = 'Checking server status...';
    const serverCheck = await fetch(API_URL).catch(() => null);
    
    if (!serverCheck) {
      spinner.fail(chalk.red('Server not running!'));
      console.log(chalk.yellow('\nPlease start the server with: npm run dev'));
      process.exit(1);
    }

    spinner.text = 'Running test suite...';

    // Run tests
    const response = await fetch(TEST_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      spinner.fail(chalk.red('Test suite failed'));
      console.error(chalk.red(`\nError: ${error.message || 'Unknown error'}\n`));
      
      if (response.status === 401) {
        console.log(chalk.yellow('Please log in to the application first.'));
      }
      
      process.exit(1);
    }

    const results = await response.json();
    spinner.succeed(chalk.green('Test suite completed'));

    // Display results
    displayResults(results);

    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);

  } catch (error) {
    spinner.fail(chalk.red('Test runner failed'));
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
    process.exit(1);
  }
}

function displayResults(data: {
  success: boolean;
  summary: TestSummary;
  results: TestResult[];
  timestamp: string;
}) {
  console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
  
  // Individual test results
  console.log(chalk.bold('Test Results:\n'));
  
  data.results.forEach((test, index) => {
    const icon = test.status === 'passed' ? '✅' : 
                 test.status === 'failed' ? '❌' : '⏭️';
    const color = test.status === 'passed' ? chalk.green :
                   test.status === 'failed' ? chalk.red : chalk.yellow;
    
    console.log(`  ${icon} ${color(test.name.padEnd(25))} ${chalk.gray(`(${test.duration}ms)`)}`);
    
    if (test.message) {
      console.log(chalk.gray(`     ${test.message}`));
    }
    
    if (test.status === 'failed' && test.details) {
      console.log(chalk.red(`     Details: ${JSON.stringify(test.details, null, 2)}`));
    }
  });

  // Summary
  console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
  console.log(chalk.bold('Summary:\n'));
  
  const summaryColor = data.summary.failed === 0 ? chalk.green : 
                       data.summary.failed > 2 ? chalk.red : chalk.yellow;
  
  console.log(`  Total Tests:    ${chalk.bold(data.summary.total)}`);
  console.log(`  Passed:         ${chalk.green(data.summary.passed)}`);
  console.log(`  Failed:         ${chalk.red(data.summary.failed)}`);
  console.log(`  Skipped:        ${chalk.yellow(data.summary.skipped)}`);
  console.log(`  Success Rate:   ${summaryColor.bold(data.summary.successRate)}`);
  console.log(`  Duration:       ${chalk.gray(data.summary.duration)}`);
  console.log(`  Timestamp:      ${chalk.gray(new Date(data.timestamp).toLocaleString())}`);

  console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

  // Overall result
  if (data.success) {
    console.log(chalk.green.bold('✨ All tests passed successfully!\n'));
  } else {
    console.log(chalk.red.bold(`⚠️  ${data.summary.failed} test(s) failed\n`));
    console.log(chalk.yellow('Please review the failed tests above.\n'));
  }
}

// Interactive test scenarios
async function runInteractiveTests() {
  console.log(chalk.blue.bold('\n🎮 Interactive Test Mode\n'));
  console.log(chalk.gray('This will simulate real user interactions...\n'));

  const scenarios = [
    {
      name: 'Emissions Query',
      message: 'Show me our total carbon emissions for this quarter',
      expectedIntent: 'analysis'
    },
    {
      name: 'Data Entry',
      message: 'I need to add electricity usage data for Building A',
      expectedIntent: 'data_entry'
    },
    {
      name: 'Compliance Check',
      message: 'Are we compliant with GRI standards?',
      expectedIntent: 'compliance_check'
    },
    {
      name: 'Report Generation',
      message: 'Generate a sustainability report for investors',
      expectedIntent: 'reporting'
    },
    {
      name: 'Optimization',
      message: 'How can we reduce our Scope 2 emissions?',
      expectedIntent: 'optimization'
    }
  ];

  for (const scenario of scenarios) {
    console.log(chalk.cyan(`\nTesting: ${scenario.name}`));
    console.log(chalk.gray(`Message: "${scenario.message}"}`));
    
    const spinner = ora('Processing...').start();
    
    try {
      const response = await fetch(`${API_URL}/api/ai/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'chat',
          message: scenario.message,
          conversationId: `test-${Date.now()}`,
          pathname: '/test'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.response) {
        spinner.succeed(chalk.green('Response generated'));
        console.log(chalk.gray(`Intent: ${data.response.metadata?.intent?.primary || 'unknown'}}`));
        console.log(chalk.gray(`Confidence: ${Math.round((data.response.metadata?.confidence || 0) * 100)}%`));
        
        if (data.response.metadata?.intent?.primary === scenario.expectedIntent) {
          console.log(chalk.green('✅ Intent matched expected'));
        } else {
          console.log(chalk.yellow(`⚠️  Expected ${scenario.expectedIntent}, got ${data.response.metadata?.intent?.primary}`));
        }
      } else {
        spinner.fail(chalk.red('Failed to generate response'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Test failed'));
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown'}}`));
    }
  }

  console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
  console.log(chalk.green('Interactive tests completed\n'));
}

// Performance benchmark
async function runPerformanceBenchmark() {
  console.log(chalk.blue.bold('\n⚡ Performance Benchmark\n'));
  console.log(chalk.gray('Testing response times and throughput...\n'));

  const iterations = 10;
  const responseTimes: number[] = [];
  const errors: string[] = [];

  const spinner = ora(`Running ${iterations} iterations...`).start();

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_URL}/api/ai/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'chat',
          message: `Test query ${i}: Show emissions data`,
          conversationId: `benchmark-${Date.now()}`,
          pathname: '/benchmark'
        })
      });

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      if (!response.ok) {
        errors.push(`Request ${i} failed: ${response.status}`);
      }

      spinner.text = `Completed ${i + 1}/${iterations} iterations...`;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      errors.push(`Request ${i} error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  spinner.succeed(chalk.green('Benchmark completed'));

  // Calculate statistics
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  const successRate = ((iterations - errors.length) / iterations) * 100;

  console.log('\n' + chalk.bold('Performance Metrics:\n'));
  console.log(`  Average Response:  ${chalk.cyan(Math.round(avgTime) + 'ms')}`);
  console.log(`  Minimum Response:  ${chalk.green(minTime + 'ms')}`);
  console.log(`  Maximum Response:  ${chalk.yellow(maxTime + 'ms')}`);
  console.log(`  Success Rate:      ${successRate === 100 ? chalk.green(successRate + '%') : chalk.yellow(successRate + '%')}`);
  console.log(`  Errors:            ${errors.length === 0 ? chalk.green('0') : chalk.red(errors.length)}`);

  if (errors.length > 0) {
    console.log('\n' + chalk.red('Errors:'));
    errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
  }

  console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

  // Performance assessment
  if (avgTime < 500 && successRate === 100) {
    console.log(chalk.green.bold('🚀 Excellent performance!\n'));
  } else if (avgTime < 1000 && successRate >= 90) {
    console.log(chalk.yellow('⚡ Good performance, room for optimization\n'));
  } else {
    console.log(chalk.red('⚠️  Performance needs improvement\n'));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'standard';

  console.clear();
  console.log(chalk.magenta.bold('╔════════════════════════════════════════╗'));
  console.log(chalk.magenta.bold('║     Blipee Assistant Test Suite        ║'));
  console.log(chalk.magenta.bold('╚════════════════════════════════════════╝'));

  switch (mode) {
    case 'interactive':
      await runInteractiveTests();
      break;
    case 'benchmark':
      await runPerformanceBenchmark();
      break;
    case 'all':
      await runTests();
      await runInteractiveTests();
      await runPerformanceBenchmark();
      break;
    default:
      await runTests();
  }

  console.log(chalk.blue('\nTest suite execution completed\n'));
}

// Run tests
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});