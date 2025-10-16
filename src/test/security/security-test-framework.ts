/**
 * Security Test Framework
 * Phase 5, Task 5.2: Comprehensive security penetration testing
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

export interface SecurityTestConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  headless: boolean;
  adminCredentials?: {
    email: string;
    password: string;
  };
  testCredentials?: {
    email: string;
    password: string;
  };
}

export interface SecurityVulnerability {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  endpoint: string;
  description: string;
  impact: string;
  recommendation: string;
  evidence?: string[];
}

export interface SecurityTestResults {
  timestamp: Date;
  testSuite: string;
  vulnerabilities: SecurityVulnerability[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export class SecurityTestFramework {
  private config: SecurityTestConfig;
  private page!: Page;
  private browser!: Browser;
  private context!: BrowserContext;
  private vulnerabilities: SecurityVulnerability[] = [];

  constructor(config: SecurityTestConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const { chromium } = require('@playwright/test');
    
    this.browser = await chromium.launch({
      headless: this.config.headless
    });

    this.context = await this.browser.newContext({
      ignoreHTTPSErrors: true,
      bypassCSP: true
    });

    this.page = await this.context.newPage();

    // Listen for console errors and network requests
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
      }
    });

    this.page.on('response', response => {
      if (!response.ok()) {
      }
    });
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  private addVulnerability(vuln: SecurityVulnerability): void {
    this.vulnerabilities.push(vuln);
  }

  async testSQLInjection(): Promise<void> {

    const sqlPayloads = [
      "' OR '1'='1",
      "' OR 1=1 --",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 'x'='x",
      "1' OR '1'='1' /*"
    ];

    const testEndpoints = [
      '/api/auth/signin',
      '/api/organizations',
      '/api/emissions',
      '/api/users/profile'
    ];

    for (const endpoint of testEndpoints) {
      for (const payload of sqlPayloads) {
        try {
          const response = await this.page.request.post(`${this.config.baseURL}${endpoint}`, {
            data: {
              email: payload,
              password: payload,
              query: payload
            }
          });

          const responseText = await response.text();
          
          // Check for SQL error messages in response
          const sqlErrorPatterns = [
            /SQL syntax.*MySQL/i,
            /Warning.*mysql_/i,
            /valid MySQL result/i,
            /PostgreSQL.*ERROR/i,
            /Warning.*PostgreSQL/i,
            /ORA-[0-9]+/i,
            /Microsoft.*ODBC.*SQL Server/i
          ];

          const containsSQLError = sqlErrorPatterns.some(pattern => 
            pattern.test(responseText)
          );

          if (containsSQLError) {
            this.addVulnerability({
              type: 'SQL Injection',
              severity: 'critical',
              endpoint,
              description: `SQL injection vulnerability detected with payload: ${payload}`,
              impact: 'Complete database compromise, data theft, unauthorized access',
              recommendation: 'Use parameterized queries and input validation',
              evidence: [responseText.substring(0, 500)]
            });
          }

        } catch (error) {
          // Network errors might indicate successful SQL injection
          if ((error as Error).message.includes('timeout')) {
            this.addVulnerability({
              type: 'Potential SQL Injection (Time-based)',
              severity: 'high',
              endpoint,
              description: `Possible time-based SQL injection with payload: ${payload}`,
              impact: 'Database information disclosure through timing attacks',
              recommendation: 'Implement proper input validation and use parameterized queries'
            });
          }
        }
      }
    }
  }

  async testXSSVulnerabilities(): Promise<void> {

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(1)">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(1)">',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '\'-alert(1)-\'',
      '<input type="text" value="" onfocus="alert(1)" autofocus>'
    ];

    // Test XSS in forms
    await this.page.goto(`${this.config.baseURL}/signin`);
    
    for (const payload of xssPayloads) {
      try {
        await this.page.fill('[data-testid="email"]', payload);
        await this.page.fill('[data-testid="password"]', payload);

        // Listen for dialog (alert) events
        let alertTriggered = false;
        this.page.once('dialog', async dialog => {
          alertTriggered = true;
          await dialog.accept();
        });

        await this.page.click('[data-testid="signin-button"]');
        await this.page.waitForTimeout(1000);

        if (alertTriggered) {
          this.addVulnerability({
            type: 'Reflected XSS',
            severity: 'high',
            endpoint: '/signin',
            description: `XSS vulnerability in login form with payload: ${payload}`,
            impact: 'Session hijacking, credential theft, malicious script execution',
            recommendation: 'Implement proper input sanitization and CSP headers'
          });
        }

        // Check if payload is reflected in HTML
        const content = await this.page.content();
        if (content.includes(payload) && !payload.startsWith('<input')) {
          this.addVulnerability({
            type: 'Stored/Reflected XSS',
            severity: 'high',
            endpoint: '/signin',
            description: `XSS payload reflected in HTML: ${payload}`,
            impact: 'Cross-site scripting attacks, session hijacking',
            recommendation: 'Escape user input and implement CSP headers'
          });
        }

      } catch (error) {
      }
    }
  }

  async testCSRFProtection(): Promise<void> {

    // First, login to get valid session
    if (this.config.testCredentials) {
      await this.page.goto(`${this.config.baseURL}/signin`);
      await this.page.fill('[data-testid="email"]', this.config.testCredentials.email);
      await this.page.fill('[data-testid="password"]', this.config.testCredentials.password);
      await this.page.click('[data-testid="signin-button"]');
    }

    const csrfEndpoints = [
      { method: 'POST', path: '/api/organizations', data: { name: 'Test Org' } },
      { method: 'PUT', path: '/api/users/profile', data: { name: 'Hacker' } },
      { method: 'DELETE', path: '/api/organizations/test', data: {} },
      { method: 'POST', path: '/api/emissions', data: { amount: 100 } }
    ];

    for (const endpoint of csrfEndpoints) {
      try {
        // Test without CSRF token
        const response = await this.page.request.fetch(`${this.config.baseURL}${endpoint.path}`, {
          method: endpoint.method,
          data: endpoint.data,
          headers: {
            'Content-Type': 'application/json',
            // Remove any CSRF headers
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        // If request succeeds without CSRF token, it's vulnerable
        if (response.ok()) {
          this.addVulnerability({
            type: 'CSRF Vulnerability',
            severity: 'high',
            endpoint: endpoint.path,
            description: `${endpoint.method} request succeeded without CSRF protection`,
            impact: 'Unauthorized actions performed on behalf of users',
            recommendation: 'Implement CSRF tokens and SameSite cookie attributes'
          });
        }

        // Test with invalid CSRF token
        const invalidTokenResponse = await this.page.request.fetch(`${this.config.baseURL}${endpoint.path}`, {
          method: endpoint.method,
          data: endpoint.data,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'invalid_token_12345'
          }
        });

        if (invalidTokenResponse.ok()) {
          this.addVulnerability({
            type: 'CSRF Token Bypass',
            severity: 'high',
            endpoint: endpoint.path,
            description: `${endpoint.method} request succeeded with invalid CSRF token`,
            impact: 'CSRF protection can be bypassed',
            recommendation: 'Implement proper CSRF token validation'
          });
        }

      } catch (error) {
      }
    }
  }

  async testAuthenticationBypass(): Promise<void> {

    const protectedEndpoints = [
      '/api/organizations',
      '/api/users/profile',
      '/api/emissions',
      '/api/admin/users',
      '/dashboard',
      '/organizations',
      '/chat'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        // Test without authentication
        const response = await this.page.request.get(`${this.config.baseURL}${endpoint}`);

        if (response.ok() && !response.url().includes('/signin')) {
          this.addVulnerability({
            type: 'Authentication Bypass',
            severity: 'critical',
            endpoint,
            description: `Protected endpoint accessible without authentication`,
            impact: 'Unauthorized access to protected resources',
            recommendation: 'Implement proper authentication checks on all protected routes'
          });
        }

        // Test with invalid session token
        const invalidTokenResponse = await this.page.request.get(`${this.config.baseURL}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer invalid_token_12345',
            'Cookie': 'session=invalid_session_12345'
          }
        });

        if (invalidTokenResponse.ok() && !invalidTokenResponse.url().includes('/signin')) {
          this.addVulnerability({
            type: 'Session Token Bypass',
            severity: 'high',
            endpoint,
            description: `Protected endpoint accessible with invalid session token`,
            impact: 'Session validation can be bypassed',
            recommendation: 'Implement proper session token validation'
          });
        }

      } catch (error) {
      }
    }
  }

  async testPrivilegeEscalation(): Promise<void> {

    // Login as regular user
    if (this.config.testCredentials) {
      await this.page.goto(`${this.config.baseURL}/signin`);
      await this.page.fill('[data-testid="email"]', this.config.testCredentials.email);
      await this.page.fill('[data-testid="password"]', this.config.testCredentials.password);
      await this.page.click('[data-testid="signin-button"]');
      await this.page.waitForURL('/dashboard');
    }

    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/organizations',
      '/api/admin/system',
      '/admin',
      '/admin/users',
      '/admin/settings'
    ];

    for (const endpoint of adminEndpoints) {
      try {
        const response = await this.page.request.get(`${this.config.baseURL}${endpoint}`);

        if (response.ok()) {
          this.addVulnerability({
            type: 'Privilege Escalation',
            severity: 'critical',
            endpoint,
            description: `Regular user can access admin endpoint: ${endpoint}`,
            impact: 'Unauthorized access to administrative functions',
            recommendation: 'Implement proper role-based access control (RBAC)'
          });
        }

        // Test role manipulation
        const roleManipulationResponse = await this.page.request.post(`${this.config.baseURL}/api/users/profile`, {
          data: {
            role: 'admin',
            permissions: ['admin', 'super_user']
          }
        });

        if (roleManipulationResponse.ok()) {
          this.addVulnerability({
            type: 'Role Manipulation',
            severity: 'critical',
            endpoint: '/api/users/profile',
            description: 'User can modify their own role/permissions',
            impact: 'Complete privilege escalation to administrator',
            recommendation: 'Restrict role modifications to authorized administrators only'
          });
        }

      } catch (error) {
      }
    }
  }

  async testFileUploadSecurity(): Promise<void> {

    const maliciousFiles = [
      { name: 'malicious.php', content: '<?php system($_GET["cmd"]); ?>', mimeType: 'application/x-php' },
      { name: 'script.js', content: 'alert("XSS via file upload");', mimeType: 'application/javascript' },
      { name: 'shell.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>', mimeType: 'application/x-jsp' },
      { name: 'backdoor.aspx', content: '<%@ Page Language="C#" %><% Response.Write("Backdoor"); %>', mimeType: 'application/x-aspx' },
      { name: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash', mimeType: 'text/plain' }
    ];

    // Test file uploads if upload functionality exists
    try {
      await this.page.goto(`${this.config.baseURL}/organizations/test/emissions`);
      
      for (const file of maliciousFiles) {
        try {
          const fileInput = await this.page.locator('input[type="file"]').first();
          
          if (await fileInput.count() > 0) {
            await fileInput.setInputFiles({
              name: file.name,
              mimeType: file.mimeType,
              buffer: Buffer.from(file.content)
            });

            const uploadButton = await this.page.locator('[data-testid*="upload"], [data-testid*="import"], button:has-text("Upload")').first();
            if (await uploadButton.count() > 0) {
              await uploadButton.click();
              await this.page.waitForTimeout(2000);

              // Check if file was accepted
              const successMessage = await this.page.locator('[data-testid*="success"], .success, [class*="success"]');
              if (await successMessage.count() > 0) {
                this.addVulnerability({
                  type: 'Malicious File Upload',
                  severity: 'critical',
                  endpoint: '/file-upload',
                  description: `Malicious file ${file.name} was accepted and uploaded`,
                  impact: 'Remote code execution, server compromise',
                  recommendation: 'Implement proper file type validation, scan uploads, restrict execution'
                });
              }
            }
          }
        } catch (error) {
        }
      }
    } catch (error) {
    }
  }

  async testSessionSecurity(): Promise<void> {

    if (this.config.testCredentials) {
      // Login and get session cookie
      await this.page.goto(`${this.config.baseURL}/signin`);
      await this.page.fill('[data-testid="email"]', this.config.testCredentials.email);
      await this.page.fill('[data-testid="password"]', this.config.testCredentials.password);
      await this.page.click('[data-testid="signin-button"]');
      await this.page.waitForURL('/dashboard');

      const cookies = await this.context.cookies();
      const sessionCookie = cookies.find(cookie => 
        cookie.name.toLowerCase().includes('session') || 
        cookie.name.toLowerCase().includes('auth') ||
        cookie.name.toLowerCase().includes('token')
      );

      if (sessionCookie) {
        // Check if session cookie is secure
        if (!sessionCookie.secure) {
          this.addVulnerability({
            type: 'Insecure Session Cookie',
            severity: 'high',
            endpoint: '/auth',
            description: 'Session cookie is not marked as Secure',
            impact: 'Session cookies can be intercepted over HTTP',
            recommendation: 'Set Secure flag on all session cookies'
          });
        }

        // Check if session cookie has HttpOnly flag
        if (!sessionCookie.httpOnly) {
          this.addVulnerability({
            type: 'Session Cookie Accessible via JavaScript',
            severity: 'high',
            endpoint: '/auth',
            description: 'Session cookie is not marked as HttpOnly',
            impact: 'Session cookies can be accessed via XSS attacks',
            recommendation: 'Set HttpOnly flag on all session cookies'
          });
        }

        // Check SameSite attribute
        if (sessionCookie.sameSite !== 'Strict' && sessionCookie.sameSite !== 'Lax') {
          this.addVulnerability({
            type: 'Missing SameSite Cookie Attribute',
            severity: 'medium',
            endpoint: '/auth',
            description: 'Session cookie does not have SameSite attribute',
            impact: 'Susceptible to CSRF attacks',
            recommendation: 'Set SameSite attribute to Strict or Lax'
          });
        }
      }

      // Test session fixation
      const oldCookies = await this.context.cookies();
      await this.page.goto(`${this.config.baseURL}/signin`);
      const newCookies = await this.context.cookies();
      
      const oldSessionCookie = oldCookies.find(c => c.name.includes('session'));
      const newSessionCookie = newCookies.find(c => c.name.includes('session'));

      if (oldSessionCookie && newSessionCookie && oldSessionCookie.value === newSessionCookie.value) {
        this.addVulnerability({
          type: 'Session Fixation',
          severity: 'high',
          endpoint: '/auth',
          description: 'Session ID is not regenerated after login',
          impact: 'Attackers can hijack user sessions',
          recommendation: 'Regenerate session ID after successful authentication'
        });
      }
    }
  }

  async testSecurityHeaders(): Promise<void> {

    const response = await this.page.request.get(`${this.config.baseURL}/`);
    const headers = response.headers();

    const requiredSecurityHeaders = [
      {
        name: 'strict-transport-security',
        description: 'HSTS header missing',
        severity: 'medium' as const,
        recommendation: 'Add Strict-Transport-Security header'
      },
      {
        name: 'x-frame-options',
        description: 'X-Frame-Options header missing',
        severity: 'medium' as const,
        recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN'
      },
      {
        name: 'x-content-type-options',
        description: 'X-Content-Type-Options header missing',
        severity: 'low' as const,
        recommendation: 'Add X-Content-Type-Options: nosniff'
      },
      {
        name: 'referrer-policy',
        description: 'Referrer-Policy header missing',
        severity: 'low' as const,
        recommendation: 'Add Referrer-Policy header'
      },
      {
        name: 'content-security-policy',
        description: 'Content-Security-Policy header missing',
        severity: 'high' as const,
        recommendation: 'Implement Content-Security-Policy header'
      }
    ];

    for (const header of requiredSecurityHeaders) {
      if (!headers[header.name]) {
        this.addVulnerability({
          type: 'Missing Security Header',
          severity: header.severity,
          endpoint: '/',
          description: header.description,
          impact: 'Reduced security posture, potential for various attacks',
          recommendation: header.recommendation
        });
      }
    }

    // Check for information disclosure headers
    const informationDisclosureHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
    for (const headerName of informationDisclosureHeaders) {
      if (headers[headerName]) {
        this.addVulnerability({
          type: 'Information Disclosure',
          severity: 'low',
          endpoint: '/',
          description: `Server information disclosed in ${headerName} header: ${headers[headerName]}`,
          impact: 'Information about server technology stack revealed',
          recommendation: `Remove or obfuscate ${headerName} header`
        });
      }
    }
  }

  getTestResults(): SecurityTestResults {
    const criticalIssues = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highIssues = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumIssues = this.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowIssues = this.vulnerabilities.filter(v => v.severity === 'low').length;

    return {
      timestamp: new Date(),
      testSuite: 'Security Penetration Testing',
      vulnerabilities: this.vulnerabilities,
      totalTests: 8, // Number of test categories
      passedTests: 8 - (criticalIssues + highIssues + mediumIssues + lowIssues > 0 ? 1 : 0),
      failedTests: criticalIssues + highIssues + mediumIssues + lowIssues > 0 ? 1 : 0,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues
    };
  }

  async generateSecurityReport(): Promise<void> {
    const results = this.getTestResults();
    const reportDir = 'test-results/security';
    
    if (!require('fs').existsSync(reportDir)) {
      require('fs').mkdirSync(reportDir, { recursive: true });
    }

    // Generate JSON report
    const jsonReport = {
      ...results,
      summary: {
        totalVulnerabilities: results.vulnerabilities.length,
        securityScore: Math.max(0, 100 - (
          results.criticalIssues * 25 +
          results.highIssues * 10 +
          results.mediumIssues * 5 +
          results.lowIssues * 2
        )),
        riskLevel: results.criticalIssues > 0 ? 'CRITICAL' :
                   results.highIssues > 0 ? 'HIGH' :
                   results.mediumIssues > 0 ? 'MEDIUM' : 'LOW'
      }
    };

    require('fs').writeFileSync(
      `${reportDir}/security-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      JSON.stringify(jsonReport, null, 2)
    );

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(jsonReport);
    require('fs').writeFileSync(
      `${reportDir}/security-report.html`,
      htmlReport
    );

  }

  private generateHTMLReport(report: any): string {
    const severityColors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#6c757d'
    };

    return `<!DOCTYPE html>
<html>
<head>
    <title>Security Penetration Test Report - blipee-os</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .critical { border-left: 5px solid ${severityColors.critical}; }
        .high { border-left: 5px solid ${severityColors.high}; }
        .medium { border-left: 5px solid ${severityColors.medium}; }
        .low { border-left: 5px solid ${severityColors.low}; }
        .vulnerability { margin: 10px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #ccc; }
        .vuln-header { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
        .vuln-details { color: #666; margin: 5px 0; }
        .security-score { font-size: 2em; font-weight: bold; text-align: center; }
        .risk-critical { color: ${severityColors.critical}; }
        .risk-high { color: ${severityColors.high}; }
        .risk-medium { color: ${severityColors.medium}; }
        .risk-low { color: ${severityColors.low}; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Security Penetration Test Report</h1>
        <p>blipee-os Security Assessment - ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Security Score</h3>
            <div class="security-score risk-${report.summary.riskLevel.toLowerCase()}">${report.summary.securityScore}/100</div>
        </div>
        <div class="card critical">
            <h3>Critical Issues</h3>
            <div class="security-score">${report.criticalIssues}</div>
        </div>
        <div class="card high">
            <h3>High Issues</h3>
            <div class="security-score">${report.highIssues}</div>
        </div>
        <div class="card medium">
            <h3>Medium Issues</h3>
            <div class="security-score">${report.mediumIssues}</div>
        </div>
        <div class="card low">
            <h3>Low Issues</h3>
            <div class="security-score">${report.lowIssues}</div>
        </div>
    </div>
    
    <div class="card">
        <h2>🚨 Vulnerabilities</h2>
        ${report.vulnerabilities.map((vuln: any) => `
            <div class="vulnerability ${vuln.severity}">
                <div class="vuln-header">${vuln.type} - ${vuln.severity.toUpperCase()}</div>
                <div class="vuln-details"><strong>Endpoint:</strong> ${vuln.endpoint}</div>
                <div class="vuln-details"><strong>Description:</strong> ${vuln.description}</div>
                <div class="vuln-details"><strong>Impact:</strong> ${vuln.impact}</div>
                <div class="vuln-details"><strong>Recommendation:</strong> ${vuln.recommendation}</div>
            </div>
        `).join('')}
        
        ${report.vulnerabilities.length === 0 ? '<p>✅ No vulnerabilities detected!</p>' : ''}
    </div>
</body>
</html>`;
  }
}