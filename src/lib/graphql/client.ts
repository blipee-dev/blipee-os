import { createClient } from 'graphql-ws';

// GraphQL endpoint URL
const GRAPHQL_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api/graphql'
  : 'http://localhost:3000/api/graphql';

const WS_ENDPOINT = process.env.NODE_ENV === 'production'
  ? 'wss://your-domain.com/api/graphql'
  : 'ws://localhost:3000/api/graphql';

// Create GraphQL client function
export function createGraphQLClient(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return {
    async query(query: string, variables?: Record<string, any>) {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL query failed');
      }
      
      return result.data;
    },
    
    async mutate(mutation: string, variables?: Record<string, any>) {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL mutation failed');
      }
      
      return result.data;
    },
  };
}

// WebSocket client for subscriptions
export function createSubscriptionClient(token?: string) {
  return createClient({
    url: WS_ENDPOINT,
    connectionParams: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });
}

// HTTP client for subscriptions (fallback)
export function createHTTPSubscriptionClient(token?: string) {
  return {
    url: GRAPHQL_ENDPOINT,
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  };
}

// Common GraphQL queries
export const QUERIES = {
  GET_ORGANIZATIONS: `
    query GetOrganizations {
      organizations {
        id
        name
        slug
        description
        industry
        size
        createdAt
        updatedAt
      }
    }
  `,
  
  GET_ORGANIZATION: `
    query GetOrganization($id: UUID!) {
      organization(id: $id) {
        id
        name
        slug
        description
        website
        industry
        size
        settings
        createdAt
        updatedAt
        members {
          id
          role
          invitationStatus
          user {
            id
            email
            firstName
            lastName
          }
        }
        buildings {
          id
          name
          description
          address
          buildingType
          floorArea
          occupancy
        }
      }
    }
  `,
  
  GET_BUILDINGS: `
    query GetBuildings($organizationId: UUID!) {
      buildings(organizationId: $organizationId) {
        id
        name
        description
        address
        buildingType
        floorArea
        occupancy
        yearBuilt
        certifications
        createdAt
        updatedAt
      }
    }
  `,
  
  GET_API_KEYS: `
    query GetAPIKeys($organizationId: UUID!) {
      apiKeys(organizationId: $organizationId) {
        id
        name
        description
        keyPrefix
        lastFour
        version
        scopes
        status
        expiresAt
        lastUsedAt
        createdAt
      }
    }
  `,
  
  GET_API_USAGE_STATS: `
    query GetAPIUsageStats($organizationId: UUID!) {
      apiUsageStats(organizationId: $organizationId) {
        totalRequests
        successfulRequests
        failedRequests
        averageResponseTime
        totalBandwidth
        topEndpoints {
          endpoint
          count
          averageResponseTime
        }
        statusCodeDistribution {
          statusCode
          count
        }
      }
    }
  `,
  
  GET_WEBHOOKS: `
    query GetWebhooks($organizationId: UUID!) {
      webhooks(organizationId: $organizationId) {
        id
        url
        description
        events
        apiVersion
        enabled
        status
        lastSuccessAt
        lastFailureAt
        lastDeliveryAt
        failureCount
        createdAt
        updatedAt
      }
    }
  `,
  
  GET_WEBHOOK_STATS: `
    query GetWebhookStats($organizationId: UUID!) {
      webhookStats(organizationId: $organizationId) {
        totalEndpoints
        activeEndpoints
        failingEndpoints
        totalDeliveries
        successfulDeliveries
        failedDeliveries
        averageResponseTime
        deliverySuccessRate
      }
    }
  `,
  
  GET_CURRENT_USER: `
    query GetCurrentUser {
      currentUser {
        id
        email
        firstName
        lastName
        avatar
        timezone
        locale
        lastSignInAt
        emailConfirmedAt
        createdAt
        updatedAt
        organizationMemberships {
          id
          role
          invitationStatus
          organization {
            id
            name
            slug
          }
        }
      }
    }
  `,
  
  GET_HEALTH_CHECK: `
    query GetHealthCheck {
      healthCheck {
        status
        timestamp
        services {
          name
          status
          responseTime
          error
        }
        uptime
        version
      }
    }
  `,
  
  GET_SYSTEM_METRICS: `
    query GetSystemMetrics {
      systemMetrics {
        cpu
        memory
        disk
        activeConnections
        requestsPerMinute
        averageResponseTime
        timestamp
      }
    }
  `,
};

// Common GraphQL mutations
export const MUTATIONS = {
  CREATE_BUILDING: `
    mutation CreateBuilding($input: CreateBuildingInput!) {
      createBuilding(input: $input) {
        id
        name
        description
        address
        buildingType
        floorArea
        occupancy
        yearBuilt
        certifications
        createdAt
        updatedAt
      }
    }
  `,
  
  UPDATE_BUILDING: `
    mutation UpdateBuilding($id: UUID!, $input: UpdateBuildingInput!) {
      updateBuilding(id: $id, input: $input) {
        id
        name
        description
        address
        buildingType
        floorArea
        occupancy
        yearBuilt
        certifications
        updatedAt
      }
    }
  `,
  
  CREATE_API_KEY: `
    mutation CreateAPIKey($input: CreateAPIKeyInput!) {
      createAPIKey(input: $input) {
        id
        name
        description
        keyPrefix
        lastFour
        version
        scopes
        status
        expiresAt
        createdAt
      }
    }
  `,
  
  CREATE_WEBHOOK: `
    mutation CreateWebhook($input: CreateWebhookInput!) {
      createWebhook(input: $input) {
        id
        url
        description
        events
        apiVersion
        enabled
        status
        createdAt
        updatedAt
      }
    }
  `,
  
  TEST_WEBHOOK: `
    mutation TestWebhook($id: UUID!) {
      testWebhook(id: $id) {
        success
        response
        error
      }
    }
  `,
};

// Common GraphQL subscriptions
export const SUBSCRIPTIONS = {
  BUILDING_UPDATED: `
    subscription BuildingUpdated($organizationId: UUID!) {
      buildingUpdated(organizationId: $organizationId) {
        id
        name
        description
        address
        buildingType
        floorArea
        occupancy
        yearBuilt
        updatedAt
      }
    }
  `,
  
  SYSTEM_HEALTH_CHANGED: `
    subscription SystemHealthChanged {
      systemHealthChanged {
        status
        timestamp
        services {
          name
          status
          responseTime
          error
        }
        uptime
        version
      }
    }
  `,
  
  ALERT_TRIGGERED: `
    subscription AlertTriggered($organizationId: UUID!) {
      alertTriggered(organizationId: $organizationId) {
        id
        type
        severity
        title
        message
        status
        triggeredAt
        metadata
      }
    }
  `,
};