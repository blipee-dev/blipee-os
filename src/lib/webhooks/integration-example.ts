/**
 * Example integration showing how to use the webhook system
 * throughout the application to emit events
 */

import { eventPublisher } from './event-publisher';
import { WebhookEventType } from '@/types/webhooks';

// Example: Emit building events
export async function createBuildingWithWebhook(
  organizationId: string,
  buildingData: any,
  userId: string
) {
  // Create the building in the database
  const building = await createBuilding(buildingData);
  
  // Emit webhook event
  await eventPublisher.emitBuildingEvent(
    organizationId,
    WebhookEventType.BUILDING_CREATED,
    building,
    undefined,
    {
      type: 'user',
      id: userId,
      name: 'John Doe' // Get from user data
    }
  );
  
  return building;
}

// Example: Emit emission events
export async function recordEmissionWithWebhook(
  organizationId: string,
  emissionData: any,
  userId: string
) {
  // Record the emission in the database
  const emission = await recordEmission(emissionData);
  
  // Emit webhook event
  await eventPublisher.emitEmissionEvent(
    organizationId,
    WebhookEventType.EMISSION_RECORDED,
    emission,
    undefined,
    {
      type: 'user',
      id: userId,
      name: 'Jane Smith'
    }
  );
  
  return emission;
}

// Example: Emit alert events
export async function triggerAlertWithWebhook(
  organizationId: string,
  alertData: any
) {
  // Create the alert in the database
  const alert = await createAlert(alertData);
  
  // Emit webhook event
  await eventPublisher.emitAlertEvent(
    organizationId,
    WebhookEventType.ALERT_TRIGGERED,
    alert,
    {
      type: 'system',
      id: 'alert-system',
      name: 'Alert System'
    }
  );
  
  return alert;
}

// Example: Emit API key events
export async function createAPIKeyWithWebhook(
  organizationId: string,
  apiKeyData: any,
  userId: string
) {
  // Create the API key (this would be in the actual API key service)
  const apiKey = await createAPIKey(apiKeyData);
  
  // Emit webhook event
  await eventPublisher.emitAPIEvent(
    organizationId,
    WebhookEventType.API_KEY_CREATED,
    {
      id: apiKey.id,
      name: apiKey.name,
      version: apiKey.version,
      scopes: apiKey.scopes,
      created_at: apiKey.created_at,
    },
    undefined,
    {
      type: 'user',
      id: userId,
      name: 'Admin User'
    }
  );
  
  return apiKey;
}

// Example: Emit compliance events
export async function generateComplianceReportWithWebhook(
  organizationId: string,
  reportData: any
) {
  // Generate the compliance report
  const report = await generateComplianceReport(reportData);
  
  // Emit webhook event
  await eventPublisher.emitComplianceEvent(
    organizationId,
    WebhookEventType.COMPLIANCE_REPORT_GENERATED,
    {
      id: report.id,
      type: report.type,
      title: report.title,
      description: report.description,
      report_url: report.report_url,
      generated_at: report.generated_at,
    },
    {
      type: 'system',
      id: 'compliance-system',
      name: 'Compliance System'
    }
  );
  
  return report;
}

// Example: Emit sustainability events
export async function achieveSustainabilityMilestoneWithWebhook(
  organizationId: string,
  milestoneData: any
) {
  // Record the milestone achievement
  const milestone = await recordMilestoneAchievement(milestoneData);
  
  // Emit webhook event
  await eventPublisher.emitSustainabilityEvent(
    organizationId,
    WebhookEventType.SUSTAINABILITY_MILESTONE_REACHED,
    {
      id: milestone.id,
      type: 'milestone',
      title: milestone.title,
      description: milestone.description,
      target_value: milestone.target_value,
      current_value: milestone.current_value,
      achieved_at: milestone.achieved_at,
    },
    {
      type: 'system',
      id: 'sustainability-system',
      name: 'Sustainability Tracking System'
    }
  );
  
  return milestone;
}

// Example: Emit user events
export async function addTeamMemberWithWebhook(
  organizationId: string,
  userData: any,
  invitedBy: string
) {
  // Add the user to the organization
  const user = await addTeamMember(userData);
  
  // Emit webhook event
  await eventPublisher.emitUserEvent(
    organizationId,
    WebhookEventType.USER_CREATED,
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    undefined,
    {
      type: 'user',
      id: invitedBy,
      name: 'Admin User'
    }
  );
  
  return user;
}

// Example: Emit system events
export async function performSystemMaintenanceWithWebhook(
  organizationId: string,
  maintenanceData: any
) {
  // Perform system maintenance
  await performSystemMaintenance(maintenanceData);
  
  // Emit webhook event
  await eventPublisher.emitSystemEvent(
    organizationId,
    WebhookEventType.SYSTEM_MAINTENANCE,
    {
      status: 'maintenance',
      message: 'System maintenance in progress',
      scheduled_maintenance: {
        start_time: maintenanceData.start_time,
        end_time: maintenanceData.end_time,
        description: maintenanceData.description,
      },
    },
    {
      type: 'system',
      id: 'maintenance-system',
      name: 'System Maintenance'
    }
  );
}

