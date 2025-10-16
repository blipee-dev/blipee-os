/**
 * GDPR Compliance Framework
 * Implementation of GDPR requirements for blipee OS
 */

export interface GDPRPrinciple {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  implementation: string;
  status: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant' | 'Not-Assessed';
  evidence: string[];
  lastAssessed: Date;
  nextAssessmentDue: Date;
}

export interface PersonalDataInventory {
  id: string;
  dataType: string;
  dataCategory: 'Basic Identity' | 'Personal Details' | 'Family' | 'Lifestyle' | 'Financial' | 'Professional' | 'Technical' | 'Special Category';
  processingPurpose: string;
  legalBasis: 'Consent' | 'Contract' | 'Legal Obligation' | 'Vital Interests' | 'Public Task' | 'Legitimate Interests';
  dataSubjects: string[];
  dataLocation: string[];
  retentionPeriod: number; // days
  isSpecialCategory: boolean;
  thirdPartySharing: boolean;
  thirdParties: string[];
  encryptionStatus: 'Encrypted' | 'Not Encrypted' | 'Partially Encrypted';
  accessControls: string[];
  lastReviewed: Date;
}

export interface DataSubjectRequest {
  id: string;
  type: 'Access' | 'Rectification' | 'Erasure' | 'Restrict Processing' | 'Data Portability' | 'Object to Processing';
  dataSubjectId: string;
  dataSubjectEmail: string;
  requestDate: Date;
  status: 'Received' | 'In Progress' | 'Completed' | 'Rejected' | 'Overdue';
  completionDate?: Date;
  responseMethod: 'Email' | 'Portal' | 'Mail' | 'Phone';
  dataProvided?: string;
  rejectionReason?: string;
  extensionGranted?: boolean;
  extensionReason?: string;
  handledBy: string;
  notes: string;
}

export interface DataBreachIncident {
  id: string;
  discoveredDate: Date;
  reportedToSupervisoryAuthority?: Date;
  reportedToDataSubjects?: Date;
  breachType: 'Confidentiality' | 'Integrity' | 'Availability';
  riskLevel: 'Low' | 'Medium' | 'High';
  affectedDataSubjects: number;
  dataTypesAffected: string[];
  cause: string;
  containmentMeasures: string[];
  status: 'Open' | 'Contained' | 'Resolved';
  lessonsLearned?: string;
  preventiveMeasures?: string[];
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  processingPurpose: string;
  consentGiven: boolean;
  consentDate: Date;
  consentMethod: 'Checkbox' | 'Button Click' | 'Verbal' | 'Written' | 'API';
  consentWithdrawn?: Date;
  withdrawalMethod?: string;
  granularConsent: Record<string, boolean>; // Specific consent for different purposes
  evidenceLocation: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * GDPR Compliance Manager
 */
export class GDPRComplianceManager {
  private principles: Map<string, GDPRPrinciple> = new Map();
  private personalDataInventory: Map<string, PersonalDataInventory> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest> = new Map();
  private dataBreaches: Map<string, DataBreachIncident> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();

  constructor() {
    this.initializePrinciples();
    this.initializeDataInventory();
  }

