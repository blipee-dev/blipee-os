/**
 * Compliance Audit Trail System
 * Comprehensive audit logging for SOC 2 and GDPR compliance activities
 */

export interface AuditEvent {
  id: string;
  timestamp: Date;
  framework: 'SOC2' | 'GDPR' | 'General';
  eventType: 'Control Test' | 'Data Subject Request' | 'Breach Report' | 'Configuration Change' | 'Assessment' | 'Evidence Upload' | 'Exception Log' | 'Consent Update';
  severity: 'Info' | 'Warning' | 'High' | 'Critical';
  actor: {
    userId: string;
    userEmail: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  };
  target: {
    type: 'Control' | 'Data Subject' | 'System' | 'Configuration' | 'Evidence' | 'Policy';
    id: string;
    name?: string;
  };
  action: string;
  description: string;
  before?: any;
  after?: any;
  metadata: {
    requestId?: string;
    sessionId?: string;
    organizationId?: string;
    complianceOfficer?: string;
    relatedEvents?: string[];
  };
  retention: {
    retentionPeriod: number; // days
    deleteAfter: Date;
    legalHold: boolean;
  };
}

export interface AuditQuery {
  framework?: 'SOC2' | 'GDPR' | 'General';
  eventType?: string;
  severity?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  organizationId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  id: string;
  generatedAt: Date;
  generatedBy: string;
  reportType: 'Full Audit' | 'SOC2 Controls' | 'GDPR Activities' | 'Security Events' | 'Data Subject Requests';
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalEvents: number;
  eventsByFramework: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  criticalFindings: string[];
  recommendations: string[];
  filePath?: string;
  retentionUntil: Date;
}

/**
 * Compliance Audit Trail Manager
 */
export class ComplianceAuditTrail {
  private events: Map<string, AuditEvent> = new Map();
  private reports: Map<string, AuditReport> = new Map();
  private retentionPolicies: Map<string, number> = new Map();

  constructor() {
    this.initializeRetentionPolicies();
  }

  /**
   * Initialize retention policies for different event types
   */
  private initializeRetentionPolicies(): void {
    // SOC 2 Type II requires 1 year of audit evidence
    this.retentionPolicies.set('SOC2', 2555); // 7 years for extra safety
    
    // GDPR requires audit logs for 3 years minimum
    this.retentionPolicies.set('GDPR', 1095); // 3 years
    
    // Security events kept for 5 years
    this.retentionPolicies.set('Security', 1825); // 5 years
    
    // General compliance events kept for 3 years
    this.retentionPolicies.set('General', 1095); // 3 years
  }

