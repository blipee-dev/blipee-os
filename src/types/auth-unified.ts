/**
 * Unified Enterprise Authentication & Authorization System
 * Single source of truth for all auth-related types
 *
 * @module auth-unified
 * @version 2.0.0
 */

import { z } from 'zod';

// ============================================================================
// ROLE DEFINITIONS - Enterprise Grade
// ============================================================================

/**
 * System-wide user roles with clear hierarchy
 * These are the ONLY valid roles in the system
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',        // Platform-level admin (Blipee team only)
  ACCOUNT_OWNER: 'account_owner',    // Organization owner with full control
  SUSTAINABILITY_MANAGER: 'sustainability_manager', // ESG and sustainability focus
  FACILITY_MANAGER: 'facility_manager',   // Building operations focus
  ANALYST: 'analyst',                // Data analysis and reporting
  VIEWER: 'viewer',                  // Read-only access
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// Zod schema for runtime validation
export const SystemRoleSchema = z.enum([
  SYSTEM_ROLES.SUPER_ADMIN,
  SYSTEM_ROLES.ACCOUNT_OWNER,
  SYSTEM_ROLES.SUSTAINABILITY_MANAGER,
  SYSTEM_ROLES.FACILITY_MANAGER,
  SYSTEM_ROLES.ANALYST,
  SYSTEM_ROLES.VIEWER,
]);

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<SystemRole, number> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: 100,
  [SYSTEM_ROLES.ACCOUNT_OWNER]: 90,
  [SYSTEM_ROLES.SUSTAINABILITY_MANAGER]: 70,
  [SYSTEM_ROLES.FACILITY_MANAGER]: 60,
  [SYSTEM_ROLES.ANALYST]: 40,
  [SYSTEM_ROLES.VIEWER]: 10,
};

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export const SUBSCRIPTION_TIERS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

export const SubscriptionTierSchema = z.enum([
  SUBSCRIPTION_TIERS.STARTER,
  SUBSCRIPTION_TIERS.PROFESSIONAL,
  SUBSCRIPTION_TIERS.ENTERPRISE,
]);

// ============================================================================
// INVITATION STATUS
// ============================================================================

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

export type InvitationStatus = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];

export const InvitationStatusSchema = z.enum([
  INVITATION_STATUS.PENDING,
  INVITATION_STATUS.ACCEPTED,
  INVITATION_STATUS.DECLINED,
  INVITATION_STATUS.EXPIRED,
]);

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * Organization entity
 */
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  subscription_tier: SubscriptionTierSchema,
  subscription_status: z.enum(['active', 'past_due', 'canceled', 'trialing']),
  settings: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

/**
 * Building/Site entity
 */
export const BuildingSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  address: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().default('UTC'),
  size_sqft: z.number().positive().optional(),
  floors: z.number().positive().optional(),
  age_category: z.string().optional(),
  occupancy_types: z.array(z.string()).default([]),
  status: z.enum(['active', 'pending_setup', 'inactive']).default('pending_setup'),
  metadata: z.record(z.any()).default({}),
  systems_config: z.record(z.any()).optional(),
  baseline_data: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Building = z.infer<typeof BuildingSchema>;

/**
 * User Profile entity
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  preferences: z.object({
    notification_style: z.enum(['proactive', 'reactive', 'summary', 'minimal']).optional(),
    communication_preference: z.enum(['email', 'sms', 'in_app', 'all']).optional(),
    language: z.string().default('en'),
    timezone: z.string().default('UTC'),
    dashboard_layout: z.record(z.any()).optional(),
  }).default({}),
  ai_personality_settings: z.object({
    tone: z.enum(['formal', 'professional', 'friendly', 'casual']).default('professional'),
    detail_level: z.enum(['executive', 'detailed', 'technical']).default('detailed'),
    proactivity: z.enum(['high', 'medium', 'low']).default('medium'),
    expertise_level: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
  }).default({}),
  onboarding_completed: z.boolean().default(false),
  onboarding_data: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Organization Member entity
 */
