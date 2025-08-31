/**
 * Sustainability Management Journey E2E Tests
 * Phase 5, Task 5.1: Complete sustainability data management flow
 */

import { test, expect } from '@playwright/test';
import { E2ETestFramework, TestUser, TestOrganization, TestBuilding } from '../e2e-test-framework';

const config = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  parallel: false,
  headless: process.env.CI === 'true',
  video: true,
  screenshot: 'only-on-failure' as const
};

const testUser: TestUser = {
  email: 'sustainability.manager@blipee-test.com',
  password: 'TestPassword123!',
  role: 'sustainability_manager',
  organizationId: 'test-org-sustainability',
  firstName: 'Sarah',
  lastName: 'Manager'
};

const testOrg: TestOrganization = {
  id: 'test-org-sustainability',
  name: 'Green Corp Test',
  type: 'corporation',
  buildings: []
};

const testBuilding: TestBuilding = {
  id: 'building-hq',
  name: 'Headquarters',
  address: '123 Green Street, Eco City, EC 12345',
  type: 'office'
};

test.describe('Sustainability Management Journey', () => {
  let framework: E2ETestFramework;
  let orgId: string;
  let buildingId: string;

  test.beforeAll(async () => {
    framework = new E2ETestFramework(config);
    await framework.initialize();
    
    // Sign in as sustainability manager
    await framework.signIn(testUser);
    
    // Create test organization
    orgId = await framework.createOrganization(testOrg);
    
    // Add test building
    buildingId = await framework.addBuilding(orgId, testBuilding);
  });

  test.afterAll(async () => {
    // Clean up test data
    await framework.cleanupTestData(orgId);
    await framework.cleanup();
  });

  test('User can view organization sustainability dashboard', async () => {
    await framework.navigateTo(`/organizations/${orgId}/dashboard`);
    
    // Check for main dashboard elements
    const dashboardTitle = await framework.page.locator('[data-testid="dashboard-title"]');
    await expect(dashboardTitle).toContainText(testOrg.name);
    
    // Check for emissions overview chart
    const emissionsChart = await framework.page.locator('[data-testid="emissions-overview-chart"]');
    await expect(emissionsChart).toBeVisible();
    
    // Check for scope breakdown
    const scope1Card = await framework.page.locator('[data-testid="scope1-card"]');
    const scope2Card = await framework.page.locator('[data-testid="scope2-card"]');
    const scope3Card = await framework.page.locator('[data-testid="scope3-card"]');
    
    await expect(scope1Card).toBeVisible();
    await expect(scope2Card).toBeVisible();
    await expect(scope3Card).toBeVisible();
  });

  test('User can add Scope 1 emissions data', async () => {
    await framework.addEmissionsData(buildingId, {
      scope: 'scope1',
      category: 'Natural Gas',
      amount: 1500,
      unit: 'cubic_meters',
      date: '2024-01-15'
    });
    
    // Verify data appears in emissions list
    await framework.navigateTo(`/buildings/${buildingId}/emissions`);
    
    const emissionsEntry = await framework.page.locator('[data-testid="emissions-entry"]').first();
    await expect(emissionsEntry).toContainText('Natural Gas');
    await expect(emissionsEntry).toContainText('1,500');
    await expect(emissionsEntry).toContainText('Scope 1');
  });

  test('User can add Scope 2 emissions data', async () => {
    await framework.addEmissionsData(buildingId, {
      scope: 'scope2',
      category: 'Electricity',
      amount: 25000,
      unit: 'kwh',
      date: '2024-01-15'
    });
    
    // Verify data appears in dashboard
    await framework.navigateTo(`/organizations/${orgId}/dashboard`);
    
    const scope2Value = await framework.page.locator('[data-testid="scope2-value"]');
    await expect(scope2Value).toContainText('25,000');
  });

  test('User can add Scope 3 emissions data', async () => {
    await framework.addEmissionsData(buildingId, {
      scope: 'scope3',
      category: 'Business Travel',
      amount: 500,
      unit: 'km',
      date: '2024-01-15'
    });
    
    // Verify total CO2 equivalent is calculated
    await framework.navigateTo(`/organizations/${orgId}/dashboard`);
    
    const totalEmissions = await framework.page.locator('[data-testid="total-emissions"]');
    await expect(totalEmissions).not.toContainText('0 tCO2e');
  });

  test('User can bulk import emissions data via CSV', async () => {
    await framework.navigateTo(`/buildings/${buildingId}/emissions`);
    
    // Click bulk import button
    await framework.page.click('[data-testid="bulk-import-button"]');
    
    // Upload CSV file (create test CSV data)
    const csvData = `date,scope,category,amount,unit
2024-01-01,scope1,Natural Gas,1000,cubic_meters
2024-01-01,scope2,Electricity,20000,kwh
2024-01-01,scope3,Business Travel,300,km`;
    
    // Create a temporary file and upload
    const fileInput = await framework.page.locator('[data-testid="csv-file-input"]');
    await fileInput.setInputFiles({
      name: 'test-emissions.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvData)
    });
    
    // Process upload
    await framework.page.click('[data-testid="process-csv-button"]');
    
    // Wait for processing
    await framework.page.waitForSelector('[data-testid="import-success-message"]');
    
    // Verify imported data appears
    const emissionsList = await framework.page.locator('[data-testid="emissions-list"]');
    await expect(emissionsList).toContainText('Natural Gas');
    await expect(emissionsList).toContainText('Electricity');
    await expect(emissionsList).toContainText('Business Travel');
  });

  test('User can set and track emissions targets', async () => {
    await framework.navigateTo(`/organizations/${orgId}/targets`);
    
    // Add new target
    await framework.page.click('[data-testid="add-target-button"]');
    
    // Fill target form
    await framework.page.fill('[data-testid="target-name"]', '2024 Carbon Reduction');
    await framework.page.selectOption('[data-testid="target-type"]', 'absolute');
    await framework.page.fill('[data-testid="target-value"]', '1000');
    await framework.page.selectOption('[data-testid="target-unit"]', 'tco2e');
    await framework.page.fill('[data-testid="target-year"]', '2024');
    
    await framework.page.click('[data-testid="save-target-button"]');
    
    // Verify target is saved
    const targetCard = await framework.page.locator('[data-testid="target-card"]');
    await expect(targetCard).toContainText('2024 Carbon Reduction');
    await expect(targetCard).toContainText('1,000 tCO2e');
    
    // Check progress indicator
    const progressBar = await framework.page.locator('[data-testid="target-progress"]');
    await expect(progressBar).toBeVisible();
  });

  test('User can generate sustainability reports', async () => {
    await framework.navigateTo(`/organizations/${orgId}/reports`);
    
    // Create new report
    await framework.page.click('[data-testid="create-report-button"]');
    
    // Select report type
    await framework.page.selectOption('[data-testid="report-type"]', 'annual-sustainability');
    
    // Select year
    await framework.page.selectOption('[data-testid="report-year"]', '2024');
    
    // Generate report
    await framework.page.click('[data-testid="generate-report-button"]');
    
    // Wait for report generation
    await framework.page.waitForSelector('[data-testid="report-ready"]', { timeout: 60000 });
    
    // Verify report contains expected sections
    const reportContent = await framework.page.locator('[data-testid="report-content"]');
    await expect(reportContent).toContainText('Executive Summary');
    await expect(reportContent).toContainText('Emissions Overview');
    await expect(reportContent).toContainText('Scope 1 Emissions');
    await expect(reportContent).toContainText('Scope 2 Emissions');
    await expect(reportContent).toContainText('Scope 3 Emissions');
    
    // Test report export
    const downloadPromise = framework.page.waitForEvent('download');
    await framework.page.click('[data-testid="export-pdf-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('sustainability-report');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('User can compare emissions across time periods', async () => {
    await framework.navigateTo(`/organizations/${orgId}/analytics`);
    
    // Select comparison view
    await framework.page.click('[data-testid="comparison-view-tab"]');
    
    // Set date ranges
    await framework.page.fill('[data-testid="period1-start"]', '2024-01-01');
    await framework.page.fill('[data-testid="period1-end"]', '2024-03-31');
    await framework.page.fill('[data-testid="period2-start"]', '2023-01-01');
    await framework.page.fill('[data-testid="period2-end"]', '2023-03-31');
    
    // Apply comparison
    await framework.page.click('[data-testid="apply-comparison-button"]');
    
    // Verify comparison chart appears
    const comparisonChart = await framework.page.locator('[data-testid="comparison-chart"]');
    await expect(comparisonChart).toBeVisible();
    
    // Check for percentage change indicators
    const changeIndicator = await framework.page.locator('[data-testid="change-indicator"]');
    await expect(changeIndicator).toBeVisible();
  });

  test('User can manage team members and permissions', async () => {
    await framework.navigateTo(`/organizations/${orgId}/team`);
    
    // Add new team member
    await framework.page.click('[data-testid="invite-member-button"]');
    
    // Fill invitation form
    await framework.page.fill('[data-testid="invite-email"]', 'analyst@blipee-test.com');
    await framework.page.selectOption('[data-testid="invite-role"]', 'analyst');
    await framework.page.fill('[data-testid="invite-message"]', 'Welcome to our sustainability team!');
    
    // Send invitation
    await framework.page.click('[data-testid="send-invitation-button"]');
    
    // Verify invitation is sent
    const successMessage = await framework.page.locator('[data-testid="invitation-sent"]');
    await expect(successMessage).toContainText('Invitation sent successfully');
    
    // Check team member appears in pending list
    const pendingList = await framework.page.locator('[data-testid="pending-invitations"]');
    await expect(pendingList).toContainText('analyst@blipee-test.com');
  });

  test('User can configure automated data collection', async () => {
    await framework.navigateTo(`/organizations/${orgId}/integrations`);
    
    // Add utility integration
    await framework.page.click('[data-testid="add-integration-button"]');
    
    // Select integration type
    await framework.page.selectOption('[data-testid="integration-type"]', 'utility');
    
    // Configure utility integration
    await framework.page.fill('[data-testid="utility-name"]', 'Green Energy Co');
    await framework.page.fill('[data-testid="utility-account"]', 'ACC-123456');
    await framework.page.selectOption('[data-testid="data-frequency"]', 'monthly');
    
    // Save integration
    await framework.page.click('[data-testid="save-integration-button"]');
    
    // Verify integration is configured
    const integrationCard = await framework.page.locator('[data-testid="integration-card"]');
    await expect(integrationCard).toContainText('Green Energy Co');
    await expect(integrationCard).toContainText('Connected');
    
    // Test data sync
    await framework.page.click('[data-testid="sync-data-button"]');
    
    // Wait for sync completion
    await framework.page.waitForSelector('[data-testid="sync-complete"]', { timeout: 30000 });
    
    // Verify new data appears
    await framework.navigateTo(`/buildings/${buildingId}/emissions`);
    const emissionsList = await framework.page.locator('[data-testid="emissions-list"]');
    await expect(emissionsList).toContainText('Auto-imported');
  });

  test('User can audit and verify emissions data', async () => {
    await framework.navigateTo(`/organizations/${orgId}/audit`);
    
    // View audit trail
    const auditLog = await framework.page.locator('[data-testid="audit-log"]');
    await expect(auditLog).toBeVisible();
    
    // Check for data entry records
    await expect(auditLog).toContainText('Emissions data added');
    await expect(auditLog).toContainText('Target created');
    await expect(auditLog).toContainText('Report generated');
    
    // Filter audit log
    await framework.page.selectOption('[data-testid="audit-filter"]', 'emissions');
    await framework.page.click('[data-testid="apply-filter-button"]');
    
    // Verify filtered results
    const filteredLog = await framework.page.locator('[data-testid="filtered-audit-log"]');
    await expect(filteredLog).toContainText('Emissions data');
    await expect(filteredLog).not.toContainText('Target created');
    
    // Export audit trail
    const downloadPromise = framework.page.waitForEvent('download');
    await framework.page.click('[data-testid="export-audit-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('audit-trail');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});