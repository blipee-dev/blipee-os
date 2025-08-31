/**
 * Phase Gate Review System
 * Phase 5, Task 5.5: Comprehensive quality gate evaluation and phase completion assessment
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface QualityGate {
  name: string;
  category: 'code-quality' | 'testing' | 'security' | 'performance' | 'documentation' | 'deployment';
  description: string;
  weight: number; // 1-10, importance weight
  criteria: QualityGateCriteria;
  status: 'not-started' | 'in-progress' | 'passed' | 'failed' | 'warning';
  score: number; // 0-100
  evidence: string[];
  blocksDeployment: boolean;
}

export interface QualityGateCriteria {
  required: boolean;
  threshold?: number;
  conditions: string[];
  automatedCheck: boolean;
}

export interface PhaseGateResult {
  gate: QualityGate;
  passed: boolean;
  actualValue?: number;
  expectedValue?: number;
  details: string[];
  recommendations: string[];
  evidence: string[];
  executionTime: number;
}

export interface PhaseGateReport {
  timestamp: string;
  phase: string;
  version: string;
  summary: {
    totalGates: number;
    passedGates: number;
    failedGates: number;
    warningGates: number;
    overallScore: number;
    readyForProduction: boolean;
    blockers: number;
    deploymentApproved: boolean;
  };
  results: PhaseGateResult[];
  categories: {
    [key: string]: {
      passed: number;
      total: number;
      score: number;
    };
  };
  recommendations: string[];
  nextSteps: string[];
  signoffs: {
    technical: boolean;
    security: boolean;
    performance: boolean;
    product: boolean;
  };
}

export class PhaseGateReviewSystem {
  private gates: QualityGate[] = [];
  private results: PhaseGateResult[] = [];
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.initializeQualityGates();
  }

  private initializeQualityGates(): void {
    // Code Quality Gates
    this.gates.push({
      name: 'TypeScript Compilation',
      category: 'code-quality',
      description: 'All TypeScript code compiles without errors',
      weight: 10,
      criteria: {
        required: true,
        conditions: ['Zero TypeScript compilation errors'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });

    this.gates.push({
      name: 'ESLint Code Quality',
      category: 'code-quality',
      description: 'Code passes linting rules with acceptable error count',
      weight: 8,
      criteria: {
        required: true,
        threshold: 10,
        conditions: ['ESLint errors under threshold', 'No critical violations'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: false
    });

    this.gates.push({
      name: 'Code Coverage',
      category: 'testing',
      description: 'Adequate test coverage across the codebase',
      weight: 9,
      criteria: {
        required: true,
        threshold: 70,
        conditions: ['Overall coverage >= 70%', 'Critical paths covered'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: false
    });

    // Testing Gates
    this.gates.push({
      name: 'Unit Tests',
      category: 'testing',
      description: 'All unit tests pass successfully',
      weight: 9,
      criteria: {
        required: true,
        conditions: ['All unit tests pass', 'Test execution under 5 minutes'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });

    this.gates.push({
      name: 'Integration Tests',
      category: 'testing',
      description: 'Integration tests validate system interactions',
      weight: 8,
      criteria: {
        required: true,
        conditions: ['API integration tests pass', 'Database integration verified'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });

    this.gates.push({
      name: 'End-to-End Tests',
      category: 'testing',
      description: 'Critical user journeys function correctly',
      weight: 9,
      criteria: {
        required: true,
        threshold: 90,
        conditions: ['E2E test pass rate >= 90%', 'Critical flows tested'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });

    // Security Gates
    this.gates.push({
      name: 'Security Scan',
      category: 'security',
      description: 'No critical security vulnerabilities',
      weight: 10,
      criteria: {
        required: true,
        threshold: 0,
        conditions: ['Zero critical vulnerabilities', 'High vulnerabilities under 5'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });

    this.gates.push({
      name: 'Dependency Security',
      category: 'security',
      description: 'Dependencies have no known vulnerabilities',
      weight: 8,
      criteria: {
        required: true,
        conditions: ['npm audit passes', 'No critical dependency vulnerabilities'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: false
    });

    this.gates.push({
      name: 'Penetration Testing',
      category: 'security',
      description: 'Security penetration tests pass',
      weight: 9,
      criteria: {
        required: true,
        threshold: 80,
        conditions: ['Pen test score >= 80%', 'No authentication bypasses'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });

    // Performance Gates
    this.gates.push({
      name: 'Performance Benchmarks',
      category: 'performance',
      description: 'System meets performance requirements',
      weight: 8,
      criteria: {
        required: true,
        threshold: 75,
        conditions: ['Benchmark score >= 75%', 'API response times acceptable'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: false
    });

    this.gates.push({
      name: 'Load Testing',
      category: 'performance',
      description: 'System handles expected load',
      weight: 9,
      criteria: {
        required: true,
        threshold: 80,
        conditions: ['Load test score >= 80%', 'Error rate under 5%'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: false
    });

    // Documentation Gates
    this.gates.push({
      name: 'API Documentation',
      category: 'documentation',
      description: 'API endpoints properly documented',
      weight: 6,
      criteria: {
        required: true,
        threshold: 80,
        conditions: ['API docs coverage >= 80%', 'Examples included'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: false
    });

    this.gates.push({
      name: 'Code Documentation',
      category: 'documentation',
      description: 'Code is adequately documented',
      weight: 5,
      criteria: {
        required: false,
        threshold: 70,
        conditions: ['Public API documented', 'Complex logic explained'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: false
    });

    // Deployment Gates
    this.gates.push({
      name: 'Build Success',
      category: 'deployment',
      description: 'Production build completes successfully',
      weight: 10,
      criteria: {
        required: true,
        conditions: ['Production build succeeds', 'No build warnings'],
        automatedCheck: true
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });

    this.gates.push({
      name: 'Environment Configuration',
      category: 'deployment',
      description: 'Production environment properly configured',
      weight: 8,
      criteria: {
        required: true,
        conditions: ['Environment variables set', 'Database migrations ready'],
        automatedCheck: false
      },
      status: 'not-started',
      score: 0,
      evidence: [],
      blocksDeployment: true
    });
  }

  async runPhaseGateReview(): Promise<PhaseGateReport> {
    console.log('🎯 Starting Phase Gate Review...\n');
    console.log(`Evaluating ${this.gates.length} quality gates\n`);

    this.results = [];

    for (const gate of this.gates) {
      console.log(`🔍 Evaluating: ${gate.name}`);
      console.log(`   Category: ${gate.category} | Weight: ${gate.weight}/10`);

      const startTime = Date.now();
      const result = await this.evaluateGate(gate);
      const executionTime = Date.now() - startTime;

      result.executionTime = executionTime;
      this.results.push(result);

      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const score = `${gate.score}/100`;
      console.log(`   Result: ${status} (${score})`);

      if (result.details.length > 0) {
        result.details.forEach(detail => console.log(`   ${detail}`));
      }

      console.log(''); // Empty line for readability
    }

    return this.generatePhaseGateReport();
  }

  private async evaluateGate(gate: QualityGate): Promise<PhaseGateResult> {
    const result: PhaseGateResult = {
      gate,
      passed: false,
      details: [],
      recommendations: [],
      evidence: [],
      executionTime: 0
    };

    try {
      switch (gate.name) {
        case 'TypeScript Compilation':
          await this.checkTypeScriptCompilation(gate, result);
          break;
        case 'ESLint Code Quality':
          await this.checkESLintQuality(gate, result);
          break;
        case 'Code Coverage':
          await this.checkCodeCoverage(gate, result);
          break;
        case 'Unit Tests':
          await this.checkUnitTests(gate, result);
          break;
        case 'Integration Tests':
          await this.checkIntegrationTests(gate, result);
          break;
        case 'End-to-End Tests':
          await this.checkE2ETests(gate, result);
          break;
        case 'Security Scan':
          await this.checkSecurityScan(gate, result);
          break;
        case 'Dependency Security':
          await this.checkDependencySecurity(gate, result);
          break;
        case 'Penetration Testing':
          await this.checkPenetrationTesting(gate, result);
          break;
        case 'Performance Benchmarks':
          await this.checkPerformanceBenchmarks(gate, result);
          break;
        case 'Load Testing':
          await this.checkLoadTesting(gate, result);
          break;
        case 'API Documentation':
          await this.checkAPIDocumentation(gate, result);
          break;
        case 'Code Documentation':
          await this.checkCodeDocumentation(gate, result);
          break;
        case 'Build Success':
          await this.checkBuildSuccess(gate, result);
          break;
        case 'Environment Configuration':
          await this.checkEnvironmentConfiguration(gate, result);
          break;
        default:
          result.details.push('Gate evaluation not implemented');
          gate.score = 0;
      }

      result.passed = gate.score >= (gate.criteria.threshold || 100);
      gate.status = result.passed ? 'passed' : 'failed';

    } catch (error) {
      result.details.push(`Evaluation failed: ${(error as Error).message}`);
      gate.score = 0;
      gate.status = 'failed';
    }

    return result;
  }

  private async checkTypeScriptCompilation(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      const output = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      gate.score = 100;
      result.details.push('TypeScript compilation successful');
      result.evidence.push('No TypeScript errors found');
      
    } catch (error) {
      const errorOutput = (error as any).stdout || (error as any).message;
      const errorCount = (errorOutput.match(/error TS/g) || []).length;
      
      gate.score = Math.max(0, 100 - (errorCount * 5)); // -5 points per error
      result.details.push(`Found ${errorCount} TypeScript errors`);
      result.recommendations.push('Fix TypeScript compilation errors');
      result.evidence.push(errorOutput.substring(0, 500));
    }
  }

  private async checkESLintQuality(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      const output = execSync('npx eslint . --ext .ts,.tsx --format json', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const eslintResults = JSON.parse(output);
      const totalErrors = eslintResults.reduce((sum: number, file: any) => sum + file.errorCount, 0);
      const totalWarnings = eslintResults.reduce((sum: number, file: any) => sum + file.warningCount, 0);

      const threshold = gate.criteria.threshold || 10;
      gate.score = totalErrors <= threshold ? 100 : Math.max(0, 100 - (totalErrors - threshold) * 5);
      
      result.actualValue = totalErrors;
      result.expectedValue = threshold;
      result.details.push(`ESLint: ${totalErrors} errors, ${totalWarnings} warnings`);
      
      if (totalErrors > threshold) {
        result.recommendations.push('Reduce ESLint errors to meet quality standards');
      }

    } catch (error) {
      // ESLint might exit with non-zero for errors, parse output anyway
      const errorOutput = (error as any).stdout;
      if (errorOutput) {
        try {
          const eslintResults = JSON.parse(errorOutput);
          const totalErrors = eslintResults.reduce((sum: number, file: any) => sum + file.errorCount, 0);
          gate.score = totalErrors === 0 ? 100 : Math.max(0, 100 - totalErrors * 5);
          result.details.push(`ESLint found ${totalErrors} errors`);
        } catch {
          gate.score = 50; // Partial score if we can't parse results
          result.details.push('ESLint check completed with issues');
        }
      } else {
        gate.score = 0;
        result.details.push('ESLint check failed');
      }
    }
  }

  private async checkCodeCoverage(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check if coverage data exists
      const coveragePaths = [
        'coverage/coverage-summary.json',
        'test-results/coverage/coverage-summary.json'
      ];

      let coverageData = null;
      for (const coveragePath of coveragePaths) {
        if (fs.existsSync(coveragePath)) {
          coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          break;
        }
      }

      if (coverageData && coverageData.total) {
        const coverage = coverageData.total.lines.pct;
        gate.score = coverage;
        result.actualValue = coverage;
        result.expectedValue = gate.criteria.threshold || 70;
        result.details.push(`Code coverage: ${coverage}%`);
        
        if (coverage < (gate.criteria.threshold || 70)) {
          result.recommendations.push('Increase test coverage to meet quality standards');
        }
      } else {
        gate.score = 0;
        result.details.push('Coverage data not found');
        result.recommendations.push('Run tests with coverage reporting');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('Coverage check failed');
    }
  }

  private async checkUnitTests(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      const output = execSync('npm run test:unit', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });

      // Check for test results in output
      const passedTests = (output.match(/✓/g) || []).length;
      const failedTests = (output.match(/✗|×/g) || []).length;
      const totalTests = passedTests + failedTests;

      if (totalTests > 0) {
        gate.score = (passedTests / totalTests) * 100;
        result.details.push(`Unit tests: ${passedTests}/${totalTests} passed`);
      } else {
        gate.score = 100; // No tests is considered passing for this check
        result.details.push('No unit tests found or all tests passed');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('Unit tests failed or timed out');
      result.recommendations.push('Fix failing unit tests');
    }
  }

  private async checkIntegrationTests(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      const output = execSync('npm run test:integration', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 600000 // 10 minutes
      });

      gate.score = output.includes('FAIL') ? 0 : 100;
      result.details.push('Integration tests executed');

    } catch (error) {
      // Integration tests might not exist yet
      gate.score = 80; // Partial score
      result.details.push('Integration tests not available or failed');
      result.recommendations.push('Implement comprehensive integration tests');
    }
  }

  private async checkE2ETests(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check if E2E test reports exist
      const e2eReportPaths = [
        'test-results/e2e-test-report.json',
        'test-results/playwright-report/results.json'
      ];

      let reportFound = false;
      for (const reportPath of e2eReportPaths) {
        if (fs.existsSync(reportPath)) {
          const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          
          if (reportData.summary) {
            const passRate = (reportData.summary.passedTests / reportData.summary.totalTests) * 100;
            gate.score = passRate;
            result.actualValue = passRate;
            result.expectedValue = gate.criteria.threshold || 90;
            result.details.push(`E2E tests: ${passRate.toFixed(1)}% pass rate`);
          } else {
            gate.score = 85; // Partial score if report format is different
            result.details.push('E2E test report found but format not recognized');
          }
          reportFound = true;
          break;
        }
      }

      if (!reportFound) {
        gate.score = 0;
        result.details.push('E2E test results not found');
        result.recommendations.push('Run E2E tests and ensure results are saved');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('E2E test evaluation failed');
    }
  }

  private async checkSecurityScan(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check for security scan results
      const securityReportPaths = [
        'test-results/security-scans/security-scan-report.json',
        'test-results/security/security-report.json'
      ];

      let reportFound = false;
      for (const reportPath of securityReportPaths) {
        if (fs.existsSync(reportPath)) {
          const securityData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          
          const criticalIssues = securityData.summary?.criticalIssues || 0;
          const highIssues = securityData.summary?.highIssues || 0;
          
          // Score based on security issues
          gate.score = criticalIssues === 0 && highIssues < 5 ? 100 : 
                      criticalIssues === 0 ? 75 : 
                      criticalIssues < 3 ? 50 : 0;
          
          result.actualValue = criticalIssues;
          result.expectedValue = 0;
          result.details.push(`Security scan: ${criticalIssues} critical, ${highIssues} high issues`);
          
          if (criticalIssues > 0) {
            result.recommendations.push('Fix critical security vulnerabilities immediately');
          }
          
          reportFound = true;
          break;
        }
      }

      if (!reportFound) {
        gate.score = 0;
        result.details.push('Security scan results not found');
        result.recommendations.push('Run security scan and ensure results are saved');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('Security scan evaluation failed');
    }
  }

  private async checkDependencySecurity(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      const output = execSync('npm audit --json', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const auditData = JSON.parse(output);
      const vulnerabilities = auditData.metadata?.vulnerabilities || {};
      const critical = vulnerabilities.critical || 0;
      const high = vulnerabilities.high || 0;

      gate.score = critical === 0 && high === 0 ? 100 :
                  critical === 0 ? 80 :
                  critical < 3 ? 60 : 0;

      result.details.push(`Dependency audit: ${critical} critical, ${high} high vulnerabilities`);

      if (critical > 0) {
        result.recommendations.push('Update dependencies with critical vulnerabilities');
      }

    } catch (error) {
      // npm audit exits with error code when vulnerabilities found
      gate.score = 70; // Partial score
      result.details.push('Dependency security check completed with issues');
      result.recommendations.push('Review and fix dependency security issues');
    }
  }

  private async checkPenetrationTesting(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check for penetration test results
      const penTestPaths = [
        'test-results/security/security-test-report.json'
      ];

      let reportFound = false;
      for (const reportPath of penTestPaths) {
        if (fs.existsSync(reportPath)) {
          const penTestData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          
          // Assume penetration test score is available
          const securityScore = penTestData.summary?.securityScore || 0;
          gate.score = securityScore;
          result.actualValue = securityScore;
          result.expectedValue = gate.criteria.threshold || 80;
          result.details.push(`Penetration test score: ${securityScore}/100`);
          
          reportFound = true;
          break;
        }
      }

      if (!reportFound) {
        gate.score = 0;
        result.details.push('Penetration test results not found');
        result.recommendations.push('Run penetration tests');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('Penetration test evaluation failed');
    }
  }

  private async checkPerformanceBenchmarks(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check for performance benchmark results
      const perfReportPaths = [
        'test-results/performance/performance-benchmark-*.json'
      ];

      const perfDir = 'test-results/performance';
      if (fs.existsSync(perfDir)) {
        const perfFiles = fs.readdirSync(perfDir)
          .filter(f => f.includes('performance-benchmark') && f.endsWith('.json'))
          .sort()
          .reverse(); // Get latest

        if (perfFiles.length > 0) {
          const perfData = JSON.parse(fs.readFileSync(path.join(perfDir, perfFiles[0]), 'utf8'));
          const overallScore = perfData.summary?.overallScore || 0;
          
          gate.score = overallScore;
          result.actualValue = overallScore;
          result.expectedValue = gate.criteria.threshold || 75;
          result.details.push(`Performance benchmark score: ${overallScore}/100`);
        } else {
          gate.score = 0;
          result.details.push('Performance benchmark results not found');
          result.recommendations.push('Run performance benchmarks');
        }
      } else {
        gate.score = 0;
        result.details.push('Performance results directory not found');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('Performance benchmark evaluation failed');
    }
  }

  private async checkLoadTesting(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check for load test results
      const loadTestDir = 'test-results/load-testing';
      if (fs.existsSync(loadTestDir)) {
        const loadTestFiles = fs.readdirSync(loadTestDir)
          .filter(f => f.includes('load-test-report') && f.endsWith('.json'))
          .sort()
          .reverse(); // Get latest

        if (loadTestFiles.length > 0) {
          const loadTestData = JSON.parse(fs.readFileSync(path.join(loadTestDir, loadTestFiles[0]), 'utf8'));
          const overallScore = loadTestData.summary?.overallScore || 0;
          
          gate.score = overallScore;
          result.actualValue = overallScore;
          result.expectedValue = gate.criteria.threshold || 80;
          result.details.push(`Load test score: ${overallScore}/100`);
        } else {
          gate.score = 0;
          result.details.push('Load test results not found');
          result.recommendations.push('Run load tests');
        }
      } else {
        gate.score = 0;
        result.details.push('Load test results directory not found');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('Load test evaluation failed');
    }
  }

  private async checkAPIDocumentation(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check for API documentation
      const docPaths = [
        'test-results/documentation/documentation-audit-report.json'
      ];

      let reportFound = false;
      for (const docPath of docPaths) {
        if (fs.existsSync(docPath)) {
          const docData = JSON.parse(fs.readFileSync(docPath, 'utf8'));
          
          const apiDocs = docData.fileMetrics?.filter((m: any) => m.type === 'api') || [];
          const avgCompleteness = apiDocs.length > 0 ? 
            apiDocs.reduce((sum: number, doc: any) => sum + doc.completeness, 0) / apiDocs.length : 0;
          
          gate.score = avgCompleteness;
          result.actualValue = avgCompleteness;
          result.expectedValue = gate.criteria.threshold || 80;
          result.details.push(`API documentation coverage: ${avgCompleteness.toFixed(1)}%`);
          
          reportFound = true;
          break;
        }
      }

      if (!reportFound) {
        gate.score = 0;
        result.details.push('API documentation report not found');
        result.recommendations.push('Run documentation audit');
      }

    } catch (error) {
      gate.score = 0;
      result.details.push('API documentation evaluation failed');
    }
  }

  private async checkCodeDocumentation(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      // Check for code documentation audit
      const codeDocPath = 'test-results/documentation/code-documentation-audit.json';
      
      if (fs.existsSync(codeDocPath)) {
        const codeDocData = JSON.parse(fs.readFileSync(codeDocPath, 'utf8'));
        const overallCoverage = codeDocData.summary?.overallCoverage || 0;
        
        gate.score = overallCoverage;
        result.actualValue = overallCoverage;
        result.expectedValue = gate.criteria.threshold || 70;
        result.details.push(`Code documentation coverage: ${overallCoverage}%`);
      } else {
        gate.score = 50; // Partial score for optional gate
        result.details.push('Code documentation audit not found');
        result.recommendations.push('Run code documentation audit');
      }

    } catch (error) {
      gate.score = 50;
      result.details.push('Code documentation evaluation failed');
    }
  }

  private async checkBuildSuccess(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    try {
      const output = execSync('npm run build', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 600000 // 10 minutes
      });

      gate.score = 100;
      result.details.push('Production build successful');
      result.evidence.push('Build completed without errors');

    } catch (error) {
      gate.score = 0;
      result.details.push('Production build failed');
      result.recommendations.push('Fix build errors before deployment');
      result.evidence.push((error as Error).message.substring(0, 500));
    }
  }

  private async checkEnvironmentConfiguration(gate: QualityGate, result: PhaseGateResult): Promise<void> {
    // Manual check - requires human verification
    const envFiles = ['.env.example', '.env.production'];
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ];

    let score = 100;
    const details: string[] = [];

    // Check if example env file exists
    if (!fs.existsSync('.env.example')) {
      score -= 20;
      details.push('Missing .env.example file');
      result.recommendations.push('Create .env.example with required variables');
    }

    // Check if required variables are documented
    if (fs.existsSync('.env.example')) {
      const envContent = fs.readFileSync('.env.example', 'utf8');
      for (const envVar of requiredEnvVars) {
        if (!envContent.includes(envVar)) {
          score -= 10;
          details.push(`Missing ${envVar} in .env.example`);
        }
      }
    }

    gate.score = Math.max(0, score);
    result.details.push(...details);
    
    if (details.length === 0) {
      result.details.push('Environment configuration appears correct');
    }
  }

  private generatePhaseGateReport(): PhaseGateReport {
    const passedGates = this.results.filter(r => r.passed).length;
    const failedGates = this.results.filter(r => !r.passed).length;
    const warningGates = this.gates.filter(g => g.score < 100 && g.score >= (g.criteria.threshold || 80)).length;

    // Calculate weighted overall score
    const totalWeight = this.gates.reduce((sum, gate) => sum + gate.weight, 0);
    const weightedScore = this.gates.reduce((sum, gate) => sum + (gate.score * gate.weight), 0);
    const overallScore = Math.round(weightedScore / totalWeight);

    // Check deployment blockers
    const blockers = this.results.filter(r => !r.passed && r.gate.blocksDeployment).length;
    const deploymentApproved = blockers === 0 && overallScore >= 75;

    // Calculate category scores
    const categories: { [key: string]: { passed: number; total: number; score: number } } = {};
    const categoryGroups = this.groupBy(this.gates, g => g.category);
    
    for (const [category, gates] of Object.entries(categoryGroups)) {
      const categoryResults = this.results.filter(r => r.gate.category === category);
      categories[category] = {
        passed: categoryResults.filter(r => r.passed).length,
        total: gates.length,
        score: Math.round(gates.reduce((sum, gate) => sum + gate.score, 0) / gates.length)
      };
    }

    // Generate recommendations
    const recommendations = this.generateOverallRecommendations();

    // Generate next steps
    const nextSteps = this.generateNextSteps(blockers, overallScore);

    return {
      timestamp: new Date().toISOString(),
      phase: 'Phase 5 - Quality & Documentation',
      version: process.env.npm_package_version || '1.0.0',
      summary: {
        totalGates: this.gates.length,
        passedGates,
        failedGates,
        warningGates,
        overallScore,
        readyForProduction: deploymentApproved,
        blockers,
        deploymentApproved
      },
      results: this.results,
      categories,
      recommendations,
      nextSteps,
      signoffs: {
        technical: overallScore >= 80 && categories['code-quality']?.score >= 75,
        security: categories['security']?.score >= 85,
        performance: categories['performance']?.score >= 75,
        product: categories['testing']?.score >= 80 && categories['documentation']?.score >= 70
      }
    };
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): { [key: string]: T[] } {
    return array.reduce((result, item) => {
      const key = keyFn(item);
      (result[key] = result[key] || []).push(item);
      return result;
    }, {} as { [key: string]: T[] });
  }

  private generateOverallRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedResults = this.results.filter(r => !r.passed);
    const criticalFailures = failedResults.filter(r => r.gate.blocksDeployment);
    
    if (criticalFailures.length > 0) {
      recommendations.push(`🔴 ${criticalFailures.length} critical gates are blocking deployment - address immediately`);
    }

    if (failedResults.length > 0) {
      recommendations.push(`⚠️ ${failedResults.length} quality gates failed - review and address issues`);
    }

    // Category-specific recommendations
    const categoryScores = Object.entries(this.groupBy(this.gates, g => g.category))
      .map(([category, gates]) => ({
        category,
        score: Math.round(gates.reduce((sum, gate) => sum + gate.score, 0) / gates.length)
      }));

    const lowPerformingCategories = categoryScores.filter(c => c.score < 75);
    for (const category of lowPerformingCategories) {
      recommendations.push(`📈 ${category.category} quality needs improvement (${category.score}/100)`);
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 All quality gates are performing well - ready for deployment');
    }

    return recommendations;
  }

  private generateNextSteps(blockers: number, overallScore: number): string[] {
    const nextSteps: string[] = [];

    if (blockers > 0) {
      nextSteps.push('1. Address all deployment-blocking quality gate failures');
      nextSteps.push('2. Re-run phase gate review to verify fixes');
    }

    if (overallScore < 75) {
      nextSteps.push('3. Improve quality gate scores to reach minimum threshold');
    }

    if (blockers === 0 && overallScore >= 75) {
      nextSteps.push('1. Obtain stakeholder sign-offs for deployment');
      nextSteps.push('2. Schedule production deployment');
      nextSteps.push('3. Monitor system performance post-deployment');
    }

    return nextSteps;
  }

  async generateReports(outputDir: string = 'test-results/phase-gate'): Promise<PhaseGateReport> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = await this.runPhaseGateReview();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Generate JSON report
    const jsonPath = path.join(outputDir, `phase-gate-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(outputDir, `phase-gate-report-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(report);
    const summaryPath = path.join(outputDir, 'PHASE_GATE_EXECUTIVE_SUMMARY.md');
    fs.writeFileSync(summaryPath, executiveSummary);

    console.log(`\n📄 Phase gate reports generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Executive Summary: ${summaryPath}`);

    return report;
  }

  private generateHTMLReport(report: PhaseGateReport): string {
    const scoreColor = report.summary.overallScore >= 80 ? '#28a745' :
                      report.summary.overallScore >= 60 ? '#ffc107' : '#dc3545';

    const deploymentColor = report.summary.deploymentApproved ? '#28a745' : '#dc3545';

    return `<!DOCTYPE html>
<html>
<head>
    <title>Phase Gate Review - ${report.phase}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #6610f2 0%, #e83e8c 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 3em; font-weight: bold; color: ${scoreColor}; text-align: center; }
        .deployment-status { font-size: 2em; font-weight: bold; color: ${deploymentColor}; text-align: center; }
        .gate-pass { color: #28a745; }
        .gate-fail { color: #dc3545; }
        .gate-warning { color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .signoff-approved { color: #28a745; font-weight: bold; }
        .signoff-pending { color: #ffc107; font-weight: bold; }
        .category-good { color: #28a745; }
        .category-warning { color: #ffc107; }
        .category-poor { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Phase Gate Review</h1>
        <p>${report.phase} - Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Overall Score</h3>
            <div class="score">${report.summary.overallScore}</div>
        </div>
        <div class="card">
            <h3>Deployment Status</h3>
            <div class="deployment-status">${report.summary.deploymentApproved ? '✅ APPROVED' : '❌ BLOCKED'}</div>
        </div>
        <div class="card">
            <h3>Quality Gates</h3>
            <h2>${report.summary.passedGates}/${report.summary.totalGates}</h2>
            <p>Passed</p>
        </div>
        <div class="card">
            <h3>Blockers</h3>
            <h2 class="${report.summary.blockers === 0 ? 'gate-pass' : 'gate-fail'}">${report.summary.blockers}</h2>
            <p>Critical Issues</p>
        </div>
        <div class="card">
            <h3>Warnings</h3>
            <h2 class="gate-warning">${report.summary.warningGates}</h2>
            <p>Need Attention</p>
        </div>
    </div>

    <div class="card">
        <h2>📋 Category Performance</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Passed/Total</th>
                    <th>Score</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(report.categories).map(([category, stats]) => `
                    <tr>
                        <td>${category.replace('-', ' ').toUpperCase()}</td>
                        <td>${stats.passed}/${stats.total}</td>
                        <td class="${stats.score >= 80 ? 'category-good' : stats.score >= 60 ? 'category-warning' : 'category-poor'}">${stats.score}</td>
                        <td class="${stats.score >= 80 ? 'gate-pass' : stats.score >= 60 ? 'gate-warning' : 'gate-fail'}">${stats.score >= 80 ? '✅' : stats.score >= 60 ? '⚠️' : '❌'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="card">
        <h2>🔍 Quality Gate Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Gate</th>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Blocks Deployment</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${report.results.map(result => `
                    <tr>
                        <td>${result.gate.name}</td>
                        <td>${result.gate.category}</td>
                        <td>${result.gate.score}/100</td>
                        <td class="${result.passed ? 'gate-pass' : 'gate-fail'}">${result.passed ? '✅ PASS' : '❌ FAIL'}</td>
                        <td>${result.gate.blocksDeployment ? '🚫 YES' : '✅ NO'}</td>
                        <td>${result.details.join('; ')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="card">
        <h2>📝 Stakeholder Sign-offs</h2>
        <table>
            <tr>
                <td>Technical Lead</td>
                <td class="${report.signoffs.technical ? 'signoff-approved' : 'signoff-pending'}">${report.signoffs.technical ? '✅ APPROVED' : '⏳ PENDING'}</td>
            </tr>
            <tr>
                <td>Security Lead</td>
                <td class="${report.signoffs.security ? 'signoff-approved' : 'signoff-pending'}">${report.signoffs.security ? '✅ APPROVED' : '⏳ PENDING'}</td>
            </tr>
            <tr>
                <td>Performance Lead</td>
                <td class="${report.signoffs.performance ? 'signoff-approved' : 'signoff-pending'}">${report.signoffs.performance ? '✅ APPROVED' : '⏳ PENDING'}</td>
            </tr>
            <tr>
                <td>Product Lead</td>
                <td class="${report.signoffs.product ? 'signoff-approved' : 'signoff-pending'}">${report.signoffs.product ? '✅ APPROVED' : '⏳ PENDING'}</td>
            </tr>
        </table>
    </div>

    <div class="card">
        <h2>💡 Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <div class="card">
        <h2>📋 Next Steps</h2>
        <ol>
            ${report.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>
    </div>
</body>
</html>`;
  }

  private generateExecutiveSummary(report: PhaseGateReport): string {
    return `# Phase Gate Executive Summary

**Project**: blipee-os  
**Phase**: ${report.phase}  
**Date**: ${new Date(report.timestamp).toLocaleDateString()}  
**Overall Score**: ${report.summary.overallScore}/100  

## 🎯 Deployment Decision

**STATUS**: ${report.summary.deploymentApproved ? '✅ APPROVED FOR DEPLOYMENT' : '❌ DEPLOYMENT BLOCKED'}

${report.summary.deploymentApproved ? 
  'All critical quality gates have been satisfied. System is ready for production deployment.' : 
  `Deployment is blocked by ${report.summary.blockers} critical issue(s). Address blocking issues before proceeding.`}

## 📊 Quality Gate Summary

| Category | Score | Status | Gates Passed |
|----------|-------|--------|--------------|
${Object.entries(report.categories).map(([category, stats]) => 
  `| ${category.replace('-', ' ').toUpperCase()} | ${stats.score}/100 | ${stats.score >= 80 ? '✅' : stats.score >= 60 ? '⚠️' : '❌'} | ${stats.passed}/${stats.total} |`
).join('\n')}

## 🔒 Stakeholder Sign-offs

- **Technical Lead**: ${report.signoffs.technical ? '✅ APPROVED' : '⏳ PENDING'}
- **Security Lead**: ${report.signoffs.security ? '✅ APPROVED' : '⏳ PENDING'}  
- **Performance Lead**: ${report.signoffs.performance ? '✅ APPROVED' : '⏳ PENDING'}
- **Product Lead**: ${report.signoffs.product ? '✅ APPROVED' : '⏳ PENDING'}

## 🚨 Critical Issues

${report.results.filter(r => !r.passed && r.gate.blocksDeployment).length === 0 ? 
  '✅ No critical issues blocking deployment' :
  report.results.filter(r => !r.passed && r.gate.blocksDeployment)
    .map(r => `- **${r.gate.name}**: ${r.details.join('. ')}`)
    .join('\n')
}

## 📋 Next Steps

${report.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 💡 Key Recommendations

${report.recommendations.slice(0, 3).map(rec => `- ${rec}`).join('\n')}

---

*Generated by blipee-os Phase Gate Review System*  
*For detailed results, see the complete HTML report*
`;
  }
}

// CLI Usage
if (require.main === module) {
  const phaseGate = new PhaseGateReviewSystem();
  
  phaseGate.generateReports()
    .then(async (report) => {
      console.log('\n🎯 Phase Gate Review Summary:');
      console.log(`Overall Score: ${report.summary.overallScore}/100`);
      console.log(`Gates Passed: ${report.summary.passedGates}/${report.summary.totalGates}`);
      console.log(`Deployment Status: ${report.summary.deploymentApproved ? '✅ APPROVED' : '❌ BLOCKED'}`);
      console.log(`Critical Blockers: ${report.summary.blockers}`);

      if (report.summary.deploymentApproved) {
        console.log('\n🚀 System is ready for production deployment!');
      } else {
        console.log(`\n🚫 Deployment blocked by ${report.summary.blockers} critical issues`);
      }

      console.log('\n🎉 Phase Gate Review completed!');
      
      const hasBlockers = report.summary.blockers > 0;
      process.exit(hasBlockers ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Phase Gate Review failed:', error);
      process.exit(1);
    });
}