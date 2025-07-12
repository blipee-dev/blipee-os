import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/compliance/service', () => ({
  ComplianceService: jest.fn(() => ({
    getComplianceStatus: jest.fn(),
    checkGDPR: jest.fn(),
    checkSOC2: jest.fn(),
    checkISO27001: jest.fn()
  }))
}));

describe('GET /api/compliance/status', () => {
  let mockComplianceService: any;

  beforeEach(() => {
    mockComplianceService = new (require('@/lib/compliance/service').ComplianceService)();
  });

  it('should return compliance status', async () => {
    mockComplianceService.getComplianceStatus.mockResolvedValue({
      gdpr: { compliant: true, lastAudit: '2024-01-15' },
      soc2: { compliant: true, type: 'Type II' },
      iso27001: { compliant: false, inProgress: true },
      overall: 'partial'
    });

    const request = new NextRequest('http://localhost:3000/api/compliance/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.gdpr.compliant).toBe(true);
    expect(data.overall).toBe('partial');
  });

  it('should filter by compliance type', async () => {
    mockComplianceService.checkGDPR.mockResolvedValue({
      compliant: true,
      requirements: ['data_mapping', 'privacy_policy', 'consent_management'],
      completed: ['data_mapping', 'privacy_policy']
    });

    const request = new NextRequest('http://localhost:3000/api/compliance/status?type=gdpr');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.requirements).toHaveLength(3);
  });
});