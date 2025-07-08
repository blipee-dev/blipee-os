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
  conversationId: uuidSchema.optional(),
  buildingId: uuidSchema.optional(),
  organizationId: uuidSchema.optional(),
  attachments: z.array(z.object({
    id: uuidSchema,
    name: z.string().max(255),
    type: z.string().max(100),
    size: z.number().max(10 * 1024 * 1024), // 10MB
    publicUrl: z.string().url().optional(),
    extractedData: z.any().optional(),
  })).optional(),
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