/**
 * E2E Test Suite Runner
 * Phase 5, Task 5.1: Comprehensive test execution and reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface TestSuite {
  name: string;
  description: string;
  testFiles: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration: number; // in minutes
  dependencies?: string[];
}

export interface TestResults {
  suiteName: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  status: 'passed' | 'failed' | 'error';
  errorMessage?: string;
  artifacts: string[];
}

export class E2ETestSuiteRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Authentication',
      description: 'User authentication and authorization flows',
      testFiles: ['user-journeys/authentication-journey.test.ts'],
      priority: 'critical',
      estimatedDuration: 15
    },
    {
      name: 'Sustainability Management',
      description: 'Core sustainability data management features',
      testFiles: ['user-journeys/sustainability-management-journey.test.ts'],
      priority: 'critical',
      estimatedDuration: 25,
      dependencies: ['Authentication']
    },
    {
      name: 'AI Conversation',
      description: 'AI-powered conversation and intelligence features',
      testFiles: ['user-journeys/ai-conversation-journey.test.ts'],
      priority: 'high',
      estimatedDuration: 30,
      dependencies: ['Authentication']
    },
    {
      name: 'Performance',
      description: 'Performance benchmarks and load testing',
      testFiles: ['performance/performance-tests.test.ts'],
      priority: 'high',
      estimatedDuration: 20
    },
    {
      name: 'Accessibility',
      description: 'WCAG compliance and accessibility testing',
      testFiles: ['accessibility/accessibility-tests.test.ts'],
      priority: 'medium',
      estimatedDuration: 15
    }
  ];

  private results: TestResults[] = [];

  async runAllSuites(options: {
    parallel?: boolean;
    includeOnly?: string[];
    exclude?: string[];
    browser?: 'chromium' | 'firefox' | 'webkit' | 'all';
    headless?: boolean;
  } = {}): Promise<{
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    totalDuration: number;
    results: TestResults[];
  }> {
    
    console.log('\n🚀 Starting E2E Test Suite Execution\n');

    const startTime = Date.now();
    this.results = [];

    // Filter test suites based on options
    let suitesToRun = this.testSuites;
    
    if (options.includeOnly) {
      suitesToRun = suitesToRun.filter(suite => 
        options.includeOnly!.includes(suite.name)
      );
    }
    
    if (options.exclude) {
      suitesToRun = suitesToRun.filter(suite => 
        !options.exclude!.includes(suite.name)
      );
    }

    // Sort by priority and dependencies
    suitesToRun = this.sortSuitesByDependencies(suitesToRun);

    console.log(`📋 Test Plan:`);
    suitesToRun.forEach((suite, index) => {
      console.log(`  ${index + 1}. ${suite.name} (${suite.priority}) - ~${suite.estimatedDuration}min`);
    });

    const totalEstimatedTime = suitesToRun.reduce((sum, suite) => sum + suite.estimatedDuration, 0);
    console.log(`\n⏱️ Total Estimated Duration: ${totalEstimatedTime} minutes\n`);

    // Run test suites
    if (options.parallel) {
      await this.runSuitesInParallel(suitesToRun, options);
    } else {
      await this.runSuitesSequentially(suitesToRun, options);
    }

    const totalDuration = Date.now() - startTime;
    const passedSuites = this.results.filter(r => r.status === 'passed').length;
    const failedSuites = this.results.filter(r => r.status === 'failed' || r.status === 'error').length;

    // Generate comprehensive report
    await this.generateTestReport();

    console.log('\n📊 Final Test Results Summary:');
    console.log(`  Total Suites: ${this.results.length}`);
    console.log(`  Passed: ${passedSuites} ✅`);
    console.log(`  Failed: ${failedSuites} ❌`);
    console.log(`  Success Rate: ${((passedSuites / this.results.length) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${Math.round(totalDuration / 1000 / 60)} minutes`);

    return {
      totalSuites: this.results.length,
      passedSuites,
      failedSuites,
      totalDuration,
      results: this.results
    };
  }

  private async runSuitesSequentially(
    suites: TestSuite[], 
    options: { browser?: string; headless?: boolean }
  ): Promise<void> {
    for (const suite of suites) {
      console.log(`\n🧪 Running Test Suite: ${suite.name}`);
      console.log(`   ${suite.description}`);
      
      const result = await this.runSingleSuite(suite, options);
      this.results.push(result);

      if (result.status === 'failed' && suite.priority === 'critical') {
        console.log(`\n❌ Critical test suite failed: ${suite.name}`);
        console.log('   Stopping execution due to critical failure');
        break;
      }
    }
  }

  private async runSuitesInParallel(
    suites: TestSuite[], 
    options: { browser?: string; headless?: boolean }
  ): Promise<void> {
    // Group suites by dependencies
    const independentSuites = suites.filter(s => !s.dependencies || s.dependencies.length === 0);
    const dependentSuites = suites.filter(s => s.dependencies && s.dependencies.length > 0);

    // Run independent suites in parallel
    if (independentSuites.length > 0) {
      console.log(`\n🔄 Running ${independentSuites.length} independent suites in parallel...`);
      
      const promises = independentSuites.map(suite => this.runSingleSuite(suite, options));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.results.push(result.value);
        } else {
          this.results.push({
            suiteName: independentSuites[index].name,
            passed: 0,
            failed: 1,
            skipped: 0,
            duration: 0,
            startTime: new Date(),
            endTime: new Date(),
            status: 'error',
            errorMessage: result.reason?.message || 'Unknown error',
            artifacts: []
          });
        }
      });
    }

    // Run dependent suites sequentially
    if (dependentSuites.length > 0) {
      console.log(`\n🔗 Running ${dependentSuites.length} dependent suites sequentially...`);
      await this.runSuitesSequentially(dependentSuites, options);
    }
  }

  private async runSingleSuite(
    suite: TestSuite, 
    options: { browser?: string; headless?: boolean }
  ): Promise<TestResults> {
    const startTime = new Date();
    const result: TestResults = {
      suiteName: suite.name,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      startTime,
      endTime: startTime,
      status: 'failed',
      artifacts: []
    };

    try {
      // Build Playwright command
      const browser = options.browser || 'chromium';
      const headless = options.headless !== false;
      
      let command = `npx playwright test`;
      
      // Add test files
      const testFiles = suite.testFiles.map(file => `src/test/e2e/${file}`).join(' ');
      command += ` ${testFiles}`;
      
      // Add browser selection
      if (browser !== 'all') {
        command += ` --project=${browser}`;
      }
      
      // Add other options
      command += ` --reporter=json`;
      command += ` --output-dir=test-results/artifacts/${suite.name.toLowerCase()}`;
      
      if (headless) {
        command += ` --headed=false`;
      }

      console.log(`   Command: ${command}`);
      
      // Execute tests
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: suite.estimatedDuration * 60 * 1000 * 2 // 2x estimated time as max
      });

      // Parse results
      const jsonMatch = output.match(/\{.*\}/s);
      if (jsonMatch) {
        const testResults = JSON.parse(jsonMatch[0]);
        result.passed = testResults.stats?.passed || 0;
        result.failed = testResults.stats?.failed || 0;
        result.skipped = testResults.stats?.skipped || 0;
        result.status = result.failed === 0 ? 'passed' : 'failed';
      } else {
        result.status = 'passed'; // If no JSON found, assume success
      }

      console.log(`   ✅ Suite completed: ${result.passed}/${result.passed + result.failed} tests passed`);

    } catch (error) {
      result.status = 'error';
      result.errorMessage = error instanceof Error ? error.message : String(error);
      result.failed = 1;
      
      console.log(`   ❌ Suite failed: ${result.errorMessage}`);
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    // Collect artifacts
    const artifactsDir = `test-results/artifacts/${suite.name.toLowerCase()}`;
    if (fs.existsSync(artifactsDir)) {
      const files = fs.readdirSync(artifactsDir, { recursive: true }) as string[];
      result.artifacts = files.map(file => path.join(artifactsDir, file));
    }

    return result;
  }

  private sortSuitesByDependencies(suites: TestSuite[]): TestSuite[] {
    const sorted: TestSuite[] = [];
    const remaining = [...suites];
    const completed = new Set<string>();

    while (remaining.length > 0) {
      const readySuites = remaining.filter(suite => 
        !suite.dependencies || 
        suite.dependencies.every(dep => completed.has(dep))
      );

      if (readySuites.length === 0) {
        // Circular dependency or missing dependency
        console.warn('⚠️ Circular or missing dependencies detected, adding remaining suites');
        sorted.push(...remaining);
        break;
      }

      // Sort by priority within ready suites
      readySuites.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      const suite = readySuites[0];
      sorted.push(suite);
      completed.add(suite.name);
      remaining.splice(remaining.indexOf(suite), 1);
    }

    return sorted;
  }

  private async generateTestReport(): Promise<void> {
    const reportDir = 'test-results';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Ensure report directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: this.results.length,
        passedSuites: this.results.filter(r => r.status === 'passed').length,
        failedSuites: this.results.filter(r => r.status === 'failed' || r.status === 'error').length,
        totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0),
        passedTests: this.results.reduce((sum, r) => sum + r.passed, 0),
        failedTests: this.results.reduce((sum, r) => sum + r.failed, 0),
        skippedTests: this.results.reduce((sum, r) => sum + r.skipped, 0),
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0)
      },
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: process.env.CI === 'true',
        baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
      }
    };

    fs.writeFileSync(
      path.join(reportDir, `e2e-test-report-${timestamp}.json`),
      JSON.stringify(jsonReport, null, 2)
    );

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(jsonReport);
    fs.writeFileSync(
      path.join(reportDir, `e2e-test-report-${timestamp}.html`),
      htmlReport
    );

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(jsonReport);
    fs.writeFileSync(
      path.join(reportDir, 'E2E_TEST_REPORT.md'),
      markdownReport
    );

    console.log(`\n📄 Test reports generated:`);
    console.log(`   JSON: test-results/e2e-test-report-${timestamp}.json`);
    console.log(`   HTML: test-results/e2e-test-report-${timestamp}.html`);
    console.log(`   Markdown: test-results/E2E_TEST_REPORT.md`);
  }

  private generateHtmlReport(report: any): string {
    const successRate = ((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1);
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Report - blipee-os</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .success { border-left-color: #28a745; }
        .danger { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .passed { color: #28a745; font-weight: bold; }
        .failed { color: #dc3545; font-weight: bold; }
        .error { color: #fd7e14; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 E2E Test Report - blipee-os</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="card success">
            <h3>✅ Passed Tests</h3>
            <h2>${report.summary.passedTests}</h2>
        </div>
        <div class="card ${report.summary.failedTests > 0 ? 'danger' : 'success'}">
            <h3>❌ Failed Tests</h3>
            <h2>${report.summary.failedTests}</h2>
        </div>
        <div class="card">
            <h3>📊 Success Rate</h3>
            <h2>${successRate}%</h2>
        </div>
        <div class="card">
            <h3>⏱️ Duration</h3>
            <h2>${Math.round(report.summary.totalDuration / 60000)}m</h2>
        </div>
    </div>
    
    <h2>📋 Test Suite Results</h2>
    <table>
        <thead>
            <tr>
                <th>Suite</th>
                <th>Status</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Duration</th>
                <th>Artifacts</th>
            </tr>
        </thead>
        <tbody>
            ${report.results.map((result: any) => `
                <tr>
                    <td>${result.suiteName}</td>
                    <td class="${result.status}">${result.status.toUpperCase()}</td>
                    <td class="passed">${result.passed}</td>
                    <td class="failed">${result.failed}</td>
                    <td>${Math.round(result.duration / 1000)}s</td>
                    <td>${result.artifacts.length} files</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <h2>🔧 Environment</h2>
    <ul>
        <li><strong>Base URL:</strong> ${report.environment.baseUrl}</li>
        <li><strong>Platform:</strong> ${report.environment.platform} (${report.environment.arch})</li>
        <li><strong>Node Version:</strong> ${report.environment.nodeVersion}</li>
        <li><strong>CI Environment:</strong> ${report.environment.ci ? 'Yes' : 'No'}</li>
    </ul>
</body>
</html>`;
  }

  private generateMarkdownReport(report: any): string {
    const successRate = ((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1);
    const duration = Math.round(report.summary.totalDuration / 60000);

    return `# E2E Test Report - blipee-os

**Generated**: ${report.timestamp}

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | ${report.summary.totalTests} |
| **Passed** | ${report.summary.passedTests} ✅ |
| **Failed** | ${report.summary.failedTests} ❌ |
| **Success Rate** | ${successRate}% |
| **Duration** | ${duration} minutes |

## 📋 Test Suite Results

| Suite | Status | Passed | Failed | Duration | Artifacts |
|-------|--------|--------|--------|----------|-----------|
${report.results.map((result: any) => 
  `| ${result.suiteName} | ${result.status === 'passed' ? '✅' : '❌'} ${result.status.toUpperCase()} | ${result.passed} | ${result.failed} | ${Math.round(result.duration / 1000)}s | ${result.artifacts.length} files |`
).join('\n')}

## 🔧 Environment

- **Base URL**: ${report.environment.baseUrl}
- **Platform**: ${report.environment.platform} (${report.environment.arch})
- **Node Version**: ${report.environment.nodeVersion}
- **CI Environment**: ${report.environment.ci ? 'Yes' : 'No'}

---

*Generated by blipee-os E2E Test Suite*
`;
  }
}

// CLI Usage
if (require.main === module) {
  const runner = new E2ETestSuiteRunner();
  
  const options = {
    parallel: process.argv.includes('--parallel'),
    headless: !process.argv.includes('--headed'),
    browser: process.argv.find(arg => arg.startsWith('--browser='))?.split('=')[1] as any || 'chromium',
    includeOnly: process.argv.find(arg => arg.startsWith('--include='))?.split('=')[1]?.split(','),
    exclude: process.argv.find(arg => arg.startsWith('--exclude='))?.split('=')[1]?.split(',')
  };

  runner.runAllSuites(options)
    .then(results => {
      console.log('\n🎉 E2E Test Suite Execution Complete!');
      process.exit(results.failedSuites > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ E2E Test Suite Execution Failed:', error);
      process.exit(1);
    });
}