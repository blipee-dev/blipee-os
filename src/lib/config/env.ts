import { z } from 'zod';

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Required - Core Services
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required',
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: 'SUPABASE_SERVICE_ROLE_KEY is required for server-side operations',
  }),
  
  // At least one AI provider required
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  
  // Optional - External APIs
  OPENWEATHERMAP_API_KEY: z.string().optional(),
  CARBON_INTERFACE_API_KEY: z.string().optional(),
  ELECTRICITY_MAPS_API_KEY: z.string().optional(),
  CLIMATIQ_API_KEY: z.string().optional(),
  CARBON_MARKET_API_KEY: z.string().optional(),
  REGULATORY_API_KEY: z.string().optional(),
  
  // Optional - Demo credentials
  DEMO_USER_EMAIL: z.string().email().optional(),
  DEMO_USER_PASSWORD: z.string().min(8).optional(),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  
  // Feature flags (all optional with defaults)
  NEXT_PUBLIC_ENABLE_VOICE_INPUT: z.string().optional().default('true').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_3D_VIEWS: z.string().optional().default('true').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_MOCK_DATA: z.string().optional().default('false').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_DOCUMENT_PARSING: z.string().optional().default('true').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_REAL_TIME_DATA: z.string().optional().default('true').transform(val => val === 'true'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
});

/**
 * Validate environment variables at startup
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  // Additional validation: at least one AI provider must be configured
  const hasAIProvider = !!(
    parsed.data.OPENAI_API_KEY ||
    parsed.data.ANTHROPIC_API_KEY ||
    parsed.data.DEEPSEEK_API_KEY
  );
  
  if (!hasAIProvider) {
    throw new Error(
      'At least one AI provider API key is required. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY.'
    );
  }
  
  // Log configuration summary (without sensitive data)
  console.log('✅ Environment configuration validated');
  console.log('   Core services: Configured');
  console.log(`   AI providers: ${[
    parsed.data.OPENAI_API_KEY && 'OpenAI',
    parsed.data.ANTHROPIC_API_KEY && 'Anthropic',
    parsed.data.DEEPSEEK_API_KEY && 'DeepSeek',
  ].filter(Boolean).join(', ')}`);
  console.log(`   External APIs: ${[
    parsed.data.OPENWEATHERMAP_API_KEY && 'Weather',
    parsed.data.CARBON_INTERFACE_API_KEY && 'Carbon Interface',
    parsed.data.ELECTRICITY_MAPS_API_KEY && 'Electricity Maps',
    parsed.data.CLIMATIQ_API_KEY && 'Climatiq',
  ].filter(Boolean).join(', ') || 'None'}`);
  console.log(`   Environment: ${parsed.data.NODE_ENV}`);
  
  return parsed.data;
}

/**
 * Validated environment variables
 * This will throw an error at startup if validation fails
 */
export const env = validateEnv();

/**
 * Type-safe environment variable access
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to get the app URL
 */
export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Helper to check if a feature is enabled
 */
export const features = {
  voiceInput: env.NEXT_PUBLIC_ENABLE_VOICE_INPUT,
  threeDViews: env.NEXT_PUBLIC_ENABLE_3D_VIEWS,
  mockData: env.NEXT_PUBLIC_ENABLE_MOCK_DATA,
  documentParsing: env.NEXT_PUBLIC_ENABLE_DOCUMENT_PARSING,
  realTimeData: env.NEXT_PUBLIC_ENABLE_REAL_TIME_DATA,
} as const;