// Example: Emit auth events
export async function enableMFAWithWebhook(
  organizationId: string,
  userId: string,
  mfaData: any
) {
  // Enable MFA for the user
  const mfaConfig = await enableMFA(userId, mfaData);
  
  // Emit webhook event
  await eventPublisher.emitAuthEvent(
    organizationId,
    WebhookEventType.MFA_ENABLED,
    {
      id: mfaConfig.id,
      type: 'mfa',
      mfa: {
        user_id: userId,
        method: mfaData.method,
        enabled: true,
        enabled_at: new Date().toISOString(),
      },
    },
    {
      type: 'user',
      id: userId,
      name: 'User'
    }
  );
  
  return mfaConfig;
}

// Placeholder functions (these would be implemented in the actual services)
async function createBuilding(data: any) {
  // Implementation would go here
  return { id: 'building-1', ...data, created_at: new Date().toISOString() };
}

async function recordEmission(data: any) {
  // Implementation would go here
  return { id: 'emission-1', ...data, created_at: new Date().toISOString() };
}

async function createAlert(data: any) {
  // Implementation would go here
  return { id: 'alert-1', ...data, triggered_at: new Date().toISOString() };
}

async function createAPIKey(data: any) {
  // Implementation would go here
  return { id: 'api-key-1', ...data, created_at: new Date().toISOString() };
}

async function generateComplianceReport(data: any) {
  // Implementation would go here
  return { id: 'report-1', ...data, generated_at: new Date().toISOString() };
}

async function recordMilestoneAchievement(data: any) {
  // Implementation would go here
  return { id: 'milestone-1', ...data, achieved_at: new Date().toISOString() };
}

async function addTeamMember(data: any) {
  // Implementation would go here
  return { id: 'user-1', ...data, created_at: new Date().toISOString() };
}

async function performSystemMaintenance() {
  // Implementation would go here
  return Promise.resolve();
}

async function enableMFA(userId: string, data: any) {
  // Implementation would go here
  return { id: 'mfa-1', user_id: userId, ...data };
}

// Example webhook endpoint that receives events
export function createWebhookEndpointExample() {
  return `
// Example webhook endpoint that receives events from blipee OS
import { WebhookVerifier } from '@/lib/webhooks/webhook-verifier';

export async function POST(_request: Request) {
  const payload = await _request.text();
  const signature = _request.headers.get('X-Blipee-Signature');
  const eventType = _request.headers.get('X-Blipee-Event');
  
  // Verify the webhook signature
  const isValid = WebhookVerifier.verifySignature(
    payload,
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(payload);
  
  // Process the event based on type
  switch (eventType) {
    case 'building.created':
      await handleBuildingCreated(event);
      break;
    case 'emission.recorded':
      await handleEmissionRecorded(event);
      break;
    case 'alert.triggered':
      await handleAlertTriggered(event);
      break;
    case 'sustainability.milestone.reached':
      await handleMilestoneReached(event);
      break;
    default:
      console.log('Unknown event type:', eventType);
  }
  
  return new Response('OK', { status: 200 });
}

async function handleBuildingCreated(event: any) {
  console.log('New building created:', event.data.building);
  // Your business logic here
}

async function handleEmissionRecorded(event: any) {
  console.log('New emission recorded:', event.data.emission);
  // Your business logic here
}

async function handleAlertTriggered(event: any) {
  console.log('Alert triggered:', event.data.alert);
  // Send notification, escalate, etc.
}

async function handleMilestoneReached(event: any) {
  console.log('Milestone reached:', event.data.sustainability);
  // Celebrate, notify stakeholders, etc.
}
`;
}

// Example of how to integrate webhooks into API routes
export function integrateWebhooksInAPIRoute() {
  return `
// Example: In /api/buildings/route.ts
import { eventPublisher } from '@/lib/webhooks/event-publisher';
import { WebhookEventType } from '@/types/webhooks';

export async function POST(request: NextRequest) {
  const data = await _request.json();
  
  // Create building logic...
  const building = await createBuilding(data);
  
  // Emit webhook event
  await eventPublisher.emitBuildingEvent(
    organizationId,
    WebhookEventType.BUILDING_CREATED,
    building,
    undefined,
    {
      type: 'user',
      id: userId,
      name: userName
    }
  );
  
  return NextResponse.json({ building });
}
`;
}

// Example webhook payload for testing
export function getExampleWebhookPayload() {
  return {
    id: 'evt_1234567890',
    type: 'building.created',
    timestamp: '2023-12-01T10:00:00Z',
    api_version: '1.0',
    organization_id: 'org_1234567890',
    actor: {
      type: 'user',
      id: 'user_1234567890',
      name: 'John Doe'
    },
    data: {
      building: {
        id: 'building_1234567890',
        name: 'Green Office Tower',
        address: '123 Sustainable St, San Francisco, CA',
        type: 'office',
        size_sqft: 50000,
        organization_id: 'org_1234567890',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2023-12-01T10:00:00Z'
      }
    }
  };
};