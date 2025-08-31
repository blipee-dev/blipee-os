/**
 * Documentation Audit System
 * Phase 5, Task 5.3: Comprehensive documentation review and quality assessment
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DocumentationMetrics {
  file: string;
  type: 'readme' | 'api' | 'guide' | 'changelog' | 'technical' | 'other';
  wordCount: number;
  lastModified: Date;
  hasCodeExamples: boolean;
  hasImages: boolean;
  hasLinks: boolean;
  hasTOC: boolean;
  completeness: number; // 0-100
  readability: number; // 0-100
  accuracy: number; // 0-100
  issues: DocumentationIssue[];
}

export interface DocumentationIssue {
  type: 'missing' | 'outdated' | 'broken-link' | 'unclear' | 'incomplete' | 'inconsistent';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: string;
  recommendation: string;
}

export interface DocumentationAuditReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    totalWordCount: number;
    averageCompleteness: number;
    averageReadability: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    documentationScore: number;
  };
  fileMetrics: DocumentationMetrics[];
  missingDocumentation: string[];
  recommendations: string[];
  qualityGates: {
    minimumCoverage: boolean;
    apiDocumentation: boolean;
    userGuides: boolean;
    technicalDocs: boolean;
    upToDate: boolean;
  };
}

export class DocumentationAuditor {
  private projectRoot: string;
  private issues: DocumentationIssue[] = [];
  private metrics: DocumentationMetrics[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async auditProjectDocumentation(): Promise<DocumentationAuditReport> {
    console.log('📚 Starting comprehensive documentation audit...\n');

    // Find all documentation files
    const docFiles = await this.findDocumentationFiles();
    console.log(`Found ${docFiles.length} documentation files\n`);

    // Analyze each documentation file
    for (const file of docFiles) {
      try {
        console.log(`📄 Analyzing ${path.relative(this.projectRoot, file)}...`);
        const metrics = await this.analyzeDocumentationFile(file);
        this.metrics.push(metrics);
      } catch (error) {
        console.warn(`⚠️ Skipping ${path.relative(this.projectRoot, file)}: ${(error as Error).message}`);
      }
    }

    // Check for missing essential documentation
    await this.checkMissingDocumentation();

    // Validate documentation consistency
    await this.validateDocumentationConsistency();

    // Check for broken links and references
    await this.validateLinksAndReferences();

    // Generate comprehensive report
    const report = await this.generateAuditReport();

    console.log('\n📊 Documentation audit completed!');
    console.log(`Documentation Score: ${report.summary.documentationScore}/100`);

    return report;
  }

  private async findDocumentationFiles(): Promise<string[]> {
    const docPatterns = [
      '**/*.md',
      '**/*.txt',
      '**/README*',
      '**/CHANGELOG*',
      '**/CONTRIBUTING*',
      '**/LICENSE*',
      '**/docs/**/*',
      '**/documentation/**/*'
    ];

    const excludePatterns = [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'test-results/**',
      '**/*.test.*',
      '**/*.spec.*'
    ];

    const files: string[] = [];
    
    try {
      const glob = require('glob');
      
      for (const pattern of docPatterns) {
        const matches = glob.sync(pattern, {
          cwd: this.projectRoot,
          ignore: excludePatterns,
          absolute: true
        });
        files.push(...matches);
      }
    } catch (error) {
      // Fallback to manual file discovery
      const manualFiles = this.findDocumentationFilesManually();
      files.push(...manualFiles);
    }

    // Remove duplicates and sort
    const uniqueFiles = Array.from(new Set(files));
    return uniqueFiles.sort();
  }

  private findDocumentationFilesManually(): string[] {
    const files: string[] = [];
    const docDirs = ['docs', 'documentation', '.'];
    
    for (const dir of docDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath)) {
        files.push(...this.scanDirectoryForDocs(fullPath));
      }
    }
    
    return files;
  }

  private scanDirectoryForDocs(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          files.push(...this.scanDirectoryForDocs(fullPath));
        } else if (stat.isFile() && this.isDocumentationFile(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dir}:`, error);
    }
    
    return files;
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'test-results'];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  private isDocumentationFile(filename: string): boolean {
    const docExtensions = ['.md', '.txt', '.rst'];
    const docNames = ['README', 'CHANGELOG', 'CONTRIBUTING', 'LICENSE', 'INSTALLATION', 'USAGE'];
    
    const ext = path.extname(filename).toLowerCase();
    const nameWithoutExt = path.basename(filename, ext).toUpperCase();
    
    return docExtensions.includes(ext) || docNames.some(name => nameWithoutExt.includes(name));
  }

  private async analyzeDocumentationFile(filePath: string): Promise<DocumentationMetrics> {
    // Skip if it's a directory
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      throw new Error(`Cannot analyze directory: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    const metrics: DocumentationMetrics = {
      file: path.relative(this.projectRoot, filePath),
      type: this.categorizeDocumentationType(filePath, content),
      wordCount: this.countWords(content),
      lastModified: stats.mtime,
      hasCodeExamples: this.hasCodeExamples(content),
      hasImages: this.hasImages(content),
      hasLinks: this.hasLinks(content),
      hasTOC: this.hasTableOfContents(content),
      completeness: this.assessCompleteness(content, filePath),
      readability: this.assessReadability(content),
      accuracy: this.assessAccuracy(content, filePath),
      issues: []
    };

    // Detect specific issues
    const issues = this.detectIssues(content, filePath, metrics);
    metrics.issues = issues;
    this.issues.push(...issues);

    return metrics;
  }

  private categorizeDocumentationType(filePath: string, content: string): DocumentationMetrics['type'] {
    const filename = path.basename(filePath).toLowerCase();
    
    if (filename.includes('readme')) return 'readme';
    if (filename.includes('changelog')) return 'changelog';
    if (filename.includes('api') || content.includes('API') || content.includes('endpoint')) return 'api';
    if (filename.includes('guide') || filename.includes('tutorial') || filename.includes('how-to')) return 'guide';
    if (filename.includes('technical') || filename.includes('architecture') || filename.includes('design')) return 'technical';
    
    return 'other';
  }

  private countWords(content: string): number {
    // Remove code blocks and other non-prose content
    const proseContent = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/\[[^\]]*\]\([^)]*\)/g, '') // Remove markdown links
      .replace(/#+ /g, '') // Remove headers
      .replace(/[^\w\s]/g, ' '); // Replace special chars with spaces
    
    return proseContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private hasCodeExamples(content: string): boolean {
    return /```[\s\S]*?```/.test(content) || /`[^`\n]+`/.test(content);
  }

  private hasImages(content: string): boolean {
    return /!\[[^\]]*\]\([^)]*\)/.test(content);
  }

  private hasLinks(content: string): boolean {
    return /\[[^\]]+\]\([^)]+\)/.test(content) || /https?:\/\/[^\s]+/.test(content);
  }

  private hasTableOfContents(content: string): boolean {
    const tocPatterns = [
      /table of contents/i,
      /toc/i,
      /contents/i,
      /- \[.*\]\(#.*\)/
    ];
    return tocPatterns.some(pattern => pattern.test(content));
  }

  private assessCompleteness(content: string, filePath: string): number {
    let score = 100;
    const filename = path.basename(filePath).toLowerCase();
    
    // README specific checks
    if (filename.includes('readme')) {
      if (!content.includes('Installation') && !content.includes('Setup')) score -= 20;
      if (!content.includes('Usage') && !content.includes('Getting Started')) score -= 20;
      if (!content.includes('Contributing')) score -= 10;
      if (!content.includes('License')) score -= 5;
      if (!this.hasCodeExamples(content)) score -= 15;
    }
    
    // API documentation checks
    if (this.categorizeDocumentationType(filePath, content) === 'api') {
      if (!content.includes('endpoint') && !content.includes('API')) score -= 30;
      if (!this.hasCodeExamples(content)) score -= 25;
      if (!content.includes('parameter') && !content.includes('request')) score -= 20;
      if (!content.includes('response') && !content.includes('return')) score -= 15;
    }
    
    // General completeness checks
    if (content.length < 100) score -= 40; // Too short
    if (!this.hasLinks(content)) score -= 10; // No external references
    if (!content.includes('example')) score -= 10; // No examples
    
    return Math.max(0, score);
  }

  private assessReadability(content: string): number {
    let score = 100;
    const words = this.countWords(content);
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    
    // Readability scoring
    if (avgWordsPerSentence > 25) score -= 20; // Too complex sentences
    if (avgWordsPerSentence < 5) score -= 10; // Too simple sentences
    
    // Structure scoring
    const lines = content.split('\n');
    const headerCount = lines.filter(line => line.startsWith('#')).length;
    
    if (words > 500 && headerCount < 3) score -= 15; // Long docs need structure
    if (!this.hasTableOfContents(content) && words > 1000) score -= 10;
    
    // Formatting scoring
    if (!this.hasCodeExamples(content) && content.includes('function')) score -= 10;
    if (content.includes('http://') && !content.includes('https://')) score -= 5; // Prefer HTTPS
    
    return Math.max(0, score);
  }

  private assessAccuracy(content: string, filePath: string): number {
    let score = 100;
    const now = new Date();
    const stats = fs.statSync(filePath);
    const daysSinceModified = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    // Age-based accuracy scoring
    if (daysSinceModified > 365) score -= 30; // Very old
    else if (daysSinceModified > 180) score -= 15; // Somewhat old
    else if (daysSinceModified > 90) score -= 5; // Getting old
    
    // Content accuracy checks
    const currentYear = now.getFullYear();
    const contentYears = content.match(/20\d{2}/g) || [];
    const hasCurrentYear = contentYears.some(year => parseInt(year) === currentYear);
    
    if (contentYears.length > 0 && !hasCurrentYear) score -= 10; // Outdated references
    
    // Technology version checks (simplified)
    const techPatterns = [
      /node\.?js?\s*v?\d+/i,
      /npm\s*v?\d+/i,
      /react\s*v?\d+/i,
      /next\.?js\s*v?\d+/i
    ];
    
    for (const pattern of techPatterns) {
      if (pattern.test(content)) {
        // Could implement version checking against package.json
        // For now, just note that versions are mentioned
      }
    }
    
    return Math.max(0, score);
  }

  private detectIssues(content: string, filePath: string, metrics: DocumentationMetrics): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];
    const filename = path.basename(filePath);
    
    // Critical issues
    if (metrics.wordCount < 50) {
      issues.push({
        type: 'incomplete',
        severity: 'critical',
        description: 'Documentation is too short and likely incomplete',
        location: filename,
        recommendation: 'Expand documentation with more detailed information'
      });
    }
    
    if (filename.toLowerCase().includes('readme') && !content.includes('Installation') && !content.includes('Setup')) {
      issues.push({
        type: 'missing',
        severity: 'critical',
        description: 'README is missing installation/setup instructions',
        location: filename,
        recommendation: 'Add clear installation and setup instructions'
      });
    }
    
    // High issues
    if (metrics.type === 'api' && !this.hasCodeExamples(content)) {
      issues.push({
        type: 'missing',
        severity: 'high',
        description: 'API documentation lacks code examples',
        location: filename,
        recommendation: 'Add practical code examples for API usage'
      });
    }
    
    if (metrics.lastModified < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
      issues.push({
        type: 'outdated',
        severity: 'high',
        description: 'Documentation has not been updated in over a year',
        location: filename,
        recommendation: 'Review and update documentation for current accuracy'
      });
    }
    
    // Medium issues
    if (metrics.wordCount > 1000 && !metrics.hasTOC) {
      issues.push({
        type: 'missing',
        severity: 'medium',
        description: 'Long documentation lacks table of contents',
        location: filename,
        recommendation: 'Add table of contents for better navigation'
      });
    }
    
    // Check for broken internal links (simplified)
    const internalLinks = content.match(/\[.*?\]\((?!https?:\/\/)([^)]+)\)/g) || [];
    for (const link of internalLinks) {
      const linkPath = link.match(/\(([^)]+)\)/)?.[1];
      if (linkPath && !linkPath.startsWith('#')) {
        const fullPath = path.resolve(path.dirname(filePath), linkPath);
        if (!fs.existsSync(fullPath)) {
          issues.push({
            type: 'broken-link',
            severity: 'medium',
            description: `Broken internal link: ${linkPath}`,
            location: filename,
            recommendation: `Fix or remove broken link to ${linkPath}`
          });
        }
      }
    }
    
    // Low issues
    if (!this.hasImages(content) && (filename.includes('guide') || filename.includes('tutorial'))) {
      issues.push({
        type: 'missing',
        severity: 'low',
        description: 'Guide/tutorial could benefit from screenshots or diagrams',
        location: filename,
        recommendation: 'Consider adding visual aids to improve understanding'
      });
    }
    
    return issues;
  }

  private async checkMissingDocumentation(): Promise<void> {
    const essentialDocs = [
      'README.md',
      'CONTRIBUTING.md',
      'docs/API.md',
      'docs/INSTALLATION.md',
      'docs/ARCHITECTURE.md'
    ];
    
    for (const doc of essentialDocs) {
      const fullPath = path.join(this.projectRoot, doc);
      if (!fs.existsSync(fullPath)) {
        this.issues.push({
          type: 'missing',
          severity: 'high',
          description: `Missing essential documentation: ${doc}`,
          recommendation: `Create ${doc} with appropriate content`
        });
      }
    }
    
    // Check for API documentation if API routes exist
    const apiDir = path.join(this.projectRoot, 'src', 'app', 'api');
    if (fs.existsSync(apiDir)) {
      const hasApiDocs = this.metrics.some(m => m.type === 'api');
      if (!hasApiDocs) {
        this.issues.push({
          type: 'missing',
          severity: 'high',
          description: 'API routes exist but no API documentation found',
          recommendation: 'Create comprehensive API documentation'
        });
      }
    }
  }

  private async validateDocumentationConsistency(): Promise<void> {
    // Check for consistent terminology
    const terminologyMap = new Map<string, string[]>();
    
    for (const metric of this.metrics) {
      const content = fs.readFileSync(path.join(this.projectRoot, metric.file), 'utf8');
      
      // Extract key terms (simplified)
      const terms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
      terms.forEach(term => {
        if (!terminologyMap.has(term)) {
          terminologyMap.set(term, []);
        }
        terminologyMap.get(term)!.push(metric.file);
      });
    }
    
    // Look for potential inconsistencies (this is a simplified check)
    const projectName = path.basename(this.projectRoot);
    const variations = ['blipee', 'Blipee', 'BLIPEE', 'blipee-os', 'Blipee OS'];
    
    let foundVariations = new Set<string>();
    for (const metric of this.metrics) {
      const content = fs.readFileSync(path.join(this.projectRoot, metric.file), 'utf8');
      variations.forEach(variation => {
        if (content.includes(variation)) {
          foundVariations.add(variation);
        }
      });
    }
    
    if (foundVariations.size > 2) {
      this.issues.push({
        type: 'inconsistent',
        severity: 'medium',
        description: `Inconsistent project name usage: ${Array.from(foundVariations).join(', ')}`,
        recommendation: 'Standardize project name usage across all documentation'
      });
    }
  }

  private async validateLinksAndReferences(): Promise<void> {
    // This is a simplified link checker
    for (const metric of this.metrics) {
      const content = fs.readFileSync(path.join(this.projectRoot, metric.file), 'utf8');
      const links = content.match(/https?:\/\/[^\s)]+/g) || [];
      
      for (const link of links.slice(0, 5)) { // Limit to avoid rate limiting
        try {
          // In a real implementation, you'd make HTTP requests to check links
          // For now, just check for common broken patterns
          if (link.includes('localhost') || link.includes('127.0.0.1')) {
            this.issues.push({
              type: 'broken-link',
              severity: 'low',
              description: `Documentation contains localhost link: ${link}`,
              location: metric.file,
              recommendation: 'Replace localhost links with actual deployment URLs'
            });
          }
        } catch (error) {
          // Link checking failed
        }
      }
    }
  }

  private async generateAuditReport(): Promise<DocumentationAuditReport> {
    const totalWordCount = this.metrics.reduce((sum, m) => sum + m.wordCount, 0);
    const avgCompleteness = this.metrics.length > 0 
      ? this.metrics.reduce((sum, m) => sum + m.completeness, 0) / this.metrics.length 
      : 0;
    const avgReadability = this.metrics.length > 0 
      ? this.metrics.reduce((sum, m) => sum + m.readability, 0) / this.metrics.length 
      : 0;
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;
    
    // Calculate overall documentation score
    const documentationScore = Math.round(
      (avgCompleteness * 0.4 + avgReadability * 0.3 + (100 - (criticalIssues * 20 + highIssues * 10 + mediumIssues * 5 + lowIssues * 2)) * 0.3)
    );
    
    const missingDocumentation = this.issues
      .filter(i => i.type === 'missing')
      .map(i => i.description);
    
    const recommendations = this.generateRecommendations();
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.metrics.length,
        totalWordCount,
        averageCompleteness: Math.round(avgCompleteness),
        averageReadability: Math.round(avgReadability),
        totalIssues: this.issues.length,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
        documentationScore: Math.max(0, Math.min(100, documentationScore))
      },
      fileMetrics: this.metrics,
      missingDocumentation,
      recommendations,
      qualityGates: {
        minimumCoverage: this.metrics.length >= 5,
        apiDocumentation: this.metrics.some(m => m.type === 'api'),
        userGuides: this.metrics.some(m => m.type === 'guide' || m.type === 'readme'),
        technicalDocs: this.metrics.some(m => m.type === 'technical'),
        upToDate: this.metrics.some(m => 
          (Date.now() - m.lastModified.getTime()) / (1000 * 60 * 60 * 24) < 90
        )
      }
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) {
      recommendations.push('Address all critical documentation issues immediately');
    }
    
    if (highIssues > 0) {
      recommendations.push('Review and resolve high-priority documentation issues');
    }
    
    if (this.metrics.length < 5) {
      recommendations.push('Increase documentation coverage by adding more comprehensive guides');
    }
    
    const avgCompleteness = this.metrics.length > 0 
      ? this.metrics.reduce((sum, m) => sum + m.completeness, 0) / this.metrics.length 
      : 0;
    
    if (avgCompleteness < 70) {
      recommendations.push('Improve documentation completeness by adding missing sections');
    }
    
    const hasApiDocs = this.metrics.some(m => m.type === 'api');
    if (!hasApiDocs && fs.existsSync(path.join(this.projectRoot, 'src', 'app', 'api'))) {
      recommendations.push('Create comprehensive API documentation for existing endpoints');
    }
    
    const outdatedDocs = this.metrics.filter(m => 
      (Date.now() - m.lastModified.getTime()) / (1000 * 60 * 60 * 24) > 180
    ).length;
    
    if (outdatedDocs > 0) {
      recommendations.push(`Review and update ${outdatedDocs} outdated documentation file(s)`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Documentation quality is good - continue maintaining current standards');
    }
    
    return recommendations;
  }

  async generateReports(outputDir: string = 'test-results/documentation'): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const report = await this.auditProjectDocumentation();
    
    // Generate JSON report
    const jsonPath = path.join(outputDir, 'documentation-audit-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(outputDir, 'documentation-audit-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    // Generate Markdown summary
    const mdReport = this.generateMarkdownReport(report);
    const mdPath = path.join(outputDir, 'DOCUMENTATION_AUDIT_SUMMARY.md');
    fs.writeFileSync(mdPath, mdReport);
    
    console.log(`\n📄 Documentation audit reports generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Markdown: ${mdPath}`);
  }

  private generateHTMLReport(report: DocumentationAuditReport): string {
    const scoreColor = report.summary.documentationScore >= 80 ? '#28a745' : 
                      report.summary.documentationScore >= 60 ? '#ffc107' : '#dc3545';

    return `<!DOCTYPE html>
<html>
<head>
    <title>Documentation Audit Report - ${path.basename(this.projectRoot)}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 3em; font-weight: bold; color: ${scoreColor}; text-align: center; }
        .issue-critical { border-left: 5px solid #dc3545; }
        .issue-high { border-left: 5px solid #fd7e14; }
        .issue-medium { border-left: 5px solid #ffc107; }
        .issue-low { border-left: 5px solid #6c757d; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .metric-good { color: #28a745; }
        .metric-warning { color: #ffc107; }
        .metric-poor { color: #dc3545; }
        .quality-gate-pass { color: #28a745; font-weight: bold; }
        .quality-gate-fail { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Documentation Audit Report</h1>
        <p>${path.basename(this.projectRoot)} - Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Overall Score</h3>
            <div class="score">${report.summary.documentationScore}</div>
        </div>
        <div class="card">
            <h3>Total Files</h3>
            <h2>${report.summary.totalFiles}</h2>
            <p>${report.summary.totalWordCount.toLocaleString()} words</p>
        </div>
        <div class="card">
            <h3>Completeness</h3>
            <h2>${report.summary.averageCompleteness}%</h2>
        </div>
        <div class="card">
            <h3>Readability</h3>
            <h2>${report.summary.averageReadability}%</h2>
        </div>
        <div class="card">
            <h3>Issues</h3>
            <h2>${report.summary.totalIssues}</h2>
            <p>${report.summary.criticalIssues} critical, ${report.summary.highIssues} high</p>
        </div>
    </div>
    
    <div class="card">
        <h2>📋 Quality Gates</h2>
        <table>
            <tr>
                <td>Minimum Coverage (5+ files)</td>
                <td class="${report.qualityGates.minimumCoverage ? 'quality-gate-pass' : 'quality-gate-fail'}">
                    ${report.qualityGates.minimumCoverage ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
            <tr>
                <td>API Documentation</td>
                <td class="${report.qualityGates.apiDocumentation ? 'quality-gate-pass' : 'quality-gate-fail'}">
                    ${report.qualityGates.apiDocumentation ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
            <tr>
                <td>User Guides</td>
                <td class="${report.qualityGates.userGuides ? 'quality-gate-pass' : 'quality-gate-fail'}">
                    ${report.qualityGates.userGuides ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
            <tr>
                <td>Technical Documentation</td>
                <td class="${report.qualityGates.technicalDocs ? 'quality-gate-pass' : 'quality-gate-fail'}">
                    ${report.qualityGates.technicalDocs ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
            <tr>
                <td>Up to Date (within 90 days)</td>
                <td class="${report.qualityGates.upToDate ? 'quality-gate-pass' : 'quality-gate-fail'}">
                    ${report.qualityGates.upToDate ? '✅ PASS' : '❌ FAIL'}
                </td>
            </tr>
        </table>
    </div>
    
    <div class="card">
        <h2>📊 File Metrics</h2>
        <table>
            <thead>
                <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th>Words</th>
                    <th>Completeness</th>
                    <th>Readability</th>
                    <th>Issues</th>
                    <th>Last Modified</th>
                </tr>
            </thead>
            <tbody>
                ${report.fileMetrics.map(metric => `
                    <tr>
                        <td>${metric.file}</td>
                        <td>${metric.type}</td>
                        <td>${metric.wordCount}</td>
                        <td class="${metric.completeness >= 80 ? 'metric-good' : metric.completeness >= 60 ? 'metric-warning' : 'metric-poor'}">${metric.completeness}%</td>
                        <td class="${metric.readability >= 80 ? 'metric-good' : metric.readability >= 60 ? 'metric-warning' : 'metric-poor'}">${metric.readability}%</td>
                        <td>${metric.issues.length}</td>
                        <td>${new Date(metric.lastModified).toLocaleDateString()}</td>
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

  private generateMarkdownReport(report: DocumentationAuditReport): string {
    return `# Documentation Audit Summary

**Project**: ${path.basename(this.projectRoot)}  
**Generated**: ${new Date(report.timestamp).toLocaleString()}  
**Overall Score**: ${report.summary.documentationScore}/100

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Total Files** | ${report.summary.totalFiles} |
| **Total Words** | ${report.summary.totalWordCount.toLocaleString()} |
| **Average Completeness** | ${report.summary.averageCompleteness}% |
| **Average Readability** | ${report.summary.averageReadability}% |
| **Total Issues** | ${report.summary.totalIssues} |
| **Critical Issues** | ${report.summary.criticalIssues} |
| **High Issues** | ${report.summary.highIssues} |

## 📋 Quality Gates

| Gate | Status |
|------|--------|
| Minimum Coverage (5+ files) | ${report.qualityGates.minimumCoverage ? '✅ PASS' : '❌ FAIL'} |
| API Documentation | ${report.qualityGates.apiDocumentation ? '✅ PASS' : '❌ FAIL'} |
| User Guides | ${report.qualityGates.userGuides ? '✅ PASS' : '❌ FAIL'} |
| Technical Documentation | ${report.qualityGates.technicalDocs ? '✅ PASS' : '❌ FAIL'} |
| Up to Date | ${report.qualityGates.upToDate ? '✅ PASS' : '❌ FAIL'} |

## 🔧 Priority Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📄 Documentation Coverage

${report.fileMetrics.map(metric => 
`### ${metric.file}
- **Type**: ${metric.type}
- **Words**: ${metric.wordCount}
- **Completeness**: ${metric.completeness}%
- **Readability**: ${metric.readability}%
- **Issues**: ${metric.issues.length}
- **Last Modified**: ${new Date(metric.lastModified).toLocaleDateString()}
`).join('\n')}

---

*Generated by blipee-os Documentation Audit System*
`;
  }
}

// CLI Usage
if (require.main === module) {
  const auditor = new DocumentationAuditor();
  
  auditor.generateReports()
    .then(() => {
      console.log('🎉 Documentation audit completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Documentation audit failed:', error);
      process.exit(1);
    });
}