export const OrganizationMemberSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: SystemRoleSchema,
  custom_permissions: z.array(z.object({
    resource: z.string(),
    action: z.string(),
    scope: z.record(z.any()).optional(),
  })).default([]),
  is_owner: z.boolean().default(false),
  invitation_status: InvitationStatusSchema,
  invited_by: z.string().uuid().optional(),
  invited_at: z.string().datetime().optional(),
  joined_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

// ============================================================================
// PERMISSIONS SYSTEM
// ============================================================================

/**
 * Resource-based permissions
 */
export const RESOURCES = {
  ORGANIZATION: 'organization',
  BUILDINGS: 'buildings',
  USERS: 'users',
  REPORTS: 'reports',
  SUSTAINABILITY: 'sustainability',
  SYSTEMS: 'systems',
  MAINTENANCE: 'maintenance',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  BILLING: 'billing',
  INTEGRATIONS: 'integrations',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type Resource = typeof RESOURCES[keyof typeof RESOURCES];

/**
 * Actions that can be performed on resources
 */
export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  EXPORT: 'export',
  INVITE: 'invite',
  MANAGE: 'manage',
  ALL: '*',
} as const;

export type Action = typeof ACTIONS[keyof typeof ACTIONS];

/**
 * Permission definition
 */
export const PermissionSchema = z.object({
  resource: z.string(),
  action: z.string(),
  scope: z.object({
    organization_id: z.string().uuid().optional(),
    building_id: z.string().uuid().optional(),
    area_id: z.string().uuid().optional(),
    time_restriction: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }).optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

/**
 * Default permissions per role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: [
    { resource: '*', action: '*' }, // Full system access
  ],
  [SYSTEM_ROLES.ACCOUNT_OWNER]: [
    { resource: RESOURCES.ORGANIZATION, action: '*' },
    { resource: RESOURCES.BUILDINGS, action: '*' },
    { resource: RESOURCES.USERS, action: '*' },
    { resource: RESOURCES.REPORTS, action: '*' },
    { resource: RESOURCES.SUSTAINABILITY, action: '*' },
    { resource: RESOURCES.SYSTEMS, action: '*' },
    { resource: RESOURCES.MAINTENANCE, action: '*' },
    { resource: RESOURCES.ANALYTICS, action: '*' },
    { resource: RESOURCES.SETTINGS, action: '*' },
    { resource: RESOURCES.BILLING, action: '*' },
    { resource: RESOURCES.INTEGRATIONS, action: '*' },
    { resource: RESOURCES.AUDIT_LOGS, action: ACTIONS.VIEW },
  ],
  [SYSTEM_ROLES.SUSTAINABILITY_MANAGER]: [
    { resource: RESOURCES.ORGANIZATION, action: ACTIONS.VIEW },
    { resource: RESOURCES.BUILDINGS, action: '*' },
    { resource: RESOURCES.USERS, action: ACTIONS.VIEW },
    { resource: RESOURCES.USERS, action: ACTIONS.INVITE },
    { resource: RESOURCES.REPORTS, action: '*' },
    { resource: RESOURCES.SUSTAINABILITY, action: '*' },
    { resource: RESOURCES.ANALYTICS, action: '*' },
    { resource: RESOURCES.SYSTEMS, action: ACTIONS.VIEW },
  ],
  [SYSTEM_ROLES.FACILITY_MANAGER]: [
    { resource: RESOURCES.ORGANIZATION, action: ACTIONS.VIEW },
    { resource: RESOURCES.BUILDINGS, action: ACTIONS.VIEW },
    { resource: RESOURCES.BUILDINGS, action: ACTIONS.EDIT },
    { resource: RESOURCES.SYSTEMS, action: '*' },
    { resource: RESOURCES.MAINTENANCE, action: '*' },
    { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW },
    { resource: RESOURCES.REPORTS, action: ACTIONS.CREATE },
    { resource: RESOURCES.USERS, action: ACTIONS.VIEW },
    { resource: RESOURCES.SUSTAINABILITY, action: ACTIONS.VIEW },
  ],
  [SYSTEM_ROLES.ANALYST]: [
    { resource: RESOURCES.ORGANIZATION, action: ACTIONS.VIEW },
    { resource: RESOURCES.BUILDINGS, action: ACTIONS.VIEW },
    { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW },
    { resource: RESOURCES.REPORTS, action: ACTIONS.CREATE },
    { resource: RESOURCES.REPORTS, action: ACTIONS.EXPORT },
    { resource: RESOURCES.SUSTAINABILITY, action: ACTIONS.VIEW },
    { resource: RESOURCES.ANALYTICS, action: '*' },
    { resource: RESOURCES.USERS, action: ACTIONS.VIEW },
  ],
  [SYSTEM_ROLES.VIEWER]: [
    { resource: RESOURCES.ORGANIZATION, action: ACTIONS.VIEW },
    { resource: RESOURCES.BUILDINGS, action: ACTIONS.VIEW },
    { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW },
    { resource: RESOURCES.SUSTAINABILITY, action: ACTIONS.VIEW },
    { resource: RESOURCES.ANALYTICS, action: ACTIONS.VIEW },
    { resource: RESOURCES.USERS, action: ACTIONS.VIEW },
  ],
};

// ============================================================================
// SESSION & AUTH RESPONSE
// ============================================================================

/**
 * Session entity
 */
export const SessionSchema = z.object({
  user: UserProfileSchema,
  organizations: z.array(OrganizationSchema),
  current_organization: OrganizationSchema.nullable(),
  current_building: BuildingSchema.optional(),
  permissions: z.array(PermissionSchema),
  expires_at: z.string().datetime(),
  session_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Authentication response
 */
export const AuthResponseSchema = z.object({
  user: UserProfileSchema,
  session: SessionSchema,
  access_token: z.string(),
  refresh_token: z.string(),
  requiresMFA: z.boolean().optional(),
  challengeId: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * Sign up metadata
 */
export const SignUpMetadataSchema = z.object({
  full_name: z.string().min(1).max(255),
  company_name: z.string().min(1).max(255).optional(),
  role: SystemRoleSchema.optional().default(SYSTEM_ROLES.ACCOUNT_OWNER),
  referral_source: z.string().optional(),
});

export type SignUpMetadata = z.infer<typeof SignUpMetadataSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  permissions: Permission[],
  resource: string,
  action: string,
  scope?: Record<string, any>
): boolean {
  return permissions.some(permission => {
    // Check wildcard permissions
    if (permission.resource === '*' && permission.action === '*') return true;
    if (permission.resource === resource && permission.action === '*') return true;

    // Check specific permission
    if (permission.resource !== resource || permission.action !== action) return false;

    // Check scope if provided
    if (scope && permission.scope) {
      return Object.entries(scope).every(([key, value]) =>
        permission.scope![key] === value
      );
    }

    return true;
  });
}

/**
 * Check if a role can perform an action based on hierarchy
 */
export function canRolePerformAction(
  userRole: SystemRole,
  requiredRole: SystemRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all permissions for a role including inherited ones
 */
export function getRolePermissions(role: SystemRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Validate role transition (for role changes)
 */
export function isValidRoleTransition(
  currentRole: SystemRole,
  newRole: SystemRole,
  performerRole: SystemRole
): boolean {
  // Super admin can change any role
  if (performerRole === SYSTEM_ROLES.SUPER_ADMIN) return true;

  // Account owner can change roles except super_admin
  if (performerRole === SYSTEM_ROLES.ACCOUNT_OWNER) {
    return newRole !== SYSTEM_ROLES.SUPER_ADMIN;
  }

  // Others can only assign roles lower than their own
  return ROLE_HIERARCHY[performerRole] > ROLE_HIERARCHY[newRole];
}