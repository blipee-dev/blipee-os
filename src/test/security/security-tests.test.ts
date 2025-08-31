/**
 * Security Penetration Tests
 * Phase 5, Task 5.2: Automated security testing suite
 */

import { test, expect } from '@playwright/test';
import { SecurityTestFramework, SecurityTestConfig } from './security-test-framework';

const config: SecurityTestConfig = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 60000,
  retries: 1,
  headless: process.env.CI === 'true',
  testCredentials: {
    email: 'security.test@blipee-test.com',
    password: 'TestPassword123!'
  },
  adminCredentials: {
    email: 'admin@blipee-test.com',
    password: 'AdminPassword123!'
  }
};

test.describe('Security Penetration Tests', () => {
  let framework: SecurityTestFramework;

  test.beforeEach(async () => {
    framework = new SecurityTestFramework(config);
    await framework.initialize();
  });

  test.afterEach(async () => {
    await framework.cleanup();
  });

  test('SQL Injection vulnerability assessment', async () => {
    console.log('\n🔍 Starting SQL Injection vulnerability assessment...');
    
    await framework.testSQLInjection();
    
    const results = framework.getTestResults();
    const sqlInjectionVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('sql injection')
    );

    console.log(`📊 SQL Injection Assessment Results:`);
    console.log(`  Vulnerabilities Found: ${sqlInjectionVulns.length}`);
    
    sqlInjectionVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // Critical and High severity SQL injection should fail the test
    const criticalSqlVulns = sqlInjectionVulns.filter(v => v.severity === 'critical');
    const highSqlVulns = sqlInjectionVulns.filter(v => v.severity === 'high');
    
    if (criticalSqlVulns.length > 0 || highSqlVulns.length > 0) {
      console.log('❌ SQL Injection vulnerabilities detected!');
      expect(criticalSqlVulns.length, 'No critical SQL injection vulnerabilities should be present').toBe(0);
      expect(highSqlVulns.length, 'No high severity SQL injection vulnerabilities should be present').toBe(0);
    } else {
      console.log('✅ No critical SQL injection vulnerabilities detected');
    }
  });

  test('Cross-Site Scripting (XSS) vulnerability assessment', async () => {
    console.log('\n🔍 Starting XSS vulnerability assessment...');
    
    await framework.testXSSVulnerabilities();
    
    const results = framework.getTestResults();
    const xssVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('xss')
    );

    console.log(`📊 XSS Assessment Results:`);
    console.log(`  Vulnerabilities Found: ${xssVulns.length}`);
    
    xssVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // High severity XSS should fail the test
    const highXssVulns = xssVulns.filter(v => v.severity === 'high');
    
    if (highXssVulns.length > 0) {
      console.log('❌ XSS vulnerabilities detected!');
      expect(highXssVulns.length, 'No high severity XSS vulnerabilities should be present').toBe(0);
    } else {
      console.log('✅ No high severity XSS vulnerabilities detected');
    }
  });

  test('CSRF protection assessment', async () => {
    console.log('\n🔍 Starting CSRF protection assessment...');
    
    await framework.testCSRFProtection();
    
    const results = framework.getTestResults();
    const csrfVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('csrf')
    );

    console.log(`📊 CSRF Assessment Results:`);
    console.log(`  Vulnerabilities Found: ${csrfVulns.length}`);
    
    csrfVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // High severity CSRF should fail the test
    const highCsrfVulns = csrfVulns.filter(v => v.severity === 'high');
    
    if (highCsrfVulns.length > 0) {
      console.log('❌ CSRF vulnerabilities detected!');
      expect(highCsrfVulns.length, 'No high severity CSRF vulnerabilities should be present').toBe(0);
    } else {
      console.log('✅ No high severity CSRF vulnerabilities detected');
    }
  });

  test('Authentication bypass assessment', async () => {
    console.log('\n🔍 Starting authentication bypass assessment...');
    
    await framework.testAuthenticationBypass();
    
    const results = framework.getTestResults();
    const authVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('authentication') ||
      v.type.toLowerCase().includes('session')
    );

    console.log(`📊 Authentication Assessment Results:`);
    console.log(`  Vulnerabilities Found: ${authVulns.length}`);
    
    authVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // Critical authentication bypass should fail the test
    const criticalAuthVulns = authVulns.filter(v => v.severity === 'critical');
    
    if (criticalAuthVulns.length > 0) {
      console.log('❌ Critical authentication vulnerabilities detected!');
      expect(criticalAuthVulns.length, 'No critical authentication vulnerabilities should be present').toBe(0);
    } else {
      console.log('✅ No critical authentication vulnerabilities detected');
    }
  });

  test('Privilege escalation assessment', async () => {
    console.log('\n🔍 Starting privilege escalation assessment...');
    
    await framework.testPrivilegeEscalation();
    
    const results = framework.getTestResults();
    const privilegeVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('privilege') ||
      v.type.toLowerCase().includes('role')
    );

    console.log(`📊 Privilege Escalation Assessment Results:`);
    console.log(`  Vulnerabilities Found: ${privilegeVulns.length}`);
    
    privilegeVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // Critical privilege escalation should fail the test
    const criticalPrivilegeVulns = privilegeVulns.filter(v => v.severity === 'critical');
    
    if (criticalPrivilegeVulns.length > 0) {
      console.log('❌ Critical privilege escalation vulnerabilities detected!');
      expect(criticalPrivilegeVulns.length, 'No critical privilege escalation vulnerabilities should be present').toBe(0);
    } else {
      console.log('✅ No critical privilege escalation vulnerabilities detected');
    }
  });

  test('File upload security assessment', async () => {
    console.log('\n🔍 Starting file upload security assessment...');
    
    await framework.testFileUploadSecurity();
    
    const results = framework.getTestResults();
    const fileVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('file')
    );

    console.log(`📊 File Upload Security Assessment Results:`);
    console.log(`  Vulnerabilities Found: ${fileVulns.length}`);
    
    fileVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // Critical file upload issues should fail the test
    const criticalFileVulns = fileVulns.filter(v => v.severity === 'critical');
    
    if (criticalFileVulns.length > 0) {
      console.log('❌ Critical file upload vulnerabilities detected!');
      expect(criticalFileVulns.length, 'No critical file upload vulnerabilities should be present').toBe(0);
    } else {
      console.log('✅ No critical file upload vulnerabilities detected');
    }
  });

  test('Session security assessment', async () => {
    console.log('\n🔍 Starting session security assessment...');
    
    await framework.testSessionSecurity();
    
    const results = framework.getTestResults();
    const sessionVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('session') ||
      v.type.toLowerCase().includes('cookie')
    );

    console.log(`📊 Session Security Assessment Results:`);
    console.log(`  Vulnerabilities Found: ${sessionVulns.length}`);
    
    sessionVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // High severity session issues should be noted but not fail tests in development
    const highSessionVulns = sessionVulns.filter(v => v.severity === 'high');
    console.log(`⚠️ High severity session issues: ${highSessionVulns.length}`);
  });

  test('Security headers assessment', async () => {
    console.log('\n🔍 Starting security headers assessment...');
    
    await framework.testSecurityHeaders();
    
    const results = framework.getTestResults();
    const headerVulns = results.vulnerabilities.filter(v => 
      v.type.toLowerCase().includes('header') ||
      v.type.toLowerCase().includes('information disclosure')
    );

    console.log(`📊 Security Headers Assessment Results:`);
    console.log(`  Issues Found: ${headerVulns.length}`);
    
    headerVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.severity.toUpperCase()}: ${vuln.description}`);
    });

    // High severity header issues should be addressed
    const highHeaderVulns = headerVulns.filter(v => v.severity === 'high');
    console.log(`⚠️ High severity header issues: ${highHeaderVulns.length}`);
    
    // In production, missing CSP header should fail the test
    if (process.env.NODE_ENV === 'production') {
      const cspMissing = headerVulns.some(v => 
        v.description.toLowerCase().includes('content-security-policy')
      );
      expect(cspMissing, 'Content-Security-Policy header should be present in production').toBe(false);
    }
  });

  test('Comprehensive security assessment and reporting', async () => {
    console.log('\n🔍 Running comprehensive security assessment...');
    
    // Run all security tests
    await framework.testSQLInjection();
    await framework.testXSSVulnerabilities();
    await framework.testCSRFProtection();
    await framework.testAuthenticationBypass();
    await framework.testPrivilegeEscalation();
    await framework.testFileUploadSecurity();
    await framework.testSessionSecurity();
    await framework.testSecurityHeaders();
    
    const results = framework.getTestResults();
    
    console.log('\n📊 Comprehensive Security Assessment Results:');
    console.log('='.repeat(50));
    console.log(`🚨 Total Vulnerabilities: ${results.vulnerabilities.length}`);
    console.log(`🔴 Critical Issues: ${results.criticalIssues}`);
    console.log(`🟠 High Issues: ${results.highIssues}`);
    console.log(`🟡 Medium Issues: ${results.mediumIssues}`);
    console.log(`🔵 Low Issues: ${results.lowIssues}`);
    
    // Calculate security score
    const securityScore = Math.max(0, 100 - (
      results.criticalIssues * 25 +
      results.highIssues * 10 +
      results.mediumIssues * 5 +
      results.lowIssues * 2
    ));
    
    console.log(`📈 Security Score: ${securityScore}/100`);
    
    const riskLevel = results.criticalIssues > 0 ? 'CRITICAL' :
                     results.highIssues > 0 ? 'HIGH' :
                     results.mediumIssues > 0 ? 'MEDIUM' : 'LOW';
    
    console.log(`⚠️ Risk Level: ${riskLevel}`);
    console.log('='.repeat(50));
    
    // Generate security report
    await framework.generateSecurityReport();
    
    // Assertions for critical security issues
    expect(results.criticalIssues, 'No critical security vulnerabilities should be present').toBe(0);
    
    // In production, also check high severity issues
    if (process.env.NODE_ENV === 'production') {
      expect(results.highIssues, 'No high severity security issues should be present in production').toBe(0);
    }
    
    // Security score should be reasonable
    expect(securityScore, 'Security score should be at least 70').toBeGreaterThanOrEqual(70);
    
    console.log('✅ Comprehensive security assessment completed');
  });
});