/**
 * Code Documentation Audit System
 * Phase 5, Task 5.3: Automated code documentation quality assessment
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CodeDocumentationMetrics {
  file: string;
  totalFunctions: number;
  documentedFunctions: number;
  totalClasses: number;
  documentedClasses: number;
  totalInterfaces: number;
  documentedInterfaces: number;
  totalTypes: number;
  documentedTypes: number;
  documentationCoverage: number;
  jsdocCompliance: number;
  typeDocCompliance: number;
  issues: CodeDocumentationIssue[];
}

export interface CodeDocumentationIssue {
  type: 'missing-docs' | 'incomplete-docs' | 'outdated-docs' | 'poor-quality' | 'inconsistent-style';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  recommendation: string;
  codeSnippet?: string;
}

export interface CodeDocumentationReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    overallCoverage: number;
    functionCoverage: number;
    classCoverage: number;
    interfaceCoverage: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    qualityScore: number;
  };
  fileMetrics: CodeDocumentationMetrics[];
  recommendations: string[];
  complianceGates: {
    minimumCoverage: boolean;
    jsdocCompliance: boolean;
    publicAPIDocumented: boolean;
    exportsDocumented: boolean;
  };
}

export class CodeDocumentationAuditor {
  private projectRoot: string;
  private sourceDir: string;
  private excludePatterns: string[];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.sourceDir = path.join(projectRoot, 'src');
    this.excludePatterns = [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**'
    ];
  }

  async auditCodeDocumentation(): Promise<CodeDocumentationReport> {

    const sourceFiles = await this.findSourceFiles();

    const fileMetrics: CodeDocumentationMetrics[] = [];

    for (const file of sourceFiles) {
      const metrics = await this.analyzeFile(file);
      fileMetrics.push(metrics);
    }

    return this.generateReport(fileMetrics);
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    await this.scanDirectory(this.sourceDir, files);
    return files.filter(file => this.shouldIncludeFile(file));
  }

  private async scanDirectory(dir: string, files: string[]): Promise<void> {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
        await this.scanDirectory(fullPath, files);
      } else if (stat.isFile() && this.isSourceFile(item)) {
        files.push(fullPath);
      }
    }
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'test-results'];
    return skipDirs.includes(name);
  }

  private isSourceFile(filename: string): boolean {
    return /\.(ts|tsx|js|jsx)$/.test(filename);
  }

  private shouldIncludeFile(filePath: string): boolean {
    const relativePath = path.relative(this.projectRoot, filePath);
    return !this.excludePatterns.some(pattern => {
      // Simple pattern matching (could be enhanced with glob)
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(relativePath);
    });
  }

  private async analyzeFile(filePath: string): Promise<CodeDocumentationMetrics> {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.projectRoot, filePath);
    
    const metrics: CodeDocumentationMetrics = {
      file: relativePath,
      totalFunctions: 0,
      documentedFunctions: 0,
      totalClasses: 0,
      documentedClasses: 0,
      totalInterfaces: 0,
      documentedInterfaces: 0,
      totalTypes: 0,
      documentedTypes: 0,
      documentationCoverage: 0,
      jsdocCompliance: 0,
      typeDocCompliance: 0,
      issues: []
    };

    // Analyze functions
    const functions = this.extractFunctions(content);
    metrics.totalFunctions = functions.length;
    metrics.documentedFunctions = functions.filter(f => f.hasDocumentation).length;

    // Analyze classes
    const classes = this.extractClasses(content);
    metrics.totalClasses = classes.length;
    metrics.documentedClasses = classes.filter(c => c.hasDocumentation).length;

    // Analyze interfaces
    const interfaces = this.extractInterfaces(content);
    metrics.totalInterfaces = interfaces.length;
    metrics.documentedInterfaces = interfaces.filter(i => i.hasDocumentation).length;

    // Analyze type aliases
    const types = this.extractTypes(content);
    metrics.totalTypes = types.length;
    metrics.documentedTypes = types.filter(t => t.hasDocumentation).length;

    // Calculate overall coverage
    const totalItems = metrics.totalFunctions + metrics.totalClasses + metrics.totalInterfaces + metrics.totalTypes;
    const documentedItems = metrics.documentedFunctions + metrics.documentedClasses + metrics.documentedInterfaces + metrics.documentedTypes;
    metrics.documentationCoverage = totalItems > 0 ? Math.round((documentedItems / totalItems) * 100) : 100;

    // Calculate JSDoc compliance
    metrics.jsdocCompliance = this.calculateJSDocCompliance(content, functions, classes, interfaces, types);

    // Calculate TypeDoc compliance
    metrics.typeDocCompliance = this.calculateTypeDocCompliance(content);

    // Generate issues
    metrics.issues = this.generateFileIssues(content, filePath, functions, classes, interfaces, types);

    return metrics;
  }

  private extractFunctions(content: string): Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> {
    const functions: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> = [];
    const lines = content.split('\n');
    
    // Regular expressions for different function types
    const patterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?[^=]*=>/g,
      /(\w+)\s*\([^)]*\)\s*:\s*[^=]*=>/g,
      /(\w+)\s*:\s*\([^)]*\)\s*=>/g
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of patterns) {
        let match;
        pattern.lastIndex = 0; // Reset regex state
        
        while ((match = pattern.exec(line)) !== null) {
          const functionName = match[1];
          if (!functionName || functionName === 'return' || functionName === 'if') continue;
          
          const isExported = line.includes('export');
          const hasDocumentation = this.hasPrecedingDocumentation(lines, i);
          
          functions.push({
            name: functionName,
            hasDocumentation,
            line: i + 1,
            isExported
          });
        }
      }
    }
    
    return functions;
  }

  private extractClasses(content: string): Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> {
    const classes: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> = [];
    const lines = content.split('\n');
    const classPattern = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;
      
      classPattern.lastIndex = 0;
      while ((match = classPattern.exec(line)) !== null) {
        const className = match[1];
        const isExported = line.includes('export');
        const hasDocumentation = this.hasPrecedingDocumentation(lines, i);
        
        classes.push({
          name: className,
          hasDocumentation,
          line: i + 1,
          isExported
        });
      }
    }
    
    return classes;
  }

  private extractInterfaces(content: string): Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> {
    const interfaces: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> = [];
    const lines = content.split('\n');
    const interfacePattern = /(?:export\s+)?interface\s+(\w+)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;
      
      interfacePattern.lastIndex = 0;
      while ((match = interfacePattern.exec(line)) !== null) {
        const interfaceName = match[1];
        const isExported = line.includes('export');
        const hasDocumentation = this.hasPrecedingDocumentation(lines, i);
        
        interfaces.push({
          name: interfaceName,
          hasDocumentation,
          line: i + 1,
          isExported
        });
      }
    }
    
    return interfaces;
  }

  private extractTypes(content: string): Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> {
    const types: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}> = [];
    const lines = content.split('\n');
    const typePattern = /(?:export\s+)?type\s+(\w+)\s*=/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;
      
      typePattern.lastIndex = 0;
      while ((match = typePattern.exec(line)) !== null) {
        const typeName = match[1];
        const isExported = line.includes('export');
        const hasDocumentation = this.hasPrecedingDocumentation(lines, i);
        
        types.push({
          name: typeName,
          hasDocumentation,
          line: i + 1,
          isExported
        });
      }
    }
    
    return types;
  }

  private hasPrecedingDocumentation(lines: string[], currentLine: number): boolean {
    // Look for JSDoc comments in the preceding lines
    for (let i = currentLine - 1; i >= 0; i--) {
      const line = lines[i].trim();
      
      if (line === '') continue; // Skip empty lines
      
      if (line.startsWith('/**') || line.includes('*/')) {
        return true; // Found JSDoc comment
      }
      
      if (line.startsWith('//')) {
        continue; // Continue looking through single-line comments
      }
      
      if (line.startsWith('*')) {
        continue; // Part of multi-line comment
      }
      
      // If we hit actual code, stop looking
      if (line && !line.startsWith('//') && !line.startsWith('*')) {
        break;
      }
    }
    
    return false;
  }

  private calculateJSDocCompliance(
    content: string,
    functions: Array<{name: string, hasDocumentation: boolean, isExported: boolean}>,
    classes: Array<{name: string, hasDocumentation: boolean, isExported: boolean}>,
    interfaces: Array<{name: string, hasDocumentation: boolean, isExported: boolean}>,
    types: Array<{name: string, hasDocumentation: boolean, isExported: boolean}>
  ): number {
    let totalCompliantItems = 0;
    let totalItems = 0;
    
    // Check for proper JSDoc format
    const jsdocBlocks = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
    
    // Analyze JSDoc quality
    for (const block of jsdocBlocks) {
      totalItems++;
      
      // Check for basic JSDoc elements
      const hasDescription = !/^\s*\/\*\*\s*\*\/\s*$/.test(block);
      const hasParams = /@param/.test(block) || !/@param/.test(content); // If no @param needed, it's compliant
      const hasReturns = /@returns?/.test(block) || !/@returns?/.test(content); // If no @returns needed, it's compliant
      
      if (hasDescription && hasParams && hasReturns) {
        totalCompliantItems++;
      }
    }
    
    return totalItems > 0 ? Math.round((totalCompliantItems / totalItems) * 100) : 100;
  }

  private calculateTypeDocCompliance(content: string): number {
    // Check for TypeDoc-specific annotations
    let score = 100;
    
    // Penalize for missing @public, @private, @internal on exported items
    const exportedItems = (content.match(/export\s+(?:class|interface|function|type|const)/g) || []).length;
    const typeDocAnnotations = (content.match(/@(?:public|private|internal|deprecated)/g) || []).length;
    
    if (exportedItems > 0 && typeDocAnnotations === 0) {
      score -= 20; // Penalize for no TypeDoc annotations
    }
    
    // Check for proper module documentation
    if (content.includes('export') && !content.includes('@fileoverview') && !content.includes('@module')) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  private generateFileIssues(
    content: string,
    filePath: string,
    functions: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}>,
    classes: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}>,
    interfaces: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}>,
    types: Array<{name: string, hasDocumentation: boolean, line: number, isExported: boolean}>
  ): CodeDocumentationIssue[] {
    const issues: CodeDocumentationIssue[] = [];
    const fileName = path.basename(filePath);

    // Check for undocumented exported functions
    const undocumentedExportedFunctions = functions.filter(f => f.isExported && !f.hasDocumentation);
    for (const func of undocumentedExportedFunctions) {
      issues.push({
        type: 'missing-docs',
        severity: 'high',
        location: `${fileName}:${func.line}`,
        description: `Exported function '${func.name}' lacks documentation`,
        recommendation: 'Add JSDoc comment explaining the function purpose, parameters, and return value',
        codeSnippet: `function ${func.name}(...)`
      });
    }

    // Check for undocumented exported classes
    const undocumentedExportedClasses = classes.filter(c => c.isExported && !c.hasDocumentation);
    for (const cls of undocumentedExportedClasses) {
      issues.push({
        type: 'missing-docs',
        severity: 'high',
        location: `${fileName}:${cls.line}`,
        description: `Exported class '${cls.name}' lacks documentation`,
        recommendation: 'Add JSDoc comment explaining the class purpose and usage',
        codeSnippet: `class ${cls.name} {...}`
      });
    }

    // Check for undocumented exported interfaces
    const undocumentedExportedInterfaces = interfaces.filter(i => i.isExported && !i.hasDocumentation);
    for (const intf of undocumentedExportedInterfaces) {
      issues.push({
        type: 'missing-docs',
        severity: 'medium',
        location: `${fileName}:${intf.line}`,
        description: `Exported interface '${intf.name}' lacks documentation`,
        recommendation: 'Add JSDoc comment explaining the interface purpose and properties',
        codeSnippet: `interface ${intf.name} {...}`
      });
    }

    // Check for undocumented public functions (non-exported but significant)
    const undocumentedPublicFunctions = functions.filter(f => !f.isExported && !f.hasDocumentation && f.name.length > 3);
    if (undocumentedPublicFunctions.length > functions.length * 0.7) { // If >70% lack docs
      issues.push({
        type: 'missing-docs',
        severity: 'medium',
        location: fileName,
        description: 'Many internal functions lack documentation',
        recommendation: 'Consider adding documentation to complex internal functions for maintainability'
      });
    }

    // Check for file-level documentation
    if (!content.includes('@fileoverview') && !content.includes('@module') && functions.length + classes.length + interfaces.length > 3) {
      issues.push({
        type: 'missing-docs',
        severity: 'medium',
        location: fileName,
        description: 'File lacks module-level documentation',
        recommendation: 'Add @fileoverview or @module comment at the top of the file'
      });
    }

    // Check for poor quality documentation
    const jsdocBlocks = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
    for (const block of jsdocBlocks) {
      if (block.trim().length < 20) { // Very short documentation
        issues.push({
          type: 'poor-quality',
          severity: 'low',
          location: fileName,
          description: 'Documentation comment is too brief',
          recommendation: 'Expand documentation with more detailed explanation'
        });
      }
    }

    // Check for inconsistent documentation style
    const singleLineComments = (content.match(/\/\/ .+/g) || []).length;
    const jsdocComments = jsdocBlocks.length;
    
    if (singleLineComments > jsdocComments * 2 && jsdocComments > 0) {
      issues.push({
        type: 'inconsistent-style',
        severity: 'low',
        location: fileName,
        description: 'Mixed documentation styles (JSDoc vs single-line comments)',
        recommendation: 'Use JSDoc comments consistently for all public APIs'
      });
    }

    return issues;
  }

  private generateReport(fileMetrics: CodeDocumentationMetrics[]): CodeDocumentationReport {
    const totalFunctions = fileMetrics.reduce((sum, m) => sum + m.totalFunctions, 0);
    const documentedFunctions = fileMetrics.reduce((sum, m) => sum + m.documentedFunctions, 0);
    const totalClasses = fileMetrics.reduce((sum, m) => sum + m.totalClasses, 0);
    const documentedClasses = fileMetrics.reduce((sum, m) => sum + m.documentedClasses, 0);
    const totalInterfaces = fileMetrics.reduce((sum, m) => sum + m.totalInterfaces, 0);
    const documentedInterfaces = fileMetrics.reduce((sum, m) => sum + m.documentedInterfaces, 0);
    
    const totalItems = totalFunctions + totalClasses + totalInterfaces;
    const documentedItems = documentedFunctions + documentedClasses + documentedInterfaces;
    const overallCoverage = totalItems > 0 ? Math.round((documentedItems / totalItems) * 100) : 100;
    
    const functionCoverage = totalFunctions > 0 ? Math.round((documentedFunctions / totalFunctions) * 100) : 100;
    const classCoverage = totalClasses > 0 ? Math.round((documentedClasses / totalClasses) * 100) : 100;
    const interfaceCoverage = totalInterfaces > 0 ? Math.round((documentedInterfaces / totalInterfaces) * 100) : 100;
    
    const allIssues = fileMetrics.flatMap(m => m.issues);
    const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    const highIssues = allIssues.filter(i => i.severity === 'high').length;
    
    // Calculate quality score
    const qualityScore = Math.round(
      overallCoverage * 0.6 + // 60% weight on coverage
      (100 - (criticalIssues * 15 + highIssues * 8 + allIssues.length * 2)) * 0.4 // 40% weight on issue severity
    );

    const recommendations = this.generateRecommendations(fileMetrics, overallCoverage, allIssues);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: fileMetrics.length,
        overallCoverage,
        functionCoverage,
        classCoverage,
        interfaceCoverage,
        totalIssues: allIssues.length,
        criticalIssues,
        highIssues,
        qualityScore: Math.max(0, Math.min(100, qualityScore))
      },
      fileMetrics,
      recommendations,
      complianceGates: {
        minimumCoverage: overallCoverage >= 70,
        jsdocCompliance: fileMetrics.every(m => m.jsdocCompliance >= 60),
        publicAPIDocumented: this.checkPublicAPIDocumentation(fileMetrics),
        exportsDocumented: this.checkExportsDocumentation(fileMetrics)
      }
    };
  }

  private checkPublicAPIDocumentation(fileMetrics: CodeDocumentationMetrics[]): boolean {
    // Check if public API files have good documentation coverage
    const publicApiFiles = fileMetrics.filter(m => 
      m.file.includes('api/') || 
      m.file.includes('lib/') && (m.totalClasses > 0 || m.totalInterfaces > 0)
    );
    
    if (publicApiFiles.length === 0) return true; // No public API files
    
    return publicApiFiles.every(m => m.documentationCoverage >= 80);
  }

  private checkExportsDocumentation(fileMetrics: CodeDocumentationMetrics[]): boolean {
    // Check if files with exports have good documentation
    const filesWithExports = fileMetrics.filter(m => 
      m.documentedFunctions + m.documentedClasses + m.documentedInterfaces > 0
    );
    
    if (filesWithExports.length === 0) return true; // No exports
    
    return filesWithExports.every(m => m.documentationCoverage >= 60);
  }

  private generateRecommendations(
    fileMetrics: CodeDocumentationMetrics[], 
    overallCoverage: number, 
    issues: CodeDocumentationIssue[]
  ): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) {
      recommendations.push(`Address ${criticalIssues} critical documentation issues immediately`);
    }
    
    if (highIssues > 0) {
      recommendations.push(`Review and resolve ${highIssues} high-priority documentation issues`);
    }
    
    if (overallCoverage < 50) {
      recommendations.push('Documentation coverage is critically low - prioritize adding docs to public APIs');
    } else if (overallCoverage < 70) {
      recommendations.push('Improve documentation coverage by focusing on exported functions and classes');
    }
    
    const filesWithLowCoverage = fileMetrics.filter(m => m.documentationCoverage < 30).length;
    if (filesWithLowCoverage > 0) {
      recommendations.push(`${filesWithLowCoverage} files have very low documentation coverage`);
    }
    
    const missingDocsIssues = issues.filter(i => i.type === 'missing-docs').length;
    if (missingDocsIssues > 10) {
      recommendations.push('Consider implementing documentation requirements in your development process');
    }
    
    const inconsistentIssues = issues.filter(i => i.type === 'inconsistent-style').length;
    if (inconsistentIssues > 0) {
      recommendations.push('Establish and enforce consistent documentation style guidelines');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Code documentation quality is good - maintain current standards');
    }
    
    return recommendations;
  }

  async generateReports(outputDir: string = 'test-results/documentation'): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const report = await this.auditCodeDocumentation();
    
    // Generate JSON report
    const jsonPath = path.join(outputDir, 'code-documentation-audit.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(outputDir, 'code-documentation-audit.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    // Generate Markdown report
    const mdReport = this.generateMarkdownReport(report);
    const mdPath = path.join(outputDir, 'CODE_DOCUMENTATION_AUDIT.md');
    fs.writeFileSync(mdPath, mdReport);
    
  }

  private generateHTMLReport(report: CodeDocumentationReport): string {
    const scoreColor = report.summary.qualityScore >= 80 ? '#28a745' : 
                      report.summary.qualityScore >= 60 ? '#ffc107' : '#dc3545';

    return `<!DOCTYPE html>
<html>
<head>
    <title>Code Documentation Audit - ${path.basename(this.projectRoot)}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 3em; font-weight: bold; color: ${scoreColor}; text-align: center; }
        .coverage-good { color: #28a745; }
        .coverage-warning { color: #ffc107; }
        .coverage-poor { color: #dc3545; }
        .gate-pass { color: #28a745; font-weight: bold; }
        .gate-fail { color: #dc3545; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .issue-critical { border-left: 5px solid #dc3545; }
        .issue-high { border-left: 5px solid #fd7e14; }
        .issue-medium { border-left: 5px solid #ffc107; }
        .issue-low { border-left: 5px solid #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Code Documentation Audit</h1>
        <p>${path.basename(this.projectRoot)} - Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Quality Score</h3>
            <div class="score">${report.summary.qualityScore}</div>
        </div>
        <div class="card">
            <h3>Overall Coverage</h3>
            <h2 class="${report.summary.overallCoverage >= 70 ? 'coverage-good' : report.summary.overallCoverage >= 50 ? 'coverage-warning' : 'coverage-poor'}">${report.summary.overallCoverage}%</h2>
        </div>
        <div class="card">
            <h3>Function Coverage</h3>
            <h2 class="${report.summary.functionCoverage >= 70 ? 'coverage-good' : report.summary.functionCoverage >= 50 ? 'coverage-warning' : 'coverage-poor'}">${report.summary.functionCoverage}%</h2>
        </div>
        <div class="card">
            <h3>Class Coverage</h3>
            <h2 class="${report.summary.classCoverage >= 70 ? 'coverage-good' : report.summary.classCoverage >= 50 ? 'coverage-warning' : 'coverage-poor'}">${report.summary.classCoverage}%</h2>
        </div>
        <div class="card">
            <h3>Total Issues</h3>
            <h2>${report.summary.totalIssues}</h2>
            <p>${report.summary.criticalIssues} critical, ${report.summary.highIssues} high</p>
        </div>
    </div>
    
    <div class="card">
        <h2>📋 Compliance Gates</h2>
        <table>
            <tr>
                <td>Minimum Coverage (70%+)</td>
                <td class="${report.complianceGates.minimumCoverage ? 'gate-pass' : 'gate-fail'}">
                    ${report.complianceGates.minimumCoverage ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
            <tr>
                <td>JSDoc Compliance</td>
                <td class="${report.complianceGates.jsdocCompliance ? 'gate-pass' : 'gate-fail'}">
                    ${report.complianceGates.jsdocCompliance ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
            <tr>
                <td>Public API Documented</td>
                <td class="${report.complianceGates.publicAPIDocumented ? 'gate-pass' : 'gate-fail'}">
                    ${report.complianceGates.publicAPIDocumented ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
            <tr>
                <td>Exports Documented</td>
                <td class="${report.complianceGates.exportsDocumented ? 'gate-pass' : 'gate-fail'}">
                    ${report.complianceGates.exportsDocumented ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
        </table>
    </div>
    
    <div class="card">
        <h2>📊 File Coverage Details</h2>
        <table>
            <thead>
                <tr>
                    <th>File</th>
                    <th>Coverage</th>
                    <th>Functions</th>
                    <th>Classes</th>
                    <th>Interfaces</th>
                    <th>Issues</th>
                </tr>
            </thead>
            <tbody>
                ${report.fileMetrics.map(metric => `
                    <tr>
                        <td>${metric.file}</td>
                        <td class="${metric.documentationCoverage >= 70 ? 'coverage-good' : metric.documentationCoverage >= 50 ? 'coverage-warning' : 'coverage-poor'}">${metric.documentationCoverage}%</td>
                        <td>${metric.documentedFunctions}/${metric.totalFunctions}</td>
                        <td>${metric.documentedClasses}/${metric.totalClasses}</td>
                        <td>${metric.documentedInterfaces}/${metric.totalInterfaces}</td>
                        <td>${metric.issues.length}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="card">
        <h2>🔧 Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }

  private generateMarkdownReport(report: CodeDocumentationReport): string {
    return `# Code Documentation Audit Report

**Project**: ${path.basename(this.projectRoot)}  
**Generated**: ${new Date(report.timestamp).toLocaleString()}  
**Quality Score**: ${report.summary.qualityScore}/100

## 📊 Coverage Summary

| Metric | Coverage |
|--------|----------|
| **Overall** | ${report.summary.overallCoverage}% |
| **Functions** | ${report.summary.functionCoverage}% |
| **Classes** | ${report.summary.classCoverage}% |
| **Interfaces** | ${report.summary.interfaceCoverage}% |

## 📋 Compliance Gates

| Gate | Status |
|------|--------|
| Minimum Coverage (70%+) | ${report.complianceGates.minimumCoverage ? '✅ PASS' : '❌ FAIL'} |
| JSDoc Compliance | ${report.complianceGates.jsdocCompliance ? '✅ PASS' : '❌ FAIL'} |
| Public API Documented | ${report.complianceGates.publicAPIDocumented ? '✅ PASS' : '❌ FAIL'} |
| Exports Documented | ${report.complianceGates.exportsDocumented ? '✅ PASS' : '❌ FAIL'} |

## 🎯 Priority Actions

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📄 File Details

${report.fileMetrics
  .filter(m => m.documentationCoverage < 70)
  .map(metric => 
`### ${metric.file} (${metric.documentationCoverage}% coverage)
- Functions: ${metric.documentedFunctions}/${metric.totalFunctions}
- Classes: ${metric.documentedClasses}/${metric.totalClasses}  
- Interfaces: ${metric.documentedInterfaces}/${metric.totalInterfaces}
- Issues: ${metric.issues.length}
`).join('\n')}

---

*Generated by blipee-os Code Documentation Audit System*
`;
  }
}

// CLI Usage
if (require.main === module) {
  const auditor = new CodeDocumentationAuditor();
  
  auditor.generateReports()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Code documentation audit failed:', error);
      process.exit(1);
    });
}