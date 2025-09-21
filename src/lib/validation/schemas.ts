import { z } from 'zod';

/**
 * Common validation patterns
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format',
});

export const emailSchema = z.string().email({
  message: 'Invalid email address',
});

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Auth schemas
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name contains invalid characters'),
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name is too long')
    .optional(),
  role: z.enum(['viewer', 'analyst', 'facility_manager', 'sustainability_manager', 'account_owner'])
    .optional()
    .default('viewer'),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

/**
 * Chat/AI schemas
 */
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message is too long'),
  conversationId: z.string().optional(), // Allow any string for now (including local_ prefixed)
  buildingId: z.string().optional(), // Allow any string for now
  organizationId: z.string().optional(),
  buildingContext: z.object({
    id: z.string(),
    name: z.string(),
    organizationId: z.string(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  attachments: z.array(z.object({
    id: z.string().optional(),
    name: z.string().max(255).optional(),
    type: z.string().max(100).optional(),
    size: z.number().max(50 * 1024 * 1024).optional(), // 50MB
    publicUrl: z.string().url().optional(),
    extractedData: z.any().optional(),
    originalName: z.string().optional(),
    fileType: z.string().optional(),
  }).passthrough()).optional(),
});

/**
 * Organization schemas
 */
export const organizationCreateSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name is too long'),
  slug: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  metadata: z.record(z.any()).optional(),
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

export const organizationMemberInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['viewer', 'analyst', 'facility_manager', 'sustainability_manager', 'account_owner']),
  sendEmail: z.boolean().optional().default(true),
});

export const adminInvitationCreateSchema = z.object({
  email: emailSchema,
  organization_name: z.string().max(100, 'Organization name too long').optional(),
  custom_message: z.string().max(500, 'Custom message too long').optional(),
  expires_in_days: z.number().int().min(1, 'Expires in days must be at least 1').max(30, 'Expires in days cannot exceed 30').optional().default(7),
  suggested_org_data: z.record(z.any()).optional().default({}),
});

/**
 * Building schemas
 */
export const buildingCreateSchema = z.object({
  name: z.string()
    .min(2, 'Building name must be at least 2 characters')
    .max(100, 'Building name is too long'),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address is too long'),
  city: z.string().max(100),
  state: z.string().max(100).optional(),
  country: z.string().max(100),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  type: z.enum(['office', 'retail', 'industrial', 'residential', 'mixed_use', 'other']),
  size_sqft: z.number().positive().optional(),
  floors: z.number().int().positive().optional(),
  year_built: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const buildingUpdateSchema = buildingCreateSchema.partial();

/**
 * File upload schemas
 */
export const fileUploadMetadataSchema = z.object({
  conversationId: uuidSchema.optional(),
  organizationId: uuidSchema.optional(),
  buildingId: uuidSchema.optional(),
  category: z.enum(['sustainability_report', 'utility_bill', 'emissions_data', 'other']).optional(),
});

/**
 * Onboarding schemas
 */
export const onboardingStepSchema = z.object({
  step: z.enum(['profile', 'organization', 'building', 'preferences', 'complete']),
  data: z.record(z.any()),
});

/**
 * Session schemas
 */
export const sessionResponseSchema = z.object({
  user: z.object({
    id: uuidSchema,
    email: emailSchema,
    full_name: z.string(),
    preferences: z.record(z.any()).optional(),
    ai_personality_settings: z.record(z.any()).optional(),
    onboarding_completed: z.boolean(),
    onboarding_data: z.record(z.any()).optional(),
  }),
  organizations: z.array(z.object({
    id: uuidSchema,
    name: z.string(),
    slug: z.string(),
    role: z.string(),
  })),
  current_organization: z.object({
    id: uuidSchema,
    name: z.string(),
    slug: z.string(),
    role: z.string(),
  }).nullable(),
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.string(),
    scope: z.record(z.string()).optional(),
  })),
  expires_at: z.string().datetime(),
});

/**
 * Sustainability metrics schemas
 */
export const metricsDataQuerySchema = z.object({
  metric_id: uuidSchema.optional(),
  site_id: uuidSchema.optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const metricsDataCreateSchema = z.object({
  metric_id: uuidSchema,
  site_id: uuidSchema.optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  value: z.number().finite('Value must be a valid number'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  data_quality: z.enum(['measured', 'calculated', 'estimated']).optional().default('measured'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  evidence_url: z.string().url('Invalid URL').optional(),
}).refine(data => new Date(data.period_end) >= new Date(data.period_start), {
  message: 'End date must be after or equal to start date',
  path: ['period_end'],
});

export const metricsDataUpdateSchema = z.object({
  id: uuidSchema,
  value: z.number().finite('Value must be a valid number').optional(),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long').optional(),
  data_quality: z.enum(['measured', 'calculated', 'estimated']).optional(),
  verification_status: z.enum(['unverified', 'verified', 'audited']).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  evidence_url: z.string().url('Invalid URL').optional(),
}).refine(data => Object.keys(data).length > 1, {
  message: 'At least one field must be provided for update',
});

export const metricsCatalogCreateSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  scope: z.enum(['scope_1', 'scope_2', 'scope_3']),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  subcategory: z.string().max(100, 'Subcategory too long').optional(),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  calculation_method: z.string().max(500, 'Calculation method too long').optional(),
  emission_factor: z.number().finite('Emission factor must be a valid number').optional(),
  emission_factor_unit: z.string().max(20, 'Emission factor unit too long').optional(),
  ghg_protocol_category: z.string().max(50, 'GHG protocol category too long').optional(),
});

/**
 * AI Target Setting schemas
 */
export const targetSettingQuerySchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(2000, 'Query too long'),
  organization_id: uuidSchema,
  context: z.record(z.any()).optional(),
});

/**
 * Site schemas
 */
export const siteCreateSchema = z.object({
  name: z.string()
    .min(1, 'Site name is required')
    .max(255, 'Site name too long'),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().max(100, 'City too long').optional(),
  country: z.string().length(2, 'Country must be 2-letter code').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  type: z.enum(['facility', 'office', 'warehouse', 'factory', 'other']).optional(),
  is_active: z.boolean().optional().default(true),
});

/**
 * Utility function to validate and sanitize data
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

