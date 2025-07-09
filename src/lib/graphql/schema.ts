import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON
  scalar UUID

  type Query {
    # Organization queries
    organizations: [Organization!]!
    organization(id: UUID!): Organization
    
    # Building queries
    buildings(organizationId: UUID!): [Building!]!
    building(id: UUID!): Building
    
    # User queries
    users(organizationId: UUID!): [User!]!
    user(id: UUID!): User
    currentUser: User
    
    # Emission queries
    emissions(organizationId: UUID!, buildingId: UUID): [Emission!]!
    emission(id: UUID!): Emission
    
    # API Gateway queries
    apiKeys(organizationId: UUID!): [APIKey!]!
    apiKey(id: UUID!): APIKey
    apiUsage(apiKeyId: UUID!, startDate: DateTime, endDate: DateTime): [APIUsage!]!
    apiUsageStats(organizationId: UUID!): APIUsageStats!
    
    # Webhook queries
    webhooks(organizationId: UUID!): [WebhookEndpoint!]!
    webhook(id: UUID!): WebhookEndpoint
    webhookDeliveries(webhookId: UUID!, limit: Int = 50, offset: Int = 0): WebhookDeliveryConnection!
    webhookStats(organizationId: UUID!): WebhookStats!
    
    # Audit queries
    auditLogs(organizationId: UUID!, limit: Int = 50, offset: Int = 0): AuditLogConnection!
    
    # Monitoring queries
    healthCheck: HealthStatus!
    systemMetrics: SystemMetrics!
    alerts(organizationId: UUID!): [Alert!]!
  }

  type Mutation {
    # Organization mutations
    createOrganization(input: CreateOrganizationInput!): Organization!
    updateOrganization(id: UUID!, input: UpdateOrganizationInput!): Organization!
    
    # Building mutations
    createBuilding(input: CreateBuildingInput!): Building!
    updateBuilding(id: UUID!, input: UpdateBuildingInput!): Building!
    deleteBuilding(id: UUID!): Boolean!
    
    # User mutations
    inviteUser(input: InviteUserInput!): OrganizationMember!
    updateUserRole(userId: UUID!, organizationId: UUID!, role: UserRole!): OrganizationMember!
    removeUser(userId: UUID!, organizationId: UUID!): Boolean!
    
    # Emission mutations
    createEmission(input: CreateEmissionInput!): Emission!
    updateEmission(id: UUID!, input: UpdateEmissionInput!): Emission!
    deleteEmission(id: UUID!): Boolean!
    
    # API Gateway mutations
    createAPIKey(input: CreateAPIKeyInput!): APIKey!
    updateAPIKey(id: UUID!, input: UpdateAPIKeyInput!): APIKey!
    revokeAPIKey(id: UUID!, reason: String): APIKey!
    
    # Webhook mutations
    createWebhook(input: CreateWebhookInput!): WebhookEndpoint!
    updateWebhook(id: UUID!, input: UpdateWebhookInput!): WebhookEndpoint!
    deleteWebhook(id: UUID!): Boolean!
    testWebhook(id: UUID!): WebhookTestResult!
    retryWebhookDelivery(deliveryId: UUID!): WebhookDelivery!
    
    # Alert mutations
    acknowledgeAlert(id: UUID!): Alert!
    resolveAlert(id: UUID!): Alert!
  }

  type Subscription {
    # Real-time organization updates
    organizationUpdated(organizationId: UUID!): Organization!
    
    # Real-time building updates
    buildingUpdated(organizationId: UUID!): Building!
    
    # Real-time emission updates
    emissionAdded(organizationId: UUID!): Emission!
    
    # Real-time webhook deliveries
    webhookDeliveryStatusChanged(organizationId: UUID!): WebhookDelivery!
    
    # Real-time alerts
    alertTriggered(organizationId: UUID!): Alert!
    alertResolved(organizationId: UUID!): Alert!
    
    # Real-time system health
    systemHealthChanged: HealthStatus!
  }

  # Core Types
  type Organization {
    id: UUID!
    name: String!
    slug: String!
    description: String
    website: String
    industry: String
    size: OrganizationSize
    settings: JSON
    subscription: Subscription
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    members: [OrganizationMember!]!
    buildings: [Building!]!
    apiKeys: [APIKey!]!
    webhooks: [WebhookEndpoint!]!
  }

  type Building {
    id: UUID!
    organizationId: UUID!
    name: String!
    description: String
    address: String
    buildingType: BuildingType
    floorArea: Float
    occupancy: Int
    yearBuilt: Int
    certifications: [String!]
    settings: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    organization: Organization!
    emissions: [Emission!]!
    devices: [Device!]!
  }

  type User {
    id: UUID!
    email: String!
    firstName: String
    lastName: String
    avatar: String
    timezone: String
    locale: String
    lastSignInAt: DateTime
    emailConfirmedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    organizationMemberships: [OrganizationMember!]!
  }

  type OrganizationMember {
    id: UUID!
    organizationId: UUID!
    userId: UUID!
    role: UserRole!
    invitationStatus: InvitationStatus!
    invitedAt: DateTime!
    joinedAt: DateTime
    
    # Relationships
    organization: Organization!
    user: User!
  }

  type Emission {
    id: UUID!
    organizationId: UUID!
    buildingId: UUID
    source: EmissionSource!
    scope: EmissionScope!
    category: String!
    activityData: Float!
    unit: String!
    emissionFactor: Float!
    co2Equivalent: Float!
    period: String!
    startDate: DateTime!
    endDate: DateTime!
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    organization: Organization!
    building: Building
  }

  type Device {
    id: UUID!
    buildingId: UUID!
    name: String!
    deviceType: DeviceType!
    model: String
    manufacturer: String
    location: String
    status: DeviceStatus!
    lastSeenAt: DateTime
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    building: Building!
  }

  # API Gateway Types
  type APIKey {
    id: UUID!
    organizationId: UUID!
    name: String!
    description: String
    keyPrefix: String!
    lastFour: String!
    version: String!
    scopes: [String!]!
    status: APIKeyStatus!
    expiresAt: DateTime
    lastUsedAt: DateTime
    createdAt: DateTime!
    
    # Relationships
    organization: Organization!
    usage: [APIUsage!]!
  }

  type APIUsage {
    id: UUID!
    apiKeyId: UUID!
    endpoint: String!
    method: String!
    version: String!
    statusCode: Int!
    responseTimeMs: Int!
    requestSizeBytes: Int
    responseSizeBytes: Int
    ipAddress: String
    userAgent: String
    createdAt: DateTime!
    
    # Relationships
    apiKey: APIKey!
  }

  type APIUsageStats {
    totalRequests: Int!
    successfulRequests: Int!
    failedRequests: Int!
    averageResponseTime: Float!
    totalBandwidth: Int!
    topEndpoints: [EndpointStat!]!
    statusCodeDistribution: [StatusCodeStat!]!
  }

  type EndpointStat {
    endpoint: String!
    count: Int!
    averageResponseTime: Float!
  }

  type StatusCodeStat {
    statusCode: Int!
    count: Int!
  }

  # Webhook Types
  type WebhookEndpoint {
    id: UUID!
    organizationId: UUID!
    url: String!
    description: String
    events: [String!]!
    apiVersion: String!
    enabled: Boolean!
    status: WebhookStatus!
    lastSuccessAt: DateTime
    lastFailureAt: DateTime
    lastDeliveryAt: DateTime
    failureCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    organization: Organization!
    deliveries: [WebhookDelivery!]!
  }

  type WebhookDelivery {
    id: UUID!
    webhookEndpointId: UUID!
    organizationId: UUID!
    eventType: String!
    eventId: UUID!
    payload: JSON!
    attemptNumber: Int!
    status: WebhookDeliveryStatus!
    responseStatusCode: Int
    responseBody: String
    responseTimeMs: Int
    errorMessage: String
    scheduledAt: DateTime!
    deliveredAt: DateTime
    nextRetryAt: DateTime
    createdAt: DateTime!
    
    # Relationships
    webhookEndpoint: WebhookEndpoint!
  }

  type WebhookDeliveryConnection {
    nodes: [WebhookDelivery!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type WebhookStats {
    totalEndpoints: Int!
    activeEndpoints: Int!
    failingEndpoints: Int!
    totalDeliveries: Int!
    successfulDeliveries: Int!
    failedDeliveries: Int!
    averageResponseTime: Float!
    deliverySuccessRate: Float!
  }

  type WebhookTestResult {
    success: Boolean!
    response: JSON
    error: String
  }

  # Audit Types
  type AuditLog {
    id: UUID!
    organizationId: UUID!
    userId: UUID
    action: String!
    resourceType: String!
    resourceId: UUID
    details: JSON
    ipAddress: String
    userAgent: String
    createdAt: DateTime!
    
    # Relationships
    organization: Organization!
    user: User
  }

  type AuditLogConnection {
    nodes: [AuditLog!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  # Monitoring Types
  type HealthStatus {
    status: HealthStatusType!
    timestamp: DateTime!
    services: [ServiceHealth!]!
    uptime: Float!
    version: String!
  }

  type ServiceHealth {
    name: String!
    status: HealthStatusType!
    responseTime: Float
    error: String
  }

  type SystemMetrics {
    cpu: Float!
    memory: Float!
    disk: Float!
    activeConnections: Int!
    requestsPerMinute: Int!
    averageResponseTime: Float!
    timestamp: DateTime!
  }

  type Alert {
    id: UUID!
    organizationId: UUID!
    type: AlertType!
    severity: AlertSeverity!
    title: String!
    message: String!
    status: AlertStatus!
    triggeredAt: DateTime!
    acknowledgedAt: DateTime
    resolvedAt: DateTime
    metadata: JSON
    
    # Relationships
    organization: Organization!
  }

  # Input Types
  input CreateOrganizationInput {
    name: String!
    slug: String!
    description: String
    website: String
    industry: String
    size: OrganizationSize
  }

  input UpdateOrganizationInput {
    name: String
    description: String
    website: String
    industry: String
    size: OrganizationSize
    settings: JSON
  }

  input CreateBuildingInput {
    organizationId: UUID!
    name: String!
    description: String
    address: String
    buildingType: BuildingType
    floorArea: Float
    occupancy: Int
    yearBuilt: Int
    certifications: [String!]
  }

  input UpdateBuildingInput {
    name: String
    description: String
    address: String
    buildingType: BuildingType
    floorArea: Float
    occupancy: Int
    yearBuilt: Int
    certifications: [String!]
    settings: JSON
  }

  input InviteUserInput {
    organizationId: UUID!
    email: String!
    role: UserRole!
  }

  input CreateEmissionInput {
    organizationId: UUID!
    buildingId: UUID
    source: EmissionSource!
    scope: EmissionScope!
    category: String!
    activityData: Float!
    unit: String!
    emissionFactor: Float!
    co2Equivalent: Float!
    period: String!
    startDate: DateTime!
    endDate: DateTime!
    metadata: JSON
  }

  input UpdateEmissionInput {
    source: EmissionSource
    scope: EmissionScope
    category: String
    activityData: Float
    unit: String
    emissionFactor: Float
    co2Equivalent: Float
    period: String
    startDate: DateTime
    endDate: DateTime
    metadata: JSON
  }

  input CreateAPIKeyInput {
    organizationId: UUID!
    name: String!
    description: String
    version: String = "v1"
    scopes: [String!]!
    expiresAt: DateTime
  }

  input UpdateAPIKeyInput {
    name: String
    description: String
    scopes: [String!]
  }

  input CreateWebhookInput {
    organizationId: UUID!
    url: String!
    description: String
    events: [String!]!
    apiVersion: String = "v1"
    enabled: Boolean = true
    headers: JSON
  }

  input UpdateWebhookInput {
    url: String
    description: String
    events: [String!]
    enabled: Boolean
    headers: JSON
  }

  # Enums
  enum OrganizationSize {
    STARTUP
    SMALL
    MEDIUM
    LARGE
    ENTERPRISE
  }

  enum UserRole {
    account_owner
    admin
    facility_manager
    analyst
    viewer
  }

  enum InvitationStatus {
    pending
    accepted
    expired
    revoked
  }

  enum BuildingType {
    OFFICE
    RETAIL
    WAREHOUSE
    MANUFACTURING
    RESIDENTIAL
    HEALTHCARE
    EDUCATION
    HOSPITALITY
    OTHER
  }

  enum EmissionSource {
    ELECTRICITY
    NATURAL_GAS
    FUEL_OIL
    PROPANE
    DISTRICT_HEATING
    DISTRICT_COOLING
    TRANSPORTATION
    WASTE
    WATER
    OTHER
  }

  enum EmissionScope {
    SCOPE_1
    SCOPE_2
    SCOPE_3
  }

  enum DeviceType {
    HVAC
    LIGHTING
    SECURITY
    METER
    SENSOR
    OTHER
  }

  enum DeviceStatus {
    ONLINE
    OFFLINE
    MAINTENANCE
    ERROR
  }

  enum APIKeyStatus {
    active
    revoked
    expired
  }

  enum WebhookStatus {
    active
    failing
    disabled
  }

  enum WebhookDeliveryStatus {
    pending
    success
    failed
  }

  enum HealthStatusType {
    HEALTHY
    DEGRADED
    UNHEALTHY
  }

  enum AlertType {
    SYSTEM
    SECURITY
    PERFORMANCE
    SUSTAINABILITY
    COMPLIANCE
  }

  enum AlertSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum AlertStatus {
    ACTIVE
    ACKNOWLEDGED
    RESOLVED
  }
`;