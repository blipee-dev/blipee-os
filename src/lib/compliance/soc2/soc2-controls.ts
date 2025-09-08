/**
 * SOC 2 Compliance Framework
 * Implementation of SOC 2 Type II Controls for blipee OS
 */

export interface SOC2Control {
  id: string;
  category: 'Security' | 'Availability' | 'Processing Integrity' | 'Confidentiality' | 'Privacy';
  name: string;
  description: string;
  implementation: string;
  testingProcedure: string;
  frequency: 'Continuous' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  status: 'Compliant' | 'Non-Compliant' | 'Not-Applicable' | 'In-Progress';
  evidence: SOC2Evidence[];
  lastTested: Date;
  nextTestDue: Date;
  owner: string;
  exceptions: SOC2Exception[];
}

export interface SOC2Evidence {
  id: string;
  type: 'Document' | 'Screenshot' | 'Log' | 'Report' | 'Certificate' | 'Policy';
  title: string;
  description: string;
  filePath?: string;
  url?: string;
  createdAt: Date;
  retentionUntil: Date;
  tags: string[];
}

export interface SOC2Exception {
  id: string;
  controlId: string;
  description: string;
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In-Progress' | 'Resolved' | 'Accepted';
  identifiedAt: Date;
  targetResolution: Date;
  actualResolution?: Date;
  mitigatingControls: string[];
  owner: string;
}

export interface SOC2Audit {
  id: string;
  auditPeriod: {
    startDate: Date;
    endDate: Date;
  };
  auditor: string;
  status: 'Planning' | 'In-Progress' | 'Review' | 'Complete' | 'Certified';
  controls: SOC2Control[];
  exceptions: SOC2Exception[];
  opinion: 'Unqualified' | 'Qualified' | 'Adverse' | 'Disclaimer' | 'Pending';
  reportUrl?: string;
  certificationDate?: Date;
}

/**
 * SOC 2 Compliance Manager
 */
export class SOC2ComplianceManager {
  private controls: Map<string, SOC2Control> = new Map();
  private evidence: Map<string, SOC2Evidence> = new Map();
  private exceptions: Map<string, SOC2Exception> = new Map();
  private currentAudit?: SOC2Audit;

  constructor() {
    this.initializeControls();
  }