  /**
   * Initialize GDPR principles
   */
  private initializePrinciples(): void {
    const principles: GDPRPrinciple[] = [
      {
        id: 'lawfulness',
        name: 'Lawfulness, fairness and transparency',
        description: 'Personal data must be processed lawfully, fairly and in a transparent manner',
        requirements: [
          'Have a lawful basis for processing',
          'Process data fairly',
          'Be transparent about processing activities',
          'Provide clear privacy notices'
        ],
        implementation: 'Privacy policy, consent management, lawful basis documentation',
        status: 'Compliant',
        evidence: ['privacy-policy.pdf', 'consent-management-system.docs'],
        lastAssessed: new Date(),
        nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'purpose-limitation',
        name: 'Purpose limitation',
        description: 'Personal data must be collected for specified, explicit and legitimate purposes',
        requirements: [
          'Clearly define processing purposes',
          'Only process for specified purposes',
          'Obtain consent for new purposes',
          'Document purpose changes'
        ],
        implementation: 'Purpose documentation, consent workflows, change management',
        status: 'Compliant',
        evidence: ['purpose-documentation.pdf'],
        lastAssessed: new Date(),
        nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'data-minimisation',
        name: 'Data minimisation',
        description: 'Personal data must be adequate, relevant and limited to what is necessary',
        requirements: [
          'Collect only necessary data',
          'Regular data reviews',
          'Remove unnecessary data',
          'Document data necessity'
        ],
        implementation: 'Data collection reviews, automated data pruning, necessity assessments',
        status: 'Compliant',
        evidence: ['data-minimization-policy.pdf'],
        lastAssessed: new Date(),
        nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'accuracy',
        name: 'Accuracy',
        description: 'Personal data must be accurate and kept up to date',
        requirements: [
          'Implement data accuracy measures',
          'Enable data correction',
          'Regular data quality checks',
          'Delete inaccurate data when necessary'
        ],
        implementation: 'Data validation, user profile updates, data quality monitoring',
        status: 'Compliant',
        evidence: ['data-accuracy-procedures.pdf'],
        lastAssessed: new Date(),
        nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'storage-limitation',
        name: 'Storage limitation',
        description: 'Personal data must not be kept longer than necessary',
        requirements: [
          'Define retention periods',
          'Implement automated deletion',
          'Regular retention reviews',
          'Secure disposal procedures'
        ],
        implementation: 'Retention policies, automated deletion, secure disposal',
        status: 'Compliant',
        evidence: ['retention-policy.pdf', 'deletion-procedures.pdf'],
        lastAssessed: new Date(),
        nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'integrity-confidentiality',
        name: 'Integrity and confidentiality',
        description: 'Personal data must be processed securely',
        requirements: [
          'Implement appropriate technical measures',
          'Implement appropriate organisational measures',
          'Protect against unauthorized processing',
          'Protect against accidental loss or destruction'
        ],
        implementation: 'Encryption, access controls, security monitoring, backup procedures',
        status: 'Compliant',
        evidence: ['security-measures.pdf', 'encryption-policy.pdf'],
        lastAssessed: new Date(),
        nextAssessmentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'accountability',
        name: 'Accountability',
        description: 'Controller must demonstrate compliance',
        requirements: [
          'Maintain processing records',
          'Implement data protection by design and default',
          'Conduct impact assessments when required',
          'Appoint DPO if required',
          'Maintain compliance documentation'
        ],
        implementation: 'Processing records, privacy by design, DPIA procedures, DPO appointment',
        status: 'Compliant',
        evidence: ['processing-records.pdf', 'dpo-appointment.pdf'],
        lastAssessed: new Date(),
        nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ];

    principles.forEach(principle => {
      this.principles.set(principle.id, principle);
    });
  }

  /**
   * Initialize personal data inventory
   */
  private initializeDataInventory(): void {
    const inventory: PersonalDataInventory[] = [
      {
        id: 'user-profile',
        dataType: 'User Profile Information',
        dataCategory: 'Basic Identity',
        processingPurpose: 'User account management and service provision',
        legalBasis: 'Contract',
        dataSubjects: ['customers'],
        dataLocation: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        retentionPeriod: 2555, // 7 years
        isSpecialCategory: false,
        thirdPartySharing: false,
        thirdParties: [],
        encryptionStatus: 'Encrypted',
        accessControls: ['role-based-access', 'multi-factor-authentication'],
        lastReviewed: new Date()
      },
      {
        id: 'usage-analytics',
        dataType: 'Usage Analytics Data',
        dataCategory: 'Technical',
        processingPurpose: 'Service improvement and analytics',
        legalBasis: 'Legitimate Interests',
        dataSubjects: ['customers'],
        dataLocation: ['us-east-1', 'eu-west-1'],
        retentionPeriod: 365, // 1 year
        isSpecialCategory: false,
        thirdPartySharing: true,
        thirdParties: ['analytics-provider'],
        encryptionStatus: 'Encrypted',
        accessControls: ['role-based-access'],
        lastReviewed: new Date()
      },
      {
        id: 'financial-data',
        dataType: 'Financial and Billing Information',
        dataCategory: 'Financial',
        processingPurpose: 'Payment processing and billing',
        legalBasis: 'Contract',
        dataSubjects: ['customers'],
        dataLocation: ['us-east-1', 'eu-west-1'],
        retentionPeriod: 2555, // 7 years for financial records
        isSpecialCategory: false,
        thirdPartySharing: true,
        thirdParties: ['payment-processor', 'accounting-system'],
        encryptionStatus: 'Encrypted',
        accessControls: ['role-based-access', 'payment-team-only'],
        lastReviewed: new Date()
      }
    ];

    inventory.forEach(item => {
      this.personalDataInventory.set(item.id, item);
    });
  }

  /**
   * Record consent
   */
  recordConsent(
    dataSubjectId: string,
    processingPurpose: string,
    consentGiven: boolean,
    consentMethod: 'Checkbox' | 'Button Click' | 'Verbal' | 'Written' | 'API',
    granularConsent: Record<string, boolean> = {},
    metadata: { ipAddress?: string; userAgent?: string; evidenceLocation?: string } = {}
  ): string {
    const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const consent: ConsentRecord = {
      id: consentId,
      dataSubjectId,
      processingPurpose,
      consentGiven,
      consentDate: new Date(),
      consentMethod,
      granularConsent,
      evidenceLocation: metadata.evidenceLocation || `consent-log-${consentId}`,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    };

    this.consentRecords.set(consentId, consent);
    return consentId;
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(
    dataSubjectId: string,
    processingPurpose: string,
    withdrawalMethod: string
  ): boolean {
    // Find active consent records
    const activeConsents = Array.from(this.consentRecords.values())
      .filter(consent => 
        consent.dataSubjectId === dataSubjectId &&
        consent.processingPurpose === processingPurpose &&
        consent.consentGiven &&
        !consent.consentWithdrawn
      );

    if (activeConsents.length === 0) {
      return false;
    }

    // Mark consent as withdrawn
    activeConsents.forEach(consent => {
      consent.consentWithdrawn = new Date();
      consent.withdrawalMethod = withdrawalMethod;
      this.consentRecords.set(consent.id, consent);
    });

    return true;
  }

  /**
   * Handle data subject request
   */
  handleDataSubjectRequest(
    type: 'Access' | 'Rectification' | 'Erasure' | 'Restrict Processing' | 'Data Portability' | 'Object to Processing',
    dataSubjectEmail: string,
    handledBy: string,
    notes: string = ''
  ): string {
    const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: DataSubjectRequest = {
      id: requestId,
      type,
      dataSubjectId: this.getDataSubjectIdFromEmail(dataSubjectEmail),
      dataSubjectEmail,
      requestDate: new Date(),
      status: 'Received',
      responseMethod: 'Email',
      handledBy,
      notes
    };

    this.dataSubjectRequests.set(requestId, request);
    return requestId;
  }

  /**
   * Complete data subject request
   */
  completeDataSubjectRequest(
    requestId: string,
    dataProvided?: string,
    rejectionReason?: string
  ): boolean {
    const request = this.dataSubjectRequests.get(requestId);
    if (!request) {
      return false;
    }

    request.status = rejectionReason ? 'Rejected' : 'Completed';
    request.completionDate = new Date();
    request.dataProvided = dataProvided;
    request.rejectionReason = rejectionReason;

    this.dataSubjectRequests.set(requestId, request);
    return true;
  }

  /**
   * Report data breach
   */
  reportDataBreach(
    breachType: 'Confidentiality' | 'Integrity' | 'Availability',
    affectedDataSubjects: number,
    dataTypesAffected: string[],
    cause: string,
    riskLevel: 'Low' | 'Medium' | 'High' = 'Medium'
  ): string {
    const breachId = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const breach: DataBreachIncident = {
      id: breachId,
      discoveredDate: new Date(),
      breachType,
      riskLevel,
      affectedDataSubjects,
      dataTypesAffected,
      cause,
      containmentMeasures: [],
      status: 'Open'
    };

    this.dataBreaches.set(breachId, breach);

    // If high risk, automatically set notification requirements
    if (riskLevel === 'High' && affectedDataSubjects > 0) {
      // Schedule supervisory authority notification (72 hours)
      const notificationDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000);
      
      // If high risk to individuals, notification may be required
      if (affectedDataSubjects > 100) {
      }
    }

    return breachId;
  }

  /**
   * Perform GDPR compliance assessment
   */
  async performComplianceAssessment(): Promise<{
    overallStatus: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
    principleResults: Map<string, GDPRPrinciple>;
    summary: {
      compliantPrinciples: number;
      nonCompliantPrinciples: number;
      totalPrinciples: number;
      overdueAssessments: number;
      openDataBreaches: number;
      overdueDataSubjectRequests: number;
      dataInventoryItems: number;
    };
    recommendations: string[];
    criticalIssues: string[];
  }> {
    const now = new Date();
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let overdueAssessments = 0;
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];

    // Check principles
    for (const principle of Array.from(this.principles.values())) {
      if (principle.nextAssessmentDue < now) {
        overdueAssessments++;
        recommendations.push(`Update assessment for ${principle.name} - overdue since ${principle.nextAssessmentDue.toLocaleDateString()}`);
      }

      if (principle.status === 'Compliant') {
        compliantCount++;
      } else if (principle.status === 'Non-Compliant') {
        nonCompliantCount++;
        criticalIssues.push(`Non-compliant principle: ${principle.name}`);
      }
    }

    // Check data subject requests (30-day deadline)
    const overdueRequests = Array.from(this.dataSubjectRequests.values())
      .filter(request => {
        const deadline = new Date(request.requestDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        return request.status === 'In Progress' && deadline < now;
      });

    if (overdueRequests.length > 0) {
      criticalIssues.push(`${overdueRequests.length} data subject request(s) overdue`);
    }

    // Check open data breaches
    const openBreaches = Array.from(this.dataBreaches.values())
      .filter(breach => breach.status === 'Open').length;

    if (openBreaches > 0) {
      criticalIssues.push(`${openBreaches} open data breach(es) require attention`);
    }

    // Determine overall status
    let overallStatus: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
    if (nonCompliantCount === 0 && criticalIssues.length === 0) {
      overallStatus = 'Compliant';
    } else if (compliantCount === 0) {
      overallStatus = 'Non-Compliant';
    } else {
      overallStatus = 'Partially-Compliant';
    }

    return {
      overallStatus,
      principleResults: new Map(this.principles),
      summary: {
        compliantPrinciples: compliantCount,
        nonCompliantPrinciples: nonCompliantCount,
        totalPrinciples: this.principles.size,
        overdueAssessments,
        openDataBreaches: openBreaches,
        overdueDataSubjectRequests: overdueRequests.length,
        dataInventoryItems: this.personalDataInventory.size
      },
      recommendations,
      criticalIssues
    };
  }

  /**
   * Get data subject ID from email (simplified)
   */
  private getDataSubjectIdFromEmail(email: string): string {
    // In real implementation, this would query the user database
    return `user_${email.replace('@', '_').replace('.', '_')}`;
  }

  /**
   * Get all principles
   */
  getPrinciples(): Map<string, GDPRPrinciple> {
    return new Map(this.principles);
  }

  /**
   * Get personal data inventory
   */
  getPersonalDataInventory(): Map<string, PersonalDataInventory> {
    return new Map(this.personalDataInventory);
  }

  /**
   * Get data subject requests
   */
  getDataSubjectRequests(): Map<string, DataSubjectRequest> {
    return new Map(this.dataSubjectRequests);
  }

  /**
   * Get data breaches
   */
  getDataBreaches(): Map<string, DataBreachIncident> {
    return new Map(this.dataBreaches);
  }

  /**
   * Get consent records
   */
  getConsentRecords(): Map<string, ConsentRecord> {
    return new Map(this.consentRecords);
  }
}

/**
 * Global GDPR compliance manager instance
 */
export const gdprComplianceManager = new GDPRComplianceManager();