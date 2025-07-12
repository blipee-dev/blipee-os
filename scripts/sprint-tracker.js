#!/usr/bin/env node

/**
 * Sprint Tracker - Generate sprint reports and track progress
 * Usage: node sprint-tracker.js [command] [options]
 * 
 * Commands:
 *   status - Show current sprint status
 *   update - Update sprint metrics
 *   report - Generate sprint report
 *   complete - Mark sprint as complete
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TRACKER_FILE = path.join(__dirname, '../docs/retail-integration/IMPLEMENTATION_PLAN_AND_TRACKER.md');
const REPORTS_DIR = path.join(__dirname, '../docs/retail-integration/sprint-reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Parse command line arguments
const command = process.argv[2];
const sprintNumber = process.argv[3];

// Sprint data structure
class SprintTracker {
  constructor() {
    this.data = this.loadTrackerData();
  }

  loadTrackerData() {
    // In a real implementation, this would parse the markdown file
    // For now, we'll use a JSON structure
    const dataFile = path.join(REPORTS_DIR, 'sprint-data.json');
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
    
    // Initialize with empty data
    return {
      currentSprint: 1,
      sprints: {
        1: { status: 'Not Started', points: 45, completed: 0, coverage: 0, bugs: 0, fixed: 0 },
        2: { status: 'Not Started', points: 45, completed: 0, coverage: 0, bugs: 0, fixed: 0 },
        3: { status: 'Not Started', points: 53, completed: 0, coverage: 0, bugs: 0, fixed: 0 },
        4: { status: 'Not Started', points: 58, completed: 0, coverage: 0, bugs: 0, fixed: 0 },
        5: { status: 'Not Started', points: 52, completed: 0, coverage: 0, bugs: 0, fixed: 0 },
        6: { status: 'Not Started', points: 52, completed: 0, coverage: 0, bugs: 0, fixed: 0 },
      }
    };
  }

  saveData() {
    const dataFile = path.join(REPORTS_DIR, 'sprint-data.json');
    fs.writeFileSync(dataFile, JSON.stringify(this.data, null, 2));
  }

  getCurrentSprint() {
    return this.data.sprints[this.data.currentSprint];
  }

  updateSprintMetrics(sprintNum, metrics) {
    if (!this.data.sprints[sprintNum]) {
      console.error(`Sprint ${sprintNum} not found`);
      return;
    }

    Object.assign(this.data.sprints[sprintNum], metrics);
    this.saveData();
  }

  generateStatus() {
    const sprint = this.getCurrentSprint();
    const sprintNum = this.data.currentSprint;

    console.log(`
╔═══════════════════════════════════════════════════════╗
║              SPRINT ${sprintNum} STATUS REPORT              ║
╚═══════════════════════════════════════════════════════╝

Status: ${sprint.status}
Progress: ${sprint.completed}/${sprint.points} story points (${Math.round(sprint.completed/sprint.points * 100)}%)
Test Coverage: ${sprint.coverage}%
Bugs: ${sprint.bugs} found, ${sprint.fixed} fixed

${this.generateProgressBar(sprint.completed, sprint.points)}

Next Steps:
- ${sprint.status === 'Not Started' ? 'Begin sprint planning' : ''}
- ${sprint.status === 'In Progress' ? 'Continue development' : ''}
- ${sprint.status === 'Testing' ? 'Complete test phase' : ''}
- ${sprint.status === 'Completed' ? 'Move to next sprint' : ''}
    `);
  }

  generateProgressBar(completed, total) {
    const percentage = Math.round((completed / total) * 100);
    const filled = Math.floor(percentage / 2);
    const empty = 50 - filled;
    
    return `Progress: [${'█'.repeat(filled)}${' '.repeat(empty)}] ${percentage}%`;
  }

  generateReport(sprintNum) {
    const sprint = this.data.sprints[sprintNum];
    if (!sprint) {
      console.error(`Sprint ${sprintNum} not found`);
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const reportFile = path.join(REPORTS_DIR, `sprint-${sprintNum}-report-${timestamp}.md`);

    const report = `# Sprint ${sprintNum} Report

Generated: ${new Date().toLocaleString()}

## Executive Summary

Sprint ${sprintNum} ${sprint.status === 'Completed' ? 'has been completed' : 'is currently ' + sprint.status}.

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Story Points | ${sprint.completed}/${sprint.points} | ${sprint.points} | ${sprint.completed >= sprint.points ? '✅' : '⚠️'} |
| Test Coverage | ${sprint.coverage}% | 90% | ${sprint.coverage >= 90 ? '✅' : '❌'} |
| Bugs Found | ${sprint.bugs} | - | - |
| Bugs Fixed | ${sprint.fixed} | ${sprint.bugs} | ${sprint.fixed >= sprint.bugs ? '✅' : '⚠️'} |

## Test Results

\`\`\`
Unit Tests: ${sprint.unitTests || 'N/A'}
Integration Tests: ${sprint.integrationTests || 'N/A'}
E2E Tests: ${sprint.e2eTests || 'N/A'}
Overall Coverage: ${sprint.coverage}%
\`\`\`

## Sprint Velocity

\`\`\`
Planned: ${sprint.points} points
Completed: ${sprint.completed} points
Velocity: ${sprint.completed / 10} points/day
\`\`\`

## Quality Gates

- [${sprint.coverage >= 90 ? 'x' : ' '}] Test coverage ≥ 90%
- [${sprint.bugs === sprint.fixed ? 'x' : ' '}] All bugs fixed
- [${sprint.completed >= sprint.points ? 'x' : ' '}] All stories completed
- [${sprint.status === 'Completed' ? 'x' : ' '}] Sprint retrospective done

## Recommendations

${this.generateRecommendations(sprint)}

---
*Report generated by sprint-tracker.js*
`;

    fs.writeFileSync(reportFile, report);
    console.log(`✅ Report generated: ${reportFile}`);
    return reportFile;
  }

  generateRecommendations(sprint) {
    const recommendations = [];

    if (sprint.coverage < 90) {
      recommendations.push('- Increase test coverage to meet 90% threshold');
    }
    if (sprint.bugs > sprint.fixed) {
      recommendations.push(`- Fix remaining ${sprint.bugs - sprint.fixed} bugs before sprint completion`);
    }
    if (sprint.completed < sprint.points) {
      recommendations.push('- Review incomplete stories and carry over to next sprint');
    }
    if (sprint.velocity < 4) {
      recommendations.push('- Consider reducing sprint scope or increasing resources');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- Sprint is on track!';
  }

  updateFromTestResults() {
    try {
      // Try to read test results from the sprint test script output
      const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        const overallCoverage = Math.round(coverage.total.lines.pct);
        
        this.updateSprintMetrics(this.data.currentSprint, {
          coverage: overallCoverage
        });
        
        console.log(`✅ Updated coverage: ${overallCoverage}%`);
      }
    } catch (error) {
      console.warn('Could not read test results:', error.message);
    }
  }

  completeSprint(sprintNum) {
    const sprint = this.data.sprints[sprintNum];
    if (!sprint) {
      console.error(`Sprint ${sprintNum} not found`);
      return;
    }

    // Check if sprint can be completed
    if (sprint.coverage < 90) {
      console.error('❌ Cannot complete sprint: Test coverage below 90%');
      return;
    }

    if (sprint.bugs > sprint.fixed) {
      console.error(`❌ Cannot complete sprint: ${sprint.bugs - sprint.fixed} bugs remain unfixed`);
      return;
    }

    // Mark as completed
    sprint.status = 'Completed';
    sprint.completedDate = new Date().toISOString();
    
    // Generate final report
    const reportPath = this.generateReport(sprintNum);
    
    // Update current sprint if needed
    if (this.data.currentSprint === sprintNum && sprintNum < 6) {
      this.data.currentSprint = sprintNum + 1;
      this.data.sprints[sprintNum + 1].status = 'Planning';
    }

    this.saveData();

    console.log(`
✅ Sprint ${sprintNum} completed successfully!

Final Metrics:
- Story Points: ${sprint.completed}/${sprint.points}
- Test Coverage: ${sprint.coverage}%
- Bugs Fixed: ${sprint.fixed}/${sprint.bugs}

Report saved to: ${reportPath}

${sprintNum < 6 ? `Next sprint (${sprintNum + 1}) is now in planning phase.` : '🎉 All sprints completed! Project ready for launch!'}
    `);
  }
}

// Command handlers
const tracker = new SprintTracker();

switch (command) {
  case 'status':
    tracker.generateStatus();
    break;

  case 'update':
    if (!sprintNumber) {
      console.error('Please specify sprint number: node sprint-tracker.js update [sprint-number]');
      process.exit(1);
    }
    
    // Interactive update
    console.log(`Updating Sprint ${sprintNumber} metrics...`);
    tracker.updateFromTestResults();
    break;

  case 'report':
    const reportSprint = sprintNumber || tracker.data.currentSprint;
    tracker.generateReport(reportSprint);
    break;

  case 'complete':
    if (!sprintNumber) {
      console.error('Please specify sprint number: node sprint-tracker.js complete [sprint-number]');
      process.exit(1);
    }
    tracker.completeSprint(parseInt(sprintNumber));
    break;

  case 'set':
    // Set specific metrics
    // Example: node sprint-tracker.js set 1 completed=35 bugs=5 fixed=5
    if (!sprintNumber) {
      console.error('Please specify sprint number');
      process.exit(1);
    }
    
    const metrics = {};
    for (let i = 4; i < process.argv.length; i++) {
      const [key, value] = process.argv[i].split('=');
      metrics[key] = isNaN(value) ? value : parseInt(value);
    }
    
    tracker.updateSprintMetrics(parseInt(sprintNumber), metrics);
    console.log(`✅ Updated Sprint ${sprintNumber}:`, metrics);
    break;

  default:
    console.log(`
Sprint Tracker - Retail Intelligence Platform

Usage: node sprint-tracker.js [command] [options]

Commands:
  status              Show current sprint status
  update [sprint]     Update sprint metrics from test results
  report [sprint]     Generate sprint report (defaults to current)
  complete [sprint]   Mark sprint as complete
  set [sprint] k=v    Set specific metrics (e.g., set 1 completed=35)

Examples:
  node sprint-tracker.js status
  node sprint-tracker.js update 1
  node sprint-tracker.js report 1
  node sprint-tracker.js complete 1
  node sprint-tracker.js set 1 completed=35 coverage=92 bugs=3 fixed=3
    `);
}