  /**
   * Initialize SOC 2 controls based on Trust Principles
   */
  private initializeControls(): void {
    const controls: SOC2Control[] = [
      // Security Controls
      {
        id: 'CC1.1',
        category: 'Security',
        name: 'Control Environment - Integrity and Ethical Values',
        description: 'Management demonstrates commitment to integrity and ethical values',
        implementation: 'Code of conduct, ethics training, disciplinary procedures',
        testingProcedure: 'Review policies, interview personnel, test disciplinary actions',
        frequency: 'Quarterly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        owner: 'CISO',
        exceptions: []
      },
      {
        id: 'CC2.1',
        category: 'Security',
        name: 'Risk Assessment Process',
        description: 'Entity defines objectives and risk tolerances',
        implementation: 'Risk management framework, periodic risk assessments',
        testingProcedure: 'Review risk assessments, test risk treatment plans',
        frequency: 'Quarterly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        owner: 'CRO',
        exceptions: []
      },
      {
        id: 'CC3.1',
        category: 'Security',
        name: 'Control Activities - Policies and Procedures',
        description: 'Policies and procedures established to support achievement of objectives',
        implementation: 'Documented policies, procedures, regular reviews',
        testingProcedure: 'Review policies, test implementation, verify approvals',
        frequency: 'Annually',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        owner: 'COO',
        exceptions: []
      },
      {
        id: 'CC4.1',
        category: 'Security',
        name: 'Information and Communication',
        description: 'Information requirements identified and communicated',
        implementation: 'Communication policies, incident reporting, management reporting',
        testingProcedure: 'Test communication channels, review incident reports',
        frequency: 'Monthly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: 'CTO',
        exceptions: []
      },
      {
        id: 'CC5.1',
        category: 'Security',
        name: 'Monitoring Activities',
        description: 'Ongoing and separate evaluations enable management to determine whether components are present and functioning',
        implementation: 'Continuous monitoring, security operations center, regular assessments',
        testingProcedure: 'Review monitoring reports, test alert mechanisms',
        frequency: 'Continuous',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        owner: 'SOC Manager',
        exceptions: []
      },
      {
        id: 'CC6.1',
        category: 'Security',
        name: 'Logical and Physical Access Controls',
        description: 'Entity implements logical and physical access security controls',
        implementation: 'Multi-factor authentication, role-based access control, physical security',
        testingProcedure: 'Test access controls, review access logs, physical inspections',
        frequency: 'Monthly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: 'Security Team',
        exceptions: []
      },
      {
        id: 'CC7.1',
        category: 'Security',
        name: 'System Operations',
        description: 'Entity implements system operations procedures',
        implementation: 'Change management, system monitoring, incident response',
        testingProcedure: 'Review change logs, test monitoring, verify incident handling',
        frequency: 'Weekly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        owner: 'DevOps Team',
        exceptions: []
      },
      {
        id: 'CC8.1',
        category: 'Security',
        name: 'Change Management',
        description: 'Entity implements change management controls',
        implementation: 'Formal change management process, testing procedures, rollback plans',
        testingProcedure: 'Review change requests, test approval process, verify deployments',
        frequency: 'Weekly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        owner: 'Engineering Manager',
        exceptions: []
      },

      // Availability Controls
      {
        id: 'A1.1',
        category: 'Availability',
        name: 'System Availability',
        description: 'Entity maintains system availability as committed or agreed',
        implementation: 'High availability architecture, redundancy, load balancing',
        testingProcedure: 'Monitor uptime, test failover procedures, capacity planning',
        frequency: 'Continuous',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        owner: 'SRE Team',
        exceptions: []
      },
      {
        id: 'A1.2',
        category: 'Availability',
        name: 'Environmental Protection',
        description: 'Entity protects against environmental factors',
        implementation: 'Multi-region deployment, disaster recovery procedures',
        testingProcedure: 'Test disaster recovery, review environmental controls',
        frequency: 'Quarterly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        owner: 'Infrastructure Team',
        exceptions: []
      },

      // Processing Integrity Controls
      {
        id: 'PI1.1',
        category: 'Processing Integrity',
        name: 'Data Processing Accuracy',
        description: 'System processing is complete, accurate, timely, and authorized',
        implementation: 'Input validation, error handling, transaction logging, reconciliation',
        testingProcedure: 'Test data processing, review error logs, verify reconciliations',
        frequency: 'Daily',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        owner: 'Data Engineering Team',
        exceptions: []
      },

      // Confidentiality Controls
      {
        id: 'C1.1',
        category: 'Confidentiality',
        name: 'Data Confidentiality',
        description: 'Confidential information is protected',
        implementation: 'Encryption at rest and in transit, access controls, data classification',
        testingProcedure: 'Test encryption, review access logs, verify data classification',
        frequency: 'Monthly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: 'Security Team',
        exceptions: []
      },

      // Privacy Controls
      {
        id: 'P1.1',
        category: 'Privacy',
        name: 'Personal Information Collection',
        description: 'Personal information is collected in accordance with privacy notice',
        implementation: 'Privacy policy, consent management, data minimization',
        testingProcedure: 'Review privacy notices, test consent mechanisms, verify data collection',
        frequency: 'Quarterly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        owner: 'Privacy Officer',
        exceptions: []
      },
      {
        id: 'P2.1',
        category: 'Privacy',
        name: 'Personal Information Use',
        description: 'Personal information is used in accordance with privacy notice',
        implementation: 'Purpose limitation, use restrictions, consent verification',
        testingProcedure: 'Review data usage, test consent verification, audit purposes',
        frequency: 'Monthly',
        status: 'Compliant',
        evidence: [],
        lastTested: new Date(),
        nextTestDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: 'Privacy Officer',
        exceptions: []
      }
    ];

    controls.forEach(control => {
      this.controls.set(control.id, control);
    });
  }

  /**
   * Perform compliance assessment
   */
  async performComplianceAssessment(): Promise<{
    overallStatus: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
    controlResults: Map<string, SOC2Control>;
    summary: {
      totalControls: number;
      compliantControls: number;
      nonCompliantControls: number;
      exceptionsCount: number;
      overdueTesting: number;
    };
  }> {
    const now = new Date();
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let overdueCount = 0;
    let exceptionsCount = 0;

    // Check each control
    for (const [controlId, control] of Array.from(this.controls)) {
      // Check if testing is overdue
      if (control.nextTestDue < now) {
        overdueCount++;
        control.status = 'Non-Compliant';
      }

      // Count status
      if (control.status === 'Compliant') {
        compliantCount++;
      } else if (control.status === 'Non-Compliant') {
        nonCompliantCount++;
      }

      // Count exceptions
      exceptionsCount += control.exceptions.filter(e => e.status === 'Open').length;
    }

    // Determine overall status
    let overallStatus: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
    if (nonCompliantCount === 0 && exceptionsCount === 0) {
      overallStatus = 'Compliant';
    } else if (compliantCount === 0) {
      overallStatus = 'Non-Compliant';
    } else {
      overallStatus = 'Partially-Compliant';
    }

    return {
      overallStatus,
      controlResults: new Map(this.controls),
      summary: {
        totalControls: this.controls.size,
        compliantControls: compliantCount,
        nonCompliantControls: nonCompliantCount,
        exceptionsCount,
        overdueTesting: overdueCount
      }
    };
  }

  /**
   * Add evidence to a control
   */
  addEvidence(controlId: string, evidence: Omit<SOC2Evidence, 'id'>): string {
    const evidenceId = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullEvidence: SOC2Evidence = {
      ...evidence,
      id: evidenceId
    };

    // Store evidence
    this.evidence.set(evidenceId, fullEvidence);

    // Add to control
    const control = this.controls.get(controlId);
    if (control) {
      control.evidence.push(fullEvidence);
      this.controls.set(controlId, control);
    }

    return evidenceId;
  }

