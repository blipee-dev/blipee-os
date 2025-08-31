import { describe, it, expect, beforeEach } from '@jest/globals';
import { TestClient } from '@/test/utils/test-client';
import { TestDatabase } from '@/test/utils/test-database';
import { TEST_CREDENTIALS } from '@/test/constants';

describe('Complete E2E User Journey', () => {
  let client: TestClient;
  let db: TestDatabase;

  beforeEach(async () => {
    client = new TestClient();
    db = new TestDatabase();
    await db.reset();
  });

  it('should complete full user journey from signup to using features', async () => {
    // 1. User signs up
    const signupRes = await client.post('/api/auth/signup', {
      email: 'newuser@example.com',
      password: TEST_CREDENTIALS.password,
      fullName: 'New User',
      organizationName: 'Test Company'
    });

    expect(signupRes.status).toBe(200);
    const { user: _user } = signupRes.data;

    // 2. User verifies email
    const verifyToken = await db.getEmailVerificationToken(user.id);
    const verifyRes = await client.get(`/api/auth/verify?token=${verifyToken}`);
    expect(verifyRes.status).toBe(200);

    // 3. User signs in
    const signinRes = await client.post('/api/auth/signin', {
      email: 'newuser@example.com',
      password: 'SecurePass123!'
    });

    expect(signinRes.status).toBe(200);
    const { session } = signinRes.data;
    client.setAuth(session.access_token);

    // 4. User sets up MFA
    const mfaSetupRes = await client.post('/api/auth/mfa/setup', {
      type: 'totp'
    });

    expect(mfaSetupRes.status).toBe(200);
    const { secret } = mfaSetupRes.data;

    // 5. User creates a building
    const buildingRes = await client.post(`/api/organizations/${user.organizationId}/buildings`, {
      name: 'Main Office',
      address: '123 Main St',
      type: 'office',
      size: 50000
    });

    expect(buildingRes.status).toBe(201);
    const { building } = buildingRes.data;

    // 6. User uploads sustainability report
    const formData = new FormData();
    formData.append('file', new File(['report content'], 'sustainability.pdf'));
    formData.append('buildingId', building.id);

    const uploadRes = await client.post('/api/documents/sustainability-report', formData);
    expect(uploadRes.status).toBe(200);

    // 7. User chats with AI
    const chatRes = await client.post('/api/ai/chat', {
      messages: [{ role: 'user', content: 'What is my building energy usage?' }],
      buildingId: building.id
    });

    expect(chatRes.status).toBe(200);
    expect(chatRes.data.message.content).toContain('energy');

    // 8. User configures webhook
    const webhookRes = await client.post('/api/webhooks', {
      url: 'https://example.com/webhook',
      events: ['building.updated', 'report.processed']
    });

    expect(webhookRes.status).toBe(201);

    // 9. User checks compliance status
    const complianceRes = await client.get('/api/compliance/status');
    expect(complianceRes.status).toBe(200);
    expect(complianceRes.data).toHaveProperty('gdpr');

    // 10. User exports data
    const exportRes = await client.post('/api/compliance/data-export', {
      format: 'json',
      includeAuditLogs: true
    });

    expect(exportRes.status).toBe(200);
    expect(exportRes.data.exportId).toBeDefined();
  });

  it('should handle complete organization workflow', async () => {
    // Setup admin user
    const admin = await db.createUser({
      email: 'admin@company.com',
      role: 'account_owner'
    });
    client.setAuth(admin.token);

    // 1. Create organization
    const orgRes = await client.post('/api/v1/organizations', {
      name: 'Enterprise Corp',
      industry: 'technology',
      size: 'enterprise'
    });

    const org = orgRes.data;

    // 2. Invite team members
    const invites = [
      { email: 'manager@company.com', role: 'sustainability_manager' },
      { email: 'analyst@company.com', role: 'analyst' },
      { email: 'viewer@company.com', role: 'viewer' }
    ];

    for (const invite of invites) {
      const inviteRes = await client.post(`/api/organizations/${org.id}/members`, invite);
      expect(inviteRes.status).toBe(201);
    }

    // 3. Configure SSO
    const ssoRes = await client.post('/api/auth/sso/configurations', {
      type: 'saml',
      organizationId: org.id,
      config: {
        entityId: 'https://company.com',
        ssoUrl: 'https://idp.company.com/sso',
        certificate: 'base64-cert'
      }
    });

    expect(ssoRes.status).toBe(201);

    // 4. Set up monitoring alerts
    const alertRes = await client.post('/api/monitoring/alerts', {
      name: 'High Energy Usage',
      condition: 'energy.usage > threshold',
      threshold: 1000,
      organizationId: org.id
    });

    expect(alertRes.status).toBe(201);

    // 5. Generate compliance report
    const reportRes = await client.get(`/api/compliance/report?organizationId=${org.id}`);
    expect(reportRes.status).toBe(200);
    expect(reportRes.data.sections).toContain('gdpr');
  });
});