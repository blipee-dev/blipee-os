/**
 * Compliance Guardian Agent Tests
 */

import { ComplianceGuardianAgent } from '../compliance-guardian';
import { AgentTask } from '../agent-framework';


describe('ComplianceGuardianAgent', () => {
  let agent: ComplianceGuardianAgent;
  const mockOrgId = 'test-org-123';

  beforeEach(async () => {
    agent = new ComplianceGuardianAgent(mockOrgId);
    await agent.initialize();
  });

  describe('initialization', () => {
    it('should initialize with correct capabilities', () => {
      const capabilityNames = agent['capabilities'].map(cap => cap.name);
      expect(capabilityNames).toContain('monitor_compliance');
      expect(capabilityNames).toContain('validate_data');
      expect(capabilityNames).toContain('track_deadlines');
      expect(capabilityNames).toContain('generate_compliance_reports');
      expect(capabilityNames).toContain('detect_framework_updates');
      expect(capabilityNames).toContain('create_remediation_plans');
    });

    it('should set high autonomy level for compliance monitoring', () => {
      expect(agent['maxAutonomyLevel']).toBe(4);
    });

    it('should set hourly execution interval', () => {
      expect(agent['executionInterval']).toBe(3600000);
    });
  });

  describe('getScheduledTasks', () => {
    it('should generate scheduled compliance tasks', async () => {
      const tasks = await agent.getScheduledTasks();

      expect(tasks.length).toBeGreaterThan(0);
      
      // Should include compliance monitoring
      const complianceTask = tasks.find(t => t.type === 'monitor_compliance');
      expect(complianceTask).toBeDefined();
      expect(complianceTask?.priority).toBe('high');

      // Should include deadline tracking
      const deadlineTask = tasks.find(t => t.type === 'track_deadlines');
      expect(deadlineTask).toBeDefined();
      expect(deadlineTask?.data.lookAheadDays).toBe(30);

      // Should include data validation
      const validationTask = tasks.find(t => t.type === 'validate_data');
      expect(validationTask).toBeDefined();
      expect(validationTask?.data.frameworks).toContain('GRI');

      // Should include framework updates
      const updateTask = tasks.find(t => t.type === 'detect_framework_updates');
      expect(updateTask).toBeDefined();
    });

    it('should schedule tasks at appropriate times', async () => {
      const tasks = await agent.getScheduledTasks();
      
      tasks.forEach(task => {
        expect(new Date(task.scheduledFor)).toBeInstanceOf(Date);
        // Allow tasks to be scheduled for today or in the future (within 24 hours tolerance)
        const taskTime = new Date(task.scheduledFor).getTime();
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        expect(taskTime).toBeGreaterThanOrEqual(now - twentyFourHours);
      });
    });
  });

  describe('executeTask - monitor_compliance', () => {
    it('should successfully monitor compliance', async () => {
      const task: AgentTask = {
        id: 'test-compliance-1',
        type: 'monitor_compliance',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: {
          checkType: 'full_compliance_scan',
          frameworks: ['GRI', 'TCFD']
        },
        requiresApproval: false
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.nextSteps).toBeDefined();
      if (result.executionTimeMs !== undefined) {
        expect(result.executionTimeMs).toBeGreaterThan(0);
      }

      // Should include compliance score
      const complianceInsight = result.insights.find(i => i.includes('compliance score'));
      expect(complianceInsight).toBeDefined();
    });

    it('should handle compliance monitoring errors', async () => {
      const task: AgentTask = {
        id: 'test-error-1',
        type: 'monitor_compliance',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: {}, // Invalid data to trigger error
        requiresApproval: false
      };

      // Test with invalid data structure to trigger error handling

      const result = await agent.executeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.nextSteps).toContain('Review compliance monitoring configuration');
    });
  });

  describe('executeTask - validate_data', () => {
    it('should validate data successfully', async () => {
      const task: AgentTask = {
        id: 'test-validation-1',
        type: 'validate_data',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: {
          validationType: 'comprehensive',
          frameworks: ['GRI', 'TCFD']
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();
      
      // Should include data quality score
      const qualityInsight = result.insights.find(i => i.includes('Data quality score'));
      expect(qualityInsight).toBeDefined();

      // Should include total validation errors
      const errorsInsight = result.insights.find(i => i.includes('Total validation errors'));
      expect(errorsInsight).toBeDefined();
    });

    it('should provide remediation steps when validation errors found', async () => {
      // Test validation without mocking - the agent will handle validation internally

      const task: AgentTask = {
        id: 'test-validation-errors',
        type: 'validate_data',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: { frameworks: ['GRI'] }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.nextSteps).toContain('Review validation errors with data collection team');
      expect(result.actions.length).toBeGreaterThan(0);
    });
  });

  describe('executeTask - track_deadlines', () => {
    it('should track upcoming deadlines', async () => {
      const task: AgentTask = {
        id: 'test-deadlines-1',
        type: 'track_deadlines',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: {
          lookAheadDays: 30,
          urgentThreshold: 7
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();
      expect(result.metadata?.upcoming_deadlines).toBeDefined();
      expect(result.metadata?.urgent_deadlines).toBeDefined();
      expect(result.metadata?.overdue_deadlines).toBeDefined();
    });

    it('should alert on urgent deadlines', async () => {
      // Mock urgent deadlines
      jest.spyOn(agent as any, 'getUpcomingDeadlines').mockResolvedValue([
        {
          id: 'urgent-deadline',
          framework: 'GRI',
          reportType: 'Annual Report',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          frequency: 'annual',
          status: 'upcoming',
          daysUntilDue: 3
        }
      ]);

      const task: AgentTask = {
        id: 'test-urgent-deadlines',
        type: 'track_deadlines',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: { urgentThreshold: 7 }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.insights.some(i => i.includes('require immediate attention'))).toBe(true);
      expect(result.actions.some(a => a.type === 'urgent_deadlines_notification')).toBe(true);
    });
  });

  describe('executeTask - generate_compliance_reports', () => {
    it('should generate comprehensive compliance report', async () => {
      const task: AgentTask = {
        id: 'test-report-1',
        type: 'generate_compliance_reports',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: {
          reportType: 'comprehensive',
          frameworks: ['GRI', 'TCFD']
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'compliance_report_generated')).toBe(true);
      expect(result.insights.some(i => i.includes('Compliance report generated'))).toBe(true);
      expect(result.nextSteps).toContain('Review compliance report with sustainability team');
      expect(result.metadata?.report_id).toBeDefined();
    });
  });

  describe('executeTask - detect_framework_updates', () => {
    it('should detect framework updates', async () => {
      const task: AgentTask = {
        id: 'test-updates-1',
        type: 'detect_framework_updates',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: {
          checkSources: ['GRI', 'TCFD', 'SASB']
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.sources_checked).toBe(3);
      expect(result.metadata?.updates_found).toBeDefined();
    });
  });

  describe('executeTask - create_remediation_plans', () => {
    it('should create remediation plan for compliance issues', async () => {
      const mockIssues = [
        {
          id: 'issue-1',
          severity: 'high',
          actionRequired: 'Collect missing scope 3 data',
          estimatedEffort: '8 hours'
        },
        {
          id: 'issue-2',
          severity: 'medium',
          actionRequired: 'Fix validation errors',
          estimatedEffort: '4 hours'
        }
      ];

      const task: AgentTask = {
        id: 'test-remediation-1',
        type: 'create_remediation_plans',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: { issues: mockIssues }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'remediation_plan_created')).toBe(true);
      expect(result.insights.some(i => i.includes('Remediation plan created'))).toBe(true);
      expect(result.nextSteps).toContain('Review remediation plan with team');
      expect(result.metadata?.plan_id).toBeDefined();
    });
  });

  describe('learn', () => {
    it('should store learning patterns', async () => {
      const mockResult = {
        success: true,
        executionTimeMs: 1500,
        actions: [{ type: 'test', description: 'test action', timestamp: new Date().toISOString() }],
        insights: ['Test insight 1', 'Test insight 2'],
        nextSteps: ['Test next step']
      };

      const storePatternSpy = jest.spyOn(agent as any, 'storePattern').mockResolvedValue(undefined);

      await agent.learn(mockResult);

      expect(storePatternSpy).toHaveBeenCalledWith(
        'compliance_monitoring',
        expect.objectContaining({
          task_success_rate: 1,
          execution_efficiency: 1500,
          insights_quality: 2,
          action_effectiveness: 1
        }),
        0.9,
        expect.objectContaining({
          task_type: 'compliance_guardian_task'
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle unknown task types', async () => {
      const task: AgentTask = {
        id: 'test-unknown',
        type: 'unknown_task_type' as any,
        scheduledFor: new Date().toISOString(),
        priority: 'low',
        data: {}
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task type');
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it('should log errors properly', async () => {
      const logErrorSpy = jest.spyOn(agent as any, 'logError').mockResolvedValue(undefined);
      
      const task: AgentTask = {
        id: 'test-error',
        type: 'unknown_task_type' as any,
        scheduledFor: new Date().toISOString(),
        priority: 'low',
        data: {}
      };

      await agent.executeTask(task);

      expect(logErrorSpy).toHaveBeenCalledWith(
        'test-error',
        expect.any(Error),
        expect.any(Number)
      );
    });
  });

  describe('compliance calculations', () => {
    it('should calculate compliance score correctly', () => {
      const score1 = agent['calculateComplianceScore'](5, 0); // No alerts
      expect(score1).toBe(100);

      const score2 = agent['calculateComplianceScore'](5, 2); // 2 alerts
      expect(score2).toBe(80);

      const score3 = agent['calculateComplianceScore'](5, 15); // Many alerts
      expect(score3).toBe(0); // Should not go below 0
    });

    it('should prioritize issues correctly', () => {
      const issues = [
        { id: '1', severity: 'low' },
        { id: '2', severity: 'critical' },
        { id: '3', severity: 'medium' },
        { id: '4', severity: 'high' }
      ];

      const prioritized = agent['prioritizeIssues'](issues);

      expect(prioritized[0].severity).toBe('critical');
      expect(prioritized[1].severity).toBe('high');
      expect(prioritized[2].severity).toBe('medium');
      expect(prioritized[3].severity).toBe('low');
    });
  });

  describe('integration scenarios', () => {
    it('should handle end-to-end compliance monitoring scenario', async () => {
      // Simulate a full compliance monitoring cycle
      const tasks = await agent.getScheduledTasks();
      const complianceTask = tasks.find(t => t.type === 'monitor_compliance');
      
      if (complianceTask) {
        const result = await agent.executeTask(complianceTask);
        expect(result.success).toBe(true);
        
        // Learn from the result
        await agent.learn(result);
        
        // Should have generated insights and actions
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.nextSteps.length).toBeGreaterThan(0);
      }
    });

    it('should handle multiple framework compliance checks', async () => {
      const task: AgentTask = {
        id: 'multi-framework-test',
        type: 'monitor_compliance',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: {
          frameworks: ['GRI', 'TCFD', 'SASB', 'EU_Taxonomy']
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.frameworks_checked).toBe(4);
    });
  });
});