  /**
   * Log an exception
   */
  logException(exception: Omit<SOC2Exception, 'id'>): string {
    const exceptionId = `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullException: SOC2Exception = {
      ...exception,
      id: exceptionId
    };

    // Store exception
    this.exceptions.set(exceptionId, fullException);

    // Add to control
    const control = this.controls.get(exception.controlId);
    if (control) {
      control.exceptions.push(fullException);
      control.status = 'Non-Compliant'; // Mark control as non-compliant
      this.controls.set(exception.controlId, control);
    }

    return exceptionId;
  }

  /**
   * Update control testing
   */
  updateControlTesting(
    controlId: string,
    status: 'Compliant' | 'Non-Compliant' | 'Not-Applicable' | 'In-Progress',
    evidenceIds?: string[]
  ): void {
    const control = this.controls.get(controlId);
    if (!control) {
      throw new Error(`Control ${controlId} not found`);
    }

    control.status = status;
    control.lastTested = new Date();
    
    // Calculate next test due date based on frequency
    const now = Date.now();
    switch (control.frequency) {
      case 'Continuous':
        control.nextTestDue = new Date(now + 1 * 24 * 60 * 60 * 1000); // 1 day
        break;
      case 'Daily':
        control.nextTestDue = new Date(now + 1 * 24 * 60 * 60 * 1000); // 1 day
        break;
      case 'Weekly':
        control.nextTestDue = new Date(now + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case 'Monthly':
        control.nextTestDue = new Date(now + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'Quarterly':
        control.nextTestDue = new Date(now + 90 * 24 * 60 * 60 * 1000); // 90 days
        break;
      case 'Annually':
        control.nextTestDue = new Date(now + 365 * 24 * 60 * 60 * 1000); // 365 days
        break;
    }

    // Add evidence if provided
    if (evidenceIds) {
      evidenceIds.forEach(evidenceId => {
        const evidence = this.evidence.get(evidenceId);
        if (evidence) {
          control.evidence.push(evidence);
        }
      });
    }

    this.controls.set(controlId, control);
  }

  /**
   * Generate SOC 2 readiness report
   */
  generateReadinessReport(): {
    readinessScore: number; // 0-100
    readyForAudit: boolean;
    categories: Record<string, {
      controlCount: number;
      compliantCount: number;
      readinessPercentage: number;
    }>;
    recommendations: string[];
    criticalIssues: string[];
  } {
    const categories: Record<string, { controlCount: number; compliantCount: number; readinessPercentage: number }> = {};
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];

    // Analyze by category
    for (const control of Array.from(this.controls.values())) {
      if (!categories[control.category]) {
        categories[control.category] = { controlCount: 0, compliantCount: 0, readinessPercentage: 0 };
      }
      
      categories[control.category].controlCount++;
      if (control.status === 'Compliant') {
        categories[control.category].compliantCount++;
      }

      // Check for critical issues
      if (control.status === 'Non-Compliant' && control.category === 'Security') {
        criticalIssues.push(`Critical security control non-compliant: ${control.name} (${control.id})`);
      }

      // Check for overdue testing
      if (control.nextTestDue < new Date()) {
        recommendations.push(`Update testing for ${control.name} (${control.id}) - overdue since ${control.nextTestDue.toLocaleDateString()}`);
      }

      // Check for missing evidence
      if (control.evidence.length === 0) {
        recommendations.push(`Add evidence for ${control.name} (${control.id})`);
      }
    }

    // Calculate readiness percentages
    let totalControls = 0;
    let totalCompliant = 0;
    
    Object.keys(categories).forEach(category => {
      const cat = categories[category];
      cat.readinessPercentage = Math.round((cat.compliantCount / cat.controlCount) * 100);
      totalControls += cat.controlCount;
      totalCompliant += cat.compliantCount;
    });

    const overallReadiness = Math.round((totalCompliant / totalControls) * 100);
    const readyForAudit = overallReadiness >= 85 && criticalIssues.length === 0;

    return {
      readinessScore: overallReadiness,
      readyForAudit,
      categories,
      recommendations,
      criticalIssues
    };
  }

  /**
   * Get all controls
   */
  getControls(): Map<string, SOC2Control> {
    return new Map(this.controls);
  }

  /**
   * Get control by ID
   */
  getControl(controlId: string): SOC2Control | undefined {
    return this.controls.get(controlId);
  }

  /**
   * Get controls by category
   */
  getControlsByCategory(category: string): SOC2Control[] {
    return Array.from(this.controls.values()).filter(control => control.category === category);
  }

  /**
   * Get all evidence
   */
  getEvidence(): Map<string, SOC2Evidence> {
    return new Map(this.evidence);
  }

  /**
   * Get all exceptions
   */
  getExceptions(): Map<string, SOC2Exception> {
    return new Map(this.exceptions);
  }
}

/**
 * Global SOC 2 compliance manager instance
 */
export const soc2ComplianceManager = new SOC2ComplianceManager();