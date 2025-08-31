/**
 * Automated Security Scanner
 * Phase 5, Task 5.2: Automated security scanning and vulnerability assessment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface SecurityScanConfig {
  baseURL: string;
  scanDepth: 'shallow' | 'medium' | 'deep';
  includePaths?: string[];
  excludePaths?: string[];
  outputDir?: string;
  silent?: boolean;
}

export interface VulnerabilityReport {
  timestamp: string;
  scanType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  vulnerability: string;
  description: string;
  location: string;
  recommendation: string;
  references?: string[];
}

export class AutomatedSecurityScanner {
  private config: SecurityScanConfig;
  private reports: VulnerabilityReport[] = [];

  constructor(config: SecurityScanConfig) {
    this.config = {
      outputDir: 'test-results/security-scans',
      silent: false,
      ...config
    };
  }

  async runFullSecurityScan(): Promise<{
    totalVulnerabilities: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    reports: VulnerabilityReport[];
  }> {
    console.log('🔍 Starting Automated Security Scan...\n');

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir!)) {
      fs.mkdirSync(this.config.outputDir!, { recursive: true });
    }

    // Run different types of security scans
    await this.runDependencySecurityScan();
    await this.runStaticCodeSecurityAnalysis();
    await this.runContainerSecurityScan();
    await this.runSecretsDetection();
    await this.runLicenseCompliance();
    await this.runDockerfileSecurity();

    // Generate comprehensive report
    await this.generateSecurityScanReport();

    const criticalIssues = this.reports.filter(r => r.severity === 'critical').length;
    const highIssues = this.reports.filter(r => r.severity === 'high').length;
    const mediumIssues = this.reports.filter(r => r.severity === 'medium').length;
    const lowIssues = this.reports.filter(r => r.severity === 'low').length;

    console.log('\n📊 Security Scan Summary:');
    console.log(`🔴 Critical: ${criticalIssues}`);
    console.log(`🟠 High: ${highIssues}`);
    console.log(`🟡 Medium: ${mediumIssues}`);
    console.log(`🔵 Low: ${lowIssues}`);
    console.log(`📋 Total: ${this.reports.length}\n`);

    return {
      totalVulnerabilities: this.reports.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      reports: this.reports
    };
  }

  private async runDependencySecurityScan(): Promise<void> {
    console.log('1️⃣ Running dependency security scan...');

    try {
      // NPM Audit
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const auditData = JSON.parse(auditOutput);
      
      if (auditData.vulnerabilities) {
        for (const [packageName, vulnerability] of Object.entries(auditData.vulnerabilities as any)) {
          const vuln = vulnerability as any;
          
          this.addReport({
            scanType: 'Dependency Security',
            severity: this.mapNpmSeverity(vuln.severity),
            vulnerability: `${packageName}: ${vuln.title || 'Security vulnerability'}`,
            description: vuln.url || 'Vulnerable dependency detected',
            location: `package.json`,
            recommendation: `Update ${packageName} to latest secure version`,
            references: [vuln.url].filter(Boolean)
          });
        }
      }

      console.log(`   Found ${Object.keys(auditData.vulnerabilities || {}).length} dependency issues`);

    } catch (error) {
      console.log('   npm audit completed with issues detected');
      
      // Parse npm audit output even when it exits with error code
      try {
        const errorOutput = (error as any).stdout || (error as any).message;
        if (errorOutput.includes('vulnerabilities')) {
          this.addReport({
            scanType: 'Dependency Security',
            severity: 'medium',
            vulnerability: 'Dependency vulnerabilities detected',
            description: 'npm audit found security issues in dependencies',
            location: 'package.json',
            recommendation: 'Run npm audit fix to resolve issues'
          });
        }
      } catch (parseError) {
        console.log('   Could not parse npm audit output');
      }
    }

    // Check for known vulnerable packages
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const knownVulnerablePackages = [
      { name: 'lodash', version: '<4.17.21', severity: 'high' as const },
      { name: 'moment', version: '*', severity: 'medium' as const },
      { name: 'axios', version: '<0.21.2', severity: 'high' as const },
      { name: 'handlebars', version: '<4.7.7', severity: 'high' as const }
    ];

    for (const pkg of knownVulnerablePackages) {
      if (allDependencies[pkg.name]) {
        this.addReport({
          scanType: 'Dependency Security',
          severity: pkg.severity,
          vulnerability: `Potentially vulnerable package: ${pkg.name}`,
          description: `Package ${pkg.name} may have known vulnerabilities`,
          location: 'package.json',
          recommendation: `Review and update ${pkg.name} to latest secure version`
        });
      }
    }
  }

  private async runStaticCodeSecurityAnalysis(): Promise<void> {
    console.log('2️⃣ Running static code security analysis...');

    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        severity: 'high' as const,
        type: 'Code Injection',
        description: 'Use of eval() function detected'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'medium' as const,
        type: 'XSS Risk',
        description: 'Direct innerHTML assignment detected'
      },
      {
        pattern: /document\.write\s*\(/g,
        severity: 'medium' as const,
        type: 'XSS Risk',
        description: 'Use of document.write() detected'
      },
      {
        pattern: /crypto\.createHash\(['"]md5['\"]\)/g,
        severity: 'medium' as const,
        type: 'Weak Cryptography',
        description: 'MD5 hash algorithm usage detected'
      },
      {
        pattern: /password\s*[:=]\s*['"][^'"]*['"](\s|;|,|$)/gi,
        severity: 'critical' as const,
        type: 'Hardcoded Credentials',
        description: 'Hardcoded password detected'
      },
      {
        pattern: /api[_-]?key\s*[:=]\s*['"][^'"]*['"](\s|;|,|$)/gi,
        severity: 'critical' as const,
        type: 'Hardcoded Secrets',
        description: 'Hardcoded API key detected'
      },
      {
        pattern: /process\.env\.\w+\s*\|\|\s*['"][^'"]*['"]/g,
        severity: 'low' as const,
        type: 'Environment Variable Fallback',
        description: 'Fallback value for environment variable'
      }
    ];

    const scanDirectories = ['src', 'pages', 'app', 'lib'];
    const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    for (const dir of scanDirectories) {
      if (fs.existsSync(dir)) {
        await this.scanDirectoryForPatterns(dir, fileExtensions, securityPatterns);
      }
    }

    console.log(`   Scanned source code for security patterns`);
  }

  private async scanDirectoryForPatterns(
    dir: string,
    extensions: string[],
    patterns: Array<{
      pattern: RegExp;
      severity: 'critical' | 'high' | 'medium' | 'low';
      type: string;
      description: string;
    }>
  ): Promise<void> {
    const files = this.getFilesRecursively(dir, extensions);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (const patternInfo of patterns) {
        const matches = content.match(patternInfo.pattern);
        if (matches) {
          // Find line numbers
          let lineNum = 1;
          for (const line of lines) {
            if (patternInfo.pattern.test(line)) {
              this.addReport({
                scanType: 'Static Code Analysis',
                severity: patternInfo.severity,
                vulnerability: patternInfo.type,
                description: `${patternInfo.description} at line ${lineNum}`,
                location: `${file}:${lineNum}`,
                recommendation: this.getRecommendationForPattern(patternInfo.type)
              });
            }
            lineNum++;
          }
        }
      }
    }
  }

  private getFilesRecursively(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.getFilesRecursively(fullPath, extensions));
      } else if (stat.isFile()) {
        if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private async runContainerSecurityScan(): Promise<void> {
    console.log('3️⃣ Running container security scan...');

    // Check for Dockerfile
    const dockerfilePath = 'Dockerfile';
    if (fs.existsSync(dockerfilePath)) {
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');

      // Check for security best practices
      if (!dockerfileContent.includes('USER ') || dockerfileContent.includes('USER root')) {
        this.addReport({
          scanType: 'Container Security',
          severity: 'high',
          vulnerability: 'Container runs as root',
          description: 'Dockerfile does not specify a non-root user',
          location: dockerfilePath,
          recommendation: 'Add USER directive to run container as non-root user'
        });
      }

      if (dockerfileContent.includes('ADD http')) {
        this.addReport({
          scanType: 'Container Security',
          severity: 'medium',
          vulnerability: 'Remote ADD instruction',
          description: 'ADD instruction downloading from remote URL',
          location: dockerfilePath,
          recommendation: 'Use COPY instead of ADD, or validate remote resources'
        });
      }

      if (!dockerfileContent.includes('HEALTHCHECK')) {
        this.addReport({
          scanType: 'Container Security',
          severity: 'low',
          vulnerability: 'Missing health check',
          description: 'Dockerfile does not include HEALTHCHECK instruction',
          location: dockerfilePath,
          recommendation: 'Add HEALTHCHECK instruction for better container monitoring'
        });
      }

      console.log('   Analyzed Dockerfile for security issues');
    } else {
      console.log('   No Dockerfile found, skipping container security scan');
    }
  }

  private async runSecretsDetection(): Promise<void> {
    console.log('4️⃣ Running secrets detection...');

    const secretPatterns = [
      {
        name: 'AWS Access Key',
        pattern: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical' as const
      },
      {
        name: 'GitHub Token',
        pattern: /gh[pousr]_[A-Za-z0-9_]{36}/g,
        severity: 'critical' as const
      },
      {
        name: 'Generic API Key',
        pattern: /[aA][pP][iI][_]?[kK][eE][yY].*[=:]\s*['"][a-zA-Z0-9]{20,}/g,
        severity: 'high' as const
      },
      {
        name: 'Generic Secret',
        pattern: /[sS][eE][cC][rR][eE][tT].*[=:]\s*['"][a-zA-Z0-9]{20,}/g,
        severity: 'high' as const
      },
      {
        name: 'Database URL',
        pattern: /(postgresql|mysql|mongodb):\/\/[^\s'"]+/g,
        severity: 'medium' as const
      },
      {
        name: 'Private Key',
        pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/g,
        severity: 'critical' as const
      }
    ];

    // Scan common files for secrets
    const filesToScan = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      'config.js',
      'config.json'
    ];

    // Add source files
    const sourceFiles = this.getFilesRecursively('src', ['.ts', '.tsx', '.js', '.jsx']);
    filesToScan.push(...sourceFiles.slice(0, 100)); // Limit to avoid too many files

    for (const file of filesToScan) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const secret of secretPatterns) {
          const matches = content.match(secret.pattern);
          if (matches) {
            this.addReport({
              scanType: 'Secrets Detection',
              severity: secret.severity,
              vulnerability: `${secret.name} detected`,
              description: `Potential ${secret.name.toLowerCase()} found in source code`,
              location: file,
              recommendation: 'Remove hardcoded secrets and use environment variables or secret management'
            });
          }
        }
      }
    }

    console.log(`   Scanned ${filesToScan.length} files for secrets`);
  }

  private async runLicenseCompliance(): Promise<void> {
    console.log('5️⃣ Running license compliance check...');

    try {
      // Check for license-checker package, if not available, use basic check
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Check for packages with restrictive licenses
      const restrictiveLicenses = ['GPL', 'AGPL', 'LGPL'];
      
      // This is a basic check - in production, use proper license checking tools
      for (const [pkg, version] of Object.entries(dependencies)) {
        try {
          const pkgPath = path.join('node_modules', pkg, 'package.json');
          if (fs.existsSync(pkgPath)) {
            const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const license = pkgInfo.license || 'Unknown';
            
            if (restrictiveLicenses.some(restrictive => 
              license.toString().toUpperCase().includes(restrictive)
            )) {
              this.addReport({
                scanType: 'License Compliance',
                severity: 'medium',
                vulnerability: 'Restrictive License',
                description: `Package ${pkg} has restrictive license: ${license}`,
                location: 'package.json',
                recommendation: 'Review license compatibility with your project'
              });
            }
          }
        } catch (error) {
          // Skip package if we can't read its license info
        }
      }

      console.log('   Checked package licenses for compliance');

    } catch (error) {
      console.log('   License compliance check completed with limitations');
    }
  }

  private async runDockerfileSecurity(): Promise<void> {
    console.log('6️⃣ Running Dockerfile security analysis...');

    const dockerComposePath = 'docker-compose.yml';
    if (fs.existsSync(dockerComposePath)) {
      const content = fs.readFileSync(dockerComposePath, 'utf8');

      // Check for security issues in docker-compose
      if (content.includes('privileged: true')) {
        this.addReport({
          scanType: 'Container Security',
          severity: 'high',
          vulnerability: 'Privileged container',
          description: 'Container configured with privileged mode',
          location: dockerComposePath,
          recommendation: 'Remove privileged mode unless absolutely necessary'
        });
      }

      if (content.includes('network_mode: host')) {
        this.addReport({
          scanType: 'Container Security',
          severity: 'medium',
          vulnerability: 'Host networking',
          description: 'Container using host network mode',
          location: dockerComposePath,
          recommendation: 'Use bridge networking instead of host mode'
        });
      }

      console.log('   Analyzed docker-compose.yml for security issues');
    }
  }

  private addReport(report: Omit<VulnerabilityReport, 'timestamp'>): void {
    const fullReport: VulnerabilityReport = {
      ...report,
      timestamp: new Date().toISOString()
    };
    
    this.reports.push(fullReport);
    
    if (!this.config.silent) {
      console.log(`   🚨 ${report.severity.toUpperCase()}: ${report.vulnerability}`);
    }
  }

  private mapNpmSeverity(npmSeverity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (npmSeverity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'moderate': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private getRecommendationForPattern(type: string): string {
    const recommendations: { [key: string]: string } = {
      'Code Injection': 'Avoid eval() function. Use safer alternatives like JSON.parse()',
      'XSS Risk': 'Use textContent instead of innerHTML, or sanitize input properly',
      'Weak Cryptography': 'Use stronger hash algorithms like SHA-256 or bcrypt',
      'Hardcoded Credentials': 'Use environment variables or secure secret management',
      'Hardcoded Secrets': 'Store secrets in environment variables or secret manager',
      'Environment Variable Fallback': 'Ensure fallback values are not sensitive'
    };
    
    return recommendations[type] || 'Review and address security concern';
  }

  private async generateSecurityScanReport(): Promise<void> {
    const reportData = {
      timestamp: new Date().toISOString(),
      scanConfig: this.config,
      summary: {
        totalVulnerabilities: this.reports.length,
        criticalIssues: this.reports.filter(r => r.severity === 'critical').length,
        highIssues: this.reports.filter(r => r.severity === 'high').length,
        mediumIssues: this.reports.filter(r => r.severity === 'medium').length,
        lowIssues: this.reports.filter(r => r.severity === 'low').length
      },
      vulnerabilities: this.reports
    };

    // Generate JSON report
    const jsonReportPath = path.join(this.config.outputDir!, 'security-scan-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(this.config.outputDir!, 'security-scan-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`\n📄 Security scan reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  private generateHTMLReport(data: any): string {
    const severityColors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#6c757d'
    };

    return `<!DOCTYPE html>
<html>
<head>
    <title>Automated Security Scan Report - blipee-os</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #6f42c1 0%, #dc3545 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .critical { border-left: 5px solid ${severityColors.critical}; }
        .high { border-left: 5px solid ${severityColors.high}; }
        .medium { border-left: 5px solid ${severityColors.medium}; }
        .low { border-left: 5px solid ${severityColors.low}; }
        .vulnerability { margin: 10px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #ccc; }
        .vuln-header { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
        .vuln-details { color: #666; margin: 5px 0; font-size: 14px; }
        .scan-type { background: #e9ecef; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Automated Security Scan Report</h1>
        <p>blipee-os Security Assessment - ${data.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Total Issues</h3>
            <h2>${data.summary.totalVulnerabilities}</h2>
        </div>
        <div class="card critical">
            <h3>Critical</h3>
            <h2>${data.summary.criticalIssues}</h2>
        </div>
        <div class="card high">
            <h3>High</h3>
            <h2>${data.summary.highIssues}</h2>
        </div>
        <div class="card medium">
            <h3>Medium</h3>
            <h2>${data.summary.mediumIssues}</h2>
        </div>
        <div class="card low">
            <h3>Low</h3>
            <h2>${data.summary.lowIssues}</h2>
        </div>
    </div>
    
    <div class="card">
        <h2>🚨 Vulnerabilities by Scan Type</h2>
        <table>
            <thead>
                <tr>
                    <th>Scan Type</th>
                    <th>Severity</th>
                    <th>Vulnerability</th>
                    <th>Location</th>
                    <th>Recommendation</th>
                </tr>
            </thead>
            <tbody>
                ${data.vulnerabilities.map((vuln: any) => `
                    <tr>
                        <td><span class="scan-type">${vuln.scanType}</span></td>
                        <td class="${vuln.severity}">${vuln.severity.toUpperCase()}</td>
                        <td><strong>${vuln.vulnerability}</strong><br><small>${vuln.description}</small></td>
                        <td><code>${vuln.location}</code></td>
                        <td>${vuln.recommendation}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        ${data.vulnerabilities.length === 0 ? '<p>✅ No vulnerabilities detected!</p>' : ''}
    </div>
</body>
</html>`;
  }
}

// CLI Usage
if (require.main === module) {
  const config: SecurityScanConfig = {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    scanDepth: (process.env.SECURITY_SCAN_DEPTH as any) || 'medium',
    silent: process.env.SECURITY_SCAN_SILENT === 'true'
  };

  const scanner = new AutomatedSecurityScanner(config);
  
  scanner.runFullSecurityScan()
    .then(results => {
      console.log('🎉 Automated security scan completed!');
      
      if (results.criticalIssues > 0) {
        console.log('❌ Critical security issues found - please address immediately');
        process.exit(1);
      } else if (results.highIssues > 0) {
        console.log('⚠️ High severity issues found - review and address');
        process.exit(0);
      } else {
        console.log('✅ No critical or high severity issues found');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Security scan failed:', error);
      process.exit(1);
    });
}