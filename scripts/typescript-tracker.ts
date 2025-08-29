#!/usr/bin/env tsx

/**
 * TypeScript Error Tracker & Progress Monitor
 * 
 * This script provides automated tracking and reporting for the
 * TypeScript modernization initiative running parallel with Phase 3-5.
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  category: 'ai' | 'api' | 'component' | 'database' | 'test' | 'other';
}

interface DailyProgress {
  date: string;
  errorsFixed: number;
  filesModified: string[];
  keyIssues: string[];
  notes: string;
  totalErrors: number;
}

interface WeeklyProgress {
  week: number;
  phase: number;
  target: number;
  completed: number;
  percentDone: number;
  filesModified: number;
  blocked: number;
  notes: string;
}

class TypeScriptTracker {
  private readonly trackingFile = './TYPESCRIPT_PROGRESS.json';
  private readonly planFile = './TYPESCRIPT_MODERNIZATION_PLAN.md';

  constructor() {
    this.ensureTrackingFile();
  }

  /**
   * Get current TypeScript error count and categorize them
   */
  async getCurrentErrors(): Promise<TypeScriptError[]> {
    try {
      console.log('🔍 Running TypeScript compiler to count current errors...');
      
      const output = execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      
      return this.parseTypeScriptErrors(output);
    } catch (error: any) {
      // TypeScript errors cause execSync to throw, but we want the output
      if (error.stdout) {
        return this.parseTypeScriptErrors(error.stdout);
      }
      console.error('❌ Failed to run TypeScript compiler:', error.message);
      return [];
    }
  }

  /**
   * Parse TypeScript compiler output into structured errors
   */
  private parseTypeScriptErrors(output: string): TypeScriptError[] {
    const errors: TypeScriptError[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Match TypeScript error format: file(line,col): error TSxxxx: message
      const match = line.match(/^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        const [, file, line, column, code, message] = match;
        errors.push({
          file: file.trim(),
          line: parseInt(line),
          column: parseInt(column),
          code,
          message: message.trim(),
          category: this.categorizeError(file, message)
        });
      }
    }

    return errors;
  }

  /**
   * Categorize error based on file path and error message
   */
  private categorizeError(file: string, message: string): TypeScriptError['category'] {
    if (file.includes('/ai/') || file.includes('ai-')) return 'ai';
    if (file.includes('/api/') || file.includes('route.ts')) return 'api';
    if (file.includes('/components/')) return 'component';
    if (file.includes('/lib/') && message.includes('supabase')) return 'database';
    if (file.includes('.test.') || file.includes('/tests/')) return 'test';
    return 'other';
  }

  /**
   * Log daily progress
   */
  async logDailyProgress(errorsFixed: number, filesModified: string[], keyIssues: string[], notes: string) {
    const errors = await this.getCurrentErrors();
    const progress = this.loadProgress();
    
    const dailyEntry: DailyProgress = {
      date: new Date().toISOString().split('T')[0],
      errorsFixed,
      filesModified,
      keyIssues,
      notes,
      totalErrors: errors.length
    };

    progress.daily = progress.daily || [];
    progress.daily.push(dailyEntry);
    
    this.saveProgress(progress);
    this.updatePlanFile(errors.length);
    
    console.log(`✅ Daily progress logged: ${errorsFixed} errors fixed, ${errors.length} remaining`);
  }

  /**
   * Log weekly summary
   */
  logWeeklySummary(week: number, phase: number, target: number, completed: number, filesModified: number, blocked: number, notes: string) {
    const progress = this.loadProgress();
    
    const weeklyEntry: WeeklyProgress = {
      week,
      phase,
      target,
      completed,
      percentDone: Math.round((completed / target) * 100),
      filesModified,
      blocked,
      notes
    };

    progress.weekly = progress.weekly || [];
    progress.weekly.push(weeklyEntry);
    
    this.saveProgress(progress);
    console.log(`✅ Weekly summary logged: Week ${week}, ${completed}/${target} errors fixed (${weeklyEntry.percentDone}%)`);
  }

  /**
   * Generate comprehensive status report
   */
  async generateStatusReport(): Promise<string> {
    const errors = await this.getCurrentErrors();
    const progress = this.loadProgress();
    
    const totalOriginalErrors = 2740;
    const currentErrors = errors.length;
    const fixedErrors = totalOriginalErrors - currentErrors;
    const overallProgress = Math.round((fixedErrors / totalOriginalErrors) * 100);

    // Error breakdown by category
    const breakdown = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const report = `
# TypeScript Modernization Status Report

**Generated**: ${new Date().toISOString()}

## Overall Progress
- **Total Errors Fixed**: ${fixedErrors}/${totalOriginalErrors}
- **Overall Progress**: ${overallProgress}%
- **Remaining Errors**: ${currentErrors}

## Error Breakdown by Category
${Object.entries(breakdown)
  .sort(([,a], [,b]) => b - a)
  .map(([category, count]) => `- **${category}**: ${count} errors`)
  .join('\n')}

## Recent Progress
${progress.daily?.slice(-5).map(day => 
  `- **${day.date}**: ${day.errorsFixed} fixed (${day.totalErrors} remaining)`
).join('\n') || 'No recent progress logged'}

## Weekly Summary
${progress.weekly?.slice(-3).map(week => 
  `- **Week ${week.week}**: ${week.completed}/${week.target} (${week.percentDone}%)`
).join('\n') || 'No weekly progress logged'}

## Top Error Files
${this.getTopErrorFiles(errors, 10)
  .map(([file, count]) => `- **${file}**: ${count} errors`)
  .join('\n')}
`;

    return report;
  }

  /**
   * Get files with most errors
   */
  private getTopErrorFiles(errors: TypeScriptError[], limit: number): [string, number][] {
    const fileCount = errors.reduce((acc, error) => {
      acc[error.file] = (acc[error.file] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(fileCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
  }

  /**
   * Update the plan file with current progress
   */
  private updatePlanFile(currentErrors: number) {
    if (!existsSync(this.planFile)) return;

    try {
      let content = readFileSync(this.planFile, 'utf8');
      const totalFixed = 2740 - currentErrors;
      const percentage = Math.round((totalFixed / 2740) * 100);
      
      // Update the progress line
      const progressLine = `**Total Progress**: ${totalFixed}/2740 errors fixed (${percentage}%)`;
      content = content.replace(/\*\*Total Progress\*\*:.*/, progressLine);
      
      writeFileSync(this.planFile, content, 'utf8');
    } catch (error) {
      console.error('⚠️ Failed to update plan file:', error);
    }
  }

  /**
   * Initialize tracking file if it doesn't exist
   */
  private ensureTrackingFile() {
    if (!existsSync(this.trackingFile)) {
      this.saveProgress({ daily: [], weekly: [] });
    }
  }

  /**
   * Load progress from tracking file
   */
  private loadProgress(): { daily: DailyProgress[], weekly: WeeklyProgress[] } {
    try {
      const content = readFileSync(this.trackingFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return { daily: [], weekly: [] };
    }
  }

  /**
   * Save progress to tracking file
   */
  private saveProgress(progress: { daily: DailyProgress[], weekly: WeeklyProgress[] }) {
    writeFileSync(this.trackingFile, JSON.stringify(progress, null, 2));
  }

  /**
   * Generate automated daily standup report
   */
  async generateStandupReport(): Promise<string> {
    const errors = await this.getCurrentErrors();
    const progress = this.loadProgress();
    const lastDay = progress.daily?.[progress.daily.length - 1];
    
    if (!lastDay) {
      return `
🚀 **TypeScript Modernization Standup**

**Yesterday**: No progress logged yet
**Today**: Getting started with error analysis
**Blockers**: None
**Total Remaining**: ${errors.length} errors
`;
    }

    return `
🚀 **TypeScript Modernization Standup**

**Yesterday**: Fixed ${lastDay.errorsFixed} errors in ${lastDay.filesModified.length} files
**Today**: Continuing with ${lastDay.notes || 'systematic error resolution'}
**Blockers**: ${lastDay.keyIssues.length > 0 ? lastDay.keyIssues.join(', ') : 'None'}
**Total Remaining**: ${errors.length} errors
`;
  }
}

// CLI Interface
async function main() {
  const tracker = new TypeScriptTracker();
  const command = process.argv[2];

  switch (command) {
    case 'status':
      console.log(await tracker.generateStatusReport());
      break;
    
    case 'count':
      const errors = await tracker.getCurrentErrors();
      console.log(`Current TypeScript errors: ${errors.length}`);
      break;
    
    case 'daily':
      const errorsFixed = parseInt(process.argv[3]) || 0;
      const files = process.argv[4]?.split(',') || [];
      const issues = process.argv[5]?.split(',') || [];
      const notes = process.argv[6] || '';
      await tracker.logDailyProgress(errorsFixed, files, issues, notes);
      break;
    
    case 'weekly':
      const week = parseInt(process.argv[3]);
      const phase = parseInt(process.argv[4]);
      const target = parseInt(process.argv[5]);
      const completed = parseInt(process.argv[6]);
      const filesModified = parseInt(process.argv[7]) || 0;
      const blocked = parseInt(process.argv[8]) || 0;
      const weekNotes = process.argv[9] || '';
      tracker.logWeeklySummary(week, phase, target, completed, filesModified, blocked, weekNotes);
      break;
    
    case 'standup':
      console.log(await tracker.generateStandupReport());
      break;
    
    default:
      console.log(`
TypeScript Tracker Usage:

  tsx scripts/typescript-tracker.ts status    - Generate full status report
  tsx scripts/typescript-tracker.ts count     - Count current errors
  tsx scripts/typescript-tracker.ts daily <fixed> <files> <issues> <notes>
  tsx scripts/typescript-tracker.ts weekly <week> <phase> <target> <completed> <files> <blocked> <notes>
  tsx scripts/typescript-tracker.ts standup   - Generate standup report
`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { TypeScriptTracker };