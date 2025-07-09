#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

class SecurityScanner {
  private issues: SecurityIssue[] = [];

  async scan(): Promise<void> {
    console.log('🔒 Starting security scan...\n');

    await this.scanDependencies();
    await this.scanCode();
    await this.scanSecrets();
    await this.scanHeaders();
    await this.scanAuthentication();
    await this.scanDatabase();
    await this.scanAPIs();
    
    this.generateReport();
  }

  private async scanDependencies(): Promise<void> {
    console.log('📦 Scanning dependencies...');
    
    try {
      // Run npm audit
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditOutput);
      
      if (audit.metadata.vulnerabilities.total > 0) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, data]: [string, any]) => {
          this.issues.push({
            severity: data.severity,
            type: 'dependency',
            description: `Vulnerable dependency: ${pkg}`,
            recommendation: `Update ${pkg} to version ${data.fixAvailable.version || 'latest'}`,
          });
        });
      }
    } catch (error) {
      // npm audit returns non-zero exit code if vulnerabilities found
      console.log('  ⚠️  Vulnerabilities found in dependencies');
    }
  }

  private async scanCode(): Promise<void> {
    console.log('🔍 Scanning code for security issues...');
    
    const patterns = [
      // SQL Injection
      {
        pattern: /query\s*\(\s*['"`].*\$\{.*\}.*['"`]/g,
        type: 'SQL Injection',
        description: 'Potential SQL injection vulnerability',
        recommendation: 'Use parameterized queries',
      },
      // XSS
      {
        pattern: /dangerouslySetInnerHTML/g,
        type: 'XSS',
        description: 'Potential XSS vulnerability with dangerouslySetInnerHTML',
        recommendation: 'Sanitize HTML content before rendering',
      },
      // Hardcoded secrets
      {
        pattern: /(api[_-]?key|secret|password)\s*[:=]\s*['"`][^'"`]+['"`]/gi,
        type: 'Hardcoded Secret',
        description: 'Potential hardcoded secret detected',
        recommendation: 'Use environment variables for secrets',
      },
      // Eval usage
      {
        pattern: /eval\s*\(/g,
        type: 'Code Injection',
        description: 'Use of eval() function',
        recommendation: 'Avoid using eval(), use safer alternatives',
      },
      // Weak crypto
      {
        pattern: /crypto\.createCipher\(/g,
        type: 'Weak Cryptography',
        description: 'Use of deprecated crypto.createCipher',
        recommendation: 'Use crypto.createCipheriv with proper IV',
      },
    ];

    const scanDirectory = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          
          patterns.forEach(({ pattern, type, description, recommendation }) => {
            lines.forEach((line, index) => {
              if (pattern.test(line)) {
                // Skip if it's a test file or migration
                if (!filePath.includes('test') && !filePath.includes('migration')) {
                  this.issues.push({
                    severity: 'high',
                    type,
                    description,
                    file: filePath,
                    line: index + 1,
                    recommendation,
                  });
                }
              }
            });
          });
        }
      });
    };

    scanDirectory('./src');
  }

  private async scanSecrets(): Promise<void> {
    console.log('🔑 Scanning for exposed secrets...');
    
    // Check .env files
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    envFiles.forEach(envFile => {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Check for actual secret values (not just placeholders)
          if (line.includes('=') && !line.includes('your-') && !line.includes('test-')) {
            const [key, value] = line.split('=');
            if (value && value.length > 10 && /[A-Za-z0-9]{20,}/.test(value)) {
              this.issues.push({
                severity: 'critical',
                type: 'Exposed Secret',
                description: `Potential secret exposed in ${envFile}: ${key}`,
                file: envFile,
                line: index + 1,
                recommendation: 'Ensure this file is in .gitignore',
              });
            }
          }
        });
      }
    });
  }

  private async scanHeaders(): Promise<void> {
    console.log('🛡️ Checking security headers...');
    
    // Check middleware configuration
    const middlewarePath = './src/middleware.ts';
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Strict-Transport-Security',
        'Content-Security-Policy',
        'X-XSS-Protection',
      ];
      
      requiredHeaders.forEach(header => {
        if (!content.includes(header)) {
          this.issues.push({
            severity: 'medium',
            type: 'Missing Security Header',
            description: `Missing security header: ${header}`,
            file: middlewarePath,
            recommendation: `Add ${header} header in middleware`,
          });
        }
      });
    }
  }

  private async scanAuthentication(): Promise<void> {
    console.log('🔐 Checking authentication security...');
    
    // Check for proper session management
    const authFiles = this.findFiles('./src', /auth.*\.(ts|tsx)$/);
    
    authFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for secure session configuration
      if (content.includes('httpOnly: false')) {
        this.issues.push({
          severity: 'high',
          type: 'Insecure Session',
          description: 'Session cookie not using httpOnly flag',
          file,
          recommendation: 'Set httpOnly: true for session cookies',
        });
      }
      
      // Check for secure flag
      if (content.includes('secure: false') && !file.includes('test')) {
        this.issues.push({
          severity: 'medium',
          type: 'Insecure Session',
          description: 'Session cookie not using secure flag',
          file,
          recommendation: 'Set secure: true for production',
        });
      }
    });
  }

  private async scanDatabase(): Promise<void> {
    console.log('💾 Checking database security...');
    
    // Check for RLS policies
    const migrationFiles = this.findFiles('./supabase/migrations', /\.sql$/);
    
    let hasRLS = false;
    migrationFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('ENABLE ROW LEVEL SECURITY')) {
        hasRLS = true;
      }
    });
    
    if (!hasRLS) {
      this.issues.push({
        severity: 'high',
        type: 'Database Security',
        description: 'Row Level Security not enabled',
        recommendation: 'Enable RLS on all tables',
      });
    }
  }

  private async scanAPIs(): Promise<void> {
    console.log('🌐 Checking API security...');
    
    const apiFiles = this.findFiles('./src/app/api', /route\.(ts|tsx)$/);
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for authentication
      if (!content.includes('auth') && !content.includes('public')) {
        this.issues.push({
          severity: 'medium',
          type: 'Unprotected API',
          description: 'API endpoint may lack authentication',
          file,
          recommendation: 'Add authentication check to API route',
        });
      }
      
      // Check for rate limiting
      if (!content.includes('rateLimit') && !content.includes('rateLimiter')) {
        this.issues.push({
          severity: 'low',
          type: 'No Rate Limiting',
          description: 'API endpoint lacks rate limiting',
          file,
          recommendation: 'Add rate limiting to prevent abuse',
        });
      }
    });
  }

  private findFiles(dir: string, pattern: RegExp): string[] {
    const files: string[] = [];
    
    const scanDir = (currentDir: string) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDir(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      });
    };
    
    if (fs.existsSync(dir)) {
      scanDir(dir);
    }
    
    return files;
  }

  private generateReport(): void {
    console.log('\n📊 Security Scan Report\n');
    
    const summary = {
      critical: this.issues.filter(i => i.severity === 'critical').length,
      high: this.issues.filter(i => i.severity === 'high').length,
      medium: this.issues.filter(i => i.severity === 'medium').length,
      low: this.issues.filter(i => i.severity === 'low').length,
    };
    
    console.log('Summary:');
    console.log(`  Critical: ${summary.critical}`);
    console.log(`  High: ${summary.high}`);
    console.log(`  Medium: ${summary.medium}`);
    console.log(`  Low: ${summary.low}`);
    console.log(`  Total: ${this.issues.length}\n`);
    
    if (this.issues.length > 0) {
      console.log('Issues found:\n');
      
      this.issues.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`   Description: ${issue.description}`);
        if (issue.file) {
          console.log(`   File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
        console.log(`   Recommendation: ${issue.recommendation}\n`);
      });
    } else {
      console.log('✅ No security issues found!\n');
    }
    
    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      issues: this.issues,
    };
    
    fs.writeFileSync('security-scan-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved to security-scan-report.json\n');
    
    // Exit with error code if critical issues found
    if (summary.critical > 0) {
      console.error('❌ Critical security issues found!');
      process.exit(1);
    }
  }
}

// Run the scanner
const scanner = new SecurityScanner();
scanner.scan().catch(console.error);