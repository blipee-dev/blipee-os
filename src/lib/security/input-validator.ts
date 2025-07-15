import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // IDs
  uuid: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Common fields
  email: z.string().email().max(255),
  url: z.string().url().max(2048),
  
  // Message validation
  userMessage: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message too long')
    .transform(val => sanitizeInput(val)),
  
  // Numeric validations
  metric: z.string().regex(/^[a-z_]+$/, 'Invalid metric name'),
  percentage: z.number().min(0).max(100),
  co2Value: z.number().min(0).max(1000000000), // Max 1 billion kg
  
  // Time validations
  timeframe: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).refine(data => new Date(data.start) < new Date(data.end), {
    message: 'Start date must be before end date'
  }),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),
  
  // Filter objects
  filters: z.object({
    industry: z.string().optional(),
    region: z.string().optional(),
    size: z.enum(['small', 'medium', 'large', 'enterprise']).optional()
  }).strict()
};

/**
 * API Request validation schemas
 */
export const RequestSchemas = {
  // Orchestrator message
  orchestratorMessage: z.object({
    message: ValidationSchemas.userMessage,
    userId: ValidationSchemas.userId,
    organizationId: ValidationSchemas.organizationId,
    context: z.record(z.any()).optional()
  }),
  
  // Agent control
  agentControl: z.object({
    agentId: z.enum(['esg-chief-of-staff', 'compliance-guardian', 'carbon-hunter', 'supply-chain-investigator']),
    action: z.enum(['start', 'stop', 'restart']),
    organizationId: ValidationSchemas.organizationId
  }),
  
  // ML prediction
  mlPrediction: z.object({
    modelType: z.enum(['emissions_prediction', 'energy_optimization', 'compliance_risk', 'supplier_scoring']),
    organizationId: ValidationSchemas.organizationId,
    parameters: z.record(z.any())
  }),
  
  // Benchmark request
  benchmarkRequest: z.object({
    organizationId: ValidationSchemas.organizationId,
    metric: ValidationSchemas.metric,
    category: z.enum(['emissions', 'energy', 'waste', 'water', 'social', 'governance']),
    filters: ValidationSchemas.filters.optional()
  }),
  
  // Emissions data
  emissionsData: z.object({
    organizationId: ValidationSchemas.organizationId,
    scope: z.enum(['scope1', 'scope2', 'scope3']),
    co2e_kg: ValidationSchemas.co2Value,
    period_start: z.string().datetime(),
    period_end: z.string().datetime(),
    source: z.string().max(255),
    verified: z.boolean().default(false)
  })
};

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML/script tags
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Additional sanitization
  return cleaned
    .trim()
    .replace(/[<>]/g, '') // Remove any remaining brackets
    .slice(0, 4000); // Enforce max length
}

/**
 * Validate and sanitize request body
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: any }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ message: 'Validation failed' }]
    };
  }
}

/**
 * SQL injection prevention
 */
export function escapeSQLIdentifier(identifier: string): string {
  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error('Invalid SQL identifier');
  }
  return identifier;
}

/**
 * Path traversal prevention
 */
export function sanitizePath(path: string): string {
  // Remove any path traversal attempts
  return path
    .replace(/\.\./g, '')
    .replace(/[\\\/]+/g, '/')
    .replace(/^\/+/, '');
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate URL format
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }
}

/**
 * Middleware to validate request body
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: any, validated: T) => Promise<any>
) {
  return async (req: any): Promise<any> => {
    const body = await req.json();
    const validation = await validateRequest(schema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(req, validation.data);
  };
}