  /**
   * Log a compliance audit event
   */
  logEvent(
    framework: 'SOC2' | 'GDPR' | 'General',
    eventType: AuditEvent['eventType'],
    severity: AuditEvent['severity'],
    actor: AuditEvent['actor'],
    target: AuditEvent['target'],
    action: string,
    description: string,
    before?: any,
    after?: any,
    metadata: AuditEvent['metadata'] = {}
  ): string {
    const eventId = `audit_${framework.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const retentionDays = this.retentionPolicies.get(framework) || 1095;
    const deleteAfter = new Date();
    deleteAfter.setDate(deleteAfter.getDate() + retentionDays);
    
    const auditEvent: AuditEvent = {
      id: eventId,
      timestamp: new Date(),
      framework,
      eventType,
      severity,
      actor,
      target,
      action,
      description,
      before,
      after,
      metadata,
      retention: {
        retentionPeriod: retentionDays,
        deleteAfter,
        legalHold: severity === 'Critical' || eventType === 'Breach Report'
      }
    };
    
    this.events.set(eventId, auditEvent);
    
    // Log to console for immediate visibility
    console.log(`🔍 [${framework}] ${severity}: ${action} - ${description}`, {
      eventId,
      actor: actor.userEmail,
      target: `${target.type}:${target.id}`
    });
    
    return eventId;
  }

  /**
   * Log SOC 2 control testing
   */
  logSOC2ControlTest(
    controlId: string,
    controlName: string,
    testResult: 'Passed' | 'Failed' | 'Not Applicable',
    tester: { userId: string; userEmail: string; role: string },
    evidence?: string[],
    notes?: string
  ): string {
    return this.logEvent(
      'SOC2',
      'Control Test',
      testResult === 'Failed' ? 'High' : 'Info',
      tester,
      { type: 'Control', id: controlId, name: controlName },
      `SOC 2 Control Test - ${testResult}`,
      `Control ${controlId} (${controlName}) tested with result: ${testResult}${notes ? '. Notes: ' + notes : ''}`,
      undefined,
      { testResult, evidence, notes },
      {
        complianceOfficer: tester.userEmail,
        requestId: `soc2_test_${Date.now()}`
      }
    );
  }

  /**
   * Log GDPR data subject request
   */
  logGDPRDataSubjectRequest(
    requestType: 'Access' | 'Rectification' | 'Erasure' | 'Restrict Processing' | 'Data Portability' | 'Object to Processing',
    dataSubjectEmail: string,
    handler: { userId: string; userEmail: string; role: string },
    status: 'Received' | 'In Progress' | 'Completed' | 'Rejected',
    completionTime?: number
  ): string {
    const severity = status === 'Rejected' ? 'Warning' : 'Info';
    const action = `GDPR ${requestType} Request - ${status}`;
    const description = `Data subject request ${requestType.toLowerCase()} for ${dataSubjectEmail} ${status.toLowerCase()}${completionTime ? ` in ${completionTime}ms` : ''}`;
    
    return this.logEvent(
      'GDPR',
      'Data Subject Request',
      severity,
      handler,
      { type: 'Data Subject', id: dataSubjectEmail },
      action,
      description,
      undefined,
      { requestType, status, completionTime },
      {
        complianceOfficer: handler.userEmail,
        requestId: `gdpr_dsr_${Date.now()}`
      }
    );
  }

  /**
   * Log GDPR data breach
   */
  logGDPRDataBreach(
    breachType: 'Confidentiality' | 'Integrity' | 'Availability',
    affectedDataSubjects: number,
    riskLevel: 'Low' | 'Medium' | 'High',
    reporter: { userId: string; userEmail: string; role: string },
    cause: string,
    containmentMeasures: string[]
  ): string {
    const severity = riskLevel === 'High' ? 'Critical' : 'High';
    const action = `GDPR Data Breach - ${breachType} - ${riskLevel} Risk`;
    const description = `Data breach affecting ${affectedDataSubjects} data subjects. Type: ${breachType}. Cause: ${cause}. Risk Level: ${riskLevel}`;
    
    return this.logEvent(
      'GDPR',
      'Breach Report',
      severity,
      reporter,
      { type: 'System', id: 'data_processing_system' },
      action,
      description,
      undefined,
      {
        breachType,
        affectedDataSubjects,
        riskLevel,
        cause,
        containmentMeasures
      },
      {
        complianceOfficer: reporter.userEmail,
        requestId: `gdpr_breach_${Date.now()}`
      }
    );
  }

  /**
   * Query audit events
   */
  queryEvents(query: AuditQuery): AuditEvent[] {
    let filteredEvents = Array.from(this.events.values());
    
    if (query.framework) {
      filteredEvents = filteredEvents.filter(e => e.framework === query.framework);
    }
    
    if (query.eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === query.eventType);
    }
    
    if (query.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === query.severity);
    }
    
    if (query.actorId) {
      filteredEvents = filteredEvents.filter(e => e.actor.userId === query.actorId);
    }
    
    if (query.targetType) {
      filteredEvents = filteredEvents.filter(e => e.target.type === query.targetType);
    }
    
    if (query.targetId) {
      filteredEvents = filteredEvents.filter(e => e.target.id === query.targetId);
    }
    
    if (query.dateFrom) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.dateFrom!);
    }
    
    if (query.dateTo) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.dateTo!);
    }
    
    if (query.organizationId) {
      filteredEvents = filteredEvents.filter(e => e.metadata.organizationId === query.organizationId);
    }
    
    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filteredEvents.slice(offset, offset + limit);
  }

  /**
   * Generate comprehensive audit report
   */
  generateAuditReport(
    reportType: AuditReport['reportType'],
    period: { startDate: Date; endDate: Date },
    generatedBy: string,
    organizationId?: string
  ): string {
    const reportId = `audit_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Query events for the period
    const events = this.queryEvents({
      dateFrom: period.startDate,
      dateTo: period.endDate,
      organizationId,
      limit: 10000
    });
    
    // Analyze events
    const eventsByFramework: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const criticalFindings: string[] = [];
    const recommendations: string[] = [];
    
    events.forEach(event => {
      // Count by framework
      eventsByFramework[event.framework] = (eventsByFramework[event.framework] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Collect critical findings
      if (event.severity === 'Critical' || event.severity === 'High') {
        criticalFindings.push(`${event.framework}: ${event.description}`);
      }
    });
    
    // Generate recommendations
    if (eventsBySeverity['Critical'] > 0) {
      recommendations.push('Address all critical compliance issues immediately');
    }
    
    if (eventsBySeverity['High'] > 5) {
      recommendations.push('Review high-severity events and implement preventive measures');
    }
    
    if (eventsByFramework['GDPR'] > eventsByFramework['SOC2']) {
      recommendations.push('Focus on SOC 2 control testing to balance compliance activities');
    }
    
    const report: AuditReport = {
      id: reportId,
      generatedAt: new Date(),
      generatedBy,
      reportType,
      period,
      totalEvents: events.length,
      eventsByFramework,
      eventsBySeverity,
      criticalFindings,
      recommendations,
      retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
    };
    
    this.reports.set(reportId, report);
    
    console.log(`📊 Audit report generated: ${reportId} (${events.length} events analyzed)`);
    
    return reportId;
  }

  /**
   * Cleanup expired audit events
   */
  async cleanupExpiredEvents(): Promise<{
    deletedEvents: number;
    retainedEvents: number;
    legalHoldEvents: number;
  }> {
    const now = new Date();
    let deletedCount = 0;
    let retainedCount = 0;
    let legalHoldCount = 0;
    
    for (const [eventId, event] of Array.from(this.events)) {
      if (event.retention.legalHold) {
        legalHoldCount++;
        retainedCount++;
      } else if (event.retention.deleteAfter < now) {
        this.events.delete(eventId);
        deletedCount++;
      } else {
        retainedCount++;
      }
    }
    
    console.log(`🧹 Audit cleanup completed: ${deletedCount} deleted, ${retainedCount} retained, ${legalHoldCount} on legal hold`);
    
    return {
      deletedEvents: deletedCount,
      retainedEvents: retainedCount,
      legalHoldEvents: legalHoldCount
    };
  }

  /**
   * Get audit statistics
   */
  getAuditStatistics(): {
    totalEvents: number;
    eventsByFramework: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsLast30Days: number;
    criticalEventsLast7Days: number;
    averageEventsPerDay: number;
  } {
    const allEvents = Array.from(this.events.values());
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const eventsByFramework: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    let eventsLast30Days = 0;
    let criticalEventsLast7Days = 0;
    
    allEvents.forEach(event => {
      // Count by framework
      eventsByFramework[event.framework] = (eventsByFramework[event.framework] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Count recent events
      if (event.timestamp >= thirtyDaysAgo) {
        eventsLast30Days++;
      }
      
      if (event.timestamp >= sevenDaysAgo && event.severity === 'Critical') {
        criticalEventsLast7Days++;
      }
    });
    
    return {
      totalEvents: allEvents.length,
      eventsByFramework,
      eventsBySeverity,
      eventsLast30Days,
      criticalEventsLast7Days,
      averageEventsPerDay: Math.round(eventsLast30Days / 30)
    };
  }

  /**
   * Export audit events to JSON
   */
  exportEvents(query: AuditQuery = {}): string {
    const events = this.queryEvents(query);
    return JSON.stringify(events, null, 2);
  }

  /**
   * Get all events
   */
  getAllEvents(): Map<string, AuditEvent> {
    return new Map(this.events);
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): AuditEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get all reports
   */
  getAllReports(): Map<string, AuditReport> {
    return new Map(this.reports);
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): AuditReport | undefined {
    return this.reports.get(reportId);
  }
}

/**
 * Global compliance audit trail instance
 */
export const complianceAuditTrail = new ComplianceAuditTrail();

/**
 * Helper function to log compliance events with context
 */
export function logComplianceEvent(
  framework: 'SOC2' | 'GDPR' | 'General',
  action: string,
  description: string,
  actor?: { userId: string; userEmail: string; role: string },
  target?: { type: AuditEvent['target']['type']; id: string; name?: string },
  severity: AuditEvent['severity'] = 'Info',
  metadata: AuditEvent['metadata'] = {}
): string {
  const defaultActor = {
    userId: 'system',
    userEmail: 'system@blipee.ai',
    role: 'system'
  };
  
  const defaultTarget = {
    type: 'System' as const,
    id: 'blipee-os'
  };
  
  return complianceAuditTrail.logEvent(
    framework,
    'Assessment',
    severity,
    actor || defaultActor,
    target || defaultTarget,
    action,
    description,
    undefined,
    undefined,
    metadata
  );
}