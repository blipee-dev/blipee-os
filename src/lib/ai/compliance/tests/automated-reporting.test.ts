/**
 * Automated Reporting Engine Test Suite
 *
 * Tests for the automated compliance reporting and submission system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutomatedReportingEngine } from '../reporting/automated-reporting-engine';
import { ReportTemplate, ReportGeneration, ReportSubmission } from '../types';

const TEST_ORG_ID = 'test-org-reporting';

// Mock report template
const mockReportTemplate: ReportTemplate = {
  id: 'sec-climate-template',
  frameworkCode: 'SEC_CLIMATE',
  name: 'SEC Climate Risk Disclosure Report',
  description: 'Standard SEC climate risk disclosure report template',
  version: '1.0',
  sections: [
    {
      id: 'governance',
      title: 'Governance',
      order: 1,
      required: true,
      subsections: [
        {
          id: 'board-oversight',
          title: 'Board Oversight',
          order: 1,
          dataRequirements: ['governance_structure', 'board_expertise'],
          template: 'Describe the board\'s oversight of climate-related risks and opportunities.'
        }
      ]
    },
    {
      id: 'strategy',
      title: 'Strategy',
      order: 2,
      required: true,
      subsections: [
        {
          id: 'climate-risks',
          title: 'Climate-related Risks',
          order: 1,
          dataRequirements: ['risk_assessment', 'scenario_analysis'],
          template: 'Describe climate-related risks and their impact on strategy.'
        }
      ]
    }
  ],
  outputFormats: ['PDF', 'Word', 'HTML'],
  complianceRequirements: {
    deadlines: ['annual'],
    mandatoryFields: ['governance', 'strategy'],
    validationRules: ['completeness', 'accuracy']
  },
  metadata: {
    createdBy: 'system',
    createdAt: new Date(),
    lastModified: new Date(),
    tags: ['sec', 'climate', 'mandatory']
  }
};

// Mock compliance data
const mockComplianceData = {
  organizationProfile: {
    name: 'Test Corporation',
    industry: 'Technology',
    size: 'Large',
    ticker: 'TEST'
  },
  governance: {
    boardOversight: 'The board provides oversight through quarterly reviews...',
    climateExpertise: 'Board includes members with climate expertise...',
    executiveCompensation: 'Climate metrics are integrated into executive compensation...'
  },
  strategy: {
    climateRisks: 'Physical and transition risks have been identified...',
    opportunities: 'Energy efficiency and renewable energy opportunities...',
    scenarioAnalysis: 'Analysis conducted using 1.5°C, 2°C, and 3°C scenarios...'
  },
  riskManagement: {
    processes: 'Climate risks are integrated into enterprise risk management...',
    assessment: 'Risks are assessed quarterly using standardized frameworks...'
  },
  metrics: {
    ghgEmissions: {
      scope1: 1000,
      scope2: 2000,
      scope3: 5000
    },
    targets: 'Science-based targets set for 2030 and 2050...'
  }
};

describe('AutomatedReportingEngine', () => {
  let reportingEngine: AutomatedReportingEngine;

  beforeEach(() => {
    reportingEngine = new AutomatedReportingEngine(TEST_ORG_ID);
  });

  describe('Template Management', () => {
    it('should create report template', async () => {
      const templateId = await reportingEngine.createTemplate(mockReportTemplate);

      expect(templateId).toBeDefined();
      expect(templateId).toBe(mockReportTemplate.id);
    });

    it('should get report template', async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
      const template = await reportingEngine.getTemplate(mockReportTemplate.id);

      expect(template).toBeDefined();
      expect(template?.id).toBe(mockReportTemplate.id);
      expect(template?.frameworkCode).toBe('SEC_CLIMATE');
      expect(template?.sections.length).toBe(2);
    });

    it('should update report template', async () => {
      await reportingEngine.createTemplate(mockReportTemplate);

      const updatedTemplate = {
        ...mockReportTemplate,
        description: 'Updated description'
      };

      await reportingEngine.updateTemplate(mockReportTemplate.id, updatedTemplate);
      const template = await reportingEngine.getTemplate(mockReportTemplate.id);

      expect(template?.description).toBe('Updated description');
    });

    it('should delete report template', async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
      await reportingEngine.deleteTemplate(mockReportTemplate.id);

      const template = await reportingEngine.getTemplate(mockReportTemplate.id);
      expect(template).toBeNull();
    });

    it('should list templates for framework', async () => {
      await reportingEngine.createTemplate(mockReportTemplate);

      const templates = await reportingEngine.getTemplatesForFramework('SEC_CLIMATE');

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].frameworkCode).toBe('SEC_CLIMATE');
    });

    it('should validate template structure', async () => {
      const invalidTemplate = {
        ...mockReportTemplate,
        sections: [] // Missing required sections
      };

      await expect(reportingEngine.createTemplate(invalidTemplate)).rejects.toThrow();
    });
  });

  describe('Report Generation', () => {
    beforeEach(async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
    });

    it('should generate report from template', async () => {
      const reportGeneration = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      expect(reportGeneration).toBeDefined();
      expect(reportGeneration.reportId).toBeDefined();
      expect(reportGeneration.templateId).toBe(mockReportTemplate.id);
      expect(reportGeneration.format).toBe('PDF');
      expect(reportGeneration.status).toBe('completed');
      expect(reportGeneration.content).toBeDefined();
    });

    it('should support multiple output formats', async () => {
      const formats = ['PDF', 'Word', 'HTML'];

      for (const format of formats) {
        const report = await reportingEngine.generateReport(
          mockReportTemplate.id,
          format as any,
          mockComplianceData
        );

        expect(report.format).toBe(format);
        expect(report.content).toBeDefined();
      }
    });

    it('should handle missing data gracefully', async () => {
      const incompleteData = {
        organizationProfile: mockComplianceData.organizationProfile,
        governance: {} // Missing required data
      };

      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        incompleteData
      );

      expect(report.status).toBe('completed_with_warnings');
      expect(report.warnings).toBeInstanceOf(Array);
      expect(report.warnings!.length).toBeGreaterThan(0);
    });

    it('should validate data against template requirements', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      expect(report.validationResults).toBeDefined();
      expect(report.validationResults?.isValid).toBe(true);
      expect(report.validationResults?.errors).toBeInstanceOf(Array);
    });

    it('should generate unique report IDs', async () => {
      const report1 = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const report2 = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      expect(report1.reportId).not.toBe(report2.reportId);
    });

    it('should include metadata in generated reports', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      expect(report.metadata).toBeDefined();
      expect(report.metadata?.generatedAt).toBeInstanceOf(Date);
      expect(report.metadata?.organizationId).toBe(TEST_ORG_ID);
      expect(report.metadata?.frameworkCode).toBe('SEC_CLIMATE');
    });
  });

  describe('Report History and Versioning', () => {
    beforeEach(async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
    });

    it('should maintain report history', async () => {
      // Generate multiple reports
      await reportingEngine.generateReport(mockReportTemplate.id, 'PDF', mockComplianceData);
      await reportingEngine.generateReport(mockReportTemplate.id, 'Word', mockComplianceData);

      const history = await reportingEngine.getReportHistory('SEC_CLIMATE', 30);

      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(2);
      history.forEach(report => {
        expect(report.reportId).toBeDefined();
        expect(report.templateId).toBe(mockReportTemplate.id);
      });
    });

    it('should get specific report by ID', async () => {
      const generatedReport = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const retrievedReport = await reportingEngine.getReport(generatedReport.reportId);

      expect(retrievedReport).toBeDefined();
      expect(retrievedReport?.reportId).toBe(generatedReport.reportId);
      expect(retrievedReport?.content).toBeDefined();
    });

    it('should support report versioning', async () => {
      const v1Report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      // Simulate updated data
      const updatedData = {
        ...mockComplianceData,
        governance: {
          ...mockComplianceData.governance,
          boardOversight: 'Updated board oversight description...'
        }
      };

      const v2Report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        updatedData
      );

      expect(v1Report.reportId).not.toBe(v2Report.reportId);
      expect(v1Report.content).not.toBe(v2Report.content);
    });
  });

  describe('Scheduled Report Generation', () => {
    beforeEach(async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
    });

    it('should schedule recurring reports', async () => {
      const schedule = {
        templateId: mockReportTemplate.id,
        frequency: 'quarterly' as const,
        format: 'PDF' as const,
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        enabled: true,
        recipients: ['compliance@test.com']
      };

      const scheduleId = await reportingEngine.scheduleReport(schedule);

      expect(scheduleId).toBeDefined();
    });

    it('should list scheduled reports', async () => {
      const schedule = {
        templateId: mockReportTemplate.id,
        frequency: 'monthly' as const,
        format: 'PDF' as const,
        nextRun: new Date(),
        enabled: true,
        recipients: ['test@example.com']
      };

      await reportingEngine.scheduleReport(schedule);
      const schedules = await reportingEngine.getScheduledReports();

      expect(schedules).toBeInstanceOf(Array);
      expect(schedules.length).toBeGreaterThan(0);
    });

    it('should update scheduled reports', async () => {
      const schedule = {
        templateId: mockReportTemplate.id,
        frequency: 'monthly' as const,
        format: 'PDF' as const,
        nextRun: new Date(),
        enabled: true,
        recipients: ['test@example.com']
      };

      const scheduleId = await reportingEngine.scheduleReport(schedule);

      await reportingEngine.updateSchedule(scheduleId, {
        ...schedule,
        frequency: 'quarterly'
      });

      const schedules = await reportingEngine.getScheduledReports();
      const updated = schedules.find(s => s.id === scheduleId);

      expect(updated?.frequency).toBe('quarterly');
    });

    it('should disable scheduled reports', async () => {
      const schedule = {
        templateId: mockReportTemplate.id,
        frequency: 'annual' as const,
        format: 'PDF' as const,
        nextRun: new Date(),
        enabled: true,
        recipients: ['test@example.com']
      };

      const scheduleId = await reportingEngine.scheduleReport(schedule);
      await reportingEngine.disableSchedule(scheduleId);

      const schedules = await reportingEngine.getScheduledReports();
      const disabled = schedules.find(s => s.id === scheduleId);

      expect(disabled?.enabled).toBe(false);
    });
  });

  describe('Report Approval Workflow', () => {
    beforeEach(async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
    });

    it('should create approval workflow', async () => {
      const workflow = {
        name: 'SEC Climate Report Approval',
        frameworkCode: 'SEC_CLIMATE',
        steps: [
          {
            stepId: 'review',
            name: 'Initial Review',
            assignees: ['reviewer@test.com'],
            required: true,
            timeoutHours: 48
          },
          {
            stepId: 'approval',
            name: 'Final Approval',
            assignees: ['approver@test.com'],
            required: true,
            timeoutHours: 24
          }
        ],
        autoSubmitOnApproval: false
      };

      const workflowId = await reportingEngine.createApprovalWorkflow(workflow);

      expect(workflowId).toBeDefined();
    });

    it('should submit report for approval', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const workflow = {
        name: 'Test Workflow',
        frameworkCode: 'SEC_CLIMATE',
        steps: [
          {
            stepId: 'review',
            name: 'Review',
            assignees: ['reviewer@test.com'],
            required: true,
            timeoutHours: 24
          }
        ],
        autoSubmitOnApproval: false
      };

      const workflowId = await reportingEngine.createApprovalWorkflow(workflow);

      const submissionId = await reportingEngine.submitForApproval(
        report.reportId,
        workflowId,
        'user@test.com'
      );

      expect(submissionId).toBeDefined();
    });

    it('should approve report step', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const workflow = {
        name: 'Test Workflow',
        frameworkCode: 'SEC_CLIMATE',
        steps: [
          {
            stepId: 'review',
            name: 'Review',
            assignees: ['reviewer@test.com'],
            required: true,
            timeoutHours: 24
          }
        ],
        autoSubmitOnApproval: false
      };

      const workflowId = await reportingEngine.createApprovalWorkflow(workflow);
      const submissionId = await reportingEngine.submitForApproval(
        report.reportId,
        workflowId,
        'user@test.com'
      );

      await reportingEngine.approveStep(
        submissionId,
        'review',
        'reviewer@test.com',
        'Report looks good'
      );

      const status = await reportingEngine.getApprovalStatus(submissionId);
      expect(status?.currentStep).toBe('completed');
    });

    it('should reject report step', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const workflow = {
        name: 'Test Workflow',
        frameworkCode: 'SEC_CLIMATE',
        steps: [
          {
            stepId: 'review',
            name: 'Review',
            assignees: ['reviewer@test.com'],
            required: true,
            timeoutHours: 24
          }
        ],
        autoSubmitOnApproval: false
      };

      const workflowId = await reportingEngine.createApprovalWorkflow(workflow);
      const submissionId = await reportingEngine.submitForApproval(
        report.reportId,
        workflowId,
        'user@test.com'
      );

      await reportingEngine.rejectStep(
        submissionId,
        'review',
        'reviewer@test.com',
        'Report needs revision'
      );

      const status = await reportingEngine.getApprovalStatus(submissionId);
      expect(status?.status).toBe('rejected');
    });
  });

  describe('Report Submission', () => {
    beforeEach(async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
    });

    it('should configure submission channel', async () => {
      const channel = {
        id: 'sec-edgar',
        name: 'SEC EDGAR System',
        type: 'api' as const,
        frameworkCode: 'SEC_CLIMATE',
        configuration: {
          endpoint: 'https://api.sec.gov/edgar',
          authentication: {
            type: 'api_key',
            credentials: { api_key: 'test-key' }
          },
          format: 'XML',
          validationRules: ['schema_validation', 'business_rules']
        },
        enabled: true
      };

      await reportingEngine.configureSubmissionChannel(channel);

      const channels = await reportingEngine.getSubmissionChannels('SEC_CLIMATE');
      expect(channels.length).toBeGreaterThan(0);
      expect(channels[0].id).toBe('sec-edgar');
    });

    it('should prepare report for submission', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const submission = await reportingEngine.prepareSubmission(
        report.reportId,
        'sec-edgar',
        {
          submissionType: 'annual',
          filingDate: new Date(),
          metadata: { year: 2024 }
        }
      );

      expect(submission).toBeDefined();
      expect(submission.submissionId).toBeDefined();
      expect(submission.status).toBe('prepared');
      expect(submission.validationResults?.isValid).toBe(true);
    });

    it('should submit report to regulatory body', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      // Configure channel first
      const channel = {
        id: 'test-channel',
        name: 'Test Channel',
        type: 'email' as const,
        frameworkCode: 'SEC_CLIMATE',
        configuration: {
          endpoint: 'test@regulator.gov',
          format: 'PDF'
        },
        enabled: true
      };

      await reportingEngine.configureSubmissionChannel(channel);

      const submission = await reportingEngine.prepareSubmission(
        report.reportId,
        'test-channel',
        { submissionType: 'test' }
      );

      const result = await reportingEngine.submitReport(submission.submissionId);

      expect(result).toBeDefined();
      expect(result.status).toMatch(/submitted|pending/);
      expect(result.submissionDate).toBeInstanceOf(Date);
    });

    it('should track submission status', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const channel = {
        id: 'track-channel',
        name: 'Tracking Channel',
        type: 'api' as const,
        frameworkCode: 'SEC_CLIMATE',
        configuration: { endpoint: 'https://api.test.com' },
        enabled: true
      };

      await reportingEngine.configureSubmissionChannel(channel);

      const submission = await reportingEngine.prepareSubmission(
        report.reportId,
        'track-channel',
        { submissionType: 'test' }
      );

      await reportingEngine.submitReport(submission.submissionId);

      const status = await reportingEngine.getSubmissionStatus(submission.submissionId);

      expect(status).toBeDefined();
      expect(status.submissionId).toBe(submission.submissionId);
      expect(status.status).toBeDefined();
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle invalid template IDs', async () => {
      await expect(
        reportingEngine.generateReport('invalid-template', 'PDF', mockComplianceData)
      ).rejects.toThrow();
    });

    it('should validate report data completeness', async () => {
      await reportingEngine.createTemplate(mockReportTemplate);

      const incompleteData = {
        organizationProfile: mockComplianceData.organizationProfile
        // Missing governance, strategy, etc.
      };

      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        incompleteData
      );

      expect(report.status).toBe('completed_with_warnings');
      expect(report.warnings).toBeInstanceOf(Array);
      expect(report.warnings!.length).toBeGreaterThan(0);
    });

    it('should handle unsupported output formats', async () => {
      await reportingEngine.createTemplate(mockReportTemplate);

      await expect(
        reportingEngine.generateReport(
          mockReportTemplate.id,
          'UNSUPPORTED' as any,
          mockComplianceData
        )
      ).rejects.toThrow();
    });

    it('should handle submission channel errors gracefully', async () => {
      const report = await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      // Mock a failing channel
      const failingChannel = {
        id: 'failing-channel',
        name: 'Failing Channel',
        type: 'api' as const,
        frameworkCode: 'SEC_CLIMATE',
        configuration: { endpoint: 'https://invalid.endpoint.com' },
        enabled: true
      };

      await reportingEngine.configureSubmissionChannel(failingChannel);

      const submission = await reportingEngine.prepareSubmission(
        report.reportId,
        'failing-channel',
        { submissionType: 'test' }
      );

      // Should handle submission failure gracefully
      const result = await reportingEngine.submitReport(submission.submissionId);

      expect(result.status).toMatch(/failed|error/);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await reportingEngine.createTemplate(mockReportTemplate);
    });

    it('should generate reports within reasonable time', async () => {
      const start = performance.now();

      await reportingEngine.generateReport(
        mockReportTemplate.id,
        'PDF',
        mockComplianceData
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent report generation', async () => {
      const promises = Array(5).fill(null).map(() =>
        reportingEngine.generateReport(
          mockReportTemplate.id,
          'PDF',
          mockComplianceData
        )
      );

      const reports = await Promise.all(promises);

      reports.forEach(report => {
        expect(report.status).toBe('completed');
        expect(report.reportId).toBeDefined();
      });

      // All reports should have unique IDs
      const ids = reports.map(r => r.reportId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(reports.length);
    });
  });
});